// Production-only CRM reconciliation worker. No public endpoints, customer PII in logs,
// or credentials in source. Public D1 remains authoritative. Receiver is idempotent.
const ENDPOINT = 'https://internal.crm.legacywaterusa.invalid/internal/ingest';
const BATCH_SIZE = 20;
const RETRY_CAP_MS = 24 * 60 * 60 * 1000;

function assertBindings(env) {
  if (!env.DB || typeof env.DB.prepare !== 'function') throw Error('Reconciler D1 binding unavailable');
  if (!env.CRM_SERVICE || typeof env.CRM_SERVICE.fetch !== 'function') throw Error('Reconciler service binding unavailable');
  if (typeof env.CRM_INGEST_TOKEN !== 'string' || env.CRM_INGEST_TOKEN.length < 32)
    throw Error('Reconciler secret missing or invalid');
}

function nextDelayMs(priorAttempts, code) {
  if (code === 400 || code === 404 || code === 405) return RETRY_CAP_MS;
  return Math.min(RETRY_CAP_MS, 5 * 60 * 1000 * 2 ** Math.min(priorAttempts, 9));
}

async function saveReceipt(env, lead, attemptAt, result, status, accepted) {
  const attempts = Number(lead.attempts) + 1;
  const next = accepted ? null : new Date(Date.parse(attemptAt) + nextDelayMs(attempts - 1, status)).toISOString();
  const delivered = accepted ? attemptAt : null;
  // State contains no customer name, phone or ZIP. Source-of-truth lead is untouched.
  await env.DB.prepare(`INSERT INTO crm_sync_receipts
    (lead_id,first_seen_at,attempts,last_attempt_at,next_attempt_at,delivered_at,last_http_status,last_result)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(lead_id) DO UPDATE SET
      attempts=excluded.attempts,
      last_attempt_at=excluded.last_attempt_at,
      next_attempt_at=excluded.next_attempt_at,
      delivered_at=excluded.delivered_at,
      last_http_status=excluded.last_http_status,
      last_result=excluded.last_result`)
    .bind(lead.id,lead.created_at,attempts,attemptAt,next,delivered,status,result).run();
}

async function sendToPrivateCrm(env, lead) {
  const payload = {
    id: lead.id,
    created_at: lead.created_at,
    full_name: lead.full_name,
    phone: lead.phone,
    zip: lead.zip,
    source: lead.source,
    campaign: lead.campaign || '',
    product_interest: lead.product_interest || null,
    preferred_day: lead.preferred_day,
    preferred_time: lead.preferred_time,
  };
  try {
    const response = await env.CRM_SERVICE.fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-crm-ingest-token': env.CRM_INGEST_TOKEN },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    const code = response.status;
    if (response.ok) {
      const body = await response.json().catch(() => null);
      if (body?.saved === true && body.id === lead.id) return { accepted: true, result: 'accepted', status: code };
    }
    return { accepted: false, result: 'rejected', status: code };
  } catch (_) {
    return { accepted: false, result: 'service_call_failed', status: null };
  }
}

export async function reconcileDue(env) {
  assertBindings(env);
  const now = new Date().toISOString();
  const rows = await env.DB.prepare(`SELECT w.*, COALESCE(r.attempts, 0) AS attempts
    FROM water_test_leads AS w
    LEFT JOIN crm_sync_receipts AS r ON r.lead_id = w.id
    WHERE (w.source LIKE 'water-test-%' OR w.source = 'ro-product-website')
      AND r.delivered_at IS NULL
      AND (r.next_attempt_at IS NULL OR r.next_attempt_at <= ?)
    ORDER BY w.created_at ASC, w.id ASC
    LIMIT ?`).bind(now,BATCH_SIZE).all();
  if (!rows.success) throw Error('Reconciliation D1 query was not successful');
  const stats = { examined: 0, accepted: 0, retrying: 0 };
  for (const lead of rows.results || []) {
    stats.examined++;
    const outcome = await sendToPrivateCrm(env, lead);
    await saveReceipt(env, lead, new Date().toISOString(), outcome.result, outcome.status, outcome.accepted);
    if (outcome.accepted) stats.accepted++;
    else stats.retrying++;
  }
  console.info('CRM reconciliation run', stats); // Aggregates only; no IDs/PII
  return stats;
}

export default {
  async scheduled(_controller, env) {
    await reconcileDue(env);
  },
  // Disabled via workers_dev=false, preview_urls=false, and no custom routes.
  // Also reject requests defensively if a route is inadvertently attached.
  fetch() {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  },
};

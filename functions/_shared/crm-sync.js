// INTERNAL ONLY: best-effort mirror of verified public Pages leads to private CRM.
// Keep D1 storage and Resend alerts independent of the CRM service.
// Privacy-safe diagnostics store only fixed outcome codes and HTTP status (no PII or secrets).
async function recordMirrorDiagnostic(env, outcome, httpStatus = null) {
  try {
    if (!env.DB || typeof env.DB.prepare !== 'function') return;
    await env.DB.prepare(
      'INSERT INTO crm_mirror_diagnostics (created_at, outcome, http_status) VALUES (?, ?, ?)'
    ).bind(new Date().toISOString(), outcome, httpStatus).run();
  } catch (_) {
    console.warn('CRM mirror diagnostics unavailable');
  }
}

export async function mirrorLeadToCrm(env, lead, { recordDiagnostics = false } = {}) {
  const diagnostic = async (outcome, status = null) => {
    if (recordDiagnostics) await recordMirrorDiagnostic(env, outcome, status);
  };
  if (!env.CRM_SERVICE || typeof env.CRM_SERVICE.fetch !== 'function') {
    console.warn('CRM mirror skipped: missing internal service binding');
    await diagnostic('service_binding_unavailable');
    return;
  }
  if (typeof env.CRM_INGEST_TOKEN !== 'string' || env.CRM_INGEST_TOKEN.length < 32) {
    console.warn('CRM mirror skipped: invalid server-only credential');
    await diagnostic('secret_missing_or_short');
    return;
  }

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
    const response = await env.CRM_SERVICE.fetch(
      'https://internal.crm.legacywaterusa.invalid/internal/ingest',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-crm-ingest-token': env.CRM_INGEST_TOKEN,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (response.ok) console.info('CRM mirror accepted', response.status);
    else console.warn('CRM mirror not accepted', response.status);
    await diagnostic(response.ok ? 'accepted' : 'rejected', response.status);
  } catch (_) {
    console.warn('CRM mirror unavailable');
    await diagnostic('service_call_failed');
  }
}

// INTERNAL ONLY: best-effort mirror of verified Pages leads to private CRM.
// The public D1 database remains authoritative and form/email success is independent of CRM.
// Never log personally identifiable data or the service token.
export async function mirrorLeadToCrm(env, lead) {
  if (!env.CRM_SERVICE || typeof env.CRM_SERVICE.fetch !== 'function') {
    console.warn('CRM mirror skipped: missing internal service binding');
    return;
  }
  if (typeof env.CRM_INGEST_TOKEN !== 'string' || env.CRM_INGEST_TOKEN.length < 32) {
    console.warn('CRM mirror skipped: invalid server-only credential');
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
  } catch (_) {
    console.warn('CRM mirror unavailable');
  }
}

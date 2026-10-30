// Best-effort, internal Cloudflare Service Binding mirror.
// Public/staging Pages D1 remains the source of truth for form submissions.
// STAGING DIAGNOSTIC ONLY: write a fixed outcome and HTTP status, NEVER lead PII or secrets.
// Diagnostics are optional: a missing table must never interrupt the original form flow.
async function mirrorDiagnostic(env, outcome, httpStatus = null) {
 try {
  if (!env.DB || typeof env.DB.prepare !== 'function') return;
  await env.DB.prepare(
   'INSERT INTO crm_mirror_diagnostics (created_at, outcome, http_status) VALUES (?, ?, ?)'
  ).bind(new Date().toISOString(), outcome, httpStatus).run();
 } catch (_) {
  console.warn('CRM mirror diagnostics storage unavailable');
 }
}

// D1 outcome recording is explicit opt-in for staging; production never queries the diagnostic table.
export async function mirrorLeadToCrm(env, lead, options={}) {
 if(!env.CRM_SERVICE || typeof env.CRM_SERVICE.fetch!=='function'){
  console.error('CRM mirror skipped: service binding unavailable');
  if(options.recordDiagnostics===true) await mirrorDiagnostic(env, 'service_binding_unavailable');
  return;
 }
 if(typeof env.CRM_INGEST_TOKEN!=='string'||env.CRM_INGEST_TOKEN.length<32){
  console.error('CRM mirror skipped: ingest secret missing or shorter than 32 characters');
  if(options.recordDiagnostics===true) await mirrorDiagnostic(env, 'secret_missing_or_short');
  return;
 }
 const payload={
  id:lead.id,created_at:lead.created_at,full_name:lead.full_name,
  phone:lead.phone,zip:lead.zip,source:lead.source,
  campaign:lead.campaign||'',product_interest:lead.product_interest||null,
  preferred_day:lead.preferred_day,preferred_time:lead.preferred_time
 };
 try{
  const res=await env.CRM_SERVICE.fetch('https://internal.crm.legacywaterusa.invalid/internal/ingest',{
   method:'POST',
   headers:{'content-type':'application/json','x-crm-ingest-token':env.CRM_INGEST_TOKEN},
   body:JSON.stringify(payload),
   signal:AbortSignal.timeout(5000)
  });
  if(!res.ok)console.error('CRM mirror not accepted',res.status);
  else console.info('CRM mirror accepted',res.status);
  if(options.recordDiagnostics===true) await mirrorDiagnostic(env, res.ok?'accepted':'rejected', res.status);
 }catch(_){
  console.error('CRM mirror unavailable');
  if(options.recordDiagnostics===true) await mirrorDiagnostic(env, 'service_call_failed');
 }
}

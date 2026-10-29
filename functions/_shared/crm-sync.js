// Best-effort, internal Cloudflare Service Binding mirror.
// The PUBLIC Pages D1 database remains authoritative for submissions.
// Never send lead PII to public third-party URLs.
export async function mirrorLeadToCrm(env, lead) {
 if(!env.CRM_SERVICE || typeof env.CRM_SERVICE.fetch!=='function'
    ||typeof env.CRM_INGEST_TOKEN!=='string'||env.CRM_INGEST_TOKEN.length<32)return;
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
   body:JSON.stringify(payload)
  });
  if(!res.ok)console.error('CRM mirror not accepted',res.status);
 }catch(error){console.error('CRM mirror unavailable',error?.name||'error')}
}

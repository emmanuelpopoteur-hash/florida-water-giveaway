// INTERNAL ONLY. Separate Worker with no public routes or workers.dev hostname.
// Receives authorized service-binding calls, writes only to the private CRM D1.
// Not protected by end-user Access: its own 32+ character service token is mandatory.
const uuidRule=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const asJson=(obj,status=200)=>Response.json(obj,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
function text(v,max){return String(v??'').trim().slice(0,max)}

async function bodyJson(request) {
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Error('JSON required');
 if(Number(request.headers.get('content-length')||0)>5000)throw Error('Payload too large');
 const raw=await request.text();
 if(raw.length>5000)throw Error('Payload too large');
 const obj=JSON.parse(raw);
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('JSON object required');
 return obj;
}
async function secretMatches(given,expected) {
 if(typeof given!=='string'||typeof expected!=='string'||expected.length<32||!given)return false;
 const encode=v=>new TextEncoder().encode(v);
 const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encode(given)),crypto.subtle.digest('SHA-256',encode(expected))]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let different=0;
 for(let i=0;i<x.length;i++)different|=x[i]^y[i];
 return different===0;
}
async function ingest(request,env) {
 // This endpoint is ONLY for a trusted Pages service binding + shared server-only secret.
 if(!env.DB||!await secretMatches(request.headers.get('x-crm-ingest-token'),env.CRM_INGEST_TOKEN))
  return asJson({error:'Forbidden'},403);
 let d;try{d=await bodyJson(request)}catch(_){return asJson({error:'Invalid request'},400)}
 const id=text(d.id,50),name=text(d.full_name,100),phone=text(d.phone,24),zip=text(d.zip,5),
 source=text(d.source,80),campaign=text(d.campaign,80),
 interest=d.product_interest==null?null:text(d.product_interest,32);
 if(!uuidRule.test(id)||name.length<2||phone.replace(/\D/g,'').length<10||!/^\d{5}$/.test(zip)
 ||!['ro-product-website'].includes(source)&&!source.startsWith('water-test-')
 ||source.length>80||!['city_water','well_water','drinking_ro',null].includes(interest))
 return asJson({error:'Invalid lead data'},400);
 if(!/^\d{4}-\d{2}-\d{2}T/.test(text(d.created_at,40)))return asJson({error:'Invalid timestamp'},400);
 try{
  const now=new Date().toISOString();
  const write=await env.DB.prepare(`INSERT OR IGNORE INTO crm_leads
  (id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,preferred_day,preferred_time,status)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,'new')`).bind(id,text(d.created_at,40),now,name,phone,zip,source,campaign,interest,text(d.preferred_day,20),text(d.preferred_time,20)).run();
  if(!write.success)throw Error('insert failed');
  return asJson({saved:true,id,created:write.meta?.changes===1},write.meta?.changes===1?201:200);
 }catch(_){return asJson({error:'CRM storage unavailable'},503)}
}

export default {
 async fetch(request,env) {
  try {
   const url=new URL(request.url);
   if(url.pathname!=='/internal/ingest')return asJson({error:'Not found'},404);
   if(request.method!=='POST')return asJson({error:'Method not allowed'},405);
   return await ingest(request,env);
  }catch(e){
   console.error('CRM internal ingestion failed',e?.name||'error');
   return asJson({error:'CRM service unavailable'},503);
  }
 }
};

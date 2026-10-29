import { pageHtml, pageCss, pageScript } from './ui.js';

const statuses=['new','contacted','qualified','proposal','scheduled','won','lost'];
const interests=['city_water','well_water','drinking_ro','unknown'];
const dateRule=/^\d{4}-\d{2}-\d{2}$/;
const uuidRule=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const headers={
 'cache-control':'private, no-store, max-age=0',
 'x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer',
 'x-frame-options':'DENY',
 'x-robots-tag':'noindex, nofollow',
 'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
};
const asJson=(obj,status=200)=>Response.json(obj,{status,headers});
const asText=(text,type)=>new Response(text,{headers:{...headers,'content-type':type}});
function text(v,max){return String(v??'').trim().slice(0,max)}
function validDate(value){
 if(value===null||value==='')return true;
 if(typeof value!=='string'||!dateRule.test(value))return false;
 const [y,m,d]=value.split('-').map(Number);
 return new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===value;
}
function amount(value){
 if(value===null||value==='')return null;
 if(!Number.isSafeInteger(value)||value<0||value>10000000000)throw Error('Invalid amount');
 return value;
}
function todayNY(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
async function bodyJson(request) {
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Error('JSON required');
 if(Number(request.headers.get('content-length')||0)>5000)throw Error('Payload too large');
 const raw=await request.text();
 if(raw.length>5000)throw Error('Payload too large');
 const obj=JSON.parse(raw);
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('JSON object required');
 return obj;
}
async function authorized(request,env,ctx){
 if(!ctx?.access||!env.CRM_ALLOWED_EMAILS||!env.DB)return null;
 try{
  const identity=await ctx.access.getIdentity();
  const email=String(identity?.email||'').trim().toLowerCase();
  const allowed=String(env.CRM_ALLOWED_EMAILS).toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  return email&&allowed.includes(email)?email:null;
 }catch(_){return null;}
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
async function summary(env){
 const today=todayNY();
 const [rows,due,total]=await Promise.all([
  env.DB.prepare('SELECT status,COUNT(*) AS count FROM crm_leads GROUP BY status').all(),
  env.DB.prepare("SELECT COUNT(*) AS count FROM crm_leads WHERE next_followup_date <= ? AND status NOT IN ('won','lost')").bind(today).first(),
  env.DB.prepare('SELECT COUNT(*) AS count FROM crm_leads').first()
 ]);
 const counts=Object.fromEntries(statuses.map(x=>[x,0]));
 for(const row of rows.results||[])if(row.status in counts)counts[row.status]=row.count;
 return asJson({counts,total:total?.count||0,followups_due:due?.count||0,today});
}
async function listLeads(url,env){
 const status=url.searchParams.get('status')||'all';
 if(status!=='all'&&!statuses.includes(status))return asJson({error:'Invalid status'},400);
 const rawQuery=text(url.searchParams.get('q'),60).replaceAll(/[\\%_]/g,'\\$&');
 const offset=Math.min(2000,Math.max(0,Number.parseInt(url.searchParams.get('offset')||'0',10)||0));
 const filter=status==='all'?'':'AND status = ?';
 const sql=`SELECT id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,status,
  next_followup_date,assigned_to,estimated_value_cents,closed_value_cents
  FROM crm_leads WHERE (full_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR zip LIKE ? ESCAPE '\\')
  ${filter} ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ?`;
 const like='%'+rawQuery+'%';
 const args=status==='all'?[like,like,like,offset]:[like,like,like,status,offset];
 const data=await env.DB.prepare(sql).bind(...args).all();
 const rows=data.results||[];
 return asJson({items:rows.slice(0,50),has_more:rows.length>50,offset});
}
async function getLead(env,id){
 const lead=await env.DB.prepare('SELECT * FROM crm_leads WHERE id=?').bind(id).first();
 if(!lead)return asJson({error:'Not found'},404);
 const [notes,audit]=await Promise.all([
  env.DB.prepare('SELECT id,created_at,author,body FROM crm_notes WHERE lead_id=? ORDER BY created_at DESC LIMIT 60').bind(id).all(),
  env.DB.prepare('SELECT created_at,actor,action,summary FROM crm_audit WHERE lead_id=? ORDER BY created_at DESC LIMIT 60').bind(id).all()
 ]);
 return asJson({lead,notes:notes.results||[],audit:audit.results||[]});
}
async function updateLead(request,env,id,actor){
 let d;try{d=await bodyJson(request)}catch(_){return asJson({error:'Invalid JSON'},400)}
 const allowed=['status','next_followup_date','assigned_to','estimated_value_cents','closed_value_cents'];
 if(!Object.keys(d).length||Object.keys(d).some(k=>!allowed.includes(k)))return asJson({error:'Invalid fields'},400);
 const old=await env.DB.prepare('SELECT * FROM crm_leads WHERE id=?').bind(id).first();
 if(!old)return asJson({error:'Not found'},404);
 const status=d.status===undefined?old.status:d.status;
 const followup=d.next_followup_date===undefined?old.next_followup_date:d.next_followup_date;
 const assigned=d.assigned_to===undefined?old.assigned_to:d.assigned_to;
 if(!statuses.includes(status)||!validDate(followup)||typeof assigned!=='string'||assigned.length>80)
  return asJson({error:'Invalid status, date or owner'},400);
 let estimated,closed;try{
 estimated=d.estimated_value_cents===undefined?old.estimated_value_cents:amount(d.estimated_value_cents);
 closed=d.closed_value_cents===undefined?old.closed_value_cents:amount(d.closed_value_cents);
 }catch(_){return asJson({error:'Invalid amount'},400)}
 const now=new Date().toISOString(),followupValue=followup||null;
 // Single D1 batch writes lead changes + audit record atomically.
 await env.DB.batch([
  env.DB.prepare('UPDATE crm_leads SET status=?,next_followup_date=?,assigned_to=?,estimated_value_cents=?,closed_value_cents=?,updated_at=?,updated_by=? WHERE id=?')
   .bind(status,followupValue,assigned,estimated,closed,now,actor,id),
  env.DB.prepare('INSERT INTO crm_audit(id,lead_id,created_at,actor,action,summary) VALUES(?,?,?,?,?,?)')
   .bind(crypto.randomUUID(),id,now,actor,'updated','Sales fields updated')
 ]);
 return asJson({saved:true});
}
async function addNote(request,env,id,actor){
 let d;try{d=await bodyJson(request)}catch(_){return asJson({error:'Invalid JSON'},400)}
 if(typeof d.body!=='string'||d.body.trim().length<2||d.body.length>1500||Object.keys(d).some(k=>k!=='body'))
  return asJson({error:'Invalid note'},400);
 const lead=await env.DB.prepare('SELECT id FROM crm_leads WHERE id=?').bind(id).first();
 if(!lead)return asJson({error:'Not found'},404);
 const now=new Date().toISOString();
 await env.DB.batch([
  env.DB.prepare('INSERT INTO crm_notes(id,lead_id,created_at,author,body) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,now,actor,d.body.trim()),
  env.DB.prepare('INSERT INTO crm_audit(id,lead_id,created_at,actor,action,summary) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,now,actor,'note','Note added')
 ]);
 return asJson({saved:true},201);
}
async function manualLead(request,env,actor){
 let d;try{d=await bodyJson(request)}catch(_){return asJson({error:'Invalid JSON'},400)}
 if(Object.keys(d).some(k=>!['full_name','phone','zip','product_interest','campaign'].includes(k)))
  return asJson({error:'Invalid fields'},400);
 const name=text(d.full_name,100),phone=text(d.phone,24),zip=text(d.zip,5);
 const interest=text(d.product_interest,32)||'unknown';
 if(name.length<2||name.length>100||phone.replace(/\D/g,'').length<10||d.phone?.length>24
 ||zip&& !/^\d{5}$/.test(zip)||!interests.includes(interest))
 return asJson({error:'Invalid lead'},400);
 const id=crypto.randomUUID(),now=new Date().toISOString();
 await env.DB.prepare(`INSERT INTO crm_leads
 (id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,status,updated_by)
 VALUES(?,?,?,?,?,?,?,?,?,'new',?)`)
 .bind(id,now,now,name,phone,zip,'manual',text(d.campaign,80)||'field',interest,actor).run();
 return asJson({saved:true,id},201);
}
export default {
 async fetch(request,env,ctx) {
  const url=new URL(request.url),pathname=url.pathname;
  try{
   if(pathname==='/internal/ingest') {
    if(request.method!=='POST')return asJson({error:'Method not allowed'},405);
    return await ingest(request,env);
   }
   const email=await authorized(request,env,ctx);
   if(!email)return asJson({error:'Private CRM: Cloudflare Access required'},403);
   if(['POST','PATCH','PUT','DELETE'].includes(request.method)) {
    const origin=request.headers.get('origin');
    const site=request.headers.get('sec-fetch-site');
    if(origin!==url.origin||(site&&!['same-origin','none'].includes(site)))return asJson({error:'Origin denied'},403);
   }
   if(request.method==='GET'&&pathname==='/')return asText(pageHtml,'text/html; charset=utf-8');
   if(request.method==='GET'&&pathname==='/assets/app.css')return asText(pageCss,'text/css; charset=utf-8');
   if(request.method==='GET'&&pathname==='/assets/app.js')return asText(pageScript,'application/javascript; charset=utf-8');
   if(pathname==='/api/me'&&request.method==='GET')return asJson({email});
   if(pathname==='/api/summary'&&request.method==='GET')return await summary(env);
   if(pathname==='/api/leads'&&request.method==='GET')return await listLeads(url,env);
   if(pathname==='/api/leads'&&request.method==='POST')return await manualLead(request,env,email);
   const match=pathname.match(/^\/api\/leads\/([0-9a-f-]{36})(?:\/(notes))?$/i);
   if(match&&uuidRule.test(match[1])) {
    if(request.method==='GET'&&!match[2])return await getLead(env,match[1]);
    if(request.method==='PATCH'&&!match[2])return await updateLead(request,env,match[1],email);
    if(request.method==='POST'&&match[2])return await addNote(request,env,match[1],email);
   }
   return asJson({error:'Not found'},404);
  }catch(error){
   console.error('CRM request failed',error?.name||'error');
   return asJson({error:'Service temporarily unavailable'},503);
  }
 }
};

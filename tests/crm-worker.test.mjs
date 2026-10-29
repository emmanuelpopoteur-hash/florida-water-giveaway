import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../crm/src/worker.js';

const URL='https://crm.legacywaterusa.com';
const token='crm-internal-'.padEnd(44,'A');
function context(email='owner@example.com'){
 return {access:{getIdentity:async()=>({email})}};
}
function db(){
 const leads=new Map();
 return {
  leads,
  prepare(sql){
   return {
    bind(...args){
     return {
      async run(){
       if(sql.includes('INSERT OR IGNORE INTO crm_leads')){
        const [id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,preferred_day,preferred_time]=args;
        const exists=leads.has(id);
        if(!exists)leads.set(id,{id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,preferred_day,preferred_time,status:'new'});
        return {success:true,meta:{changes:exists?0:1}};
       }
       if(sql.includes('INSERT INTO crm_leads')){
        const [id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,updated_by]=args;
        leads.set(id,{id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,updated_by,status:'new'});
        return {success:true};
       }
       throw Error('Unexpected SQL: '+sql);
      }
     };
    }
   };
  }
 };
}
function env(){return {DB:db(),CRM_INGEST_TOKEN:token,CRM_ALLOWED_EMAILS:'owner@example.com'};}
function req(path,method='GET',payload,headers={}){
 return new Request(URL+path,{method,headers:{...(payload?{'content-type':'application/json'}:{}),...headers},body:payload?JSON.stringify(payload):undefined});
}
const lead={
 id:'11111111-2222-4333-8444-555555555555',created_at:'2026-10-29T22:00:00Z',
 full_name:'Test Customer',phone:'4075550111',zip:'34771',source:'water-test-direct',
 campaign:'water-test-direct',product_interest:'city_water',preferred_day:'Weekday',preferred_time:'Morning'
};
test('CRM is private without Access context, including if client forges a JWT header',async()=>{
 const e=env();
 const response=await worker.fetch(req('/api/me','GET',undefined,{'Cf-Access-Jwt-Assertion':'forged'}),e,{});
 assert.equal(response.status,403);
});
test('CRM allowlist is mandatory and denies any other signed in user',async()=>{
 const e=env();
 const r=await worker.fetch(req('/'),e,context('someoneelse@example.com'));
 assert.equal(r.status,403);
 delete e.CRM_ALLOWED_EMAILS;
 const r2=await worker.fetch(req('/'),e,context());
 assert.equal(r2.status,403);
});
test('authorized staff can load the private mobile interface',async()=>{
 const r=await worker.fetch(req('/'),env(),context());
 assert.equal(r.status,200);
 assert.match(await r.text(),/Mis oportunidades/);
 assert.match(r.headers.get('content-security-policy'),/default-src 'none'/);
});
test('internal service binding refuses absent or wrong secret',async()=>{
 const e=env();
 const noToken=await worker.fetch(req('/internal/ingest','POST',lead),e,{});
 const badToken=await worker.fetch(req('/internal/ingest','POST',lead,{'x-crm-ingest-token':'wrong'}),e,{});
 assert.equal(noToken.status,403);assert.equal(badToken.status,403);
 assert.equal(e.DB.leads.size,0);
});
test('authorized ingest stores lead once without overwriting subsequent status',async()=>{
 const e=env();
 const call=()=>worker.fetch(req('/internal/ingest','POST',lead,{'x-crm-ingest-token':token}),e,{});
 const a=await call(),b=await call();
 assert.equal(a.status,201);assert.equal(b.status,200);assert.equal(e.DB.leads.size,1);
 assert.equal(e.DB.leads.get(lead.id).source,'water-test-direct');
});
test('internal mirror rejects malformed IDs and other product sources',async()=>{
 const e=env();
 const a=await worker.fetch(req('/internal/ingest','POST',{...lead,id:'bad-id'},{'x-crm-ingest-token':token}),e,{});
 const b=await worker.fetch(req('/internal/ingest','POST',{...lead,source:'unapproved'},{'x-crm-ingest-token':token}),e,{});
 assert.equal(a.status,400);assert.equal(b.status,400);
});
test('manual lead creation requires Access and same-origin writes',async()=>{
 const e=env();
 const payload={full_name:'Direct Test',phone:'4075550199',zip:'34769',product_interest:'well_water',campaign:'door-to-door'};
 const invalid=await worker.fetch(req('/api/leads','POST',payload,{'origin':'https://evil.example'}),e,context());
 assert.equal(invalid.status,403);
 const ok=await worker.fetch(req('/api/leads','POST',payload,{'origin':URL}),e,context());
 assert.equal(ok.status,201);assert.equal(e.DB.leads.size,1);
});
test('no lead is created from invalid manual contact details',async()=>{
 const e=env();
 const res=await worker.fetch(req('/api/leads','POST',{full_name:'X',phone:'123',zip:'34769'},{'origin':URL}),e,context());
 assert.equal(res.status,400);assert.equal(e.DB.leads.size,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/leads.js';
import ingestWorker from '../crm/src/ingest.js';

// Fully synthetic fixtures. No Cloudflare secrets, live customers or network requests.
const staging='https://legacy-water-staging.pages.dev';
const production='https://legacywaterusa.com';
const token='staging-internal-test-token-'.padEnd(48,'Z');
const lead={
 request_id:'12345678-1234-4234-8234-123456789abc',
 zip:'34769', preferred_day:'Weekday', preferred_time:'Morning',
 full_name:'Synthetic Integration Test',phone:'4075550118',
 source:'qr',campaign:'crm-staging-ci',product_interest:'city_water'
};

function pagesDb() {
 const rows=new Map(), diagnostics=[];
 return {
  rows, diagnostics,
  prepare(sql) {
   return {bind(...args) {
    return {
     async run() {
      if(sql.includes('INSERT OR IGNORE INTO water_test_leads')){
       const [id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest]=args;
       const exists=rows.has(id);
       if(!exists)rows.set(id,{id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest});
       return {success:true,meta:{changes:exists?0:1}};
      }
      if(sql.includes('INSERT INTO crm_mirror_diagnostics')){
       const [created_at,outcome,http_status]=args;
       diagnostics.push({created_at,outcome,http_status});
       return {success:true};
      }
      throw Error('Unexpected Pages SQL: '+sql);
     },
     async first() {
      if(sql.includes('SELECT * FROM water_test_leads'))return rows.get(args[0])||null;
      throw Error('Unexpected Pages select: '+sql);
     }
    };
   }};
  }
 };
}

function crmDb(){
 const rows=new Map();
 return {
  rows,
  prepare(sql){return {bind(...args){return {
   async run(){
    if(!sql.includes('INSERT OR IGNORE INTO crm_leads'))throw Error('Unexpected CRM SQL');
    const [id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,preferred_day,preferred_time]=args;
    const exists=rows.has(id);
    if(!exists)rows.set(id,{id,created_at,updated_at,full_name,phone,zip,source,campaign,product_interest,preferred_day,preferred_time,status:'new'});
    return {success:true,meta:{changes:exists?0:1}};
   }
  };}};}
 };
}

function setup({pagesToken=token,receiverToken=token,hasBinding=true}={}){
 const page=pagesDb(),crm=crmDb(),pending=[];
 const receiverEnv={DB:crm,CRM_INGEST_TOKEN:receiverToken};
 const env={DB:page,CRM_INGEST_TOKEN:pagesToken};
 if(hasBinding)env.CRM_SERVICE={
  fetch:(url,init)=>ingestWorker.fetch(new Request(url,init),receiverEnv)
 };
 const context={waitUntil(p){pending.push(p);}};
 return {page,crm,env,context,pending};
}

async function send(set,site=staging,payload=lead){
 const request=new Request(site+'/api/leads',{
  method:'POST',
  headers:{origin:site,'content-type':'application/json'},
  body:JSON.stringify(payload)
 });
 const response=await onRequestPost({request,env:set.env,context:set.context});
 await Promise.all(set.pending.splice(0));
 return response;
}

test('new staging submission saves source lead and reaches private CRM with accepted 201 diagnostic',async()=>{
 const set=setup(),res=await send(set);
 assert.equal(res.status,201);
 assert.equal(set.page.rows.size,1);
 assert.equal(set.crm.rows.size,1);
 assert.equal(set.page.diagnostics.length,1);
 assert.deepEqual([set.page.diagnostics[0].outcome,set.page.diagnostics[0].http_status],['accepted',201]);
 assert.equal(set.crm.rows.get(lead.request_id).campaign,'crm-staging-ci');
 assert.equal(set.crm.rows.get(lead.request_id).status,'new');
});

test('duplicate request id does not resend or duplicate the prospect',async()=>{
 const set=setup();
 await send(set);
 const again=await send(set);
 assert.equal(again.status,200);
 assert.equal(set.crm.rows.size,1);
 assert.equal(set.page.diagnostics.length,1);
});

test('staging records a short/missing secret without blocking the original form',async()=>{
 const set=setup({pagesToken:'short'});
 const res=await send(set);
 assert.equal(res.status,201);
 assert.equal(set.page.rows.size,1);
 assert.equal(set.crm.rows.size,0);
 assert.equal(set.page.diagnostics[0].outcome,'secret_missing_or_short');
});

test('staging records unavailable binding without losing lead',async()=>{
 const set=setup({hasBinding:false});
 const res=await send(set);
 assert.equal(res.status,201);
 assert.equal(set.page.diagnostics[0].outcome,'service_binding_unavailable');
});

test('staging records 403 authentication failure without exposing secret values',async()=>{
 const set=setup({receiverToken:'different-strong-token-'.padEnd(48,'X')});
 const res=await send(set);
 assert.equal(res.status,201);
 assert.deepEqual([set.page.diagnostics[0].outcome,set.page.diagnostics[0].http_status],['rejected',403]);
 assert.equal(set.crm.rows.size,0);
});

test('public-origin request uses background mirror and does not touch the staging diagnostic table',async()=>{
 const set=setup(),res=await send(set,production);
 assert.equal(res.status,201);
 assert.equal(set.crm.rows.size,1);
 assert.equal(set.page.diagnostics.length,0);
});

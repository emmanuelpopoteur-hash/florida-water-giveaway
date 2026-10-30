import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/ro-inquiries.js';

const id='11111111-2222-4333-8444-555555555555';
const payload={
 request_id:id, zip:'34769', preferred_day:'Weekday', preferred_time:'Morning',
 full_name:'Synthetic RO Inquiry', phone:'4075550199',
 model:'premium', delivery:'florida-install', channel:'virtual_advisor'
};

function fixture({hasService=true, serviceStatus=201}={}){
 const leads=new Map(),diagnostics=[],mirrors=[],pending=[];
 const DB={prepare(sql){
  return {bind(...args){
   return {
    async run(){
     if(sql.includes('INSERT OR IGNORE INTO water_test_leads')){
      const [id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest]=args;
      const old=leads.has(id);
      if(!old)leads.set(id,{id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest});
      return {success:true,meta:{changes:old?0:1}};
     }
     if(sql.includes('INSERT INTO crm_mirror_diagnostics')){
      const [created_at,outcome,http_status]=args;diagnostics.push({created_at,outcome,http_status});
      return {success:true};
     }
     throw Error('Unexpected SQL '+sql);
    },
    async first(){
      if(sql.includes('SELECT * FROM water_test_leads WHERE id = ?'))return leads.get(args[0])||null;
      throw Error('Unexpected SQL '+sql);
    }
   };
  }};
 }};
 const env={DB,CRM_INGEST_TOKEN:'SYNTHETIC_TEST_SECRET_ONLY_000000000000'};
 if(hasService)env.CRM_SERVICE={
  async fetch(url,options){
   mirrors.push({url,options});
   return Response.json({saved:serviceStatus===201},{status:serviceStatus});
  }
 };
 const event={
  request:new Request('https://legacywaterusa.com/api/ro-inquiries',{
   method:'POST',headers:{'origin':'https://legacywaterusa.com','content-type':'application/json'},
   body:JSON.stringify(payload)
  }),
  env,
  waitUntil(promise){
   assert.strictEqual(this,event,'Pages waitUntil must receive the EventContext');
   pending.push(promise);
  }
 };
 return {event,leads,diagnostics,mirrors,pending};
}

test('new verified RO inquiry mirrors to CRM without affecting public D1 or alert flow',async()=>{
 const f=fixture();
 const response=await onRequestPost(f.event);
 assert.equal(response.status,201);
 assert.equal(f.leads.size,1);
 assert.equal(f.pending.length,1);
 await Promise.all(f.pending);
 assert.equal(f.mirrors.length,1);
 const lead=JSON.parse(f.mirrors[0].options.body);
 assert.equal(lead.id,id);
 assert.equal(lead.source,'ro-product-website');
 assert.equal(lead.product_interest,'drinking_ro');
 assert.equal(lead.campaign,'us-ro-premium-florida-install-virtual-advisor');
 assert.deepEqual([f.diagnostics[0].outcome,f.diagnostics[0].http_status],['accepted',201]);
});

test('duplicate RO request ID is still eligible for safe, idempotent CRM repair',async()=>{
 const f=fixture();
 await onRequestPost(f.event);
 await Promise.all(f.pending);
 const response=await onRequestPost(f.event);
 await Promise.all(f.pending);
 assert.equal(response.status,200);
 assert.equal(f.leads.size,1);
 assert.equal(f.mirrors.length,2);
});

test('missing service binding does not fail public RO inquiry',async()=>{
 const f=fixture({hasService:false});
 const response=await onRequestPost(f.event);
 assert.equal(response.status,201);
 await Promise.all(f.pending);
 assert.equal(f.leads.size,1);
 assert.equal(f.diagnostics[0].outcome,'service_binding_unavailable');
});

test('403 from private CRM does not fail public RO inquiry',async()=>{
 const f=fixture({serviceStatus:403});
 const response=await onRequestPost(f.event);
 assert.equal(response.status,201);
 await Promise.all(f.pending);
 assert.deepEqual([f.diagnostics[0].outcome,f.diagnostics[0].http_status],['rejected',403]);
 assert.equal(Object.hasOwn(f.diagnostics[0],'phone'),false);
});

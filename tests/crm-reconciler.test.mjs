import test from 'node:test';
import assert from 'node:assert/strict';
import handler, {reconcileDue} from '../internal/crm-reconciler/worker.js';

const id='11111111-2222-4333-8444-555555555555';
const lead={id,created_at:'2026-10-30T00:00:00.000Z',full_name:'Example User',
  phone:'4075550100',zip:'34769',source:'water-test-direct',campaign:'test',
  preferred_day:'Weekday',preferred_time:'Morning',product_interest:null};
function setup(status=201){
 const receipts=new Map(),calls=[];
 const DB={prepare(sql){return {bind(...args){return {
  async all(){const r=receipts.get(id);
   return {success:true,results:!r?.delivered_at&&!r?.next_attempt_at?[{...lead,attempts:0}]:[]};},
  async run(){const [key,first_seen_at,attempts,last_attempt_at,next_attempt_at,
   delivered_at,last_http_status,last_result]=args;
   receipts.set(key,{first_seen_at,attempts,last_attempt_at,next_attempt_at,
    delivered_at,last_http_status,last_result});return {success:true};}
 };}}}};
 const env={DB,CRM_INGEST_TOKEN:'SYNTHETIC_ONLY_32_CHARACTERS_TEST_0000',
  CRM_SERVICE:{async fetch(url,opts){calls.push({url,opts});
    return Response.json({saved:status===200||status===201,id},{status});}}};
 return {env,receipts,calls};
}
test('scheduled reconciler is not a public HTTP API',()=>{
 assert.equal(handler.fetch().status,404);
});
test('201 receipt avoids duplicate transmission',async()=>{
 const f=setup();assert.equal((await reconcileDue(f.env)).accepted,1);
 assert.equal((await reconcileDue(f.env)).examined,0);
 assert.equal(f.calls.length,1);
 assert.equal(f.receipts.get(id).last_result,'accepted');
});
test('403 causes delayed retry, not false acceptance',async()=>{
 const f=setup(403);await reconcileDue(f.env);
 const r=f.receipts.get(id);
 assert.equal(r.last_result,'rejected');
 assert.equal(r.delivered_at,null);
 assert.ok(r.next_attempt_at);
});
test('200 idempotent acknowledgment is accepted',async()=>{
 const f=setup(200);await reconcileDue(f.env);
 assert.equal(f.receipts.get(id).last_http_status,200);
 assert.equal(f.receipts.get(id).last_result,'accepted');
});
test('invalid secret stops the scheduled operation',async()=>{
 const f=setup();f.env.CRM_INGEST_TOKEN='short';
 await assert.rejects(reconcileDue(f.env));
});

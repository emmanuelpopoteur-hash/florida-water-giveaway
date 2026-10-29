import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/ro-inquiries.js';

const endpoint='https://legacywaterusa.com/api/ro-inquiries';
const payload={
 request_id:'12b8e15f-1df1-4fa6-8c73-58dcffcf87b3',
 model:'essential',delivery:'florida-install',zip:'34771',
 full_name:'QR Test Customer',phone:'4075550101',
 preferred_day:'Weekday',preferred_time:'Morning',channel:'website',
 utm_campaign:'ro-information-card'
};
function mock(){
 let saved=null;
 return {DB:{prepare(sql){
  return {bind(...args){return {
   async run(){
    if(!sql.includes('INSERT OR IGNORE'))throw Error('Unexpected write');
    if(saved)return {success:true,meta:{changes:0}};
    const [id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest]=args;
    saved={id,created_at,zip,preferred_day,preferred_time,full_name,phone,source,campaign,product_interest};
    return {success:true,meta:{changes:1}};
   },
   async first(){return saved}
  }}};
 }},getSaved:()=>saved};
}
function call(data,env){
 const request=new Request(endpoint,{method:'POST',headers:{'origin':'https://legacywaterusa.com','content-type':'application/json'},body:JSON.stringify(data)});
 return onRequestPost({request,env,context:{waitUntil(){}}});
}
test('RO QR requests preserve their original campaign when stored in public D1',async()=>{
 const env=mock();
 const a=await call(payload,env);
 assert.equal(a.status,201);
 assert.equal(env.getSaved().campaign,'us-ro-essential-florida-install-website-ro-information-card');
 assert.equal(env.getSaved().source,'ro-product-website');
 const b=await call(payload,env);
 assert.equal(b.status,200);
});
test('reject malformed campaign strings to prevent untrusted metadata',async()=>{
 const env=mock();
 const r=await call({...payload,utm_campaign:'../unexpected campaign?x=1'},env);
 assert.equal(r.status,400);
 assert.equal(env.getSaved(),null);
});

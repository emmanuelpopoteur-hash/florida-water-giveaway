import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/ro-info.js';

const endpoint = 'https://legacywaterusa.com/api/ro-info';
const requestId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const payload = (rest={}) => ({
  request_id:requestId,email:'owner-approved@example.com',product:'essential',language:'es',
  consent:true,website:'',...rest
});
function request(data, headers={}) {
  return new Request(endpoint,{method:'POST',headers:{
    'origin':'https://legacywaterusa.com','content-type':'application/json',
    'CF-Connecting-IP':'203.0.113.2',...headers
  },body:JSON.stringify(data)});
}
function mockEnv() {
  const rows=new Map(),kvItems=new Map();
  const DB={prepare(sql){
    return {
      bind(...params) {
        return {
          async first() {
            if(sql.includes('LIMIT 1'))return null;
            if(sql.includes('WHERE id = ?'))return rows.get(params[0])||null;
            throw Error('Unexpected read query: '+sql);
          },
          async run() {
            if(sql.startsWith('INSERT')) {
              const [id,created_at,email,product,language,consented_at,status]=params;
              if(!rows.has(id))rows.set(id,{id,created_at,email,product,language,consented_at,status});
              return {success:true};
            }
            if(sql.startsWith('UPDATE')) {
              const [accepted_at,id]=params;
              const old=rows.get(id);rows.set(id,{...old,status:'accepted',accepted_at});
              return {success:true};
            }
            throw Error('Unexpected write query: '+sql);
          }
        };
      },
      async first(){if(sql.includes('LIMIT 1'))return null;throw Error('Unexpected direct read');}
    };
  }};
  const RO_EMAIL_RATE_LIMIT={
    async get(k){return kvItems.get(k)||null},
    async put(k,v){kvItems.set(k,v)}
  };
  return {DB,RESEND_API_KEY:'TEST-ONLY',LEAD_ALERT_TO:'info@legacywaterusa.com',RO_EMAIL_RATE_LIMIT,rows,kvItems};
}
test('feature stays hidden without Cloudflare bindings',async()=>{
  const res=await onRequestGet({env:{}});
  assert.equal((await res.json()).enabled,false);
});
test('explicit consent is mandatory',async()=>{
  const res=await onRequestPost({request:request(payload({consent:false})),env:{}});
  assert.equal(res.status,400);
});
test('cross-site requests are blocked',async()=>{
  const res=await onRequestPost({request:request(payload(),{origin:'https://unknown.example'}),env:{}});
  assert.equal(res.status,403);
});
test('missing rate limiter fails closed',async()=>{
  const env=mockEnv();delete env.RO_EMAIL_RATE_LIMIT;
  const res=await onRequestPost({request:request(payload()),env});
  assert.equal(res.status,503);
});
test('sends static selected-system information once and records consent',async()=>{
  const env=mockEnv(),original=globalThis.fetch, deliveries=[];
  globalThis.fetch=async(_url,opts)=>{
    deliveries.push(JSON.parse(opts.body));
    return Response.json({id:'accepted-test'});
  };
  try {
    const first=await onRequestPost({request:request(payload()),env});
    assert.equal(first.status,201);
    assert.equal((await first.json()).sent,true);
    assert.equal(env.rows.get(requestId).status,'accepted');
    assert.equal(env.rows.get(requestId).language,'es');
    assert.equal(deliveries.length,2);
    assert.equal(deliveries[0].to[0],'owner-approved@example.com');
    assert.ok(deliveries[0].text.includes('US$1,199'));
    assert.match(deliveries[0].text,/propuesto/i);
    assert.equal(deliveries[1].to[0],'info@legacywaterusa.com');
    const again=await onRequestPost({request:request(payload()),env});
    assert.equal(again.status,200);
    assert.equal(deliveries.length,2);
  } finally { globalThis.fetch=original; }
});

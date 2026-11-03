import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/ro-info.js';

async function withProvider(handler, run) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try { await run(); } finally { globalThis.fetch = original; }
}

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

test('rejects honeypot and malformed fields before storing or sending',async()=>{
  const env=mockEnv();
  await withProvider(async()=>{throw Error('Provider must not be called')},async()=>{
    for(const bad of [{website:'bot'},{consent:'true'},{consent:undefined},{email:'invalid'},{product:'unknown'},{language:'fr'},{request_id:'bad'}]) {
      assert.equal((await onRequestPost({request:request(payload(bad)),env})).status,400);
    }
    assert.equal(env.rows.size,0);
  });
});
test('missing migration hides the feature and rejects submission',async()=>{
  const env=mockEnv();env.DB.prepare=()=>{throw Error('no such table')};
  assert.equal((await (await onRequestGet({env})).json()).enabled,false);
  assert.equal((await onRequestPost({request:request(payload()),env})).status,503);
});
test('missing edge IP and broken KV never send or store',async()=>{
  for(const brokenKV of [false,true]) {
    const env=mockEnv(),req=request(payload());
    if(brokenKV)env.RO_EMAIL_RATE_LIMIT.get=async()=>{throw Error('KV unavailable')};
    else req.headers.delete('CF-Connecting-IP');
    await withProvider(async()=>{throw Error('Provider must not be called')},async()=>{
      assert.equal((await onRequestPost({request:req,env})).status,brokenKV?503:429);
      assert.equal(env.rows.size,0);
    });
  }
});
test('third request to the same recipient in a day is blocked',async()=>{
  const env=mockEnv();let calls=0;
  await withProvider(async()=>{calls++;return Response.json({id:'mock'})},async()=>{
    for(let i=1;i<=3;i++) {
      const res=await onRequestPost({request:request(payload({request_id:`aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee${i}`})),env});
      assert.equal(res.status,i<3?201:429);
    }
    assert.equal(env.rows.size,2);assert.equal(calls,4);
  });
});
test('fourth request from an IP in an hour is blocked across recipients',async()=>{
  const env=mockEnv();
  await withProvider(async()=>Response.json({id:'mock'}),async()=>{
    for(let i=1;i<=4;i++)assert.equal((await onRequestPost({request:request(payload({request_id:`aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee${i}`,email:`owned${i}@example.com`})),env})).status,i<4?201:429);
    assert.equal(env.rows.size,3);
  });
});
test('daily IP counter blocks even when hourly counter is empty',async()=>{
  const env=mockEnv();
  await withProvider(async()=>Response.json({id:'mock'}),async()=>{
    assert.equal((await onRequestPost({request:request(payload()),env})).status,201);
    for(const key of env.kvItems.keys()) {
      if(key.startsWith('ro-d:'))env.kvItems.set(key,'10');
      if(key.startsWith('ro-h:'))env.kvItems.delete(key);
    }
    assert.equal((await onRequestPost({request:request(payload({request_id:'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee2',email:'second@example.com'})),env})).status,429);
  });
});
test('provider rejection keeps pending row and retry uses the same idempotency key',async()=>{
  const env=mockEnv(),keys=[];let reject=true;
  await withProvider(async(_url,opts)=>{
    keys.push(opts.headers['idempotency-key']);
    return reject?new Response('rejected',{status:500}):Response.json({id:'mock'});
  },async()=>{
    assert.equal((await onRequestPost({request:request(payload()),env})).status,503);
    assert.equal(env.rows.get(requestId).status,'pending');assert.equal(keys.length,1);
    reject=false;
    assert.equal((await onRequestPost({request:request(payload()),env})).status,201);
    assert.equal(env.rows.size,1);assert.equal(env.rows.get(requestId).status,'accepted');
    assert.equal(keys[0],keys[1]);assert.equal(keys[2],'ro-email-owner-'+requestId);
  });
});
test('accepted request replay skips both provider calls even if rate limits are full',async()=>{
  const env=mockEnv();let calls=0;
  await withProvider(async()=>{calls++;return Response.json({id:'mock'})},async()=>{
    await onRequestPost({request:request(payload()),env});
    for(const key of env.kvItems.keys())env.kvItems.set(key,'99');
    assert.equal((await onRequestPost({request:request(payload()),env})).status,200);
    assert.equal(calls,2);assert.equal(env.rows.size,1);
    assert.equal((await onRequestPost({request:request(payload({product:'advanced'})),env})).status,409);
    assert.equal(calls,2);
  });
});
test('owner notification failure does not turn accepted customer email into failure',async()=>{
  const env=mockEnv();let calls=0;
  await withProvider(async()=>{calls++;if(calls===2)throw Error('owner timeout');return Response.json({id:'mock'})},async()=>{
    assert.equal((await onRequestPost({request:request(payload()),env})).status,201);
    assert.equal(env.rows.get(requestId).status,'accepted');
  });
});
test('all products and both languages send fixed content and do not relay user text',async()=>{
  for(const product of ['essential','advanced','premium'])for(const language of ['en','es']) {
    const env=mockEnv(),bodies=[];
    await withProvider(async(_url,opts)=>{bodies.push(JSON.parse(opts.body));return Response.json({id:'mock'})},async()=>{
      assert.equal((await onRequestPost({request:request(payload({product,language,message:'UNTRUSTED_TEXT_MUST_NOT_APPEAR'})),env})).status,201);
      assert.equal(bodies.length,2);assert.ok(!bodies[0].text.includes('UNTRUSTED_TEXT'));
      assert.ok(bodies[0].text.includes(language==='es'?'Gracias por solicitar':'Thank you for requesting'));
      if(product!=='essential')assert.ok(!bodies[0].text.includes('1,199'));
      if(product==='premium')assert.match(bodies[0].text,language==='es'?/todavía no está a la venta/:/not currently offered for sale/);
    });
  }
});


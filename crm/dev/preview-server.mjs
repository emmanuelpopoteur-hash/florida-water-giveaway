// TEST-ONLY demo server for screenshot and browser UI checks.
// Serves the actual CRM UI using 100% fabricated data on localhost.
// Never deploy this module to Cloudflare or use customer information here.
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {pageHtml,pageCss,pageScript} from '../src/ui.js';

if (process.env.CI !== 'true' && process.env.CRM_ENABLE_LOCAL_DEMO !== '1') {
  throw new Error('Local CRM demo is disabled. Set CRM_ENABLE_LOCAL_DEMO=1.');
}
const port=Number(process.env.PORT||4188);
const iso='2026-10-29T12:00:00.000Z';
const demoSeed=[
 {id:'11111111-1111-4111-8111-111111111111',created_at:iso,updated_at:iso,full_name:'María Ejemplo',phone:'407-555-0101',zip:'34769',source:'water-test-qr',campaign:'water-test-direct',product_interest:'city_water',preferred_day:'Weekday',preferred_time:'Morning',status:'new',next_followup_date:'2026-10-29',assigned_to:'',estimated_value_cents:null,closed_value_cents:null,notes:[]},
 {id:'22222222-2222-4222-8222-222222222222',created_at:'2026-10-27T15:00:00Z',updated_at:iso,full_name:'Luis Demostración',phone:'407-555-0102',zip:'34771',source:'ro-product-website',campaign:'ro-information-card',product_interest:'drinking_ro',preferred_day:'Weekend',preferred_time:'Afternoon',status:'contacted',next_followup_date:'2026-11-02',assigned_to:'',estimated_value_cents:119900,closed_value_cents:null,notes:[{id:'a',created_at:iso,author:'demo@legacywaterusa.test',body:'Solicitó detalles del sistema RO y mantenimiento.'}]},
 {id:'33333333-3333-4333-8333-333333333333',created_at:'2026-10-25T14:00:00Z',updated_at:iso,full_name:'Ana Prueba',phone:'407-555-0103',zip:'34772',source:'water-test-card',campaign:'door-hanger-water-entry',product_interest:'well_water',preferred_day:'Weekday',preferred_time:'Evening',status:'qualified',next_followup_date:'2026-10-28',assigned_to:'',estimated_value_cents:null,closed_value_cents:null,notes:[]},
 {id:'44444444-4444-4444-8444-444444444444',created_at:'2026-10-23T14:00:00Z',updated_at:iso,full_name:'Pedro Ficticio',phone:'407-555-0104',zip:'34744',source:'manual',campaign:'referido-demo',product_interest:'city_water',preferred_day:'',preferred_time:'',status:'proposal',next_followup_date:null,assigned_to:'',estimated_value_cents:829000,closed_value_cents:null,notes:[]},
 {id:'55555555-5555-4555-8555-555555555555',created_at:'2026-10-20T14:00:00Z',updated_at:iso,full_name:'Cliente de Muestra',phone:'407-555-0105',zip:'34746',source:'manual',campaign:'visita-demo',product_interest:'city_water',preferred_day:'',preferred_time:'',status:'won',next_followup_date:null,assigned_to:'',estimated_value_cents:899000,closed_value_cents:899000,notes:[]}
]; 
let leads=structuredClone(demoSeed);
function respond(res,obj,status=200,kind='application/json; charset=utf-8'){
 res.writeHead(status,{'content-type':kind,'cache-control':'no-store','x-robots-tag':'noindex,nofollow'});res.end(kind.startsWith('application/json')?JSON.stringify(obj):obj);
}
async function parse(req){
 let out='';for await(const part of req){out+=part;if(out.length>6000)throw Error('Too large')}
 return JSON.parse(out||'{}');
}
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:'+port);
 try {
  if(req.method==='POST'&&u.pathname==='/__reset'){
   leads=structuredClone(demoSeed);return respond(res,{reset:true});
  }
  if(req.method==='GET'&&u.pathname==='/')return respond(res,pageHtml,200,'text/html; charset=utf-8');
  if(req.method==='GET'&&u.pathname==='/assets/app.css')return respond(res,pageCss,200,'text/css; charset=utf-8');
  if(req.method==='GET'&&u.pathname==='/assets/app.js')return respond(res,pageScript,200,'application/javascript; charset=utf-8');
  if(req.method==='GET'&&u.pathname==='/api/me')return respond(res,{email:'demo@legacywaterusa.test'});
  if(req.method==='GET'&&u.pathname==='/api/summary'){
   const counts={new:0,contacted:0,qualified:0,proposal:0,scheduled:0,won:0,lost:0};
   for(const l of leads)counts[l.status]++;
   const due=leads.filter(l=>l.next_followup_date&&l.next_followup_date<='2026-10-29'&&!['won','lost'].includes(l.status)).length;
   return respond(res,{total:leads.length,counts,followups_due:due,today:'2026-10-29'});
  }
  if(req.method==='GET'&&u.pathname==='/api/leads'){
   const q=(u.searchParams.get('q')||'').toLowerCase(),status=u.searchParams.get('status')||'all',offset=Math.max(0,parseInt(u.searchParams.get('offset')||'0',10)||0);
   const selected=leads.filter(l=>(status==='all'||l.status===status)&&[l.full_name,l.phone,l.zip].some(x=>x.toLowerCase().includes(q)));
   return respond(res,{items:selected.slice(offset,offset+50),offset,has_more:selected.length>offset+50});
  }
  if(req.method==='POST'&&u.pathname==='/api/leads'){
   const d=await parse(req);if(!d.full_name||!d.phone)return respond(res,{error:'Datos incompletos'},400);
   const id=randomUUID();
   leads.unshift({id,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),full_name:d.full_name,phone:d.phone,zip:d.zip||'',source:'manual',campaign:d.campaign||'field',product_interest:d.product_interest||'unknown',preferred_day:'',preferred_time:'',status:'new',next_followup_date:null,assigned_to:'',estimated_value_cents:null,closed_value_cents:null,notes:[]});
   return respond(res,{saved:true,id},201);
  }
  const m=u.pathname.match(/^\/api\/leads\/([0-9a-f-]{36})(?:\/(notes))?$/i);
  if(m){
   const lead=leads.find(l=>l.id===m[1]);if(!lead)return respond(res,{error:'No encontrado'},404);
   if(req.method==='GET'&&!m[2])return respond(res,{lead,notes:lead.notes,audit:[]});
   if(req.method==='PATCH'&&!m[2]){
    const d=await parse(req);
    for(const k of ['status','next_followup_date','assigned_to','estimated_value_cents','closed_value_cents'])if(Object.hasOwn(d,k))lead[k]=d[k];
    return respond(res,{saved:true});
   }
   if(req.method==='POST'&&m[2]){
    const d=await parse(req);
    lead.notes.unshift({id:randomUUID(),author:'demo@legacywaterusa.test',created_at:new Date().toISOString(),body:String(d.body||'')});
    return respond(res,{saved:true},201);
   }
  }
  return respond(res,{error:'Not found'},404);
 }catch(e){return respond(res,{error:'Demo request failed'},500)}
});
server.listen(port,'127.0.0.1',()=>console.log('Test-only CRM preview on localhost:'+port));

// Requested one-time product information by email, USA only.
// This endpoint never accepts message text, marketing opt-in, payment or booking details.
const json = (body, status=200) => Response.json(body, {
  status, headers: {'cache-control':'no-store','content-type':'application/json; charset=utf-8'}
});
const validId = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const validEmail = /^[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}$/;

const configured = env => !!(env.DB && env.RESEND_API_KEY && env.LEAD_ALERT_TO && env.RO_EMAIL_RATE_LIMIT);
async function ready(env) {
  if (!configured(env)) return false;
  try { await env.DB.prepare('SELECT id FROM ro_email_requests LIMIT 1').first(); return true; }
  catch (_) { return false; }
}
const products = {
  essential: {
    en: {
      title: 'Essential — proposed RO + UV + alkaline package',
      details: 'Proposed price: US$1,199 for an eligible standard installation in Central Florida. The exact equipment/model, installation terms, warranty and planned first-year maintenance must be confirmed in a written quote. Extra plumbing, electrical work, travel, applicable taxes or other services may cost extra.'
    },
    es: {
      title: 'Essential — sistema RO + UV + alcalino propuesto',
      details: 'Precio propuesto: US$1,199 para instalación estándar elegible en Florida Central. El equipo/modelo definitivo, la instalación, la garantía y el mantenimiento previsto del primer año deben confirmarse por escrito. Plomería, electricidad, distancia, impuestos u otros servicios pueden generar cargos adicionales.'
    }
  },
  advanced: {
    en: {
      title: 'Advanced — upgraded RO under evaluation',
      details: 'Advanced is being evaluated and has no confirmed price. Components, UV availability, installation and warranty depend on the selected model and a written quote.'
    },
    es: {
      title: 'Advanced — sistema RO mejorado en evaluación',
      details: 'Advanced está en evaluación y no tiene precio confirmado. Sus componentes, disponibilidad de UV, instalación y garantía dependen del modelo seleccionado y de la cotización escrita.'
    }
  },
  premium: {
    en: {
      title: 'Premium H2 — interest list only',
      details: 'Premium H2 is under evaluation, not currently offered for sale. We have not verified hydrogen output, pH 10.5 or negative ORP. Availability, performance, price and warranty are not confirmed.'
    },
    es: {
      title: 'Premium H2 — lista de interés solamente',
      details: 'Premium H2 sigue en evaluación y todavía no está a la venta. No hemos verificado producción de hidrógeno, pH 10.5 ni ORP negativo. Disponibilidad, rendimiento, precio y garantía no están confirmados.'
    }
  }
};
async function digest(value) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(b)].slice(0,16).map(x => x.toString(16).padStart(2,'0')).join('');
}
async function throttle(env, request, email) {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return false; // The Cloudflare edge should supply this; fail closed if not.
  const [ipKey, emailKey] = await Promise.all([digest('ip:'+ip),digest('email:'+email)]);
  const hour = Math.floor(Date.now()/3600000), day = Math.floor(Date.now()/86400000);
  const items = [
    {key:'ro-h:'+ipKey+':'+hour, limit:3, ttl:7200},
    {key:'ro-d:'+ipKey+':'+day, limit:10, ttl:172800},
    {key:'ro-e:'+emailKey+':'+day, limit:2, ttl:172800}
  ];
  const old = await Promise.all(items.map(i=>env.RO_EMAIL_RATE_LIMIT.get(i.key)));
  if (old.some((v,i)=>Number(v||0)>=items[i].limit)) return false;
  // KV updates are not atomic. Complement with a Cloudflare WAF rate limit rule.
  await Promise.all(items.map((item,i)=>env.RO_EMAIL_RATE_LIMIT.put(item.key,String(Number(old[i]||0)+1),{expirationTtl:item.ttl})));
  return true;
}
function customerText(product, language) {
  const item=products[product][language], spanish=language==='es';
  return [
    spanish?'Gracias por solicitar información a Legacy Water USA.':'Thank you for requesting information from Legacy Water USA.',
    '',item.title,'',item.details,'',
    spanish?'Esta comunicación responde únicamente a tu solicitud. No representa una compra, reserva, instalación confirmada ni aceptación de una cotización.':'This message responds only to your request. It is not a purchase, reservation, confirmed installation or accepted quote.',
    '',
    spanish?'Consulta los sistemas o solicita una cotización escrita:':'View systems or request a written quote:',
    'https://legacywaterusa.com/ro/','',
    spanish?'¿Preguntas? Responde a este correo o escribe a info@legacywaterusa.com.':'Questions? Reply to this email or contact info@legacywaterusa.com.',
    'Legacy Water USA'
  ].join('\n');
}
async function sendEmail(env, body, key) {
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','idempotency-key':key},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(6500)
  });
  return response.ok;
}

export async function onRequestGet({env}) {
  return json({enabled:await ready(env)});
}
export async function onRequestPost({request,env}) {
  const origin = request.headers.get('origin'), own = new URL(request.url).origin;
  if (origin && origin !== own) return json({error:'Origin not allowed'},403);
  const site = request.headers.get('sec-fetch-site');
  if (site && !['same-origin','none'].includes(site)) return json({error:'Cross-site request not allowed'},403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'JSON required'},415);
  if (Number(request.headers.get('content-length')||0)>1600) return json({error:'Payload too large'},413);
  let data;
  try {
    const raw=await request.text();
    if(raw.length>1600)return json({error:'Payload too large'},413);
    data=JSON.parse(raw);
    if(!data || typeof data!=='object' || Array.isArray(data))throw Error('Invalid');
  } catch (_) { return json({error:'Invalid JSON'},400); }
  if(data.website)return json({error:'Invalid request'},400);
  const id=String(data.request_id||'').trim();
  const email=String(data.email||'').trim().toLowerCase();
  const product=String(data.product||'').trim().toLowerCase();
  const language=String(data.language||'en');
  if(!validId.test(id)||email.length>254||!validEmail.test(email)||!products[product]||
     !['es','en'].includes(language)||data.consent!==true)
     return json({error:'Email, product and explicit permission are required'},400);
  if(!await ready(env))return json({error:'Email requests not yet available'},503);
  try {
    const prior=await env.DB.prepare('SELECT * FROM ro_email_requests WHERE id = ?').bind(id).first();
    if(prior && (prior.email!==email||prior.product!==product||prior.language!==language))
      return json({error:'Request identifier already used'},409);
    if(prior?.status==='accepted')return json({sent:true,id},200);
    if(!await throttle(env,request,email))return json({error:'Too many requests'},429);
    if(!prior){
      const insert=await env.DB.prepare(
        'INSERT OR IGNORE INTO ro_email_requests (id,created_at,email,product,language,consented_at,status) VALUES (?,?,?,?,?,?,?)'
      ).bind(id,new Date().toISOString(),email,product,language,new Date().toISOString(),'pending').run();
      if(!insert.success)throw Error('D1 insert failed');
      const saved=await env.DB.prepare('SELECT * FROM ro_email_requests WHERE id = ?').bind(id).first();
      if(!saved || saved.email!==email || saved.product!==product || saved.language!==language)
        return json({error:'Request identifier already used'},409);
    }
    const sent=await sendEmail(env,{
      from:'Legacy Water USA <leads@legacywaterusa.com>',
      to:[email],
      reply_to:'info@legacywaterusa.com',
      subject:language==='es'?'Información solicitada — Legacy Water USA':'Your requested water-system information — Legacy Water USA',
      text:customerText(product,language)
    },'ro-customer-'+id);
    if(!sent) {
      console.error('RO requested email rejected by provider');
      return json({error:'Unable to send email at this time'},503);
    }
    await env.DB.prepare("UPDATE ro_email_requests SET status='accepted', accepted_at=? WHERE id=?").bind(new Date().toISOString(),id).run();
    // Owner alert is independent; a failure must not change the customer response.
    try {
      const notified=await sendEmail(env,{
        from:'Legacy Water USA <leads@legacywaterusa.com>',
        to:[env.LEAD_ALERT_TO],
        subject:'RO information email requested — '+product.toUpperCase(),
        text:['One-time information request through the virtual advisor.',
          'Customer email: '+email,'Product: '+product,'Language: '+language,
          'Permission recorded: '+new Date().toISOString(),
          'Request reference: '+id,
          'Not subscribed to promotional messages.'].join('\n')
      },'ro-email-owner-'+id);
      if(!notified)console.error('RO requested email owner notification rejected');
    } catch(e) { console.error('RO requested email owner notification failed',e?.name||'error'); }
    return json({sent:true,id},201);
  } catch(e) {
    console.error('RO email request failed',e?.name||'error');
    return json({error:'Unable to process email request'},503);
  }
}

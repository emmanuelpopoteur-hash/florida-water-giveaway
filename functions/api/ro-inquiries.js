import { mirrorLeadToCrm } from '../_shared/crm-sync.js';
// Separate RO product inquiry intake; reuses the existing D1 lead table and alert credentials.
// This endpoint does not create an order, charge a card, or reserve inventory.
const reply = (body, status) => Response.json(body, {
  status, headers: { 'cache-control':'no-store', 'content-type':'application/json; charset=utf-8' }
});
const safeText = v => String(v ?? '').trim();
const validUuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

async function notify(env, lead, model, delivery) {
  if (!env.RESEND_API_KEY || !env.LEAD_ALERT_TO) return;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type':'application/json', 'idempotency-key':`ro-inquiry-${lead.id}` },
      body: JSON.stringify({
        from: 'Legacy Water USA <leads@legacywaterusa.com>',
        to: env.LEAD_ALERT_TO,
        subject: `New RO product inquiry — ${model.toUpperCase()} — ${lead.zip}`,
        text: [
          'A customer submitted a request for a US reverse osmosis system. This is not a paid order.',
          `Package: ${model}`, `Service requested: ${delivery}`, `Channel: ${lead.campaign}`,
          `Name: ${lead.full_name}`, `Phone: ${lead.phone}`, `US ZIP: ${lead.zip}`,
          `Preferred contact day: ${lead.preferred_day}`,
          `Preferred contact time: ${lead.preferred_time}`,
          `Lead ID: ${lead.id}`
        ].join('\n')
      }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) console.error('RO inquiry alert failed', response.status);
  } catch (e) {
    console.error('RO inquiry alert failed', e?.name || 'network error');
  }
}

export async function onRequestPost({ request, env, context }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({error:'Origin not allowed'}, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return reply({error:'JSON required'}, 415);
  if (Number(request.headers.get('content-length') || 0) > 4096) return reply({error:'Request too large'}, 413);
  let data;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return reply({error:'Request too large'}, 413);
    data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid');
  } catch { return reply({error:'Invalid JSON'}, 400); }
  if (data.website) return reply({error:'Invalid request'}, 400);

  const zip = safeText(data.zip);
  const name = safeText(data.full_name);
  const phone = safeText(data.phone);
  const day = safeText(data.preferred_day);
  const time = safeText(data.preferred_time);
  const model = safeText(data.model).toLowerCase();
  const delivery = safeText(data.delivery).toLowerCase();
  const id = safeText(data.request_id);
  const channel = safeText(data.channel).toLowerCase() === 'virtual_advisor' ? 'virtual-advisor' : 'website';
  if (!/^\d{5}$/.test(zip) || name.length < 2 || name.length > 100 ||
      phone.length > 24 || phone.replace(/\D/g,'').length < 10 ||
      !['Weekday','Weekend'].includes(day) ||
      !['Morning','Afternoon','Evening'].includes(time) ||
      !['essential','advanced','premium'].includes(model) ||
      !['florida-install','other-us-quote'].includes(delivery) ||
      !validUuid.test(id)) return reply({error:'Invalid request details'}, 400);

  if (!env.DB) return reply({error:'Request service temporarily unavailable'}, 503);
  const campaign = `us-ro-${model}-${delivery}-${channel}`;
  const source = 'ro-product-website';
  try {
    const write = await env.DB.prepare(
      `INSERT OR IGNORE INTO water_test_leads
       (id, created_at, zip, preferred_day, preferred_time, full_name, phone, source, campaign, product_interest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id,new Date().toISOString(),zip,day,time,name,phone,source,campaign,'drinking_ro').run();
    if (!write.success || ![0,1].includes(write.meta?.changes)) throw new Error('Unconfirmed D1 write');
    const saved = await env.DB.prepare('SELECT * FROM water_test_leads WHERE id = ?').bind(id).first();
    if (!saved) throw new Error('Unconfirmed D1 readback');
    if (saved.zip !== zip || saved.full_name !== name || saved.phone !== phone ||
      saved.preferred_day !== day || saved.preferred_time !== time ||
      saved.source !== source || saved.campaign !== campaign || saved.product_interest !== 'drinking_ro')
      return reply({error:'Request identifier already used'},409);
    if (write.meta.changes===1) {
      if (context?.waitUntil) context.waitUntil(mirrorLeadToCrm(env,saved));
      await notify(env,saved,model,delivery);
    }
    return reply({saved:true,id},write.meta.changes===1?201:200);
  } catch(e) {
    console.error('RO inquiry storage failed',e?.name||'error');
    return reply({error:'Unable to save request'},503);
  }
}
export const onRequestGet = () => reply({error:'Method not allowed'},405);

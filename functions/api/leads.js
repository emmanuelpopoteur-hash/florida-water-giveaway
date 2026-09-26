const json = (body, status) => Response.json(body, {
  status,
  headers: { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' },
});

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: 'Origin not allowed' }, 403);
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'JSON required' }, 415);
  }
  if (Number(request.headers.get('content-length') || 0) > 8192) {
    return json({ error: 'Request too large' }, 413);
  }
  let data;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: 'Request too large' }, 413);
    data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid payload');
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  // Honeypot: accept the request without storing an automated submission.
  if (data.website) return json({ error: 'Invalid request' }, 400);
  const zip = String(data.zip ?? '').trim();
  const preferredDay = String(data.preferred_day ?? '');
  const preferredTime = String(data.preferred_time ?? '');
  const fullName = String(data.full_name ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const rawSource = String(data.source ?? '').trim().toLowerCase();
  const source = ['tiktok', 'instagram', 'facebook', 'qr', 'flyer', 'card', 'google'].includes(rawSource)
    ? rawSource : 'direct';
  const campaign = String(data.campaign ?? '').trim().replace(/[\x00-\x1f]/g, '').slice(0, 80);
  const rawInterest = String(data.product_interest ?? '').trim().toLowerCase();
  const interest = ['city_water', 'well_water', 'drinking_ro'].includes(rawInterest) ? rawInterest : null;
  if (!/^(32|33|34)\d{3}$/.test(zip) ||
      !['Weekday', 'Weekend'].includes(preferredDay) ||
      !['Morning', 'Afternoon', 'Evening'].includes(preferredTime) ||
      fullName.length < 2 || fullName.length > 100 ||
      phone.length > 24 || phone.replace(/\D/g, '').length < 10) {
    return json({ error: 'Invalid lead details' }, 400);
  }
  if (!env.DB) {
    console.error('Missing D1 binding DB');
    return json({ error: 'Unable to save request' }, 503);
  }
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const write = await env.DB.prepare(
      `INSERT INTO water_test_leads
       (id, created_at, zip, preferred_day, preferred_time, full_name, phone, source, campaign, product_interest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, createdAt, zip, preferredDay, preferredTime, fullName, phone,
      `water-test-${source}`, campaign, interest).run();
    if (!write.success || write.meta?.changes !== 1) throw new Error('D1 write not confirmed');
    const saved = await env.DB.prepare('SELECT id FROM water_test_leads WHERE id = ?').bind(id).first();
    if (saved?.id !== id) throw new Error('D1 readback not confirmed');
    return json({ id, saved: true }, 201);
  } catch (error) {
    console.error('Lead storage failed', error);
    return json({ error: 'Unable to save request' }, 503);
  }
}

export function onRequestGet() {
  return json({ error: 'Method not allowed' }, 405);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/leads.js';

// No network, real credentials, customer information, or Cloudflare resources.
const leadId = '11111111-2222-4333-8444-555555555555';
const token = 'LOCAL_SYNTHETIC_TEST_TOKEN_12345678901234';
const payload = {
  request_id: leadId,
  zip: '34769',
  preferred_day: 'Weekday',
  preferred_time: 'Morning',
  full_name: 'Synthetic CRM Test',
  phone: '4075550199',
  source: 'qr',
  campaign: 'ci-test-pages-eventcontext',
  product_interest: 'city_water'
};

function setup({ hasService = true, status = 201 } = {}) {
  const leads = new Map(), diagnostics = [], calls = [], pending = [];
  const DB = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.includes('INSERT OR IGNORE INTO water_test_leads')) {
                const [id, created_at, zip, preferred_day, preferred_time, full_name, phone, source, campaign, product_interest] = args;
                const exists = leads.has(id);
                if (!exists) leads.set(id, { id, created_at, zip, preferred_day, preferred_time, full_name, phone, source, campaign, product_interest });
                return { success: true, meta: { changes: exists ? 0 : 1 } };
              }
              if (sql.includes('INSERT INTO crm_mirror_diagnostics')) {
                const [created_at, outcome, http_status] = args;
                diagnostics.push({ created_at, outcome, http_status });
                return { success: true };
              }
              throw Error('Unrecognized test SQL: ' + sql);
            },
            async first() {
              if (sql.includes('SELECT * FROM water_test_leads WHERE id = ?')) return leads.get(args[0]) || null;
              throw Error('Unrecognized test SELECT: ' + sql);
            },
          };
        },
      };
    },
  };

  const env = { DB, CRM_INGEST_TOKEN: token };
  if (hasService) env.CRM_SERVICE = {
    async fetch(url, options) {
      calls.push({ url, options });
      return Response.json({ saved: status === 201 }, { status });
    },
  };

  const event = {
    request: new Request('https://legacywaterusa.com/api/leads', {
      method: 'POST',
      headers: { origin: 'https://legacywaterusa.com', 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    env,
    waitUntil(promise) {
      assert.strictEqual(this, event, 'Pages waitUntil must be invoked on EventContext itself');
      pending.push(promise);
    },
  };
  return { event, leads, diagnostics, calls, pending };
}

test('Pages EventContext schedules and completes the CRM mirror with accepted 201 diagnostic', async () => {
  const fixture = setup();
  const response = await onRequestPost(fixture.event);
  assert.equal(response.status, 201);
  assert.equal(fixture.leads.size, 1);
  assert.equal(fixture.pending.length, 1, 'must schedule using EventContext.waitUntil');
  await Promise.all(fixture.pending);
  assert.equal(fixture.calls.length, 1);
  assert.equal(fixture.calls[0].options.headers['x-crm-ingest-token'], token);
  assert.equal(JSON.parse(fixture.calls[0].options.body).id, leadId);
  assert.deepEqual(
    [fixture.diagnostics[0].outcome, fixture.diagnostics[0].http_status],
    ['accepted', 201],
  );
});

test('missing CRM binding still saves the original lead and diagnostics a safe outcome', async () => {
  const fixture = setup({ hasService: false });
  const response = await onRequestPost(fixture.event);
  assert.equal(response.status, 201);
  await Promise.all(fixture.pending);
  assert.equal(fixture.leads.size, 1);
  assert.equal(fixture.diagnostics[0].outcome, 'service_binding_unavailable');
});

test('rejected service response logs only status/outcome without interrupting public form', async () => {
  const fixture = setup({ status: 403 });
  const response = await onRequestPost(fixture.event);
  assert.equal(response.status, 201);
  await Promise.all(fixture.pending);
  assert.deepEqual(
    [fixture.diagnostics[0].outcome, fixture.diagnostics[0].http_status],
    ['rejected', 403],
  );
  assert.equal(Object.hasOwn(fixture.diagnostics[0], 'full_name'), false);
});

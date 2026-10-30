import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/leads.js';
import ingestWorker from '../crm/src/ingest.js';

// Synthetic-only regression tests. No real customer details, Cloudflare secrets,
// network calls, production databases or external services.
const stagingUrl = 'https://legacy-water-staging.pages.dev/api/leads';
const pagesToken = 'S'.repeat(40);
const customer = {
  request_id: '66ec9da2-9b93-47f4-b713-6c451e3d5a15',
  zip: '34769', preferred_day: 'Weekday', preferred_time: 'Morning',
  full_name: 'Synthetic CRM Test', phone: '4075550199',
  source: 'qr', campaign: 'crm-automated-safety', product_interest: 'city_water',
};
function fakePagesDb() {
  const leads = new Map(), diagnostics = [];
  return {
    leads, diagnostics,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.includes('INSERT OR IGNORE INTO water_test_leads')) {
                const [id, created_at, zip, preferred_day, preferred_time, full_name,
                  phone, source, campaign, product_interest] = args;
                if (leads.has(id)) return { success: true, meta: { changes: 0 } };
                leads.set(id, { id, created_at, zip, preferred_day, preferred_time,
                  full_name, phone, source, campaign, product_interest });
                return { success: true, meta: { changes: 1 } };
              }
              if (sql.includes('INSERT INTO crm_mirror_diagnostics')) {
                const [created_at, outcome, http_status] = args;
                diagnostics.push({ created_at, outcome, http_status });
                return { success: true };
              }
              throw Error('Unexpected Pages SQL');
            },
            async first() {
              if (sql.includes('SELECT * FROM water_test_leads WHERE id = ?'))
                return leads.get(args[0]) || null;
              throw Error('Unexpected Pages read');
            },
          };
        },
      };
    },
  };
}
function fakeCrmDb() {
  const leads = new Map();
  return {
    leads,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (!sql.includes('INSERT OR IGNORE INTO crm_leads')) throw Error('Unexpected CRM SQL');
              const [id, created_at, updated_at, full_name, phone, zip, source,
                campaign, product_interest, preferred_day, preferred_time] = args;
              if (leads.has(id)) return { success: true, meta: { changes: 0 } };
              leads.set(id, { id, created_at, updated_at, full_name, phone, zip,
                source, campaign, product_interest, preferred_day, preferred_time, status: 'new' });
              return { success: true, meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
}
function setup({ binding = true, publicToken = pagesToken, privateToken = pagesToken } = {}) {
  const publicDb = fakePagesDb(), privateDb = fakeCrmDb();
  const env = { DB: publicDb, CRM_INGEST_TOKEN: publicToken };
  if (binding) {
    env.CRM_SERVICE = {
      fetch(url, init) {
        return ingestWorker.fetch(new Request(url, init), {
          DB: privateDb, CRM_INGEST_TOKEN: privateToken,
        }, {});
      },
    };
  }
  return { env, publicDb, privateDb };
}
function request(payload = customer) {
  return new Request(stagingUrl, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
const submit = (env, payload) => onRequestPost({
  request: request(payload), env,
  context: { waitUntil() { throw Error('Staging must await mirror instead of scheduling waitUntil'); } },
});

test('Pages staging completes end-to-end transfer before returning success', async () => {
  const { env, publicDb, privateDb } = setup();
  const result = await submit(env);
  assert.equal(result.status, 201);
  assert.equal((await result.json()).saved, true);
  assert.equal(publicDb.leads.size, 1);
  assert.equal(privateDb.leads.size, 1);
  const lead = privateDb.leads.get(customer.request_id);
  assert.equal(lead.status, 'new');
  assert.equal(lead.campaign, 'crm-automated-safety');
  assert.equal(lead.source, 'water-test-qr');
  assert.equal(publicDb.diagnostics.length, 1);
  assert.deepEqual(
    [publicDb.diagnostics[0].outcome, publicDb.diagnostics[0].http_status],
    ['accepted', 201],
  );
});

test('Missing service binding never loses original form submission', async () => {
  const { env, publicDb, privateDb } = setup({ binding: false });
  const result = await submit(env);
  assert.equal(result.status, 201);
  assert.equal(publicDb.leads.size, 1);
  assert.equal(privateDb.leads.size, 0);
  assert.equal(publicDb.diagnostics[0].outcome, 'service_binding_unavailable');
});

test('Too-short secret is diagnosed, without sending private customer data', async () => {
  const { env, publicDb, privateDb } = setup({ publicToken: 'too-short' });
  const result = await submit(env);
  assert.equal(result.status, 201);
  assert.equal(privateDb.leads.size, 0);
  assert.deepEqual(
    [publicDb.diagnostics[0].outcome, publicDb.diagnostics[0].http_status],
    ['secret_missing_or_short', null],
  );
});

test('Mismatched shared tokens are rejected, with no CRM write', async () => {
  const { env, publicDb, privateDb } = setup({ privateToken: 'X'.repeat(40) });
  const result = await submit(env);
  assert.equal(result.status, 201);
  assert.equal(publicDb.leads.size, 1);
  assert.equal(privateDb.leads.size, 0);
  assert.deepEqual(
    [publicDb.diagnostics[0].outcome, publicDb.diagnostics[0].http_status],
    ['rejected', 403],
  );
});

test('Duplicate submission does not mirror or email twice', async () => {
  const { env, publicDb, privateDb } = setup();
  const first = await submit(env);
  const repeat = await submit(env);
  assert.equal(first.status, 201);
  assert.equal(repeat.status, 200);
  assert.equal(publicDb.leads.size, 1);
  assert.equal(privateDb.leads.size, 1);
  assert.equal(publicDb.diagnostics.length, 1);
});

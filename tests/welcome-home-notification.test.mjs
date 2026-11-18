// Welcome Home owner notification tests.
// Run: node --test tests/welcome-home-notification.test.mjs
// No API keys, real email sends, D1 connections or CRM connections are used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Exercise the notifier currently used by the Pages Function without changing
// production exports. The extraction fails closed if the function moves.
const source = readFileSync(new URL('../functions/api/leads.js', import.meta.url), 'utf8');
const start = source.indexOf('async function notifyOwner(');
const end = source.indexOf('\nexport async function onRequestPost(', start);
assert.ok(start >= 0 && end > start, 'Expected Pages notifyOwner function not found');
const notifierCode = source.slice(start, end);

function makeHarness() {
  const calls = [];
  const fetchStub = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    calls.push({ url, options, email: JSON.parse(options.body) });
    return { ok: true, status: 200 };
  };
  const noNetwork = new Function(
    'fetch', 'AbortSignal', 'console',
    notifierCode + '\nreturn notifyOwner;',
  );
  const notifyOwner = noNetwork(fetchStub, { timeout: () => undefined }, {
    error: () => {}, warn: () => {},
  });
  return { calls, notifyOwner };
}

function fakeLead(campaign = 'welcome_home_2026_sc01') {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    zip: '34771',
    full_name: 'QA NO CONTACT',
    phone: '407-555-0100',
    preferred_day: 'Weekday',
    preferred_time: 'Afternoon',
    source: 'water-test-qr',
    campaign,
  };
}

const fakeEnv = {
  RESEND_API_KEY: 'FAKE-NO-NETWORK-TOKEN',
  LEAD_ALERT_TO: 'qa@example.invalid',
};

test('Welcome Home subject, campaign, cake voucher instructions and idempotency', async () => {
  const { calls, notifyOwner } = makeHarness();
  await notifyOwner(fakeEnv, fakeLead());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].email.subject, 'WELCOME HOME — New water test request — 34771');
  assert.equal(calls[0].email.to, fakeEnv.LEAD_ALERT_TO);
  assert.match(calls[0].email.text, /Campaign: welcome_home_2026_sc01/);
  assert.match(calls[0].email.text, /La Casita Celebrations/);
  assert.match(calls[0].email.text, /after the completed eligible in-home evaluation/);
  assert.match(calls[0].email.text, /no purchase required/);
  assert.match(calls[0].email.text, /not a confirmed booking/);
  assert.equal(calls[0].options.headers['idempotency-key'], 'water-test-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
});

test('Generic and malformed campaign alerts stay generic', async () => {
  const { calls, notifyOwner } = makeHarness();
  await notifyOwner(fakeEnv, fakeLead('generic_campaign'));
  await notifyOwner(fakeEnv, fakeLead('welcome_home_2026_sc01 EXTRA'));
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.email.subject, 'New water test request — 34771');
    assert.doesNotMatch(call.email.text, /Voucher:|Program: Welcome Home/);
  }
});

test('Missing email configuration causes no send', async () => {
  const { calls, notifyOwner } = makeHarness();
  await notifyOwner({ ...fakeEnv, RESEND_API_KEY: undefined }, fakeLead());
  await notifyOwner({ ...fakeEnv, LEAD_ALERT_TO: undefined }, fakeLead());
  assert.equal(calls.length, 0);
});

test('Only the explicitly mocked network path is available', async () => {
  const { calls, notifyOwner } = makeHarness();
  await notifyOwner(fakeEnv, fakeLead('welcome_home_2026_pilot1'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].email.subject, 'WELCOME HOME — New water test request — 34771');
});

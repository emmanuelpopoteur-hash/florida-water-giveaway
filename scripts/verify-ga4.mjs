import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = 'dist';
const read = p => readFileSync(join(root, p), 'utf8');
const paths = [];
function walk(directory) {
  for (const d of readdirSync(directory, {withFileTypes:true})) {
    const path = join(directory, d.name);
    if (d.isDirectory()) walk(path);
    else if (d.isFile() && path.endsWith('.html')) paths.push(path);
  }
}
walk(root);
assert.ok(paths.length >= 15, 'Too few HTML pages to claim global coverage: ' + paths.length);
for (const path of paths) {
  const html = readFileSync(path, 'utf8');
  assert.equal((html.match(/<script src="\/media\/ga4-consent\.js" defer><\/script>/g)||[]).length, 1, 'Exactly one consent script per page: ' + path);
  assert.ok(!html.includes('googletagmanager.com/gtag/js?id='), 'GA4 must not load before consent: ' + path);
}
const script = read('media/ga4-consent.js');
assert.ok(script.includes("const MEASUREMENT_ID = 'G-QGPB6TBYGF'"), 'Incorrect GA measurement ID');
assert.ok(script.includes("if (initialized || choice !== 'granted') return;"), 'Analytics requires opt-in');
assert.ok(script.includes("script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID"), 'Missing Google tag script');
assert.ok(script.includes("['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'lang']"), 'Missing sanitized campaign attribution');
assert.ok(script.includes("window.gtag('event', 'generate_lead'"), 'Missing generate_lead event');
const form = read('check/app.js');
assert.ok(form.includes("if(response.status===201){try{window.legacyAnalytics?.trackLeadSaved?.()}catch(_){}}"), 'Only confirmed first saves should fire GA lead event');
assert.ok(form.includes("if(!response.ok||result?.saved!==true||typeof result.id!=='string'||!result.id)throw Error('Save not confirmed');"), 'Lead confirmation gate missing');
for (const privacy of ['privacy/index.html','privacy/es/index.html']) {
  assert.ok(read(privacy).includes('Google Analytics'), 'Missing privacy notice ' + privacy);
}
console.log('PASS: ' + paths.length + ' HTML pages, once-per-page analytics loader, opt-in, safe lead event, bilingual privacy notices.');

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const routes = [
  { path: '/insights/', lang: 'en', alternate: '/insights/es/' },
  { path: '/insights/es/', lang: 'es', alternate: '/insights/' },
  { path: '/insights/st-cloud-water-quality-2025/', lang: 'en', alternate: '/insights/es/calidad-agua-st-cloud-2025/' },
  { path: '/insights/es/calidad-agua-st-cloud-2025/', lang: 'es', alternate: '/insights/st-cloud-water-quality-2025/' },
  { path: '/insights/toho-water-rates-2026/', lang: 'en', alternate: '/insights/es/tarifas-toho-2026/' },
  { path: '/insights/es/tarifas-toho-2026/', lang: 'es', alternate: '/insights/toho-water-rates-2026/' }
];
const origin = 'https://legacywaterusa.com';
const read = path => readFileSync(join(dist, path), 'utf8');
const checkRoute = route => {
  const file = join(route.path.slice(1), 'index.html');
  const html = read(file);
  assert.ok(html.length > 2000, `Page too small: ${file}`);
  assert.ok(html.startsWith('<!doctype html>'), `HTML DOCTYPE missing: ${file}`);
  assert.ok(html.includes(`<html lang="${route.lang}">`), `Wrong language: ${file}`);
  assert.ok(html.includes(`<link rel="canonical" href="${origin + route.path}">`), `Canonical missing: ${file}`);
  assert.ok(html.includes(`rel="alternate" hreflang="${route.lang === 'en' ? 'es' : 'en'}" href="${origin + route.alternate}"`), `Other language URL missing: ${file}`);
  assert.ok(html.includes('<meta name="description"'), `Meta description missing: ${file}`);
  assert.ok(html.includes('og:title'), `Social title missing: ${file}`);
  assert.ok(html.includes('/insights/styles.css'), `Stylesheet missing: ${file}`);
  assert.ok(html.includes('/check/?lang=' + route.lang + '&utm_source=legacy_insights'), `Trackable CTA missing: ${file}`);
  assert.ok(html.includes('utm_campaign=water_education'), `Campaign parameter missing: ${file}`);
  assert.ok(html.includes('not affiliated with Toho Water Authority') || html.includes('No estamos afiliados con Toho Water Authority') || html.includes('No estamos afiliados a Toho Water Authority'), `Disclosure missing: ${file}`);
  assert.ok(html.includes('Toho') && html.includes('Water'), `Sources missing: ${file}`);
  for (const href of html.matchAll(/href="(\/[A-Za-z0-9_\-./]+)(?:\?[^"]*)?"/g)) {
    const url = href[1];
    if (url.startsWith('/media/')) continue;
    const asset = url.endsWith('/') ? url.slice(1) + 'index.html' : url.slice(1);
    assert.ok(existsSync(join(dist,asset)), `Broken internal link in ${file}: ${url}`);
  }
  console.log('PASS:', route.path);
};
for (const route of routes) checkRoute(route);
const map = read('sitemap.xml');
for (const r of routes) assert.ok(map.includes(origin + r.path), `Missing sitemap entry: ${r.path}`);
assert.ok(read('robots.txt').includes('Sitemap: ' + origin + '/sitemap.xml'));
assert.ok(read('index.html').includes('data-insights'), 'Homepage navigation missing Insights');
assert.ok(read('index.html').includes("language === 'es' ? '/insights/es/' : '/insights/'"), 'Homepage Spanish routing missing');
console.log('PASS: sitemap, internal links, homepage language selection and tracked CTAs.');

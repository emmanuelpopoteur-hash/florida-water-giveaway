// Static safety checks for the two mailer variants; no network or customer data.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../welcome-home/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../welcome-home/buyer-options.css', import.meta.url), 'utf8');

test('Only the active-buyer letter activates its above-fold campaign strip', () => {
  assert.match(html, /const buyerLetter = batch === 'sc01b';/);
  assert.match(html, /id="buyerHeroPromos" hidden/);
  assert.match(html, /if \(buyerLetter\) \{\s*document\.body\.classList\.add\('buyer-letter'\)/);
  assert.match(html, /document\.getElementById\('buyerHeroPromos'\)\.hidden=false/);
  assert.match(css, /\.buyer-hero-promos\[hidden\]\{display:none!important\}/);
  assert.match(css, /\.buyer-letter \.hero h1/);
});

test('Active-buyer claims remain qualified and callback is explicit', () => {
  assert.match(html, /System options from \$3,990\*/);
  assert.match(html, /6 months without payments\*/);
  assert.match(html, /RO with qualifying packages\*/);
  assert.match(html, /no-payment periods may accrue interest/);
  assert.match(html, /Call to Compare: \(407\) 257-6911/);
  assert.match(html, /Llama para comparar/);
  assert.doesNotMatch(html, /Guaranteed approval|Zero interest guaranteed/i);
});

test('QR variants share the backend and retain intent before the callback', () => {
  assert.match(html, /url\.searchParams\.set\('utm_campaign','welcome_home_2026_'\+batch\)/);
  assert.match(html, /compareUrl\.searchParams\.set\('utm_campaign','welcome_home_2026_'\+batch\+'__compare'\)/);
  assert.match(html, /const target=buyerLetter\?compareUrl:url/);
  assert.match(html, /document\.getElementById\('waterOffer'\)\.href=url\.pathname\+url\.search/);
  assert.match(html, /getElementById\('compareOffer'\)\.href=compareUrl\.pathname\+compareUrl\.search/);
});

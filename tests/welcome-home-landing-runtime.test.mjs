// Real inline landing script, executed with inert DOM doubles.
// No network, browser, customer data, submissions or Cloudflare bindings.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const html = readFileSync(new URL('../welcome-home/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length > 0, 'Welcome Home inline landing script was not found');
const source = scripts.at(-1)[1];
assert.match(source, /const buyerLetter = batch === 'sc01b'/);

function element(attributes = {}) {
  const attrs = { ...attributes };
  const callbacks = {};
  return {
    textContent: '',
    hidden: false,
    href: '',
    dataset: {},
    attrs,
    callbacks,
    classList: {
      values: new Set(),
      add(x) { this.values.add(x); },
      toggle(x, shouldAdd) {
        if (shouldAdd) this.values.add(x);
        else this.values.delete(x);
      },
      contains(x) { return this.values.has(x); },
    },
    getAttribute(k) { return attrs[k] ?? null; },
    setAttribute(k, v) { attrs[k] = String(v); },
    addEventListener(event, cb) { (callbacks[event] ||= []).push(cb); },
    click() { for (const cb of callbacks.click || []) cb(); },
    querySelectorAll() { return []; },
  };
}

function makePage(batch, lang = 'en') {
  const enEs = (en, es) => element({ 'data-en': en, 'data-es': es });
  const heading = enEs('Your home is new. How well do you know its water?', 'Tu hogar es nuevo. ¿Qué sabes del agua que utilizas?');
  const subtitle = enEs('WELCOME TO THE NEIGHBORHOOD', 'BIENVENIDOS AL VECINDARIO');
  const phone = enEs('Call (407) 257-6911', 'Llamar (407) 257-6911');
  const note = enEs('Choose your preferred day and time.', 'Elige tu horario preferido.');
  const description = enEs('Congratulations on your new St. Cloud home!', '¡Felicidades por tu nuevo hogar!');
  const top = enEs('Request My Free Water Check', 'Solicitar mi prueba gratis');
  const bottom = enEs('Request My Free Water Check', 'Solicitar mi prueba gratis');
  const langEN = element();
  const langES = element();
  langEN.dataset.lang = 'en';
  langES.dataset.lang = 'es';
  const allTranslatable = [heading, subtitle, phone, note, description, top, bottom];
  const promo = element();
  promo.hidden = true;
  const menu = element({ 'aria-expanded': 'false' });
  const navigation = element();
  const ids = {
    welcomeHeading: heading,
    buyerHeroPromos: promo,
    bookTop: Object.assign(element(), { querySelector: () => top }),
    bookBottom: Object.assign(element(), { querySelector: () => bottom }),
    waterOffer: element(),
    compareOffer: element(),
    menuButton: menu,
    'main-nav': navigation,
  };
  const body = element();
  const document = {
    body,
    documentElement: { lang: 'en' },
    getElementById(id) {
      assert.ok(id in ids, 'Unknown ID ' + id);
      return ids[id];
    },
    querySelector(sel) {
      const nodes = {
        '.hero-subtitle': subtitle,
        '.hero-buttons .button-white [data-en]': phone,
        '.appointment-note': note,
        '.hero-description': description,
      };
      assert.ok(sel in nodes, 'Unknown selector ' + sel);
      return nodes[sel];
    },
    querySelectorAll(sel) {
      if (sel === '[data-en][data-es]') return allTranslatable;
      if (sel === '[data-lang]') return [langEN, langES];
      throw Error('Unknown selector ' + sel);
    },
  };
  const url = 'https://preview.example.invalid/welcome-home/?c=' + batch + '&lang=' + lang;
  const location = { href: url, origin: 'https://preview.example.invalid', search: new URL(url).search };
  let replacedUrl = '';
  const history = { replaceState(_state, _title, next) { replacedUrl = String(next); } };
  runInNewContext(source, { document, location, history, URL, URLSearchParams });
  return {
    ids, body, document, langEN, langES, heading, subtitle, phone, top,
    get replacedUrl() { return replacedUrl; },
  };
}

test('Letter A keeps curiosity headline and free-check primary action', () => {
  const p = makePage('sc01a');
  assert.equal(p.heading.textContent, 'Your home is new. How well do you know its water?');
  assert.equal(p.ids.buyerHeroPromos.hidden, true);
  assert.equal(p.ids.bookTop.href, '/check/?utm_source=qr&utm_medium=direct_mail&utm_campaign=welcome_home_2026_sc01a&lang=en');
  assert.match(p.ids.compareOffer.href, /welcome_home_2026_sc01a__compare/);
  assert.match(p.ids.waterOffer.href, /welcome_home_2026_sc01a&lang=en/);
  assert.equal(p.body.classList.contains('buyer-letter'), false);
});

test('Letter B uses comparison headline, CTA and quote-specific campaign', () => {
  const p = makePage('sc01b');
  assert.equal(p.heading.textContent, 'Already have a water system quote?');
  assert.equal(p.ids.buyerHeroPromos.hidden, false);
  assert.equal(p.body.classList.contains('buyer-letter'), true);
  assert.equal(p.top.textContent, 'Compare My Options');
  assert.match(p.ids.bookTop.href, /welcome_home_2026_sc01b__compare&lang=en/);
  assert.match(p.ids.bookBottom.href, /welcome_home_2026_sc01b__compare&lang=en/);
  assert.match(p.ids.waterOffer.href, /welcome_home_2026_sc01b&lang=en/);
  assert.match(p.phone.textContent, /Call to Compare/);
});

test('Spanish switch keeps B batch, comparison intent, and return URL', () => {
  const p = makePage('sc01b');
  p.langES.click();
  assert.equal(p.document.documentElement.lang, 'es');
  assert.equal(p.heading.textContent, '¿Ya tienes una cotización de agua?');
  assert.equal(p.top.textContent, 'Comparar mis opciones');
  assert.match(p.ids.bookTop.href, /welcome_home_2026_sc01b__compare&lang=es/);
  assert.match(p.ids.waterOffer.href, /welcome_home_2026_sc01b&lang=es/);
  assert.equal(p.replacedUrl, '/welcome-home/?c=sc01b&lang=es');
  p.langEN.click();
  assert.equal(p.heading.textContent, 'Already have a water system quote?');
  assert.match(p.ids.bookTop.href, /lang=en$/);
});

test('Unrecognized campaign never activates buyer-specific promotion', () => {
  const p = makePage('other');
  assert.equal(p.ids.buyerHeroPromos.hidden, true);
  assert.equal(p.body.classList.contains('buyer-letter'), false);
});

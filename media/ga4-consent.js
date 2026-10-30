/* Legacy Water USA — GA4, only after explicit analytics consent.
 * Do not send names, phone numbers, addresses, form field values or lead IDs.
 * Measurement ID is a public identifier, not a credential.
 */
(() => {
  'use strict';
  const MEASUREMENT_ID = 'G-QGPB6TBYGF';
  const STORAGE_KEY = 'legacy_analytics_consent_v1';
  let choice = null;
  let initialized = false;
  let banner;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') choice = stored;
  } catch (_) {}

  const getLanguage = () => {
    try {
      const query = new URLSearchParams(location.search).get('lang');
      const saved = localStorage.getItem('legacy-language');
      return location.pathname.startsWith('/es/') || location.pathname.startsWith('/insights/es/') ||
        location.pathname.startsWith('/privacy/es/') || query === 'es' ||
        (query !== 'en' && saved === 'es') ? 'es' : 'en';
    } catch (_) {
      return document.documentElement.lang === 'es' ? 'es' : 'en';
    }
  };

  const texts = {
    en: {
      title: 'Optional website analytics',
      detail: 'May we use Google Analytics to understand which pages people visit and improve Legacy Water USA? Contact details submitted in our water-test form are not sent to Analytics.',
      accept: 'Allow analytics',
      decline: 'No thanks',
      settings: 'Privacy choices',
      policy: 'Privacy notice'
    },
    es: {
      title: 'Análisis opcional del sitio',
      detail: '¿Nos permites usar Google Analytics para saber qué páginas visitan las personas y mejorar Legacy Water USA? No enviamos a Analytics los datos de contacto del formulario de prueba de agua.',
      accept: 'Permitir análisis',
      decline: 'No, gracias',
      settings: 'Preferencias de privacidad',
      policy: 'Aviso de privacidad'
    }
  };

  function safePageLocation() {
    const page = new URL(location.href);
    const allowed = new URLSearchParams();
    const incoming = page.searchParams;
    for (const name of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'lang']) {
      const value = incoming.get(name);
      if (value && /^[a-zA-Z0-9_\-.]{1,100}$/.test(value)) allowed.set(name, value);
    }
    page.search = allowed.toString();
    page.hash = '';
    return page.href;
  }

  function startAnalytics() {
    if (initialized || choice !== 'granted') return;
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {page_location: safePageLocation()});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  // This method is called only after /api/leads returns 201 with saved:true and an ID.
  window.legacyAnalytics = {
    trackLeadSaved() {
      if (choice !== 'granted' || typeof window.gtag !== 'function') return;
      window.gtag('event', 'generate_lead', {
        lead_type: 'in_home_water_test'
      });
    }
  };

  function setChoice(next) {
    const revoked = choice === 'granted' && next === 'denied';
    choice = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    banner?.remove();
    banner = null;
    if (revoked) {
      try { window.gtag?.('consent', 'update', {analytics_storage: 'denied'}); } catch (_) {}
      location.reload(); // stop the previously loaded analytics script in this tab
    } else if (next === 'granted') {
      startAnalytics();
    }
  }

  function showBanner() {
    if (banner) return;
    const t = texts[getLanguage()];
    const policy = getLanguage() === 'es' ? '/privacy/es/' : '/privacy/';
    banner = document.createElement('section');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t.title);
    banner.style.cssText = 'position:fixed;left:12px;bottom:55px;z-index:2147480000;width:min(410px,calc(100vw - 24px));background:#fff;color:#123242;border:1px solid #bed5d3;box-shadow:0 12px 40px #061b2940;border-radius:16px;padding:18px;font:14px/1.5 system-ui,-apple-system,sans-serif;';
    const title = document.createElement('strong');
    title.textContent = t.title;
    title.style.cssText = 'display:block;font-size:16px;margin-bottom:5px;';
    const detail = document.createElement('p');
    detail.textContent = t.detail;
    detail.style.cssText = 'margin:0 0 12px;';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:9px;align-items:center;';
    function button(label, value, primary) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'border:1px solid #087c82;border-radius:7px;padding:9px 12px;cursor:pointer;font:600 13px system-ui;background:' + (primary ? '#087c82;color:#fff;' : '#fff;color:#087c82;');
      b.addEventListener('click', () => setChoice(value));
      return b;
    }
    actions.append(button(t.accept, 'granted', true), button(t.decline, 'denied', false));
    const link = document.createElement('a');
    link.href = policy;
    link.textContent = t.policy;
    link.style.cssText = 'font-size:12px;margin-top:10px;display:inline-block;color:#087c82;';
    banner.append(title, detail, actions, link);
    document.body.appendChild(banner);
  }

  function setupUI() {
    const t = texts[getLanguage()];
    const control = document.createElement('button');
    control.type = 'button';
    control.textContent = t.settings;
    control.style.cssText = 'position:fixed;left:12px;bottom:10px;z-index:2147479999;border:1px solid #9cb6ba;border-radius:999px;padding:5px 9px;background:#fff;color:#244653;font:11px/1.4 system-ui,-apple-system,sans-serif;cursor:pointer;box-shadow:0 2px 7px #061b2920;';
    control.addEventListener('click', showBanner);
    document.body.appendChild(control);
    if (!choice) showBanner();
  }

  if (choice === 'granted') startAnalytics();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupUI);
  else setupUI();
})();

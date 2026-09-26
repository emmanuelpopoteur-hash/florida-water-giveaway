(() => {
  const translations = {
    'FLORIDA HOMEOWNERS': 'PROPIETARIOS EN FLORIDA',
    'COMPLIMENTARY WATER TEST': 'PRUEBA DE AGUA GRATIS',
    'COMPLIMENTARY WATER TEST • FLORIDA HOMEOWNERS': 'PRUEBA DE AGUA GRATIS • PROPIETARIOS EN FLORIDA',
    'FREE IN-HOME WATER TEST': 'PRUEBA DE AGUA GRATIS EN CASA',
    'What’s Really': '¿Qué hay realmente',
    'in Your': 'en tu',
    'Water?': 'agua?',
    'Get a complimentary in-home water test and see what’s happening with the water your family uses every day.': 'Solicita una prueba de agua gratis en casa y descubre qué sucede con el agua que tu familia usa cada día.',
    'CHECK MY WATER FOR FREE': 'SOLICITAR PRUEBA GRATIS',
    'No obligation': 'Sin compromiso',
    'We come to your home': 'Vamos a tu casa',
    'Clarity starts at home.': 'La claridad comienza en casa.',
    'YOUR WATER, MADE CLEARER': 'CONOCE MEJOR TU AGUA',
    'Let’s check': 'Conozcamos',
    'your water.': 'tu agua.',
    'Complimentary test. No pressure to buy.': 'Prueba gratis. Sin presión para comprar.',
    'STEP 01 / 03': 'PASO 01 / 03',
    'ABOUT 1 MINUTE': 'APROX. 1 MINUTO',
    'FIRST, YOUR LOCATION': 'PRIMERO, TU UBICACIÓN',
    'Where should we': '¿Dónde debemos',
    'test your water?': 'analizar tu agua?',
    'Florida ZIP code': 'Código postal de Florida',
    'Available for homeowners in Florida.': 'Disponible para propietarios de viviendas en Florida.',
    'CONTINUE': 'CONTINUAR',
    'YOUR PREFERRED TIME': 'TU HORARIO PREFERIDO',
    'When works': '¿Cuándo te',
    'best for you?': 'conviene más?',
    'Preferred day': 'Día preferido',
    'Weekday': 'Entre semana',
    'Weekend': 'Fin de semana',
    'Preferred time': 'Horario preferido',
    'Morning': 'Mañana',
    'Afternoon': 'Tarde',
    'Evening': 'Noche',
    'This is a preference, not a booked appointment.': 'Esta es una preferencia; todavía no es una cita confirmada.',
    '← Back': '← Volver',
    'LAST STEP': 'ÚLTIMO PASO',
    'How can we': '¿Cómo podemos',
    'reach you?': 'contactarte?',
    'Full name': 'Nombre completo',
    'Phone number': 'Número de teléfono',
    'We’ll use your number to confirm your water test.': 'Usaremos tu número para confirmar la prueba de agua.',
    'REQUEST MY FREE TEST': 'SOLICITAR MI PRUEBA GRATIS',
    'By submitting, you agree that Legacy Water USA may contact you about this request. No obligation to purchase.': 'Al enviar este formulario, aceptas que Legacy Water USA te contacte acerca de esta solicitud. No tienes obligación de comprar.',
    'REQUEST RECEIVED': 'SOLICITUD RECIBIDA',
    'You’re all set!': '¡Todo listo!',
    'A Legacy Water USA specialist will contact you shortly to confirm your complimentary in-home water test.': 'Un especialista de Legacy Water USA se comunicará contigo pronto para confirmar tu prueba de agua gratis en casa.',
    '$0 • No obligation': '$0 • Sin compromiso',
    'WHAT TO EXPECT': 'QUÉ PUEDES ESPERAR',
    'What Happens During': '¿Qué sucede durante',
    'Your Water Test': 'tu prueba de agua?',
    'Simple, personal, and entirely up to you.': 'Sencilla, personal y sin compromiso.',
    'We test your water': 'Analizamos tu agua',
    'in your home.': 'en tu casa.',
    'We explain what we find': 'Te explicamos los resultados',
    'in simple terms.': 'con palabras claras.',
    'You decide what you': 'Tú decides qué',
    'want to do next.': 'hacer después.',
    'The visit is complimentary. There is no obligation to purchase anything.': 'La visita es gratis. No tienes obligación de comprar nada.',
    'Helping Florida homeowners understand their water.': 'Ayudamos a los propietarios de Florida a conocer su agua.',
    'Please enter a valid 5-digit ZIP code.': 'Ingresa un código postal válido de 5 dígitos.',
    'Please enter a Florida ZIP code.': 'Ingresa un código postal de Florida.',
    'Please select a preferred day and time.': 'Selecciona un día y un horario preferidos.',
    'Please enter your full name and a valid phone number.': 'Ingresa tu nombre completo y un número de teléfono válido.',
    'We could not send your request right now. Please try again shortly.': 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos momentos.',
    'SENDING…': 'ENVIANDO…'
  };
  const originals = new WeakMap();
  let language = 'en';
  function translateNode(node) {
    if (!originals.has(node)) originals.set(node, node.textContent);
    const original = originals.get(node);
    const key = original.trim();
    const translated = language === 'es' ? translations[key] : undefined;
    node.textContent = translated ? original.replace(key, translated) : original;
  }
  function render() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateNode(walker.currentNode);
    document.getElementById('zip').placeholder = language === 'es' ? 'Ingresa tu código postal' : 'Enter your ZIP code';
    document.getElementById('fullName').placeholder = language === 'es' ? 'Tu nombre completo' : 'Your full name';
    document.documentElement.lang = language;
    document.title = language === 'es' ? 'Prueba de agua gratis en casa | Legacy Water USA' : 'Free In-Home Water Test | Legacy Water USA';
    document.querySelector('meta[name="description"]').content = language === 'es'
      ? 'Solicita una prueba de agua gratis en casa con Legacy Water USA. Sin compromiso, para propietarios en Florida.'
      : 'Get a complimentary in-home water test from Legacy Water USA. $0, no obligation, serving Florida homeowners.';
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  }
  function setLanguage(next, updateUrl = false) {
    language = next === 'es' ? 'es' : 'en';
    try { localStorage.setItem('legacy-water-test-language', language); } catch (_) {}
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
    }
    render();
  }
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('legacy-water-test-language'); } catch (_) {}
  setLanguage(requested === 'en' || requested === 'es' ? requested : saved);
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language, true)));
  window.waterTestI18n = { t: value => language === 'es' ? translations[value] || value : value, getLanguage: () => language, render };
})();

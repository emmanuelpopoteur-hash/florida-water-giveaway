const t=value=>window.waterTestI18n.t(value);const form=document.getElementById('leadForm');let requestId='',requestFingerprint='';const steps=[...document.querySelectorAll('.step')];let current=1;const show=n=>{current=n;steps.forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));document.getElementById('stepLabel').textContent=`${window.waterTestI18n.getLanguage()==='es'?'PASO':'STEP'} 0${n} / 03`;document.getElementById('progressFill').style.width=`${n/3*100}%`;document.querySelector('.card').scrollIntoView({behavior:'smooth',block:'center'});};const err=(id,msg)=>{(document.getElementById(id).dataset.originalError=msg,document.getElementById(id).textContent=t(msg))};const tracking=new URLSearchParams(location.search);const startingZip=tracking.get('zip');if(/^(32|33|34)\d{3}$/.test(startingZip||'')){document.getElementById('zip').value=startingZip;document.getElementById('zip').dispatchEvent(new Event('input',{bubbles:true}))}const querySource=tracking.get('utm_source')?.toLowerCase();const rawCampaign=(tracking.get('utm_campaign')||'').trim().slice(0,80);const inheritedInterest=rawCampaign.match(/__(city_water|well_water|drinking_ro)$/)?.[1]||'';const requestedInterest=tracking.get('interest')||inheritedInterest;const productInterest=['city_water','well_water','drinking_ro'].includes(requestedInterest)?requestedInterest:null;const campaign=inheritedInterest?rawCampaign.replace(/__(city_water|well_water|drinking_ro)$/,''):rawCampaign;
// Welcome Home campaign only: keep the homeowner's context throughout the existing form.
// Never activate this presentation for general QR, social, or other marketing sources.
const isCompareRequest=campaign.endsWith('__compare');
const welcomeBaseCampaign=isCompareRequest?campaign.slice(0,-'__compare'.length):campaign;
const welcomeBatch=welcomeBaseCampaign.match(/^welcome_home_2026_([a-z0-9_-]{1,24})$/)?.[1]||'';
const isWelcomeCompareFlow=Boolean(welcomeBatch&&isCompareRequest);
if(welcomeBatch){
  document.body.classList.add('welcome-home-flow');
  document.getElementById('welcomeLeadIntro').hidden=false;
  document.getElementById('welcomeSuccess').hidden=false;
  document.getElementById('welcomeFooterBrand').hidden=false;
  const welcomeBack=document.getElementById('welcomeBack');
  const updateWelcomeBack=()=>{
    const destination=new URL('/welcome-home/',location.origin);
    destination.searchParams.set('c',welcomeBatch);
    destination.searchParams.set('lang',window.waterTestI18n.getLanguage());
    welcomeBack.href=destination.pathname+destination.search;
  };
  updateWelcomeBack();
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',updateWelcomeBack));
  if(isCompareRequest){
    document.body.classList.add('welcome-quote-flow');
    const updateCompareCopy=()=>{
      const es=window.waterTestI18n.getLanguage()==='es';
      // The quote-comparison path must not look like a mandatory water-test booking.
      // A comparison request is just a preferred callback/visit window.
      const bookingTitle=document.querySelector('.booking-intro h2');
      if(bookingTitle) bookingTitle.textContent=es
        ? 'Compara tus opciones de tratamiento de agua.'
        : 'Compare your water treatment options.';
      const bookingPromise=document.querySelector('.booking-intro .mini-trust');
      if(bookingPromise) bookingPromise.textContent=es
        ? 'Consulta sin obligación de compra.'
        : 'No obligation to purchase.';
      const zipHeading=document.querySelector('#leadForm .step[data-step="1"] h3');
      if(zipHeading) zipHeading.textContent=es
        ? '¿En qué código postal está tu hogar?'
        : 'What ZIP code is your home in?';
      const contactHint=document.querySelector('#leadForm .step[data-step="3"] .field-help');
      if(contactHint) contactHint.textContent=es
        ? 'Usaremos tu teléfono para responder a tu solicitud de comparación.'
        : 'We will use your number to follow up on your comparison request.';
      const submit=document.getElementById('submitButton');
      if(submit&&!submit.disabled) submit.firstChild.textContent=es
        ? 'SOLICITAR COMPARACIÓN '
        : 'REQUEST COMPARISON ';
      const thankYou=document.querySelector('#successPanel h3');
      if(thankYou) thankYou.textContent=es
        ? '¡Recibimos tu solicitud!'
        : 'We received your request!';
      const successSummary=document.querySelector('#successPanel h3 + p');
      if(successSummary) successSummary.textContent=es
        ? 'Legacy Water USA te contactará para hablar de las opciones disponibles. Tu cita no está confirmada todavía.'
        : 'Legacy Water USA will contact you about the available options. No appointment has been confirmed yet.';

      document.querySelector('#welcomeLeadIntro h2').textContent=es
        ? '¿Ya tienes una cotización? Comparemos opciones.'
        : 'Already have a quote? Compare your options.';
      document.querySelector('#welcomeLeadIntro .welcome-lead-copy p').textContent=es
        ? 'Cuéntanos cuándo te conviene conversar o recibir una visita. Podemos revisar las características y condiciones de las opciones disponibles, y ofrecerte una evaluación gratuita del agua si te interesa. Sin obligación de compra.'
        : 'Tell us when a call or visit works for you. We can review available system options and their terms, and offer a complimentary home water check if you would like. No purchase required.';
      document.getElementById('welcomeSuccess').textContent=es
        ? 'Gracias por solicitar una comparación. Te contactaremos para coordinar una llamada o visita; el horario elegido no está confirmado. El voucher de La Casita Celebrations solo se entrega después de completar una evaluación de agua gratuita y vence 30 días después.'
        : 'Thanks for requesting an options comparison. We will contact you to coordinate a call or visit; your selected time is not yet confirmed. The La Casita Celebrations tasting voucher is handed out only after a completed complimentary water evaluation and expires 30 days later.';
    };
    updateCompareCopy();
    document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',updateCompareCopy));
  }
}
const referrerHost=(()=>{try{return new URL(document.referrer).hostname.toLowerCase()}catch{return ''}})();const source=['tiktok','instagram','facebook','qr','flyer','card','google'].find(name=>querySource===name||(!querySource&&referrerHost.includes(name)))||'direct';document.getElementById('year').textContent=new Date().getFullYear();document.getElementById('zipNext').onclick=()=>{let zip=document.getElementById('zip').value.trim();if(!/^\d{5}$/.test(zip)){err('zipError','Please enter a valid 5-digit ZIP code.');return}if(!(/^(32|33|34)\d{3}$/.test(zip))){err('zipError','Please enter a Florida ZIP code.');return}err('zipError','');show(2)};document.getElementById('timeNext').onclick=()=>{if(!form.elements.day.value||!form.elements.time.value){err('timeError','Please select a preferred day and time.');return}err('timeError','');show(3)};document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(current-1));form.addEventListener('submit',async e=>{e.preventDefault();let name=form.elements.name.value.trim(),phone=form.elements.phone.value.trim();if(name.length<2||phone.replace(/\D/g,'').length<10){err('contactError','Please enter your full name and a valid phone number.');return}err('contactError','');const requestPayload={zip:form.elements.zip.value.trim(),preferred_day:form.elements.day.value,preferred_time:form.elements.time.value,full_name:name,phone:phone,source,campaign,product_interest:productInterest};const fingerprint=JSON.stringify(requestPayload);if(fingerprint!==requestFingerprint){requestId=crypto.randomUUID();requestFingerprint=fingerprint}let btn=document.getElementById('submitButton');btn.disabled=true;btn.firstChild.textContent=t('SENDING…')+' ';try{let response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...requestPayload,request_id:requestId})});let result=await response.json();if(!response.ok||result?.saved!==true||typeof result.id!=='string'||!result.id)throw Error('Save not confirmed');if(response.status===201){try{window.legacyAnalytics?.trackLeadSaved?.()}catch(_){}}document.getElementById('formPanel').hidden=true;document.getElementById('successPanel').hidden=false;document.getElementById('successPanel').focus()}catch(e){err('contactError','We could not send your request right now. Please try again shortly.')}finally{btn.disabled=false;btn.firstChild.textContent=isWelcomeCompareFlow?(window.waterTestI18n.getLanguage()==='es'?'SOLICITAR COMPARACIÓN ':'REQUEST COMPARISON '):t('REQUEST MY FREE TEST')+' '}});

document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('stepLabel').textContent=`${window.waterTestI18n.getLanguage()==='es'?'PASO':'STEP'} 0${current} / 03`;document.querySelectorAll('.error').forEach(element=>{if(element.dataset.originalError)element.textContent=t(element.dataset.originalError)});if(document.getElementById('submitButton').disabled)document.getElementById('submitButton').firstChild.textContent=t('SENDING…')+' '}));

const homeLink=document.querySelector('a.brand[aria-label="Legacy Water USA home"]');
const updateHomeLink=()=>{const home=new URL("/",window.location.origin);home.searchParams.set("lang",window.waterTestI18n.getLanguage());for(const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"]){if(tracking.has(key))home.searchParams.set(key,tracking.get(key).slice(0,100))}homeLink.href=home.href};
updateHomeLink();
document.querySelectorAll("[data-language]").forEach(button=>button.addEventListener("click",updateHomeLink));

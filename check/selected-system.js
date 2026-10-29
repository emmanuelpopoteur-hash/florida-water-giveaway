(() => {
const models = {"essential": {"en": "Essential softener", "es": "Suavizador Essential"}, "softener": {"en": "City-water softener", "es": "Suavizador para agua de ciudad"}, "hybrid": {"en": "Hybrid city-water system", "es": "Híbrido para agua de ciudad"}, "hybrid-dual": {"en": "Dual hybrid city-water system", "es": "Híbrido dual para agua de ciudad"}, "salt-free": {"en": "Élite salt-free system", "es": "Sistema Élite sin sal"}, "well-10": {"en": "Well-water treatment · 10 × 54", "es": "Tratamiento de pozo · 10 × 54"}, "well-12": {"en": "Well-water treatment · 12 × 52", "es": "Tratamiento de pozo · 12 × 52"}, "whole-home-ro": {"en": "Whole-home reverse osmosis", "es": "Ósmosis inversa para toda la casa"}, "alkaline-ro": {"en": "Alkaline reverse osmosis", "es": "Ósmosis inversa alcalina"}, "well-ro": {"en": "Alkaline reverse osmosis for wells", "es": "Ósmosis alcalina para agua de pozo"}};
const campaign=(new URLSearchParams(location.search).get('utm_campaign')||'').replace(/__(city_water|well_water|drinking_ro)$/,'');
const model=Object.keys(models).sort((a,b)=>b.length-a.length).find(key=>campaign.endsWith('_'+key));
if(!model)return;
const panel=document.getElementById('selectedSystem');
function render(){
 const lang=window.waterTestI18n.getLanguage(); panel.hidden=false;
 panel.querySelector('small').textContent=lang==='es'?'TE INTERESA':'YOUR INTEREST';
 panel.querySelector('strong').textContent='EcoVerse — '+models[model][lang];
 panel.querySelector('p').textContent=lang==='es'?'Durante la visita podemos conversar sobre este sistema y las necesidades de tu hogar.':'During your visit, we can discuss this system and your home’s needs.';
 const link=panel.querySelector('a');link.textContent=lang==='es'?'Ver otros sistemas →':'Explore other systems →';link.href='/sistemas/?lang='+lang+'#ecoverse';
}
render();document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',render));
})();

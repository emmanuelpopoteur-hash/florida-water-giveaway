/* Legacy Water USA sales assistant. Guided functionality works without an external AI key. */
(function(){
"use strict";
if(document.getElementById("lw-chat-launcher"))return;
const colombia=location.pathname.startsWith("/colombia/");
const dict={
es:{
title:"Asesor de agua",status:"Asistente virtual · atención automática",
intro:colombia?"¡Hola! Soy el asesor virtual de Legacy Water USA. Estamos estudiando opciones de ósmosis inversa para Cali. ¿Qué te interesa conocer?":"¡Hola! Soy el asesor virtual de Legacy Water USA. Puedo comparar equipos, explicar costos y recibir tu solicitud de cotización o prueba gratuita. ¿Cómo puedo ayudarte?",
placeholder:"Escribe tu pregunta…",send:"Enviar",close:"Cerrar chat",foot:"Asistente automatizado. No acepta pagos ni confirma citas.",
chips:["RO para beber","Toda la casa","Precios","Hablar con asesor"],
answers:{
ro:colombia?"Para Cali estamos investigando sistemas RO + UV + remineralización. Aún no hay precios colombianos ni disponibilidad confirmada.":"Para beber, estamos evaluando Essential RO + UV + remineralización. Precio objetivo: US$1,199 con instalación estándar para hogares elegibles de Florida Central. Debemos confirmar modelo, garantía, instalación y mantenimiento por escrito.",
whole:"Para ducha, lavadora, cocina y electrodomésticos, considera tratamiento de casa completa. Un RO bajo fregadero solo trata el agua de ese punto. La elección requiere evaluar el origen y la calidad del agua.",
price:colombia?"Todavía no fijamos precios para Colombia. Primero evaluaremos el mercado, importación, instalación y mantenimiento.":"Essential tiene un precio propuesto de US$1,199 para instalación estándar elegible en Florida Central, sujeto a cotización final. Advanced y Premium H₂ no tienen precio confirmado.",
well:"Con agua de pozo debemos comprobar dureza, hierro, azufre, sedimentos y calidad microbiológica con pruebas apropiadas. Puede ser necesario pretratamiento; UV sola no garantiza la seguridad.",
city:"El agua municipal varía por zona y proveedor. Podemos revisar reportes públicos y tus inquietudes. Un medidor TDS no demuestra potabilidad ni determina por sí solo la dureza.",
maintenance:"El mantenimiento del primer año está contemplado en la propuesta Essential. Visitas, cartuchos, lámpara UV, membrana y mano de obra se detallarán en la cotización final.",
uv:"La luz UV puede complementar el sistema, pero necesita caudal apropiado, agua adecuada y mantenimiento. No quita dureza ni reemplaza las pruebas necesarias.",
hydrogen:"Premium H₂ está en investigación. No podemos prometer hidrógeno molecular medible, pH 10.5 ni ORP negativo sin documentación y pruebas específicas.",
shipping:colombia?"La importación y el transporte a Cali siguen en evaluación; no tenemos fechas ni costos confirmados.":"En Florida Central estudiamos instalación estándar. Fuera de Florida, equipos, envío, instalador y garantías se evalúan caso por caso; no prometemos cobertura nacional.",
warranty:"La garantía depende del equipo y fabricante finalmente seleccionados. Se entregarán condiciones por escrito antes de cualquier pago.",
bottled:"Aunque compres agua embotellada para beber, el agua del hogar también se utiliza para ducharse, cocinar, lavar y cuidar electrodomésticos. Podemos evaluar RO, toda la casa o ambos.",
human:"Este es un chat automatizado. Para atención humana puedes escribir a info@legacywaterusa.com o solicitar que te llamemos.",
fallback:"Puedo orientarte sobre RO para beber, toda la casa, agua de pozo, UV, precios, garantía y mantenimiento. ¿Qué te interesa?"
},
links:{quote:"Solicitar cotización",test:"Prueba gratis en Florida",catalog:"Ver opciones",callback:"Solicitar llamada",mail:"Escribir un correo",col:"Ver opciones Cali"},
form:{title:"Deja tus datos",name:"Nombre completo",phone:"Teléfono",zip:"ZIP de EE. UU.",day:"Día",time:"Horario",choose:"Selecciona",week:"Entre semana",weekend:"Fin de semana",morning:"Mañana",afternoon:"Tarde",evening:"Noche",consent:"Autorizo que Legacy Water USA me contacte sobre esta solicitud. No acepto publicidad automática.",send:"Enviar solicitud",sending:"Enviando…",invalid:"Revisa nombre, teléfono, ZIP, horario y autorización.",onlyFL:"La prueba gratis a domicilio está limitada a los ZIP habilitados de Florida.",error:"No pudimos confirmar el registro. Intenta otra vez o escribe a info@legacywaterusa.com.",success:"¡Solicitud registrada! Referencia: ",note:"No es una compra ni una cita confirmada."}
},
en:{
title:"Water advisor",status:"Virtual assistant · automated guidance",
intro:colombia?"Hello! I'm the Legacy Water USA virtual assistant. We're exploring RO options for Cali; pricing and availability are not confirmed. What would you like to know?":"Hello! I'm the Legacy Water USA virtual advisor. I can compare water systems, explain pricing, and help you request a quote or free water test. What can I help with?",
placeholder:"Ask about your water…",send:"Send",close:"Close chat",foot:"Automated assistant. No payments or confirmed bookings.",
chips:["Drinking water RO","Whole-home system","Pricing","Talk to someone"],
answers:{
ro:colombia?"We're exploring RO + UV + remineralization for Cali. Colombian pricing and availability remain unconfirmed.":"For drinking water, we're evaluating Essential RO + UV + remineralization. Proposed US$1,199 for a qualifying standard Central Florida installation. Model, warranty, installation and maintenance terms require written confirmation.",
whole:"For showers, laundry, kitchens and appliances, whole-home treatment may be relevant. Under-sink RO only treats water at that faucet. The right option depends on water source and testing.",
price:colombia?"Colombian pricing has not been established. We first need to assess the market, import costs, installation and maintenance.":"The proposed Essential price is US$1,199 for qualifying standard installations in Central Florida, subject to a final quote. Advanced and Premium H₂ have no confirmed price.",
well:"Well water needs appropriate testing for hardness, iron, sulfur, sediment and microbiological quality. Pretreatment may be necessary, and UV alone does not guarantee safety.",
city:"Municipal water varies by provider and neighborhood. We can review public reports and your concerns. A TDS reading does not establish safety or hardness by itself.",
maintenance:"First-year maintenance is planned for Essential. Specific service visits, filters, UV lamp, membrane and labor will be detailed in a final written quote.",
uv:"UV may complement treatment when flow and water conditions are suitable, but it requires maintenance. It does not soften water or replace necessary testing.",
hydrogen:"Premium H₂ is still being evaluated. We cannot promise measurable molecular hydrogen, pH 10.5 or negative ORP without documented testing.",
shipping:colombia?"Importation and delivery to Cali are still under review. There are no confirmed shipping costs or dates.":"Standard installation is under review in Central Florida. Outside Florida, shipment, installer and warranty are assessed individually; nationwide service is not confirmed.",
warranty:"Warranty coverage depends on the final product and manufacturer. Terms will be provided in writing before payment.",
bottled:"Even if you buy bottled water for drinking, your home uses water for showers, cooking, cleaning and appliances. We can explore RO, whole-home treatment or both.",
human:"This is an automated chat. Email info@legacywaterusa.com for personal assistance or request a callback.",
fallback:"I can help with drinking-water RO, whole-home treatment, well water, UV, pricing, warranty and maintenance. What interests you?"
},
links:{quote:"Request quote",test:"Free Florida water test",catalog:"Explore options",callback:"Request callback",mail:"Email Legacy",col:"View Cali options"},
form:{title:"Request a callback",name:"Full name",phone:"Phone number",zip:"U.S. ZIP code",day:"Preferred day",time:"Preferred time",choose:"Choose",week:"Weekdays",weekend:"Weekends",morning:"Morning",afternoon:"Afternoon",evening:"Evening",consent:"I authorize Legacy Water USA to contact me about this request. I do not consent to automated marketing.",send:"Send request",sending:"Sending…",invalid:"Please check name, phone, ZIP, timing and authorization.",onlyFL:"Free in-home water tests are limited to eligible Florida ZIP codes.",error:"We couldn't confirm your request. Retry or email info@legacywaterusa.com.",success:"Request received! Reference: ",note:"This is not a purchase or confirmed appointment."}
}
};
function language(){return colombia||document.documentElement.lang==="es"?"es":"en"}
function t(){return dict[language()]}
const normalize=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function intent(s){
const q=normalize(s);
if(/(humano|asesor|representante|agent|human|call|llam|telefono|whatsapp|email|contact|persona real)/.test(q))return "human";
if(/(embotell|bottled|no bebo|don't drink tap)/.test(q))return "bottled";
if(/(hidrogen|hydrogen|\bh2\b|orp|10\.5|premium)/.test(q))return "hydrogen";
if(/(mantenim|repuesto|cartucho|maintenance|replace|service plan)/.test(q))return "maintenance";
if(/(garantia|warranty|return policy)/.test(q))return "warranty";
if(/(envio|entrega|shipping|delivery|ship|exportacion|importacion|colombia)/.test(q))return "shipping";
if(/(ultravioleta|\buv\b|lampara|ultraviolet)/.test(q))return "uv";
if(/(pozo|well water|hierro|iron|azufre|sulfur)/.test(q))return "well";
if(/(municip|acueducto|agua de ciudad|city water|cloro|chlorine|tds|dureza|hardness)/.test(q))return "city";
if(/(ducha|baño|lavadora|toda la casa|whole.home|shower|laundry|appliance|casa completa)/.test(q))return "whole";
if(/(precio|cuanto|cuesta|cost|price|financi|finance|pago|pay|\$|oferta)/.test(q))return "price";
if(/(\bro\b|osmosis|beb|drinking|drink|cocina|kitchen|essential|advanced|buy|compr|purificador)/.test(q))return "ro";
return null;
}
function elt(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
const root=elt("div");root.id="lw-chat-root";
root.innerHTML='<div class="lw-chat-dim" id="lw-chat-dim" hidden></div>'+
'<button class="lw-chat-button" type="button" id="lw-chat-launcher" aria-haspopup="dialog" aria-expanded="false"><span class="lw-avatar" aria-hidden="true">💧</span><span id="lw-chat-label"></span><span class="lw-online" aria-hidden="true"></span></button>'+
'<section class="lw-chat" id="lw-chat-panel" role="dialog" aria-modal="true" aria-label="Legacy Water USA automated water advisor" hidden>'+
'<header class="lw-chat-header"><span class="lw-chat-mark" aria-hidden="true">💧</span><div class="lw-chat-heading"><strong id="lw-chat-title"></strong><small id="lw-chat-status"></small></div><button class="lw-chat-close" type="button" id="lw-chat-close">×</button></header>'+
'<div class="lw-chat-messages" id="lw-chat-log" role="log" aria-live="polite" aria-relevant="additions text"></div>'+
'<form class="lw-chat-composer" id="lw-chat-composer"><input id="lw-chat-input" type="text" maxlength="450" autocomplete="off" required><button id="lw-chat-send" type="submit">➤</button></form>'+
'<div id="lw-chat-foot" class="lw-chat-foot"></div></section>';
document.body.appendChild(root);
const $=id=>document.getElementById(id),log=$("lw-chat-log"),panel=$("lw-chat-panel"),launcher=$("lw-chat-launcher"),input=$("lw-chat-input"),send=$("lw-chat-send");
let started=false,busy=false,AI=false,last="ro",messages=[];
function locale(){const d=t();$("lw-chat-label").textContent=d.title;$("lw-chat-title").textContent=d.title;$("lw-chat-status").textContent=d.status;$("lw-chat-foot").textContent=d.foot;input.placeholder=d.placeholder;input.setAttribute("aria-label",d.placeholder);$("lw-chat-close").setAttribute("aria-label",d.close);send.setAttribute("aria-label",d.send)}
locale();new MutationObserver(locale).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
const scroll=()=>{log.scrollTop=log.scrollHeight};
function bubble(text,who){
const row=elt("div","lw-chat-line"+(who==="user"?" user":""));
row.appendChild(elt("div","lw-chat-bubble",text));log.appendChild(row);scroll();
}
function path(target,extra){
const u=new URL(target,location.origin);u.searchParams.set("lang",language());u.searchParams.set("utm_source","virtual_advisor");if(extra)Object.entries(extra).forEach(([k,v])=>u.searchParams.set(k,v));return u.pathname+u.search+u.hash
}
function choices(items,asQuick){
const group=elt("div",asQuick?"lw-chat-quick":"lw-chat-actions");
for(const item of items){let el=elt(item.href?"a":"button","",item.label);
if(item.href)el.href=item.href;else el.type="button";
if(item.topic)el.addEventListener("click",()=>{bubble(item.label,"user");respond(item.topic)});
if(item.click)el.addEventListener("click",item.click);
group.appendChild(el)}log.appendChild(group);scroll();
}
function nextActions(topic){
const L=t().links;
if(colombia){choices([{label:L.col,href:"/colombia/opciones-ro/"},{label:L.mail,href:"mailto:info@legacywaterusa.com?subject=Cali%20RO%20inquiry"}]);return}
if(topic==="whole"||topic==="well"||topic==="city"||topic==="uv"||topic==="bottled")
choices([{label:L.test,href:path("/check/",{interest:topic==="well"?"well_water":"city_water"})},{label:L.callback,click:()=>showForm("test")},{label:L.catalog,href:path("/sistemas/")}]);
else if(topic==="human")choices([{label:L.callback,click:()=>showForm("ro")},{label:L.mail,href:"mailto:info@legacywaterusa.com?subject=Customer%20request"}]);
else choices([{label:L.quote,href:path("/ro/",{plan:topic==="hydrogen"?"premium":"essential"})+"#request"},{label:L.callback,click:()=>showForm("ro")},{label:L.catalog,href:path("/sistemas/")}]);
}
function respond(topic){last=topic||last;bubble(t().answers[topic]||t().answers.fallback);nextActions(topic)}
function open(){
panel.hidden=false;$("lw-chat-dim").hidden=false;launcher.hidden=true;launcher.setAttribute("aria-expanded","true");
if(!started){started=true;bubble(t().intro);choices(t().chips.map((label,i)=>({label,topic:["ro","whole","price","human"][i]})),true)}
input.focus();scroll()
}
function close(){panel.hidden=true;$("lw-chat-dim").hidden=true;launcher.hidden=false;launcher.setAttribute("aria-expanded","false");launcher.focus()}
launcher.addEventListener("click",open);$("lw-chat-close").addEventListener("click",close);$("lw-chat-dim").addEventListener("click",close);document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
async function discover(){try{const r=await fetch("/api/sales-chat",{cache:"no-store"});if(r.ok)AI=(await r.json()).enabled===true}catch(_){}}
discover();
async function question(text){
if(busy)return;busy=true;input.disabled=send.disabled=true;
const topic=intent(text);
messages.push({role:"user",content:text});messages=messages.slice(-7);
if(AI){
const wait=elt("div","lw-chat-typing",language()==="es"?"Consultando…":"Checking…");log.appendChild(wait);scroll();
try{
const res=await fetch("/api/sales-chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:text,history:messages.slice(-6),language:language(),market:colombia?"colombia":"usa"})});
const obj=await res.json();if(!res.ok||typeof obj.reply!=="string"||!obj.reply.trim())throw Error("unavailable");
wait.remove();bubble(obj.reply.slice(0,850));messages.push({role:"assistant",content:obj.reply.slice(0,850)});messages=messages.slice(-7);nextActions(topic||"ro");
}catch(_){wait.remove();AI=false;respond(topic)}
}else respond(topic);
busy=false;input.disabled=send.disabled=false;input.focus();
}
$("lw-chat-composer").addEventListener("submit",e=>{e.preventDefault();const msg=input.value.trim();if(!msg||busy)return;input.value="";bubble(msg,"user");question(msg)});
function showForm(kind){
if(colombia){choices([{label:t().links.mail,href:"mailto:info@legacywaterusa.com"}]);return}
const d=t().form,f=elt("form","lw-chat-form"),fields={};f.appendChild(elt("strong","",d.title));
function field(id,label,opts){
const wrap=elt("label","",label);let box;
if(opts){box=elt("select");opts.forEach(([value,text])=>{const op=elt("option","",text);op.value=value;box.appendChild(op)})}
else{box=elt("input");box.type=id==="phone"?"tel":"text";box.maxLength=id==="name"?100:id==="zip"?5:24}
box.required=true;box.setAttribute("name",id);box.setAttribute("aria-label",label);wrap.appendChild(box);fields[id]=box;return wrap;
}
f.appendChild(field("name",d.name));f.appendChild(field("phone",d.phone));f.appendChild(field("zip",d.zip));
fields.zip.inputMode="numeric";fields.zip.placeholder="34771";fields.phone.placeholder="(407) 555-0123";
const two=elt("div","lw-two");
two.appendChild(field("day",d.day,[["",d.choose],["Weekday",d.week],["Weekend",d.weekend]]));
two.appendChild(field("time",d.time,[["",d.choose],["Morning",d.morning],["Afternoon",d.afternoon],["Evening",d.evening]]));f.appendChild(two);
const consent=elt("label","lw-consent"),cb=elt("input");cb.type="checkbox";cb.required=true;consent.appendChild(cb);consent.appendChild(elt("span","",d.consent));f.appendChild(consent);
const err=elt("div","lw-form-error");err.setAttribute("role","alert");f.appendChild(err);
const submit=elt("button","",d.send);submit.type="submit";f.appendChild(submit);log.appendChild(f);scroll();fields.name.focus();
let uuid=null;
f.addEventListener("submit",async ev=>{
ev.preventDefault();err.textContent="";
const name=fields.name.value.trim(),phone=fields.phone.value.trim(),zip=fields.zip.value.trim();
if(name.length<2||phone.replace(/\D/g,"").length<10||!/^\d{5}$/.test(zip)||!fields.day.value||!fields.time.value||!cb.checked){err.textContent=d.invalid;return}
if(kind==="test"&&!/^(32|33|34)\d{3}$/.test(zip)){err.textContent=d.onlyFL;return}
if(!crypto||!crypto.randomUUID){err.textContent=d.error;return}
uuid=uuid||crypto.randomUUID();submit.disabled=true;submit.textContent=d.sending;
const payload={request_id:uuid,zip,full_name:name,phone,preferred_day:fields.day.value,preferred_time:fields.time.value,website:""};
let endpoint="/api/ro-inquiries";
if(kind==="test"){endpoint="/api/leads";payload.source="direct";payload.campaign="virtual-assistant";payload.product_interest=last==="well"?"well_water":last==="whole"?"city_water":"drinking_ro"}
else{payload.model=last==="hydrogen"?"premium":"essential";payload.delivery=/^(32|33|34)\d{3}$/.test(zip)?"florida-install":"other-us-quote";payload.channel="virtual_advisor"}
try{const res=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const data=await res.json().catch(()=>({}));if(!res.ok||data.saved!==true||!data.id)throw Error("failed");
f.remove();bubble(d.success+String(data.id).slice(0,8).toUpperCase()+"\n"+d.note);choices([{label:t().links.catalog,href:path("/sistemas/")}]);
}catch(_){err.textContent=d.error;submit.disabled=false;submit.textContent=d.send}
});
}
})();

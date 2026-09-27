import {nearbySystems, searchSystems, zipSystems} from './core.mjs';
import {locate, locationError} from './geolocation.mjs';
const form=document.getElementById('zip-form'), zip=document.getElementById('zip-input'), result=document.getElementById('zip-result');
const gps=document.getElementById('water-gps'), status=document.getElementById('water-status'), search=document.getElementById('water-provider');
const lang=()=>document.documentElement.lang==='es'?'es':'en';
const t=(en,es)=>lang()==='es'?es:en;
let directory, historical, loading, mode='', point=null, selected='', sequence=0, searching=false,notice=null;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
function link(text,url){const a=el('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function announce(en,es){notice=[en,es];status.textContent=lang()==='es'?es:en;}
async function load(){
  if(directory)return;
  if(!loading)loading=Promise.all(['/water-lookup/directory.json','/water-lookup/historical.json'].map(async url=>{
    const r=await fetch(url);if(!r.ok)throw Error('Data unavailable');return r.json();
  })).then(([d,h])=>{directory=d;historical=h;}).catch(error=>{loading=null;throw error;});
  await loading;
}
function renderHistorical(system, result){
  const data=historical.contaminants[system.id];
  if(!data){result.append(el('p',t('Measurements for this system have not yet been added here. Open the source record and confirm its system ID and sampling dates.','Todavía no hemos incorporado las mediciones de este sistema. Abre la fuente y confirma su identificador y fechas de muestreo.')));return;}
  result.append(el('h4',t('Historical measurements','Mediciones históricas')));
  result.append(el('p',t('Previously transcribed EWG utility averages. These are not current tap readings; check the source for sampling periods and updates. EWG guidelines and legal limits are different benchmarks.','Promedios históricos de EWG transcritos previamente. No son mediciones actuales de tu grifo; consulta los periodos y actualizaciones en la fuente. Las guías EWG y los límites legales son referencias diferentes.')));
  for(const [key,en,es] of [['above','Above EWG guidelines','Por encima de las guías EWG'],['other','Other detected contaminants','Otros contaminantes detectados']]){
    if(!data[key]?.length)continue;
    result.append(el('h4',`${t(en,es)} (${data[key].length})`));const cards=el('div',null,'zip-measures');
    for(const row of data[key]){const card=el('div',null,'zip-measure');card.append(el('strong',row[lang()==='es'?1:0]),el('span',t('Utility average: ','Promedio del sistema: ')+row[2]),el('span',t('EWG guideline: ','Guía EWG: ')+(row[3]||t('not set','sin guía'))+' · '+t('Legal limit: ','Límite legal: ')+(row[4]||t('not set','sin límite'))));
      const effect=historical.potentialEffects[row[0]];if(effect)card.append(el('span',t('Potential effect: ','Efecto potencial: ')+effect[lang()]));cards.append(card);}
    result.append(cards);
  }
  result.append(el('p',t('This summary may be incomplete. HAA5 and HAA9 overlap. A potential effect describes a contaminant hazard, not a diagnosis or a prediction about your home.','Este resumen puede estar incompleto. HAA5 y HAA9 se superponen. Un efecto potencial describe un peligro del contaminante, no un diagnóstico ni una predicción sobre tu hogar.'),'zip-context'));
}
function renderOfficial(system){
  const report=historical.officialReports?.[system.id];if(!report)return;
  const section=el('section',null,'water-official');section.append(el('h3',t('Official water report · ','Informe oficial del agua · ')+report.year));
  section.append(el('p',t('System-wide results, not a test of your home. Sampling dates vary by substance.','Resultados del sistema, no un análisis de tu casa. Las fechas de muestreo varían por sustancia.')));
  section.append(el('p',t('The report marks no violations or action-level exceedances in these tables.','El informe no marca incumplimientos ni superaciones del nivel de acción en estas tablas.')));
  const cards=el('div',null,'zip-measures');
  const more=el('details',null,'water-disclosure');more.append(el('summary',t('All results and sampling details','Todos los resultados y detalles de muestreo')));
  const rest=el('div',null,'zip-measures');more.append(rest);
  report.rows.forEach((r,i)=>{
    const card=el('div',null,'zip-measure');
    const metric=r[7]==='lraa'?t('Locational running annual average','Promedio anual móvil por punto'):r[7]==='p90'?t('90th percentile','Percentil 90'):t('Reported level','Nivel reportado');
    card.append(el('strong',r[lang()==='es'?1:0]),el('span',metric+': '+r[2]+' '+r[3]),el('span',t('Report limit: ','Límite del informe: ')+r[6]+' '+r[3]),el('span',t('Sampled: ','Muestreo: ')+r[5]),el('span',t('Range: ','Rango: ')+r[4]+' '+r[3]));
    if(r[7]==='p90')card.append(el('span',t('Sites above action level: 0','Sitios por encima del nivel de acción: 0')));
    if(!r[3])card.append(el('span',t('Unit not specified in the source row.','La fila de origen no especifica la unidad.')));
    card.append(link(t('Source · page ','Fuente · página ')+r[8],report.url+'#page='+r[8]));
    (i<3?cards:rest).append(card);
  });
  section.append(cards,more);
  more.append(el('p',t('MCL: maximum contaminant level. MRDL: maximum residual disinfectant level. AL: action level. ND: not detected. ppm = mg/L; ppb = µg/L; pCi/L measures radioactivity. Limits are reproduced from the 2025 report.','MCL: nivel máximo de contaminante. MRDL: nivel máximo residual de desinfectante. AL: nivel de acción. ND: no detectado. ppm = mg/L; ppb = µg/L; pCi/L mide radiactividad. Los límites se reproducen del informe 2025.')));
  if(system.id==='FL3491373')more.append(el('p',t('Toho reports that it stopped adding fluoride on July 1, 2025; the fluoride sample here is from April 2023.','Toho informa que dejó de añadir fluoruro el 1 de julio de 2025; la muestra de fluoruro aquí es de abril de 2023.')));
  section.append(el('p',system.id==='FL3491373'?t('Source: English report, pages 6–8. The Spanish PDF has conflicting labels and limits; this summary translates the English tables.','Fuente: informe en inglés, páginas 6–8. El PDF en español presenta diferencias en nombres y límites; este resumen traduce las tablas en inglés.'):t('Source: Orange County Utilities 2025 report, page 12. Spanish labels translated by Legacy.','Fuente: informe 2025 de Orange County Utilities, página 12. Etiquetas traducidas al español por Legacy.'),'zip-context'),link(t('Open full official report ↗','Abrir informe oficial completo ↗'),report.url));
  result.append(section);
}
function render(){
  if(!directory||!mode)return;
  result.hidden=false;result.replaceChildren();
  if(selected){
    const system=directory.systems.find(s=>s.id===selected)||historical.systemCatalog[selected];
    if(!system){selected='';return render();}
    result.append(el('h3',system.displayName||system.name),el('p',`${system.id}${system.city?' · '+system.city:''}`),el('p',t('You selected this system. Confirm that the ID or name matches your water bill. Location does not establish service to your address.','Seleccionaste este sistema. Confirma que el identificador o nombre coincida con tu factura. La ubicación no confirma el servicio a tu dirección.')));
    if(system.displayName)result.append(el('p',t('Registry name: ','Nombre en el registro: ')+system.name));
    if(system.reportUrl)result.append(link(t('Official water quality reports ↗','Informes oficiales de calidad del agua ↗'),system.reportUrl));
    if(system.serviceMapUrl)result.append(el('p'),link(t('Confirm your address on the official water quality map ↗','Confirma tu dirección en el mapa oficial de calidad del agua ↗'),system.serviceMapUrl));
    renderOfficial(system);
    const history=el('details',null,'water-disclosure');
    history.append(el('summary',t('Historical measurements','Mediciones históricas')));
    renderHistorical(system,history);result.append(history);
    result.append(link(t('Look up this system in EWG ↗','Consultar este sistema en EWG ↗'),'https://www.ewg.org/tapwater/system.php?pws='+encodeURIComponent(system.id)));
    const back=el('button',t('Change provider','Cambiar proveedor'),'water-secondary');back.type='button';back.addEventListener('click',()=>{selected='';render();});result.append(back);return;
  }
  const list=mode==='name'?searchSystems(directory.systems,search.value):mode==='zip'?zipSystems(directory.systems,directory.zips,zip.value.trim()):nearbySystems(directory.systems,point);
  result.append(el('h3',mode==='name'?t('Find the name on your bill','Busca el nombre de tu factura'):mode==='gps'?t('Systems near your location','Sistemas cerca de tu ubicación'):t('Systems near ZIP ','Sistemas cerca del ZIP ')+zip.value));
  result.append(el('p',mode==='name'?t('Community water systems listed by Florida DEP. Choose only the provider shown on your bill.','Sistemas comunitarios registrados por Florida DEP. Elige únicamente el proveedor que aparece en tu factura.'):t('Suggestions use treatment-plant locations within 40 km, not service-area boundaries. Your ZIP can have several providers. If yours is missing, search by name or city below.','Las sugerencias usan ubicaciones de plantas a menos de 40 km, no límites de servicio. Un ZIP puede tener varios proveedores. Si falta el tuyo, busca por nombre o ciudad.')));
  if(!list.length)result.append(el('p',t('No matching systems found. Try a provider name, city, or PWS ID. No result does not mean there is no service or that the water is safe.','No encontramos coincidencias. Prueba con el proveedor, ciudad o identificador PWS. Esto no significa que no exista servicio ni que el agua sea segura.')));
  const shown=list.slice(0,40);

  const cards=el('div',null,'water-candidates water-primary');
  const others=el('details',null,'water-disclosure');
  others.append(el('summary',t(`Other providers (${list.length-1})`,`Otros proveedores (${list.length-1})`)));
  const otherCards=el('div',null,'water-candidates');others.append(otherCards);
  if(list.length>40)others.append(el('p',t(`Showing 40 of ${list.length}. Search by name to narrow results.`,`Mostrando 40 de ${list.length}. Busca por nombre para filtrar.`)));
  for(const system of shown){const card=el('div',null,'water-candidate');card.append(el('strong',system.displayName||system.name),el('span',`${system.city||'Florida'} · ${system.id}`));
    if(Number.isFinite(system.distance))card.append(el('small',t('Plant approx. ','Planta a aprox. ')+Math.round(system.distance)+' km'+(mode==='zip'?t(' from ZIP center',' del centro del ZIP'):'')));
    const choose=el('button',t('This matches my bill','Coincide con mi factura'));choose.type='button';choose.addEventListener('click',()=>{selected=system.id;render();});card.append(choose);(system===shown[0]?cards:otherCards).append(card);}
  result.append(cards);if(list.length>1)result.append(others);
  const info=el('details',null,'water-disclosure');info.append(el('summary',t('Sources and search details','Fuentes y detalles de búsqueda')));result.append(info);
  info.append(el('p',t('Private well? Public-system reports do not describe your well. It needs its own testing.','¿Pozo privado? Los reportes de sistemas públicos no describen tu pozo. Necesita sus propias pruebas.')));
  info.append(link(t('Source: Florida DEP facility directory ↗','Fuente: directorio de instalaciones de Florida DEP ↗'),'https://geodata.dep.state.fl.us/datasets/public-water-supply-pws-plants-non-federal/about'));
  info.append(el('p',t('Directory retrieved: ','Directorio consultado: ')+directory.retrieved+t('. ZIP locations: Census 2025 ZCTA centers; not every postal ZIP has a geographic area.','. Ubicaciones ZIP: centros ZCTA del Censo 2025; no todos los ZIP postales tienen un área geográfica.'),'zip-context'));
}
async function runSearch(nextMode){
  const request=++sequence;searching=false;gps.disabled=false;selected='';mode='';point=null;result.hidden=true;
  announce('Loading directory…','Cargando directorio…');
  try{await load();if(request!==sequence)return;
    if(nextMode==='zip'){
      point=directory.zips[zip.value.trim()];
      if(!point){announce('No Florida geographic area found for that ZIP. Check the ZIP or search by provider/city.','No encontramos un área geográfica de Florida para ese ZIP. Revísalo o busca por proveedor/ciudad.');return;}
    }else if(search.value.trim().length<2){announce('Enter at least two letters or digits.','Escribe al menos dos letras o números.');return;}
    if(nextMode==='name'){zip.value='';window.setLanguage?.(lang());}
    mode=nextMode;announce('Choose your provider below.','Elige tu proveedor abajo.');render();
  }catch(_){if(request===sequence)announce('The directory could not load. Try again or use the source link below.','No se pudo cargar el directorio. Inténtalo de nuevo o usa el enlace a la fuente.');}
}
form.addEventListener('submit',e=>{e.preventDefault();runSearch('zip');});
document.getElementById('water-provider-form').addEventListener('submit',e=>{e.preventDefault();runSearch('name');});
zip.addEventListener('input',()=>{++sequence;selected='';mode='';point=null;result.hidden=true;gps.disabled=false;searching=false;notice=null;status.textContent='';window.setLanguage?.(lang());});
search.addEventListener('input',()=>{++sequence;selected='';mode='';point=null;result.hidden=true;gps.disabled=false;searching=false;notice=null;status.textContent='';});
gps.addEventListener('click',async()=>{
  if(!navigator.geolocation){announce('Location is unavailable. Enter your ZIP instead.','La ubicación no está disponible. Ingresa tu ZIP.');return;}
  const request=++sequence;selected='';mode='';point=null;result.hidden=true;gps.disabled=true;searching=true;
  announce('Waiting for location permission…','Esperando permiso de ubicación…');
  locate(navigator.geolocation,{isCurrent:()=>request===sequence,
    onRetry:()=>announce('Location is taking longer. Retrying…','La ubicación está tardando. Reintentando…'),
    onSuccess:async position=>{
    if(request!==sequence)return;
    try{await load();if(request!==sequence)return;
      if(position.coords.accuracy>10000){announce('Location is too imprecise. Use your ZIP or provider name.','La ubicación es demasiado imprecisa. Usa tu ZIP o proveedor.');return;}
      zip.value='';window.setLanguage?.(lang());
      point=[position.coords.latitude,position.coords.longitude];mode='gps';
      announce('Location is used only on this device. Confirm your provider below.','La ubicación se usa solo en este dispositivo. Confirma tu proveedor abajo.');render();
    }catch(_){if(request===sequence)announce('The directory could not load. Please try again.','No se pudo cargar el directorio. Inténtalo de nuevo.');}
    finally{if(request===sequence){gps.disabled=false;searching=false;}}
  },onError:error=>{gps.disabled=false;searching=false;announce(...locationError(error.code));}});
});
window.refreshWaterLookup=()=>{if(mode)render();if(notice)status.textContent=notice[lang()==='es'?1:0];};

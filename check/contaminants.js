(() => {
  const input = document.getElementById('zip');
  const panel = document.getElementById('localWaterResult');
  if (!input || !panel) return;

  // Historical utility averages from EWG system records, not household results.
  const records = {
    FL3491373: { name: 'City of St. Cloud', total: 11, aboveCount: 5, above: [
      ['Chlorate', 'Clorato', '556.7 ppb', '210 ppb', null, 'thyroid'],
      ['Haloacetic acids (HAA5)', 'Ácidos haloacéticos (HAA5)', '32.0 ppb', '0.1 ppb', '60 ppb', 'cancer'],
      ['Haloacetic acids (HAA9)', 'Ácidos haloacéticos (HAA9)', '23.6 ppb', '0.06 ppb', null, 'cancer'],
      ['Radium, combined (-226 and -228)', 'Radio combinado (-226 y -228)', '0.64 pCi/L', '0.05 pCi/L', '5 pCi/L', 'cancer'],
      ['Total trihalomethanes (TTHMs)', 'Trihalometanos totales (TTHM)', '48.7 ppb', '0.15 ppb', '80 ppb', 'cancer']
    ], other: [
      ['Barium', 'Bario', '17.3 ppb'], ['Cyanide', 'Cianuro', '2.00 ppb'],
      ['Fluoride', 'Fluoruro', '0.640 ppm'], ['Manganese', 'Manganeso', '1.04 ppb'],
      ['Nitrate', 'Nitrato', '0.0331 ppm'], ['Strontium', 'Estroncio', '0.603 ppb']
    ] },
    FL3490751: { name: 'Toho Water Authority Eastern', total: 11, aboveCount: 3, above: [
      ['Haloacetic acids (HAA5)', 'Ácidos haloacéticos (HAA5)', '29.3 ppb', '0.1 ppb', '60 ppb', 'cancer'],
      ['Haloacetic acids (HAA9)', 'Ácidos haloacéticos (HAA9)', '32.9 ppb', '0.06 ppb', null, 'cancer'],
      ['Total trihalomethanes (TTHMs)', 'Trihalometanos totales (TTHM)', '49.3 ppb', '0.15 ppb', '80 ppb', 'cancer']
    ], other: [] },
    FL3480962: { name: 'Orlando Utilities Commission', total: 16, aboveCount: 7, above: [
      ['1,3-Butadiene', '1,3-butadieno', '0.0229 ppb', '0.0103 ppb', null, 'cancer'],
      ['Bromate', 'Bromato', '3.52 ppb', '0.1 ppb', '10 ppb', 'cancer'],
      ['Haloacetic acids (HAA5)', 'Ácidos haloacéticos (HAA5)', '23.8 ppb', '0.1 ppb', '60 ppb', 'cancer'],
      ['Total trihalomethanes (TTHMs)', 'Trihalometanos totales (TTHM)', '53.4 ppb', '0.15 ppb', '80 ppb', 'cancer']
    ], other: [] }
  };
  const knownZip = { '34744': 'FL3490751', '34747': 'FL3490751', '32801': 'FL3480962', '32836': 'FL3480962' };
  let chosen = '';
  let lastZip = '';
  const es = () => window.waterTestI18n.getLanguage() === 'es';
  const line = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    return element;
  };
  function render() {
    const zip = input.value.trim();
    if (zip !== lastZip) { chosen = ''; lastZip = zip; }
    panel.replaceChildren();
    if (!/^(32|33|34)\d{3}$/.test(zip)) { panel.hidden = true; return; }
    panel.hidden = false;
    panel.append(line('p', 'local-water-kicker', es() ? 'REGISTRO PÚBLICO DEL AGUA' : 'PUBLIC WATER RECORD'));
    panel.append(line('h4', '', es() ? '¿Qué se ha detectado en tu zona?' : 'What has been detected in your area?'));
    const automatic = knownZip[zip];
    const id = automatic || chosen;
    if (!automatic) {
      panel.append(line('p', 'local-water-note', es()
        ? 'Un ZIP puede tener varios proveedores. Selecciona el nombre que aparece en tu factura; esta lista no confirma que abastezcan tu dirección.'
        : 'A ZIP can have several providers. Select the name on your bill; this list does not confirm service at your address.'));
      const label = line('label', 'local-water-label', es() ? 'Sistema en tu factura' : 'System on your bill');
      const select = document.createElement('select');
      select.setAttribute('aria-label', label.textContent);
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = es() ? 'Selecciona tu proveedor' : 'Select your provider'; select.append(empty);
      Object.entries(records).forEach(([key, record]) => { const option = document.createElement('option'); option.value = key; option.textContent = record.name; select.append(option); });
      select.value = chosen;
      select.addEventListener('change', () => { chosen = select.value; render(); });
      label.append(select); panel.append(label);
    } else {
      panel.append(line('p', 'local-water-note', es()
        ? 'Registro asociado con este ZIP en nuestra guía. Confirma el sistema de tu hogar en la factura.'
        : 'A record associated with this ZIP in our guide. Confirm your home’s system on the bill.'));
    }
    if (!id) return;
    const record = records[id];
    panel.append(line('p', 'local-water-provider', record.name));
    panel.append(line('p', 'local-water-count', es()
      ? `${record.aboveCount} de ${record.total} contaminantes detectados superan las guías de EWG`
      : `${record.aboveCount} of ${record.total} detected contaminants exceed EWG guidelines`));
    const list = document.createElement('div'); list.className = 'local-water-list';
    record.above.forEach(item => {
      const card = document.createElement('div'); card.className = 'local-water-item';
      card.append(line('strong', '', item[es() ? 1 : 0]));
      card.append(line('span', 'local-water-effect', es()
        ? `Posible efecto según EWG: ${item[5] === 'thyroid' ? 'daño a la tiroides' : 'cáncer'}`
        : `EWG potential effect: ${item[5] === 'thyroid' ? 'harm to the thyroid' : 'cancer'}`));
      card.append(line('span', '', (es() ? 'Promedio del sistema: ' : 'Utility average: ') + item[2]));
      card.append(line('small', '', (es() ? 'Guía EWG: ' : 'EWG guideline: ') + item[3] + ' · ' + (es() ? 'Límite legal: ' : 'Legal limit: ') + (item[4] || (es() ? 'no establecido' : 'not set'))));
      list.append(card);
    });
    panel.append(list);
    if (record.other.length) {
      const details = document.createElement('details');
      details.append(line('summary', '', es() ? `Ver otros ${record.other.length} detectados` : `View ${record.other.length} other detections`));
      record.other.forEach(item => details.append(line('p', '', `${item[es() ? 1 : 0]} · ${item[2]}`)));
      panel.append(details);
    }
    if (record.above.length + record.other.length < record.total) panel.append(line('p', 'local-water-note', es()
      ? 'Este adelanto muestra parte de los contaminantes del registro. La guía completa se está incorporando.'
      : 'This preview shows part of the record. More details are being added.'));
    panel.append(line('p', 'local-water-disclaimer', es()
      ? 'Son promedios históricos del sistema, no resultados de tu casa ni un diagnóstico. HAA5 y HAA9 se superponen. La prueba gratis en casa mide parámetros específicos; para identificar estos contaminantes se necesitan análisis de laboratorio adecuados.'
      : 'These are historical system averages, not results from your home or a diagnosis. HAA5 and HAA9 overlap. The free home visit measures specific parameters; identifying these contaminants requires appropriate laboratory tests.'));
    const source = document.createElement('a');
    source.href = `https://www.ewg.org/tapwater/system.php?pws=${id}`;
    source.target = '_blank'; source.rel = 'noopener noreferrer';
    source.textContent = es() ? 'Fuente: EWG (opcional) ↗' : 'Source: EWG (optional) ↗';
    panel.append(source);
  }
  input.addEventListener('input', render);
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', render));
  render();
})();

// Quote-comparison UI QA: test real client copy without any network access.
// Run: node --test tests/welcome-home-comparison-form.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../check/app.js', import.meta.url), 'utf8');
const begin = source.indexOf('    const updateCompareCopy=()=>{');
const end = source.indexOf('\n    };\n    updateCompareCopy();', begin);
assert.ok(begin >= 0 && end > begin, 'Expected quote copy updater not found');
const code = source.slice(begin, end + '\n    };'.length);

function makeUi(language) {
  const selectors = [
    '.booking-intro h2',
    '.booking-intro .mini-trust',
    '#leadForm .step[data-step="1"] h3',
    '#leadForm .step[data-step="3"] .field-help',
    '#successPanel h3',
    '#successPanel h3 + p',
    '#welcomeLeadIntro h2',
    '#welcomeLeadIntro .welcome-lead-copy p',
  ];
  const elements = Object.fromEntries(selectors.map(s => [s, { textContent: '' }]));
  elements.submitButton = { disabled: false, firstChild: { textContent: '' } };
  elements.welcomeSuccess = { textContent: '' };
  const document = {
    querySelector: selector => {
      assert.ok(selector in elements, 'Unexpected selector: ' + selector);
      return elements[selector];
    },
    getElementById: id => {
      assert.ok(id in elements, 'Unexpected element ID: ' + id);
      return elements[id];
    },
  };
  const window = { waterTestI18n: { getLanguage: () => language } };
  const update = new Function('document', 'window', code + '\nreturn updateCompareCopy;')(document, window);
  update();
  return elements;
}

test('English comparison journey does not claim a mandatory water test', () => {
  const elements = makeUi('en');
  assert.match(elements['.booking-intro h2'].textContent, /Compare your water treatment options/);
  assert.match(elements['#leadForm .step[data-step="1"] h3'].textContent, /ZIP code/);
  assert.match(elements['#leadForm .step[data-step="3"] .field-help'].textContent, /comparison request/);
  assert.match(elements.submitButton.firstChild.textContent, /REQUEST COMPARISON/);
  assert.match(elements['#successPanel h3 + p'].textContent, /No appointment has been confirmed/);
  assert.match(elements.welcomeSuccess.textContent, /voucher.*only.*completed complimentary water evaluation/s);
});

test('Spanish comparison journey retains same promises and action', () => {
  const elements = makeUi('es');
  assert.match(elements['.booking-intro h2'].textContent, /Compara tus opciones/);
  assert.match(elements['#leadForm .step[data-step="3"] .field-help'].textContent, /solicitud de comparación/);
  assert.match(elements.submitButton.firstChild.textContent, /SOLICITAR COMPARACIÓN/);
  assert.match(elements['#successPanel h3 + p'].textContent, /no está confirmada/);
  assert.match(elements.welcomeSuccess.textContent, /voucher.*solo.*completar una evaluación de agua gratuita/s);
});

test('Submission resets to comparison CTA only for the Welcome Home comparison route', () => {
  assert.match(source, /const isWelcomeCompareFlow=Boolean\(welcomeBatch&&isCompareRequest\)/);
  assert.match(source, /finally\{btn.disabled=false;btn.firstChild.textContent=isWelcomeCompareFlow\?/);
  assert.match(source, /:t\('REQUEST MY FREE TEST'\)\+' '\}/);
});

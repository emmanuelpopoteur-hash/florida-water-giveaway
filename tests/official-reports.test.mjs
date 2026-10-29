import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../water-lookup/historical.json',import.meta.url)));
const directory=JSON.parse(fs.readFileSync(new URL('../water-lookup/directory.json',import.meta.url)));
test('every published report resolves to a provider and carries dated, sourced measurement rows',()=>{
 for(const [id,report] of Object.entries(data.officialReports)){
  assert.ok(directory.systems.some(s=>s.id===id),id);
  assert.match(report.url,/^https:\/\/(www\.)?(ocfl\.net|tohowater\.com|ouc\.com|tampa\.gov|jea\.com)\//);
  assert.ok(report.rows.length>0);
  for(const r of report.rows){assert.equal(r.length,9);assert.ok(r[0]&&r[1]);assert.ok(r[2].split(',').every(v=>Number.isFinite(Number(v.trim()))));assert.match(r[5],/20\d{2}/);assert.ok(['reported','lraa','raa','p90'].includes(r[7]));assert.ok(Number.isInteger(r[8]));}
 }
});
test('Eastern monitoring context and Western ambiguous limit remain visible in source data',()=>{
 const eastern=data.officialReports.FL3484132;
 assert.match(eastern.notice[0],/invalidated/);assert.match(eastern.notice[1],/Tres muestras/);
 assert.equal(eastern.rows.find(r=>r[0].includes('TTHM'))[7],'lraa');
 assert.equal(data.officialReports.FL3481546.rows.find(r=>r[0].includes('Radium'))[6],'—');
});
test('purchased-water systems preserve their own results and supplier identity',()=>{
 const golden=data.officialReports.FL3484434,flamingo=data.officialReports.FL3484437;
 assert.match(golden.supplier,/FL3484093/);
 assert.notEqual(golden.rows.find(r=>r[0]==='Chlorine')[2],flamingo.rows.find(r=>r[0]==='Chlorine')[2]);
 assert.equal(flamingo.rows.find(r=>r[0].includes('TTHM'))[7],'reported');
});

test('Sunbridge retains both sampling periods and the individual lead exceedance',()=>{
 const report=data.officialReports.FL3494439;
 assert.equal(report.sitesAboveAL['Lead (tap water)'],1);
 assert.equal(report.rows.find(r=>r[0]==='Lead (tap water)')[2],'0.5, 0.4');
 assert.match(report.notice[0],/one site/);
 assert.equal(data.officialReports.FL3490751.rows.find(r=>r[0]==='Chlorine')[7],'raa');
});

test('OUC preserves its 2024 report year and individual copper exceedance',()=>{
 const report=data.officialReports.FL3480962;
 assert.equal(report.year,2024);assert.equal(report.sitesAboveAL['Copper (tap water)'],1);
 assert.equal(report.rows.find(r=>r[0].includes('TTHM'))[2],'66.29');
 assert.match(report.notice[1],/2024/);
});

test('Tampa preserves semiannual lead data and distinguishes PFAS reporting thresholds',()=>{
 const r=data.officialReports.FL6290327;
 assert.equal(r.rows.filter(x=>x[0].startsWith('Lead (tap')).length,2);
 assert.equal(r.sitesAboveAL['Lead (tap water, Jul–Dec)'],1);
 assert.match(r.additional.find(x=>x.page===15).text[0],/not a legal limit/);
});

test('JEA grids retain secondary exceedances and annual-versus-individual TTHM context',()=>{
 const major=data.officialReports.FL2161328;
 assert.match(major.notice[0],/82.26/);assert.ok(major.status);
 assert.ok(major.additional.some(x=>x.title[0].includes('Chloride')));
 assert.equal(data.officialReports.FL2160735.sitesAboveAL['Copper (tap water)'],1);
 assert.equal(data.officialReports.FL2550866.rows.some(r=>r[0]==='Lead (tap water)'),false);
 assert.match(data.officialReports.FL2550866.additional[0].text[0],/not detected/);
});

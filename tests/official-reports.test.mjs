import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../water-lookup/historical.json',import.meta.url)));
const directory=JSON.parse(fs.readFileSync(new URL('../water-lookup/directory.json',import.meta.url)));
test('every published report resolves to a provider and carries dated, sourced measurement rows',()=>{
 for(const [id,report] of Object.entries(data.officialReports)){
  assert.ok(directory.systems.some(s=>s.id===id),id);
  assert.match(report.url,/^https:\/\/(www\.)?(ocfl\.net|tohowater\.com)\//);
  assert.ok(report.rows.length>0);
  for(const r of report.rows){assert.equal(r.length,9);assert.ok(r[0]&&r[1]);assert.ok(Number.isFinite(Number(r[2])));assert.match(r[5],/20\d{2}/);assert.ok(['reported','lraa','p90'].includes(r[7]));assert.ok(Number.isInteger(r[8]));}
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

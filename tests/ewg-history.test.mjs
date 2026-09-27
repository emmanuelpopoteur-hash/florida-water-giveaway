import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../water-lookup/historical.json',import.meta.url)));
test('Tampa EWG keeps source periods, categories and proposed-limit labels distinct from official data',()=>{
 const tampa=data.contaminants.FL6290327;
 assert.equal(tampa.above.length,17);assert.equal(tampa.other.length,14);
 assert.equal(tampa.source.period,'2014–2024');
 assert.equal(tampa.proposedLimits.length,2);
 for(const name of tampa.proposedLimits)assert.equal(tampa.above.find(r=>r[0]===name)[4],'4 ppt');
 assert.ok(tampa.other.some(r=>r[0]==='Bromoform'));
 assert.ok(tampa.other.some(r=>r[0]==='Uranium'));
 assert.equal(tampa.above.find(r=>r[0]==='Bromate')[2],'2.54 ppb');
 assert.equal(data.officialReports.FL6290327.year,2025);
 assert.match(tampa.note[1],/no establecen los requisitos legales actuales/);
});

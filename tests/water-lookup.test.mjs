import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {distanceKm,nearbySystems,searchSystems} from '../water-lookup/core.mjs';
const d=JSON.parse(fs.readFileSync(new URL('../water-lookup/directory.json',import.meta.url)));
test('directory has unique public system IDs and valid geographic points',()=>{
 assert.equal(new Set(d.systems.map(s=>s.id)).size,d.systems.length);
 for(const s of d.systems){assert.match(s.id,/^FL\d{7}$/);for(const [lat,lon]of s.points){assert.ok(lat>24&&lat<32&&lon>-88&&lon<-79);}}
});
test('Central Florida ZIPs return candidate systems without choosing one',()=>{
 for(const [zip,id] of [['34771','FL3491373'],['32801','FL3480962'],['34744','FL3490751']])assert.ok(nearbySystems(d.systems,d.zips[zip]).some(s=>s.id===id));
});
test('statewide ZIP coverage includes Miami, Tampa, Jacksonville and Tallahassee',()=>{
 for(const zip of ['33101','33602','32202','32301']){assert.ok(d.zips[zip],zip);assert.ok(nearbySystems(d.systems,d.zips[zip]).length);}
 assert.equal(d.zips['10001'],undefined);assert.equal(d.zips['99999'],undefined);
});
test('distance and empty locations do not fabricate a nearby provider',()=>{
 assert.equal(distanceKm([28,-81],[28,-81]),0);
 assert.deepEqual(nearbySystems([{id:'none',name:'No coordinates',points:[]}],[28,-81]),[]);
 assert.deepEqual(nearbySystems(d.systems,[40.7,-74]),[]);
});
test('name, city and exact ID search cover directory',()=>{
 assert.equal(searchSystems(d.systems,'FL3491373')[0].id,'FL3491373');
 assert.ok(searchSystems(d.systems,'Orlando').length>0);
 assert.ok(searchSystems(d.systems,'toho eastern').some(s=>s.id==='FL3490751'));
 assert.deepEqual(searchSystems(d.systems,'no-such-water-system'),[]);
});

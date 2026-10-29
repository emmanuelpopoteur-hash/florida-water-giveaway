import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCampaigns,buildCampaignLinks } from '../scripts/campaign-links.mjs';

test('printed QR campaigns stay on Legacy Water HTTPS with attribution',async()=>{
  const urls=buildCampaignLinks(await loadCampaigns());
  assert.equal(urls.length,3);
  assert.equal(new Set(urls.map(x=>x.id)).size,urls.length);
  for (const entry of urls) {
    const url=new URL(entry.url);
    assert.equal(url.origin,'https://legacywaterusa.com');
    assert.equal(url.searchParams.get('utm_source'),'qr');
    assert.equal(url.searchParams.get('utm_medium'),'print');
    assert.equal(url.searchParams.get('utm_campaign'),entry.id);
    assert.equal(url.searchParams.get('utm_campaign').length<=80,true);
  }
  assert.equal(new URL(urls.find(x=>x.id==='water-test-direct').url).pathname,'/check/');
  assert.equal(new URL(urls.find(x=>x.id==='door-hanger-water-entry').url).pathname,'/water-test/');
});

test('QR builder rejects offsite domains and deceptive destinations',async()=>{
  const normal=await loadCampaigns();
  assert.throws(()=>buildCampaignLinks({...normal,base:'https://attacker.example/'}));
  assert.throws(()=>buildCampaignLinks({...normal,campaigns:[{...normal.campaigns[0],path:'//attacker.example/'}]}));
  assert.throws(()=>buildCampaignLinks({...normal,campaigns:[normal.campaigns[0],normal.campaigns[0]]}));
});

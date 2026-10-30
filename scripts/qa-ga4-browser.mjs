import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {join, extname, normalize} from 'node:path';
import {chromium} from 'playwright';

const root = join(process.cwd(), 'dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server = createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  let target = normalize(join(root,decodeURIComponent(url.pathname)));
  if (!target.startsWith(root + '/') && target !== root) {res.writeHead(403);res.end();return;}
  if (url.pathname.endsWith('/')) target = join(target, 'index.html');
  if (!existsSync(target)) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[extname(target)]||'application/octet-stream');
  res.end(readFileSync(target));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({headless:true});

async function setupPage(path) {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  const response = await page.goto(base+path,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  return page;
}
async function leadScenario({status,consent}) {
  const page = await setupPage('/check/?utm_source=legacy_insights&utm_campaign=water_education__stcloud_ccr_2025');
  try {
    await page.route('**/api/leads', async route => {
      const body = status===503 ? {error:'storage failed'} : {saved:true,id:'11111111-2222-4333-8444-555555555555'};
      await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    });
    if (consent) {
      await page.getByRole('button',{name:'Allow analytics'}).click();
      await page.locator('script[src*="googletagmanager.com/gtag/js"]').waitFor({state:'attached'});
    } else {
      await page.getByRole('button',{name:'No thanks'}).click();
      assert.equal(await page.locator('script[src*="googletagmanager.com/gtag/js"]').count(),0);
    }
    await page.locator('#zip').fill('34771');
    await page.locator('#zipNext').click();
    await page.locator('input[name="day"][value="Weekday"]').check();
    await page.locator('input[name="time"][value="Morning"]').check();
    await page.locator('#timeNext').click();
    await page.locator('#fullName').fill('Sample Privacy Test');
    await page.locator('#phone').fill('4075550199');
    await page.locator('#submitButton').click();
    if (status===503) {
      await page.locator('#contactError').waitFor({state:'visible'});
      assert.equal(await page.locator('#successPanel').isVisible(),false);
    } else {
      await page.locator('#successPanel').waitFor({state:'visible'});
    }
    const calls = await page.evaluate(()=>window.dataLayer?window.dataLayer.map(x=>Array.from(x)):[]);
    const leadEvents = calls.filter(x=>x[0]==='event' && x[1]==='generate_lead');
    const expected = status===201 && consent ? 1 : 0;
    assert.equal(leadEvents.length,expected,'Incorrect lead conversion count for '+status+'/'+consent);
    assert.ok(!JSON.stringify(calls).includes('Sample Privacy Test'),'Name leaked to GA');
    assert.ok(!JSON.stringify(calls).includes('4075550199'),'Phone leaked to GA');
    if (consent) {
      const config = calls.find(x=>x[0]==='config');
      assert.equal(config?.[1],'G-QGPB6TBYGF');
      assert.ok(config?.[2]?.page_location?.includes('utm_campaign=water_education__stcloud_ccr_2025'));
      assert.ok(!config?.[2]?.page_location?.includes('zip='));
    }
    console.log('PASS lead scenario: HTTP '+status+', consent '+consent+', GA conversions '+leadEvents.length);
  } finally { await page.close(); }
}

try {
  const homepage = await setupPage('/');
  try {
    assert.equal(await homepage.locator('script[src*="googletagmanager.com/gtag/js"]').count(),0,'GA loaded before consent');
    assert.equal(await homepage.getByRole('dialog',{name:'Optional website analytics'}).count(),1);
    await homepage.getByRole('button',{name:'No thanks'}).click();
    assert.equal(await homepage.locator('script[src*="googletagmanager.com/gtag/js"]').count(),0);
    await homepage.reload({waitUntil:'domcontentloaded'});
    assert.equal(await homepage.getByRole('dialog',{name:'Optional website analytics'}).count(),0);
    await homepage.getByRole('button',{name:'Privacy choices'}).click();
    await homepage.getByRole('button',{name:'Allow analytics'}).click();
    assert.equal(await homepage.locator('script[src*="googletagmanager.com/gtag/js"]').count(),1);
    console.log('PASS: opt-in, reject and revisit consent');
  } finally {await homepage.close();}
  await leadScenario({status:201,consent:true});
  await leadScenario({status:200,consent:true});
  await leadScenario({status:503,consent:true});
  await leadScenario({status:201,consent:false});
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}

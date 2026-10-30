import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = join(process.cwd(), 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  let target = normalize(join(root, decodeURIComponent(path)));
  if (!target.startsWith(root + '/') && target !== root) {
    response.writeHead(403); return response.end();
  }
  if (path.endsWith('/')) target = join(target, 'index.html');
  if (!existsSync(target)) {response.writeHead(404); return response.end('Not found');}
  response.setHeader('Content-Type', mime[extname(target)] || 'application/octet-stream');
  response.end(readFileSync(target));
});
const listen = () => new Promise(ok => server.listen(0, '127.0.0.1', ok));
await listen();
const port = server.address().port;
const base = 'http://127.0.0.1:' + port;
const screens = [
  ['/insights/', 'hub-en'],
  ['/insights/es/', 'hub-es'],
  ['/insights/st-cloud-water-quality-2025/', 'water-en'],
  ['/insights/es/calidad-agua-st-cloud-2025/', 'water-es'],
  ['/insights/toho-water-rates-2026/', 'rates-en'],
  ['/insights/es/tarifas-toho-2026/', 'rates-es']
];
mkdirSync('qa-screenshots', {recursive: true});
let browser;
try {
  browser = await chromium.launch({headless: true});
  for (const [route,name] of screens) {
    for (const view of [{label:'mobile',width:390,height:844},{label:'desktop',width:1365,height:900}]) {
      const page = await browser.newPage({ viewport: {width:view.width,height:view.height}, deviceScaleFactor:1 });
      const result = await page.goto(base + route, {waitUntil:'domcontentloaded'});
      assert.equal(result.status(), 200, route);
      await page.locator('h1').waitFor();
      const data = await page.evaluate(() => ({
        pageWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth,
        title: document.querySelector('h1')?.textContent.trim(),
        cta: document.querySelector('.cta .button')?.getAttribute('href'),
        language: document.documentElement.lang
      }));
      assert.ok(data.pageWidth <= data.windowWidth + 2, `Horizontal overflow ${route} ${view.label}: ${data.pageWidth} vs ${data.windowWidth}`);
      assert.ok(data.title.length >= 10, `Missing main heading ${route}`);
      assert.ok(data.cta.includes('/check/?lang=') && data.cta.includes('utm_content='), `Missing tracked CTA ${route}`);
      await page.screenshot({path:`qa-screenshots/${name}-${view.label}.png`, fullPage:true});
      console.log(`PASS ${route} (${view.label}, ${data.language}, width ${data.pageWidth}px)`);
      await page.close();
    }
  }
  const homepage = await browser.newPage();
  await homepage.goto(base + '/?lang=es', {waitUntil:'domcontentloaded'});
  const spanishHref = await homepage.locator('a[data-insights]').first().getAttribute('href');
  assert.equal(spanishHref, '/insights/es/');
  await homepage.locator('#en').click();
  const englishHref = await homepage.locator('a[data-insights]').first().getAttribute('href');
  assert.equal(englishHref, '/insights/');
  console.log('PASS homepage bilingual navigation: EN/ES links verified.');
  await homepage.close();
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

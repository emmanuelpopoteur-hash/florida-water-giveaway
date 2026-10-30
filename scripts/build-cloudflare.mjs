import { cp, mkdir, rm, stat, readdir, readFile, writeFile } from 'node:fs/promises';

const source = ['index.html', 'en', 'es', 'sistemas', 'ro', 'chatbot', 'agua-local', 'colombia', 'water-lookup', 'water-test', 'check', 'insights', 'privacy', 'media', 'robots.txt', 'sitemap.xml'];
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of source) {
  try {
    await stat(path);
    await cp(path, `dist/${path}`, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (['index.html', 'check', 'media', 'chatbot'].includes(path)) throw new Error(`Required site path missing: ${path}`);
  }
}

/* Inject one analytics-consent loader in every published HTML page. This
 * keeps the GA4 tag consistent across the main site, Insights and /check/.
 * Raw source pages remain unchanged by the generated dist/ update. */
async function addAnalyticsLoader(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = directory + '/' + entry.name;
    if (entry.isDirectory()) {
      await addAnalyticsLoader(path);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      const original = await readFile(path, 'utf8');
      if (!/<head(?:\s[^>]*)?>/i.test(original)) {
        throw new Error('Missing head element in ' + path);
      }
      if (original.includes('/media/ga4-consent.js')) {
        throw new Error('Duplicate analytics loader in ' + path);
      }
      const script = '<script src="/media/ga4-consent.js" defer></script>';
      const updated = original.replace(/<head(?:\s[^>]*)?>/i, (open) => open + script);
      await writeFile(path, updated, 'utf8');
    }
  }
}
await addAnalyticsLoader('dist');

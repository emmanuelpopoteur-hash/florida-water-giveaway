import { cp, mkdir, rm, stat } from 'node:fs/promises';

const source = ['index.html', 'en', 'es', 'sistemas', 'agua-local', 'water-test', 'check', 'media', 'robots.txt', 'sitemap.xml'];
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of source) {
  try {
    await stat(path);
    await cp(path, `dist/${path}`, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (['index.html', 'check', 'media'].includes(path)) throw new Error(`Required site path missing: ${path}`);
  }
}

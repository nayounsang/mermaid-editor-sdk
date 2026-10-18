import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const webDirectory = 'app/web';
const siteConfig = await readFile(join(webDirectory, 'app/site-config.ts'), 'utf8');
const siteUrlMatch = siteConfig.match(/SITE_URL\s*=\s*'([^']+)'/);

if (!siteUrlMatch) {
  throw new Error('Could not read SITE_URL from app/web/app/site-config.ts.');
}

const siteUrl = siteUrlMatch[1].replace(/\/$/, '');
const urls = [`${siteUrl}/`, `${siteUrl}/docs`, `${siteUrl}/docs/api`];

await rm(join(webDirectory, 'public/docs/api'), { recursive: true, force: true });

for (const packageName of ['ui', 'headless']) {
  urls.push(`${siteUrl}/docs/api/${packageName}`);
  const navigationPath = join(webDirectory, 'app/generated/api', packageName, 'navigation.json');
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
  const collectPageUrls = (items) => {
    for (const item of items) {
      if (item.path) {
        urls.push(`${siteUrl}/docs/api/${packageName}/${item.path.replace(/\.md$/, '')}`);
      }

      if (item.children) collectPageUrls(item.children);
    }
  };

  collectPageUrls(navigation);
}

const entries = [...new Set(urls)].map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`);
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join('\n') + '\n</urlset>\n';

await writeFile(join(webDirectory, 'public/sitemap.xml'), sitemap);

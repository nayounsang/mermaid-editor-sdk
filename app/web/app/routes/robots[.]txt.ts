import { SITE_URL } from '../site-config';

export function loader() {
  const sitemapLine = SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : '';
  const body = `User-agent: *\nAllow: /\n${sitemapLine}`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('robots.txt', 'routes/robots[.]txt.ts'),
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
] satisfies RouteConfig;

import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('docs', 'routes/docs.tsx'),
  route('docs/api', 'routes/api-reference-home.tsx'),
  route('docs/api/:package', 'routes/api-reference.tsx', [
    index('routes/api-reference-index.tsx'),
    route(':kind/:symbol', 'routes/api-reference-symbol.tsx'),
  ]),
  route('robots.txt', 'routes/robots[.]txt.ts'),
] satisfies RouteConfig;

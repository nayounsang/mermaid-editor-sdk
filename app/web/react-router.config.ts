import { vercelPreset } from '@vercel/react-router/vite';
import type { Config } from '@react-router/dev/config';
import { readFile } from 'node:fs/promises';

type NavigationItem = {
  path?: string;
  children?: NavigationItem[];
};

async function getApiPrerenderPaths(packageName: 'headless' | 'ui') {
  const navigationPath = new URL(`./app/generated/api/${packageName}/navigation.json`, import.meta.url);
  let navigation: NavigationItem[];
  try {
    navigation = JSON.parse(await readFile(navigationPath, 'utf8')) as NavigationItem[];
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }

  const paths: string[] = [];

  function collect(items: NavigationItem[]) {
    for (const item of items) {
      if (item.path) {
        const [kind, symbolFile] = item.path.split('/');
        if (kind && symbolFile) {
          paths.push(`/docs/api/${packageName}/${kind}/${symbolFile.replace(/\.md$/, '')}`);
        }
      }
      if (item.children) collect(item.children);
    }
  }

  collect(navigation);
  return paths;
}

export default {
  ssr: true,
  presets: [vercelPreset()],
  async prerender() {
    const [headlessPaths, uiPaths] = await Promise.all([
      getApiPrerenderPaths('headless'),
      getApiPrerenderPaths('ui'),
    ]);
    return [
      '/docs',
      '/docs/api',
      '/docs/api/headless',
      '/docs/api/ui',
      ...headlessPaths,
      ...uiPaths,
    ];
  },
} satisfies Config;

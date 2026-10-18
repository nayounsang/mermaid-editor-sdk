export type ApiNavigationItem = {
  title: string;
  path?: string;
  isDeprecated?: boolean;
  children?: ApiNavigationItem[];
};

const markdownFiles: Record<string, () => Promise<string>> = import.meta.glob('./generated/api/**/*.md', {
  import: 'default',
  query: '?raw',
});

const navigationFiles = import.meta.glob('./generated/api/*/navigation.json', {
  eager: true,
  import: 'default',
});

export async function getApiMarkdown(filePath: string) {
  const load = markdownFiles[`./generated/api/${filePath}`];
  return load ? load() : undefined;
}

export function getApiPackageName(value: string | undefined) {
  return value === 'ui' || value === 'headless' ? value : undefined;
}

export function getApiNavigation(packageName: string): ApiNavigationItem[] {
  const navigation = navigationFiles[`./generated/api/${packageName}/navigation.json`];
  return Array.isArray(navigation) ? (navigation as ApiNavigationItem[]) : [];
}

export function getApiPagePath(packageName: string, markdownPath: string) {
  const path = markdownPath.replace(/\.md$/, '');
  if (path === 'README') return `/docs/api/${packageName}`;
  return `/docs/api/${packageName}/${path}`;
}

export function resolveApiHref(
  href: string | undefined,
  packageName: string,
  markdownPath: string,
) {
  if (!href || href.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) {
    return href;
  }

  const currentPath = `/docs/api/${packageName}/${markdownPath}`;
  const resolved = new URL(href, `https://docs.invalid${currentPath}`);
  const apiPrefix = `/docs/api/${packageName}/`;

  if (!resolved.pathname.startsWith(apiPrefix)) return href;

  let pagePath = resolved.pathname.slice(apiPrefix.length).replace(/\.md$/, '');
  if (pagePath === 'README') pagePath = '';
  const routePath = pagePath ? `${apiPrefix}${pagePath}` : `/docs/api/${packageName}`;
  return `${routePath}${resolved.search}${resolved.hash}`;
}

export function getApiPageTitle(markdown: string | undefined, fallback: string) {
  const heading = markdown?.match(/^#\s+(.+)$/m)?.[1];
  return heading?.replace(/^(?:Class|Interface|Function|Type Alias|Variable|Enumeration):\s*/, '') ?? fallback;
}

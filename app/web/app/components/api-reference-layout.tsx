import { type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { getApiNavigation, getApiPagePath, type ApiNavigationItem } from '../api-reference-content';

const packages = [
  { slug: 'ui', label: 'UI', packageName: '@mermaid-editor-sdk/ui' },
  { slug: 'headless', label: 'Headless', packageName: '@mermaid-editor-sdk/headless' },
] as const;

function hasCurrentPage(items: ApiNavigationItem[], packageSlug: string, currentPath: string): boolean {
  return items.some((item) => {
    if (item.path && getApiPagePath(packageSlug, item.path) === currentPath) return true;
    return item.children ? hasCurrentPage(item.children, packageSlug, currentPath) : false;
  });
}

function NavigationGroup({
  items,
  packageSlug,
  currentPath,
}: {
  items: ApiNavigationItem[];
  packageSlug: string;
  currentPath: string;
}) {
  return items.map((item) => (
    <li className="api-navigation-item" key={item.path ?? item.title}>
      {item.path ? (
        <Link
          aria-current={getApiPagePath(packageSlug, item.path) === currentPath ? 'page' : undefined}
          className="api-navigation-link"
          to={getApiPagePath(packageSlug, item.path)}
        >
          {item.title}
        </Link>
      ) : (
        <details
          className="api-navigation-group"
          open={hasCurrentPage([item], packageSlug, currentPath)}
        >
          <summary>{item.title}</summary>
          {item.children?.length ? (
            <ul><NavigationGroup items={item.children} packageSlug={packageSlug} currentPath={currentPath} /></ul>
          ) : null}
        </details>
      )}
    </li>
  ));
}

export function ApiReferenceLayout({
  children,
  currentPath,
}: {
  children: ReactNode;
  currentPath: string;
}) {
  const { package: routePackage } = useParams();

  return (
    <div className="api-reference-shell">
      <aside className="api-reference-sidebar" aria-label="API reference navigation" data-pagefind-ignore>
        <nav className="api-reference-navigation" aria-label="Packages and API symbols">
          <ul className="api-package-list">
            {packages.map((item) => {
              const isCurrentPackage = item.slug === routePackage;
              const navigation = getApiNavigation(item.slug);
              const isActivePackage = isCurrentPackage || hasCurrentPage(navigation, item.slug, currentPath);
              return (
                <li className="api-package-item" key={item.slug}>
                  <details className="api-package-group" open={isActivePackage}>
                    <summary>
                      <span>{item.label}</span>
                      <span className="api-package-name">{item.packageName}</span>
                    </summary>
                    <div className="api-package-contents">
                      <Link
                        aria-current={currentPath === `/docs/api/${item.slug}` ? 'page' : undefined}
                        className="api-package-overview-link"
                        to={`/docs/api/${item.slug}`}
                      >
                        Overview
                      </Link>
                      <ul>
                        <NavigationGroup items={navigation} packageSlug={item.slug} currentPath={currentPath} />
                      </ul>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="api-reference-content">{children}</div>
    </div>
  );
}

import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';
import { ApiReferenceLayout } from '../components/api-reference-layout';
import { SiteHeader } from '../components/site-header';
import { SITE_URL } from '../site-config';

export const meta: MetaFunction = () => [
  { title: 'API Reference | Mermaid Editor SDK' },
  { name: 'description', content: 'Browse the UI and headless package APIs for Mermaid Editor SDK.' },
  ...(SITE_URL ? [{ tagName: 'link', rel: 'canonical', href: `${SITE_URL}/docs/api` }] : []),
];

const apiPackages = [
  {
    slug: 'ui',
    name: '@mermaid-editor-sdk/ui',
    description: 'React components and hooks for building a Mermaid diagram editor.',
  },
  {
    slug: 'headless',
    name: '@mermaid-editor-sdk/headless',
    description: 'Framework-agnostic editing, document, and diagram operations.',
  },
] as const;

export default function ApiReferenceHome() {
  return (
    <main className="docs-page api-docs-page">
      <SiteHeader activePage="api" />
      <ApiReferenceLayout currentPath="/docs/api">
        <article className="api-overview docs-article">
          <p className="api-reference-eyebrow">API reference</p>
          <h1>Packages</h1>
          <p className="api-overview-lede">
              Explore the public APIs for Mermaid Editor SDK.
          </p>
          <div className="api-overview-grid">
            {apiPackages.map((apiPackage) => (
              <Link className="api-overview-card" key={apiPackage.slug} to={`/docs/api/${apiPackage.slug}`}>
                <span className="api-overview-card-eyebrow">{apiPackage.slug}</span>
                <h2>{apiPackage.name}</h2>
                <p>{apiPackage.description}</p>
                <span className="api-overview-card-link">Browse API <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </article>
      </ApiReferenceLayout>
    </main>
  );
}

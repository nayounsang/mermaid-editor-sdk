import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import type { MetaFunction } from 'react-router';
import 'highlight.js/styles/github-dark.css';
import { SiteHeader } from '../components/site-header';
import sdkDocumentation from '../content/sdk.md?raw';
import { SITE_URL } from '../site-config';

const pageTitle = 'SDK Documentation | Mermaid Editor SDK';
const description = 'Choose between the ready-to-use React UI and headless editing logic, with installation examples and API references.';

export const meta: MetaFunction = () => [
  { title: pageTitle },
  { name: 'description', content: description },
  { property: 'og:type', content: 'website' },
  { property: 'og:title', content: pageTitle },
  { property: 'og:description', content: description },
];

export function links() {
  return [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ...(SITE_URL ? [{ rel: 'canonical', href: `${SITE_URL}/docs` }] : []),
  ];
}

export default function Docs() {
  return (
    <main className="docs-page">
      <SiteHeader activePage="docs" />
      <article className="docs-article">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, [rehypeHighlight, { aliases: { typescript: ['tsx'] } }] ]}
        >
          {sdkDocumentation}
        </ReactMarkdown>
      </article>
    </main>
  );
}

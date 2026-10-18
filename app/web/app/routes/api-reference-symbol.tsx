import type { MetaFunction } from 'react-router';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getApiMarkdown, getApiPageTitle } from '../api-reference-content';
import { ApiMarkdown } from '../components/api-markdown';
import { ApiReferenceLayout } from '../components/api-reference-layout';
import { SITE_URL } from '../site-config';

export const meta: MetaFunction = ({ params }) => {
  const packageName = params.package === 'headless' ? 'Headless' : 'UI';
  const packageSlug = params.package === 'headless' ? 'headless' : 'ui';
  return [
    { title: `${params.symbol ?? 'API'} | ${packageName} API Reference` },
    ...(SITE_URL
      ? [{ tagName: 'link', rel: 'canonical', href: `${SITE_URL}/docs/api/${packageSlug}/${params.kind}/${params.symbol}` }]
      : []),
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const packageName = params.package === 'headless' ? 'headless' : 'ui';
  const markdownPath = `${params.kind ?? ''}/${params.symbol ?? ''}.md`;
  return {
    markdown: await getApiMarkdown(`${packageName}/${markdownPath}`),
    markdownPath,
    kind: params.kind ?? '',
    packageName,
    symbol: params.symbol ?? '',
  };
}

export default function ApiReferenceSymbol() {
  const { markdown, markdownPath, packageName, kind, symbol } = useLoaderData<typeof loader>();
  const title = getApiPageTitle(markdown, symbol);

  return (
    <ApiReferenceLayout currentPath={`/docs/api/${packageName}/${kind}/${symbol}`}>
      <article className="api-markdown docs-article">
        {markdown ? <ApiMarkdown content={markdown} packageName={packageName} markdownPath={markdownPath} /> : (
          <div className="api-reference-not-found">
            <p className="api-reference-eyebrow">{packageName} API reference</p>
            <h1>{title}</h1>
            <p>This API entry was not found in the generated reference.</p>
          </div>
        )}
      </article>
    </ApiReferenceLayout>
  );
}

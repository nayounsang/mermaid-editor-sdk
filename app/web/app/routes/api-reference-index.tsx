import { useLoaderData, type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { ApiMarkdown } from '../components/api-markdown';
import { ApiReferenceLayout } from '../components/api-reference-layout';
import { getApiMarkdown, getApiPackageName, getApiPageTitle } from '../api-reference-content';
import { SITE_URL } from '../site-config';

export const meta: MetaFunction = ({ params }) => {
  const packageSlug = getApiPackageName(params.package);
  if (!packageSlug) return [{ title: 'API Reference | Mermaid Editor SDK' }];
  const packageTitle = `@mermaid-editor-sdk/${packageSlug} API Reference`;
  return [
    { title: `${packageTitle} | Mermaid Editor SDK` },
    ...(SITE_URL ? [{ tagName: 'link', rel: 'canonical', href: `${SITE_URL}/docs/api/${packageSlug}` }] : []),
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const packageName = getApiPackageName(params.package);
  if (!packageName) throw new Response('Not Found', { status: 404 });
  return {
    markdown: await getApiMarkdown(`${packageName}/README.md`),
    packageName,
  };
}

export default function ApiReferenceIndex() {
  const { markdown, packageName } = useLoaderData<typeof loader>();
  const packageTitle = `@mermaid-editor-sdk/${packageName} API Reference`;
  const markdownWithTitle = markdown?.replace(/^#\s+.+$/m, `# ${packageTitle}`);

  return (
    <ApiReferenceLayout currentPath={`/docs/api/${packageName}`}>
      <article className="api-markdown docs-article">
        {markdownWithTitle ? <ApiMarkdown content={markdownWithTitle} packageName={packageName} markdownPath="README.md" /> : (
          <>
            <h1>{getApiPageTitle(markdown, `${packageName} API`)}</h1>
            <p>Choose a symbol from the navigation to browse the generated API reference.</p>
          </>
        )}
      </article>
    </ApiReferenceLayout>
  );
}

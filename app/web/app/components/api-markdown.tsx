import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { resolveApiHref } from '../api-reference-content';

export function ApiMarkdown({
  content,
  packageName,
  markdownPath,
}: {
  content: string;
  packageName: string;
  markdownPath: string;
}) {
  const components: Components = {
    a: ({ href, children, ...props }) => (
      <a href={resolveApiHref(href, packageName, markdownPath)} {...props}>{children}</a>
    ),
  };

  return (
    <ReactMarkdown
      components={components}
      rehypePlugins={[rehypeSlug, [rehypeHighlight, { aliases: { typescript: ['tsx'] } }] ]}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}

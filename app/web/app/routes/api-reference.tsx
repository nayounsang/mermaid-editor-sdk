import { Outlet } from 'react-router';
import type { MetaFunction } from 'react-router';
import { SiteHeader } from '../components/site-header';

export const meta: MetaFunction = ({ params }) => {
  const packageName = params.package === 'headless' ? 'Headless' : 'UI';
  return [{ title: `${packageName} API Reference | Mermaid Editor SDK` }];
};

export default function ApiReference() {
  return (
    <main className="docs-page api-docs-page">
      <SiteHeader activePage="api" />
      <Outlet />
    </main>
  );
}

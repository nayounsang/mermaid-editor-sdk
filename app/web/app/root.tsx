import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import '@mermaid-editor-sdk/ui/style.css';
import './design-system.css';
import './dev.css';

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f3f3ef" />
        <meta name="google-site-verification" content="nZV_ZdGfP7qnS6DjjdRD9T6a6XLWkdKXYYpphQg-w2s" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

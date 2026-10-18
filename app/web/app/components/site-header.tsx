import { createElement, useEffect } from 'react';

type SiteHeaderProps = {
  activePage: 'home' | 'docs' | 'api';
};

export function SiteHeader({ activePage }: SiteHeaderProps) {
  useEffect(() => {
    void import('@pagefind/component-ui/css/pagefind-component-ui.css').then(() => import('@pagefind/component-ui'));
  }, []);

  return (
    <header className="site-header" data-pagefind-ignore>
      <div className="site-header-inner">
        <a className="site-brand" href="/" aria-label="Mermaid Editor SDK home">
          Mermaid Editor SDK
        </a>
        <nav className="site-navigation" aria-label="Main navigation">
          <a href="/" aria-current={activePage === 'home' ? 'page' : undefined}>Home</a>
          <a href="/docs" aria-current={activePage === 'docs' ? 'page' : undefined}>
            Docs
          </a>
          <a href="/docs/api" aria-current={activePage === 'api' ? 'page' : undefined}>
            API
          </a>
        </nav>
        {activePage !== 'home' && (
          <div className="site-search">
            {createElement('pagefind-modal-trigger')}
            {createElement('pagefind-modal')}
          </div>
        )}
      </div>
    </header>
  );
}

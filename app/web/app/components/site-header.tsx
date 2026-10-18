type SiteHeaderProps = {
  activePage: 'home' | 'docs' | 'api';
};

export function SiteHeader({ activePage }: SiteHeaderProps) {
  return (
    <header className="site-header">
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
      </div>
    </header>
  );
}

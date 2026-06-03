import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/motion.css';
import '../styles/responsive.css';
import '../styles/editorial.css';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div id="top">
      <div className="aurora" aria-hidden="true" style={{ display: 'block' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="grid-bg" aria-hidden="true" />

      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="logo">
            <img className="logo-mark-img" src="/favicon.png" alt="" width="30" height="30" />
            <b>DEVLIB</b>
            <span>·&nbsp;v04</span>
          </Link>
          <nav className="nav-links nav-menu" aria-label="Navegação principal">
            <div className="nav-group">
              <span>Explorar</span>
              <Link to="/">Acervo</Link>
              <Link to="/receitas">Receitas</Link>
              <Link to="/guias">Guias</Link>
            </div>
          </nav>
          <div className="nav-actions">
            <Link to="/" className="nav-cta">Voltar ao acervo</Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer shell" style={{ marginTop: '5rem' }}>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>
          DEVLIB v04 · Acervo curado para devs que constroem com agentes.
        </p>
      </footer>
    </div>
  );
}

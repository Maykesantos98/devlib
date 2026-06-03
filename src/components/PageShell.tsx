import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

import { Navbar } from './Navbar';

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
  const [theme, setTheme] = useLocalStorage<'nebula' | 'cyberpunk' | 'slate'>('devlib_theme', 'nebula');

  // Sync theme attribute on root element so detail pages also pick it up.
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Detail pages don't host the CmdkPalette yet — Sprint 12 makes ⌘K global.
  const handleCmdk = () => {
    window.location.assign('/?cmdk=open');
  };

  return (
    <div id="top">
      <div className="aurora" aria-hidden="true" style={{ display: 'block' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="grid-bg" aria-hidden="true" />

      <Navbar
        theme={theme}
        onChangeTheme={setTheme}
        onOpenCmdk={handleCmdk}
      />

      <main>{children}</main>

      <footer className="footer shell" style={{ marginTop: '5rem', paddingBottom: '3rem' }}>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>
          DEVLIB v04 · Acervo curado para devs que constroem com agentes.
        </p>
      </footer>
    </div>
  );
}

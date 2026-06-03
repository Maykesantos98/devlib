import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette } from 'lucide-react';

interface NavbarProps {
  theme: 'nebula' | 'cyberpunk' | 'slate';
  onChangeTheme: (theme: 'nebula' | 'cyberpunk' | 'slate') => void;
  onOpenCmdk: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onChangeTheme, onOpenCmdk }) => {
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'nebula', label: 'Nebula Dark', color: '#A855F7' },
    { id: 'cyberpunk', label: 'Cyberpunk', color: '#FACC15' },
    { id: 'slate', label: 'Slate Minimal', color: '#38BDF8' },
  ] as const;

  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="#top" className="logo">
          <img className="logo-mark-img" src="/favicon.png" alt="" width="30" height="30" />
          <b>DEVLIB</b>
          <span>·&nbsp;v03</span>
        </a>
        <nav className="nav-links nav-menu" aria-label="Navegação principal">
          <div className="nav-group">
            <span>Explore</span>
            <a href="#interface-components">Componentes</a>
            <a href="#agentes">Agentes</a>
            <a href="#mcp">MCP</a>
          </div>
          <div className="nav-group">
            <span>Build</span>
            <a href="#interface-components">UI kits</a>
            <a href="#server-db">Backend</a>
            <a href="#metodo">Método</a>
          </div>
          <div className="nav-group">
            <span>Editorial</span>
            <Link to="/receitas">Receitas</Link>
            <Link to="/guias">Guias</Link>
            <a href="#metodo">Método</a>
          </div>
        </nav>

        <div className="nav-actions">
          <div className="theme-selector">
            <button
              className="btn-theme"
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Selecionar tema"
              title="Trocar tema visual"
            >
              <Palette size={16} />
            </button>

            {isOpen && (
              <>
                <div
                  className="theme-dropdown-backdrop"
                  onClick={() => setIsOpen(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99,
                  }}
                />
                <div className="theme-dropdown">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeTheme(t.id);
                        setIsOpen(false);
                      }}
                      className={`theme-btn-item ${theme === t.id ? 'active' : ''}`}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: t.color,
                          boxShadow: `0 0 8px ${t.color}`,
                          flexShrink: 0,
                        }}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="nav-cta nav-search" type="button" onClick={onOpenCmdk} data-magnetic>
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  );
};

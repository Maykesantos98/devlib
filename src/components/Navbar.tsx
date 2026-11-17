import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Search, Menu, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  theme: 'nebula' | 'cyberpunk' | 'slate';
  onChangeTheme: (theme: 'nebula' | 'cyberpunk' | 'slate') => void;
  onOpenCmdk: () => void;
}

interface NavLink {
  label: string;
  to: string;
  external?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Acervo',   to: '/#acervo' },
  { label: 'Receitas', to: '/receitas' },
  { label: 'Guias',    to: '/guias' },
  { label: 'Método',   to: '/#metodo' },
];

const THEMES = [
  { id: 'nebula',    label: 'Nebula',    color: '#A855F7' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#FACC15' },
  { id: 'slate',     label: 'Slate',     color: '#38BDF8' },
] as const;

/**
 * Animated nav link with slide-up hover.
 * Adapted from 21st.dev's Mini Navbar pattern to CSS variables.
 */
function AnimatedNavLink({ label, to }: NavLink) {
  return (
    <Link to={to} className="nav-link" aria-label={label}>
      <span className="nav-link-inner">
        <span className="nav-link-text">{label}</span>
        <span className="nav-link-text nav-link-text-hover" aria-hidden="true">{label}</span>
      </span>
    </Link>
  );
}

export function Navbar({ theme, onChangeTheme, onOpenCmdk }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const shapeClass = open ? 'navbar-rounded' : 'navbar-pill';

  return (
    <header className={`navbar-floating ${shapeClass}`}>
      <div className="navbar-row">
        {/* Logo */}
        <BrandLogo />

        {/* Desktop links */}
        <nav className="navbar-links" aria-label="Navegação principal">
          {NAV_LINKS.map((l) => (
            <AnimatedNavLink key={l.to} {...l} />
          ))}
        </nav>

        {/* Right actions */}
        <div className="navbar-actions">
          {/* Theme switcher */}
          <div className="navbar-theme">
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={() => setThemeOpen((v) => !v)}
              aria-label="Trocar tema"
              aria-expanded={themeOpen}
            >
              <Palette size={15} aria-hidden="true" />
            </button>
            {themeOpen && (
              <>
                <button
                  type="button"
                  className="navbar-backdrop"
                  aria-label="Fechar menu de temas"
                  onClick={() => setThemeOpen(false)}
                />
                <div className="navbar-theme-menu" role="menu">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onChangeTheme(t.id);
                        setThemeOpen(false);
                      }}
                      className={`navbar-theme-item ${theme === t.id ? 'is-active' : ''}`}
                    >
                      <span
                        className="navbar-theme-dot"
                        style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
                        aria-hidden="true"
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search trigger */}
          <button
            type="button"
            className="navbar-search"
            onClick={onOpenCmdk}
            data-magnetic
            aria-label="Abrir busca"
          >
            <Search size={14} aria-hidden="true" />
            <span>Buscar</span>
            <kbd>⌘K</kbd>
          </button>

          {/* Mobile toggle */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`navbar-mobile-menu ${open ? 'is-open' : ''}`}>
        <nav aria-label="Navegação mobile">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="navbar-mobile-link"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { libraries, recipes, guides } from '../lib/content';
import { CATEGORIES } from '../lib/schema';
import { BrandLogo } from './BrandLogo';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

interface FooterProps {
  onOpenCmdk: () => void;
}

const NAV_LINKS = [
  { label: 'Acervo',   to: '/#acervo' },
  { label: 'Receitas', to: '/receitas' },
  { label: 'Guias',    to: '/guias' },
  { label: 'Método',   to: '/#metodo' },
];

const SOCIAL_LINKS = [
  {
    icon: GithubIcon,
    href: 'https://github.com/Maykesantos98',
    label: 'GitHub',
  },
  {
    icon: BookOpen,
    href: 'https://context7.com/',
    label: 'Context7 (docs)',
  },
];

/**
 * Minimal centered footer (Tailark pattern, ported to CSS variables).
 * Replaces the v03 4-column footer that had broken anchor links.
 */
export function Footer({ onOpenCmdk }: FooterProps) {
  const year = new Date().getFullYear();
  const stats = `${libraries.length} libs · ${recipes.length} receitas · ${guides.length} guias · ${CATEGORIES.length} categorias`;

  return (
    <footer className="footer-v05">
      <div className="footer-v05-inner shell">
        <BrandLogo size="footer" showText={false} />

        <nav className="footer-v05-links" aria-label="Navegação do rodapé">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
          <button type="button" onClick={onOpenCmdk} className="footer-v05-search" aria-label="Abrir busca">
            <Search size={14} aria-hidden="true" />
            Buscar
            <kbd>⌘K</kbd>
          </button>
        </nav>

        <div className="footer-v05-social" role="list">
          {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              role="listitem"
            >
              <Icon size={16} aria-hidden="true" />
            </a>
          ))}
        </div>

        <p className="footer-v05-meta">
          <span>© {year} · DEVLIB v04</span>
          <span aria-hidden="true">·</span>
          <span>{stats}</span>
          <span aria-hidden="true">·</span>
          <span>Sem tracker · Open source</span>
        </p>
      </div>
    </footer>
  );
}

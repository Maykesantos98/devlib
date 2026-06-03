import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CardData } from './types';
import type { DevlibConsoleApi } from './devlib';
import { chapters as librariesData } from './lib/content';
import { useLocalStorage } from './hooks/useLocalStorage';

// Components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BentoGrid } from './components/BentoGrid';
import { Dock } from './components/Dock';
import { CardDetailModal } from './components/CardDetailModal';
import { CmdkPalette } from './components/CmdkPalette';
import { Mascot } from './components/Mascot';
import { Footer } from './components/Footer';
import { EditorialStrip } from './components/sections/EditorialStrip';
import { Stats } from './components/sections/Stats';
import { CategoryIndex } from './components/sections/CategoryIndex';
import { Method } from './components/sections/Method';
import { Filters, INITIAL_FILTERS } from './components/Filters';
import type { FilterState } from './components/Filters';

// Global styles import (Vite handles this)
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/motion.css';
import './styles/responsive.css';
import './styles/editorial.css';

export const App: React.FC = () => {
  // ── States ──────────────────────────────────────────────
  const [selectedStack, setSelectedStack] = useLocalStorage<string[]>('devlib_stack', []);
  const [theme, setTheme] = useLocalStorage<'nebula' | 'cyberpunk' | 'slate'>('devlib_theme', 'nebula');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const totalLibraries = librariesData.reduce((sum, c) => sum + c.cards.length, 0);
  const [visibleCount, setVisibleCount] = useState(totalLibraries);
  
  // Modals & Panels
  const [isCmdkOpen, setIsCmdkOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatrixMode, setIsMatrixMode] = useState(false);

  // ── Keyboard Shortcuts (Vim gt, 1-8, Esc, Konami) ───────
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const konamiBuffer = useRef<string[]>([]);
  const lastKeyRef = useRef<string>('');

  const toggleStackItem = useCallback((title: string) => {
    setSelectedStack((prev) => {
      const idx = prev.indexOf(title);
      if (idx === -1) {
        return [...prev, title];
      } else {
        return prev.filter((t) => t !== title);
      }
    });
  }, [setSelectedStack]);

  const handleCardClick = useCallback((card: CardData) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  }, []);

  const handleFilterSelect = useCallback((filter: string) => {
    setFilters((prev) => ({ ...prev, category: filter }));

    // Smooth scroll to acervo section
    const target = document.getElementById('acervo');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleTriggerMatrix = useCallback(() => {
    setIsMatrixMode((prev) => !prev);
  }, []);

  // Update matrix-mode class on HTML root element
  useEffect(() => {
    document.documentElement.classList.toggle('matrix-mode', isMatrixMode);
  }, [isMatrixMode]);

  // Sync theme selection to document element attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Scroll Event for Nav / Back to top
  useEffect(() => {
    const nav = document.querySelector('.nav');
    const toTopBtn = document.getElementById('toTop');
    
    let lastY = -1;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return;
      lastY = y;
      nav?.classList.toggle('scrolled', y > 20);
      toTopBtn?.classList.toggle('visible', y > 600);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Shortcuts and Konami keyboard hook
  useEffect(() => {
    const filterByKey = ['all', 'ai-agents', 'mcp', 'frontend-ui', 'frontend-frameworks', 'backend-data', 'backend-toolkit', 'mobile-ai', 'security', 'devops', 'trade-quant'];

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target?.matches?.('input, textarea, [contenteditable]');

      // cmd+k / ctrl+k
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdkOpen((prev) => !prev);
        return;
      }

      // Esc
      if (e.key === 'Escape') {
        if (isCmdkOpen) {
          setIsCmdkOpen(false);
        } else if (isModalOpen) {
          setIsModalOpen(false);
        }
        return;
      }

      if (inField) return;

      // 1-8 filters
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10);
        const filterCategory = filterByKey[idx];
        if (filterCategory) {
          handleFilterSelect(filterCategory);
        }
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        handleFilterSelect('all');
        return;
      }

      // g then t (Vim scroll to top)
      if (lastKeyRef.current === 'g' && e.key === 't') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        lastKeyRef.current = '';
        return;
      }
      lastKeyRef.current = e.key;
      setTimeout(() => {
        if (lastKeyRef.current === e.key) lastKeyRef.current = '';
      }, 600);

      // Konami Code buffer
      konamiBuffer.current.push(e.key);
      if (konamiBuffer.current.length > KONAMI.length) {
        konamiBuffer.current.shift();
      }
      if (KONAMI.every((k, i) => konamiBuffer.current[i]?.toLowerCase() === k.toLowerCase())) {
        konamiBuffer.current = [];
        handleTriggerMatrix();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCmdkOpen, isModalOpen, handleFilterSelect, handleTriggerMatrix]);

  // Command palette and window devlib commands support
  useEffect(() => {
    const api: DevlibConsoleApi = {
      help() {
        console.group('%cdevlib · comandos (React)', 'color:#F59E0B;font-weight:600;');
        console.log('devlib.shuffle()        → embaralha a ordem do bento');
        console.log('devlib.matrix()         → ativa/desativa modo Matrix (verde)');
        console.log('devlib.count()          → exibe contagem de itens visíveis');
        console.log('devlib.filter("agents") → filtra por categoria');
        console.log('devlib.search("zod")    → busca termo');
        console.log('devlib.go("agentes")    → scroll para seção');
        console.log('devlib.about()          → créditos da versão React');
        console.groupEnd();
        return '✓ pronto. tente um comando.';
      },
      shuffle() {
        document.querySelectorAll('.bento').forEach((bento) => {
          const items = Array.from(bento.children);
          items.sort(() => Math.random() - 0.5).forEach((item) => bento.appendChild(item));
        });
        return '🔀 Cards embaralhados.';
      },
      reset() {
        window.location.reload();
        return '🔄 Recarregando...';
      },
      matrix() {
        handleTriggerMatrix();
        return isMatrixMode ? '○ Matrix desativado.' : '◉ Matrix ativado.';
      },
      count() {
        return `${visibleCount} de ${totalLibraries} bibliotecas visíveis.`;
      },
      filter(category: string) {
        handleFilterSelect(category);
        return `✓ filtrado: ${category}`;
      },
      search(term: string) {
        setSearchQuery(term);
        return `✓ buscando: "${term}"`;
      },
      go(sectionId: string) {
        const target = document.getElementById(sectionId);
        if (!target) return `❌ seção não encontrada: ${sectionId}`;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return `✓ scroll → #${sectionId}`;
      },
      about() {
        console.log('%cDEVLIB React v03', 'color:#F59E0B;font-weight:600;font-size:14px;');
        console.log('Estrutura de dados assíncrona, orquestrada via componentes reativos no React.');
        return '⚛️';
      }
    };
    window.devlib = api;
  }, [isMatrixMode, visibleCount, handleFilterSelect, handleTriggerMatrix]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top">
      {/* Skip link for keyboard / screen-reader users */}
      <a href="#acervo" className="skip-link">
        Pular para o acervo
      </a>

      {/* Scroll progress bar */}
      <div className="scroll-progress" aria-hidden="true"></div>

      {/* Dynamic Aurora and Grid Background */}
      <div className="aurora" aria-hidden="true" style={{ display: 'block' }}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="grid-bg" aria-hidden="true"></div>

      {/* Navigation */}
      <Navbar theme={theme} onChangeTheme={setTheme} onOpenCmdk={() => setIsCmdkOpen(true)} />

      <main>
        {/* Hero Section */}
        <Hero onOpenCmdk={() => setIsCmdkOpen(true)} />

        {/* Stats — small editorial signal */}
        <Stats />

        {/* Main Acervo Catalog — moved UP so action is reachable in 1 scroll */}
        <section className="section shell" id="acervo">
          <span className="section-eyebrow">— Acervo aberto</span>
          <h2 className="section-title">Tudo, <em>organizado.</em></h2>
          <p className="section-desc">Pressione <kbd>⌘K</kbd> para buscar entre as {totalLibraries} entradas. Filtre por categoria para refinar.</p>

          <div className="toolbar" role="search">
            <label className="search">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                id="searchInput"
                type="search"
                placeholder="Buscar — react, mcp, postgres…"
                autoComplete="off"
                aria-label="Buscar no acervo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <span className="count" aria-live="polite" aria-atomic="true">
              <b id="visibleCount">{visibleCount}</b>bibliotecas
            </span>
          </div>

          {/* Multi-axis filters: category + difficulty + type */}
          <Filters value={filters} onChange={setFilters} />

          {/* Render the Bento Grid of chapters & cards */}
          <BentoGrid
            data={librariesData}
            searchQuery={searchQuery}
            filters={filters}
            selectedStack={selectedStack}
            onToggleStack={toggleStackItem}
            onCardClick={handleCardClick}
            onVisibleCountChange={setVisibleCount}
          />
        </section>

        {/* Editorial (Receitas + Guias consolidated, was 3 separate strips) */}
        <EditorialStrip />

        {/* Index — quick jump to categories */}
        <CategoryIndex />

        {/* Method Section */}
        <Method />
      </main>

      {/* Footer */}
      <Footer onOpenCmdk={() => setIsCmdkOpen(true)} />

      {/* Back to Top */}
      <button
        className="to-top"
        type="button"
        aria-label="Voltar ao topo"
        id="toTop"
        onClick={handleScrollToTop}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      {/* Droid Mascot */}
      <Mascot />

      {/* macOS Dock panel */}
      <Dock selectedStack={selectedStack} onRemoveItem={toggleStackItem} onClearStack={() => setSelectedStack([])} />

      {/* Global Command Palette */}
      <CmdkPalette
        isOpen={isCmdkOpen}
        onClose={() => setIsCmdkOpen(false)}
      />

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Native Keyboard Shortcuts Help dialog wrapper */}
      <dialog className="shortcuts" id="shortcutsDialog" style={{ border: 0, background: 'transparent' }}>
        <div className="shortcuts-inner" style={{ border: '1px solid var(--border-bright)' }}>
          <header className="shortcuts-head">
            <h2 id="shortcuts-title">Atalhos</h2>
            <button className="shortcuts-close" type="button" aria-label="Fechar" onClick={() => (document.getElementById('shortcutsDialog') as HTMLDialogElement)?.close()}>×</button>
          </header>
          <dl className="shortcuts-list">
            <div><dt><kbd>⌘</kbd><kbd>K</kbd></dt><dd>Focar busca</dd></div>
            <div><dt><kbd>?</kbd></dt><dd>Mostrar atalhos</dd></div>
            <div><dt><kbd>Esc</kbd></dt><dd>Limpar busca · fechar dialog</dd></div>
            <div><dt><kbd>1</kbd>–<kbd>8</kbd></dt><dd>Filtrar por categoria</dd></div>
            <div><dt><kbd>G</kbd><kbd>T</kbd></dt><dd>Voltar ao topo</dd></div>
          </dl>
          <p className="shortcuts-hint">
            Aberto o DevTools? Tente <code>devlib.help()</code> no console.
          </p>
        </div>
      </dialog>
    </div>
  );
};
export default App;

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
import { FeaturedRecipes } from './components/sections/FeaturedRecipes';
import { LatestGuides } from './components/sections/LatestGuides';

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
  const [activeFilter, setActiveFilter] = useState('all');
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
    setActiveFilter(filter);
    
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
    const filterByKey = ['all', 'kit', 'agents', 'mcp', 'interface-components', 'interface-frameworks', 'server-db', 'server-utils', 'guard', 'run', 'ship', 'trade'];

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

        {/* Receitas em destaque — v04 */}
        <FeaturedRecipes />

        {/* Guias recentes — v04 */}
        <LatestGuides />

        {/* Blueprint Examples */}
        <section className="blueprint-strip shell" aria-label="Exemplos reais de stack visual">
          <a className="blueprint-card" href="#interface-components">
            <span className="blueprint-kicker">Components</span>
            <h2>shadcn + ReUI</h2>
            <p>Base editável, padrões complexos e blocos prontos para montar interfaces reais.</p>
          </a>
          <a className="blueprint-card" href="#interface-components">
            <span className="blueprint-kicker">Motion</span>
            <h2>Magic + Aceternity</h2>
            <p>Hero sections, backgrounds, microinterações e CTAs com acabamento visual.</p>
          </a>
          <a className="blueprint-card" href="#agentes">
            <span className="blueprint-kicker">Agents</span>
            <h2>SDK + browser tools</h2>
            <p>Combine frameworks de agentes com automação de navegador e MCP.</p>
          </a>
        </section>

        {/* Stats strip */}
        <section className="stats-strip" aria-label="Resumo do acervo">
          <div className="shell stats-inner">
            <div className="stat-item">
              <span className="stat-num gradient">{totalLibraries}</span>
              <span className="stat-tag">bibliotecas</span>
            </div>
            <span className="stat-divider" aria-hidden="true"></span>
            <div className="stat-item">
              <span className="stat-num">9</span>
              <span className="stat-tag">categorias</span>
            </div>
            <span className="stat-divider" aria-hidden="true"></span>
            <div className="stat-item">
              <span className="stat-num live"><span className="status-dot" aria-hidden="true"></span>Ativo</span>
              <span className="stat-tag">status</span>
            </div>
            <span className="stat-divider" aria-hidden="true"></span>
            <div className="stat-item">
              <span className="stat-num small">2026</span>
              <span className="stat-tag">atualizado</span>
            </div>
          </div>
        </section>

        {/* Marquee kinetic divider */}
        <div className="marquee" aria-hidden="true" style={{ display: 'block' }}>
          <div className="marquee-track">
            <span>react</span><span aria-hidden="true">✦</span>
            <span>typescript</span><span aria-hidden="true">✦</span>
            <span>postgres</span><span aria-hidden="true">✦</span>
            <span>mcp</span><span aria-hidden="true">✦</span>
            <span>edge</span><span aria-hidden="true">✦</span>
            <span>tailwind</span><span aria-hidden="true">✦</span>
            <span>agentes</span><span aria-hidden="true">✦</span>
            <span>rag</span><span aria-hidden="true">✦</span>
            <span>open source</span><span aria-hidden="true">✦</span>
            <span>2026</span><span aria-hidden="true">✦</span>
            <span>react</span><span aria-hidden="true">✦</span>
            <span>typescript</span><span aria-hidden="true">✦</span>
            <span>postgres</span><span aria-hidden="true">✦</span>
            <span>mcp</span><span aria-hidden="true">✦</span>
            <span>edge</span><span aria-hidden="true">✦</span>
            <span>tailwind</span><span aria-hidden="true">✦</span>
            <span>agentes</span><span aria-hidden="true">✦</span>
            <span>rag</span><span aria-hidden="true">✦</span>
            <span>open source</span><span aria-hidden="true">✦</span>
            <span>2026</span><span aria-hidden="true">✦</span>
          </div>
        </div>

        {/* Index / Table of Contents */}
        <section className="index shell" id="indice" aria-labelledby="indice-title">
          <span className="section-eyebrow">— Índice</span>
          <h2 className="section-title" id="indice-title">11 <em>categorias.</em></h2>
          <p className="section-desc">Navegue direto para a área que interessa. Cada categoria abre na seção correspondente do acervo.</p>

          <ol className="toc">
            <li>
              <a href="#kit">
                <span className="toc-num">§01</span>
                <span className="toc-meta">
                  <span className="toc-name">Kit</span>
                  <span className="toc-desc">Fundações &amp; skills</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">12</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#agentes">
                <span className="toc-num">§02</span>
                <span className="toc-meta">
                  <span className="toc-name">Agentes</span>
                  <span className="toc-desc">Frameworks &amp; SDKs</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">13</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#mcp">
                <span className="toc-num">§03</span>
                <span className="toc-meta">
                  <span className="toc-name">MCP</span>
                  <span className="toc-desc">Protocolos &amp; servidores</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">10</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#interface-components">
                <span className="toc-num">§04</span>
                <span className="toc-meta">
                  <span className="toc-name">Interface (UI Kits)</span>
                  <span className="toc-desc">Componentes &amp; blocos</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">18</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#interface-frameworks">
                <span className="toc-num">§05</span>
                <span className="toc-meta">
                  <span className="toc-name">Interface (Frameworks)</span>
                  <span className="toc-desc">Engines, 3D &amp; Motion</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">16</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#server-db">
                <span className="toc-num">§06</span>
                <span className="toc-meta">
                  <span className="toc-name">Servidor (Bancos &amp; APIs)</span>
                  <span className="toc-desc">BaaS, redis &amp; runtimes</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">9</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#server-utils">
                <span className="toc-num">§07</span>
                <span className="toc-meta">
                  <span className="toc-name">Servidor (ORMs &amp; Utils)</span>
                  <span className="toc-desc">Prisma, Drizzle &amp; Zod</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">8</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#seguranca">
                <span className="toc-num">§08</span>
                <span className="toc-meta">
                  <span className="toc-name">Segurança</span>
                  <span className="toc-desc">Auth &amp; appsec</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">12</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#build">
                <span className="toc-num">§09</span>
                <span className="toc-meta">
                  <span className="toc-name">Build</span>
                  <span className="toc-desc">Build, testes &amp; obs.</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">10</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#apps">
                <span className="toc-num">§10</span>
                <span className="toc-meta">
                  <span className="toc-name">Apps</span>
                  <span className="toc-desc">Mobile &amp; IA on-device</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">15</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
            <li>
              <a href="#trade">
                <span className="toc-num">§11</span>
                <span className="toc-meta">
                  <span className="toc-name">Trade</span>
                  <span className="toc-desc">Agentes &amp; quant</span>
                </span>
                <span className="toc-right">
                  <span className="toc-count">10</span>
                  <svg className="toc-arrow" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </a>
            </li>
          </ol>
        </section>

        {/* Main Acervo Catalog */}
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
            <span className="count">
              <b id="visibleCount">{visibleCount}</b>bibliotecas
            </span>
          </div>

          <div className="filters" role="group" aria-label="Filtrar por categoria" style={{ marginBottom: '2rem' }}>
            {['all', 'top', 'recent', 'frontend', 'backend', 'kit', 'agents', 'mcp', 'interface-components', 'interface-frameworks', 'server-db', 'server-utils', 'guard', 'run', 'ship', 'trade'].map((filter) => {
              const labelMap: Record<string, string> = {
                all: 'Todos',
                top: '★ Top estrelas',
                recent: '● Recentes',
                frontend: 'Front-end',
                backend: 'Back-end',
                kit: 'Kit',
                agents: 'Agentes',
                mcp: 'MCP',
                'interface-components': 'Interface (UI)',
                'interface-frameworks': 'Interface (Dev)',
                'server-db': 'Servidor (Bancos)',
                'server-utils': 'Servidor (Utils)',
                guard: 'Segurança',
                run: 'Build',
                ship: 'Apps',
                trade: 'Trade'
              };
              const isAccent = filter === 'top' || filter === 'recent';
              return (
                <button
                  key={filter}
                  className={`filter ${isAccent ? 'filter-accent' : ''} ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={activeFilter === filter}
                  aria-current={activeFilter === filter ? 'true' : undefined}
                >
                  {labelMap[filter] || filter}
                </button>
              );
            })}
          </div>

          {/* Render the Bento Grid of chapters & cards */}
          <BentoGrid
            data={librariesData}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            selectedStack={selectedStack}
            onToggleStack={toggleStackItem}
            onCardClick={handleCardClick}
            onVisibleCountChange={setVisibleCount}
          />
        </section>

        {/* Method Section */}
        <section className="method shell" id="metodo" aria-labelledby="metodo-title">
          <span className="section-eyebrow">— Método</span>
          <h2 className="section-title" id="metodo-title">Como <em>usamos.</em></h2>
          <p className="section-desc">Quatro princípios que organizam o uso deste acervo no dia a dia. Pequenos hábitos, grande diferença na qualidade do que entregamos.</p>

          <ol className="principles">
            <li className="principle">
              <span className="principle-num">01</span>
              <h3>Pesquise antes de codar.</h3>
              <p>Use Context7 ou docs oficiais para confirmar APIs, versões e exemplos atuais antes de qualquer implementação.</p>
            </li>
            <li className="principle">
              <span className="principle-num">02</span>
              <h3>Verifique com docs ao vivo.</h3>
              <p>Treine ceticismo: bibliotecas evoluem, e código baseado em versões antigas é fonte comum de bugs sutis.</p>
            </li>
            <li className="principle">
              <span className="principle-num">03</span>
              <h3>Teste como o usuário.</h3>
              <p>Use webapp-testing ou Playwright para validar o fluxo real no navegador antes de declarar pronto.</p>
            </li>
            <li className="principle">
              <span className="principle-num">04</span>
              <h3>Entregue em passos pequenos.</h3>
              <p>Commits atômicos, deploys focados, rollback fácil. A coreografia invisível que mantém o produto vivo.</p>
            </li>
          </ol>
        </section>
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

      {/* Command Palette Modal */}
      <CmdkPalette
        data={librariesData}
        isOpen={isCmdkOpen}
        onClose={() => setIsCmdkOpen(false)}
        onSelectCard={handleCardClick}
        onSelectFilter={handleFilterSelect}
        onTriggerMatrix={handleTriggerMatrix}
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

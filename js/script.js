/* ─────────────────────────────────────────────────────────────
 * DEVLIB — vanilla JS (no GSAP, no Lenis, no CDN)
 * Filter · search · scroll reveal · counters · nav state ·
 * cursor spotlight · magnetic buttons · scroll-progress fallback
 * ───────────────────────────────────────────────────────────── */

(() => {
  'use strict';

  const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const supportsScrollTimeline = CSS.supports?.('animation-timeline: scroll()') ?? false;
  const supportsViewTimeline   = CSS.supports?.('animation-timeline: view()')   ?? false;

  /* ─── DOM ──────────────────────────────────────────────── */
  const nav         = document.querySelector('.nav');
  const cards       = document.querySelectorAll('.card');
  const tocItems    = document.querySelectorAll('.toc a');
  const chapters    = document.querySelectorAll('.chapter-bar');
  const searchInput = document.getElementById('searchInput');
  const filterBtns  = document.querySelectorAll('.filter');
  const visibleEl   = document.getElementById('visibleCount');
  const emptyEl     = document.getElementById('emptyState');
  const toTopBtn    = document.getElementById('toTop');
  const yearEl      = document.getElementById('year');
  const counters    = document.querySelectorAll('[data-count]');

  let activeFilter = 'all';

  /* ─── Year ─────────────────────────────────────────────── */
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ─── Nav scrolled + back-to-top (single passive listener) */
  let lastY = -1;
  function onScroll() {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 6) return;
    lastY = y;
    nav?.classList.toggle('scrolled', y > 20);
    toTopBtn?.classList.toggle('visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─── Scrollspy — highlight current section in the nav ──── */
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navLinks.length) {
    const linkFor = new Map();
    const spied = [];
    navLinks.forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) { linkFor.set(sec, a); spied.push(sec); }
    });
    if (spied.length) {
      const spy = new IntersectionObserver(
        (entries) => {
          // Pick the entry most in view
          let best = null;
          entries.forEach((en) => {
            if (en.isIntersecting &&
                (!best || en.intersectionRatio > best.intersectionRatio)) {
              best = en;
            }
          });
          if (!best) return;
          navLinks.forEach((a) => a.classList.remove('is-active'));
          linkFor.get(best.target)?.classList.add('is-active');
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
      );
      spied.forEach((s) => spy.observe(s));
    }
  }

  /* ─── Scroll reveal ───────────────────────────────────── */
  // Native CSS view-timeline handles reveals in modern browsers (Chrome/Edge 115+).
  // For Firefox/older Safari, fall back to IntersectionObserver toggling .in class.
  if (reduced) {
    [...cards, ...tocItems].forEach((el) => el.classList.add('in'));
  } else if (!supportsViewTimeline) {
    const revealTargets = [...cards, ...tocItems];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.05 }
    );
    revealTargets.forEach((el) => io.observe(el));
  }
  // If supportsViewTimeline → CSS does everything, no JS needed.

  /* ─── Scroll progress bar — JS fallback ────────────────── */
  // Modern browsers: CSS @supports animation-timeline: scroll() handles it.
  // Older browsers: throttle with rAF.
  if (!supportsScrollTimeline && !reduced) {
    const progress = document.querySelector('.scroll-progress');
    if (progress) {
      let ticking = false;
      const updateProgress = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const ratio = max > 0 ? scrollY / max : 0;
        progress.style.transform = `scaleX(${ratio})`;
        ticking = false;
      };
      addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
      }, { passive: true });
      updateProgress();
    }
  }

  /* ─── Cursor spotlight: folded into per-card tilt below ──
   * (Previous global mousemove looped all 70 cards per frame —
   *  replaced by per-card listeners that only fire on the hovered
   *  card. Same visual, ~70× fewer getBoundingClientRect calls.) */

  /* ─── Magnetic buttons ─────────────────────────────────── */
  if (fineHover && !reduced) {
    const magnets = document.querySelectorAll('[data-magnetic]');
    const STRENGTH = 0.28;
    magnets.forEach((el) => {
      let rafId = null;
      const onMove = (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const dx = e.clientX - (rect.left + rect.width / 2);
          const dy = e.clientY - (rect.top  + rect.height / 2);
          el.style.setProperty('--mag-x', `${dx * STRENGTH}px`);
          el.style.setProperty('--mag-y', `${dy * STRENGTH}px`);
          rafId = null;
        });
      };
      const onLeave = () => {
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      };
      el.addEventListener('mousemove', onMove, { passive: true });
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ─── 3D card tilt + spotlight (single per-card listener) ─ */
  if (fineHover && !reduced) {
    const TILT_DEG = 5;
    cards.forEach((card) => {
      let raf = null;
      let lastE = null;
      card.addEventListener('mousemove', (e) => {
        lastE = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const lx = lastE.clientX - rect.left;
          const ly = lastE.clientY - rect.top;
          const px = lx / rect.width;   // 0..1
          const py = ly / rect.height;  // 0..1
          // Tilt
          card.style.setProperty('--rx', `${(py - 0.5) * -TILT_DEG}deg`);
          card.style.setProperty('--ry', `${(px - 0.5) *  TILT_DEG}deg`);
          // Spotlight (same rect — no extra layout read)
          card.style.setProperty('--mx', `${lx}px`);
          card.style.setProperty('--my', `${ly}px`);
          raf = null;
        });
      }, { passive: true });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--mx', '-200px');
        card.style.setProperty('--my', '-200px');
      });
    });
  }

  /* ─── Matrix mode toggle (Konami easter egg) ──────────── */
  function toggleMatrixMode() {
    document.documentElement.classList.toggle('matrix-mode');
    const on = document.documentElement.classList.contains('matrix-mode');
    if (typeof console !== 'undefined') {
      console.log(
        `%c${on ? '◉ Matrix mode ON' : '○ Matrix mode OFF'}`,
        'color:#22c55e;font-family:monospace;font-weight:600;font-size:14px;'
      );
    }
  }

  /* ─── Command palette (⌘K) ────────────────────────────── */
  const cmdk      = document.getElementById('cmdk');
  const cmdkInput = document.getElementById('cmdkInput');
  const cmdkList  = document.getElementById('cmdkList');
  const cmdkCount = document.getElementById('cmdkCount');

  const escapeHtml = (s) =>
    s.replace(/[&<>"]/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    ));

  // Index: every repo card → palette entry
  const repoEntries = [...cards].map((card) => {
    const title = card.querySelector('.card-title')?.textContent.trim() || '';
    const url   = card.querySelector('.card-link')?.href || '';
    const meta  = card.querySelector('.card-meta')?.textContent
      .replace(/\s+/g, ' ').trim() || '';
    return {
      type: 'repo',
      label: title,
      sub: meta.split('·')[0]?.trim() || 'lib',
      keywords: `${title} ${meta} ${card.dataset.kind || ''}`,
      run: () => url && window.open(url, '_blank', 'noopener'),
    };
  });

  const goTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const clickFilter = (cat) =>
    document.querySelector(`.filter[data-filter="${cat}"]`)?.click();

  const commandEntries = [
    { type: 'cmd', label: 'Ir para o Índice',   sub: 'navegação', keywords: 'indice toc', run: () => goTo('indice') },
    { type: 'cmd', label: 'Ir para o Acervo',   sub: 'navegação', keywords: 'acervo cards', run: () => goTo('acervo') },
    { type: 'cmd', label: 'Ir para o Método',   sub: 'navegação', keywords: 'metodo principios', run: () => goTo('metodo') },
    { type: 'cmd', label: 'Voltar ao topo',     sub: 'navegação', keywords: 'topo top home', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { type: 'cmd', label: 'Filtrar: Todos',        sub: 'filtro', keywords: 'todos all reset', run: () => clickFilter('all') },
    { type: 'cmd', label: 'Filtrar: Top estrelas', sub: 'filtro', keywords: 'top estrelas stars github populares', run: () => clickFilter('top') },
    { type: 'cmd', label: 'Filtrar: Recentes',     sub: 'filtro', keywords: 'recente recent novo new', run: () => clickFilter('recent') },
    { type: 'cmd', label: 'Filtrar: Front-end',    sub: 'filtro', keywords: 'frontend front ui interface', run: () => clickFilter('frontend') },
    { type: 'cmd', label: 'Filtrar: Back-end',     sub: 'filtro', keywords: 'backend back server api', run: () => clickFilter('backend') },
    { type: 'cmd', label: 'Filtrar: Kit',       sub: 'filtro', keywords: 'kit fundacoes', run: () => clickFilter('kit') },
    { type: 'cmd', label: 'Filtrar: Agentes',   sub: 'filtro', keywords: 'agentes agents llm', run: () => clickFilter('agents') },
    { type: 'cmd', label: 'Filtrar: MCP',       sub: 'filtro', keywords: 'mcp protocolo', run: () => clickFilter('mcp') },
    { type: 'cmd', label: 'Filtrar: Interface', sub: 'filtro', keywords: 'interface frontend ui', run: () => clickFilter('interface') },
    { type: 'cmd', label: 'Filtrar: Servidor',  sub: 'filtro', keywords: 'servidor backend api', run: () => clickFilter('server') },
    { type: 'cmd', label: 'Filtrar: Segurança', sub: 'filtro', keywords: 'seguranca security auth', run: () => clickFilter('guard') },
    { type: 'cmd', label: 'Filtrar: Build',     sub: 'filtro', keywords: 'build test ci', run: () => clickFilter('run') },
    { type: 'cmd', label: 'Filtrar: Apps',      sub: 'filtro', keywords: 'apps mobile desktop', run: () => clickFilter('ship') },
    { type: 'cmd', label: 'Filtrar: Trade',     sub: 'filtro', keywords: 'trade trading agentes quant bot cripto bybit', run: () => clickFilter('trade') },
    { type: 'cmd', label: 'Mostrar atalhos',    sub: 'ajuda', keywords: 'atalhos shortcuts help', run: () => document.getElementById('shortcutsDialog')?.showModal() },
    { type: 'cmd', label: 'Ativar Matrix mode', sub: 'easter egg', keywords: 'matrix verde konami', run: () => toggleMatrixMode() },
  ];

  const allEntries = [...commandEntries, ...repoEntries];
  let cmdkFiltered = [];
  let cmdkActive = 0;

  function renderCmdk(query) {
    const q = normalize(query.trim());
    cmdkFiltered = !q
      ? [...commandEntries.slice(0, 6), ...repoEntries.slice(0, 8)]
      : allEntries
          .filter((it) => normalize(`${it.label} ${it.sub} ${it.keywords}`).includes(q))
          .slice(0, 40);
    cmdkActive = 0;

    if (!cmdkFiltered.length) {
      cmdkList.innerHTML = '<li class="cmdk-empty">Nada encontrado · tente outro termo</li>';
      cmdkCount.textContent = '0';
      return;
    }
    cmdkList.innerHTML = cmdkFiltered.map((it, i) => `
      <li class="cmdk-item${i === 0 ? ' active' : ''}" role="option"
          data-idx="${i}" data-type="${it.type}" aria-selected="${i === 0}">
        <span class="cmdk-kind">${it.type === 'repo' ? 'lib' : 'cmd'}</span>
        <span class="cmdk-label">${escapeHtml(it.label)}</span>
        <span class="cmdk-sub">${escapeHtml(it.sub)}</span>
      </li>`).join('');
    cmdkCount.textContent = String(cmdkFiltered.length);
  }

  function moveCmdk(dir) {
    const items = cmdkList.querySelectorAll('.cmdk-item');
    if (!items.length) return;
    items[cmdkActive]?.classList.remove('active');
    items[cmdkActive]?.setAttribute('aria-selected', 'false');
    cmdkActive = (cmdkActive + dir + items.length) % items.length;
    const el = items[cmdkActive];
    el?.classList.add('active');
    el?.setAttribute('aria-selected', 'true');
    el?.scrollIntoView({ block: 'nearest' });
  }

  function activateCmdk(idx) {
    const item = cmdkFiltered[idx];
    if (!item) return;
    cmdk.close();
    item.run?.();
  }

  function openCmdk() {
    if (!cmdk) { searchInput?.focus(); return; }
    renderCmdk('');
    cmdkInput.value = '';
    if (!cmdk.open) cmdk.showModal();
    requestAnimationFrame(() => cmdkInput.focus());
  }

  cmdkInput?.addEventListener('input', () => renderCmdk(cmdkInput.value));
  cmdkInput?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown')      { e.preventDefault(); moveCmdk(1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); moveCmdk(-1); }
    else if (e.key === 'Enter')     { e.preventDefault(); activateCmdk(cmdkActive); }
  });
  cmdkList?.addEventListener('click', (e) => {
    const li = e.target.closest('.cmdk-item');
    if (li) activateCmdk(+li.dataset.idx);
  });
  cmdkList?.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.cmdk-item');
    if (!li) return;
    const idx = +li.dataset.idx;
    if (idx === cmdkActive) return;
    cmdkList.querySelectorAll('.cmdk-item').forEach((n) => {
      n.classList.remove('active');
      n.setAttribute('aria-selected', 'false');
    });
    li.classList.add('active');
    li.setAttribute('aria-selected', 'true');
    cmdkActive = idx;
  });
  // Click on backdrop closes
  cmdk?.addEventListener('click', (e) => {
    if (e.target === cmdk) cmdk.close();
  });

  /* ─── Console easter egg + dev API ────────────────────── */
  if (typeof console !== 'undefined') {
    const banner = `
   █████╗   ███████╗████████╗ █████╗  ██████╗██╗  ██╗
  ██╔══██╗  ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
  ███████║  ███████╗   ██║   ███████║██║     █████╔╝
  ██╔══██║  ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
  ██║  ██║██╗███████║   ██║   ██║  ██║╚██████╗██║  ██╗
  ╚═╝  ╚═╝╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
`;
    console.log(
      `%c${banner}`,
      'color:#A78BFA;font-family:ui-monospace,monospace;font-size:11px;line-height:1.1;'
    );
    console.log(
      '%cBem-vindo, dev. 103 bibliotecas · 9 categorias · 0 dependências.',
      'color:#22D3EE;font-size:13px;font-weight:600;'
    );
    console.log(
      '%cExperimente: devlib.help()',
      'color:#71717A;font-style:italic;font-size:12px;'
    );
  }

  // Public dev API on window — fun, discoverable, harmless
  window.aStack = {
    /** Mostra todos os comandos disponíveis */
    help() {
      console.group('%cdevlib · comandos', 'color:#A78BFA;font-weight:600;');
      console.log('devlib.shuffle()   → embaralha a ordem dos cards');
      console.log('devlib.reset()     → restaura ordem original');
      console.log('devlib.matrix()    → ativa modo Matrix (verde)');
      console.log('devlib.count()     → quantas bibliotecas estão visíveis');
      console.log('devlib.filter("agents") → filtra por categoria');
      console.log('devlib.search("zod") → busca termo');
      console.log('devlib.go("agentes")   → scroll para seção');
      console.log('devlib.about()     → quem fez isso');
      console.groupEnd();
      console.log(
        '%cAtalhos: %c⌘K %csearch · %c? %catalhos · %c1-8 %cfiltro',
        'color:#71717A;', 'color:#A78BFA;font-weight:600;', 'color:#71717A;',
        'color:#A78BFA;font-weight:600;', 'color:#71717A;',
        'color:#A78BFA;font-weight:600;', 'color:#71717A;'
      );
      return '✓ pronto. tente um comando.';
    },
    shuffle() {
      document.querySelectorAll('.bento').forEach((bento) => {
        const items = [...bento.children];
        items.sort(() => Math.random() - 0.5).forEach((item) => bento.appendChild(item));
      });
      return `🔀 ${cards.length} cards embaralhados.`;
    },
    reset() {
      // Reload preserves scroll if SPA — but easiest: reload
      location.reload();
    },
    matrix() {
      toggleMatrixMode();
      return document.documentElement.classList.contains('matrix-mode')
        ? '◉ Matrix ativado. (Konami também funciona: ↑↑↓↓←→←→BA)'
        : '○ Matrix desativado.';
    },
    count() {
      const visible = [...cards].filter((c) => !c.classList.contains('hidden')).length;
      return `${visible} de ${cards.length} bibliotecas visíveis.`;
    },
    filter(category) {
      const btn = document.querySelector(`.filter[data-filter="${category}"]`);
      if (!btn) return `❌ categoria não encontrada. tente: all, kit, agents, mcp, interface, server, guard, run, ship`;
      btn.click();
      return `✓ filtrado: ${category}`;
    },
    search(term) {
      if (!searchInput) return '❌ search não disponível';
      searchInput.value = term;
      applyFilters();
      return `✓ buscando: "${term}" — ${this.count()}`;
    },
    go(sectionId) {
      const target = document.getElementById(sectionId);
      if (!target) return `❌ seção não encontrada: ${sectionId}`;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return `✓ scroll → #${sectionId}`;
    },
    about() {
      console.log(
        '%cDEVLIB — Edição 01 · 2026',
        'color:#A78BFA;font-weight:600;font-size:14px;'
      );
      console.log('Acervo curado de 103 bibliotecas para devs que constroem com agentes.');
      console.log('Stack: HTML · CSS · JavaScript vanilla. Zero CDN, zero dependências.');
      console.log('CSS scroll-driven animations (animation-timeline). View Transitions API.');
      return '🛠️';
    },
  };
  // Brand alias — DEVLIB is the public name; aStack kept for back-compat
  window.devlib = window.aStack;

  /* ─── Number counter when stats enter view ─────────────── */
  if (counters.length && !reduced) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = +el.dataset.count;
          const dur = 1200;
          const start = performance.now();

          const tick = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            el.textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = target;
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  }

  /* ─── Search + filter ──────────────────────────────────── */
  const normalize = (s) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Special filters that don't map to a single data-kind token.
  // RECENT — newest additions (coding agents, MCP tooling, guardrails,
  // trade agents, mobile on-device, UI). Updated for the 103-lib archive.
  const RECENT = new Set([
    'Claude Code', 'OpenHands', 'Cline', 'Goose',
    'FastMCP', 'MCP Inspector', 'GitHub MCP Server', 'Playwright MCP', 'Composio',
    'NeMo Guardrails', 'Guardrails AI', 'LLM Guard', 'Garak',
    'TradingAgents', 'AI-Trader', 'AgenticTrading', 'Freqtrade',
    'bybit-exchange/skills', 'awesome-ai-in-finance',
    'Flutter', 'React Native', 'MLC LLM', 'ExecuTorch',
    'react-native-executorch', 'MediaPipe', 'Capacitor',
    'react-native-ai', 'Cactus', 'UIverse', 'Mobbin',
  ]);
  // TOP — highest GitHub-star / iconic repos across the archive.
  const TOP = new Set([
    'Flutter', 'React Native', 'Next.js', 'Three.js', 'Ollama', 'Bun',
    'llama.cpp', 'OpenHands', 'Cline', 'Goose', 'Supabase', 'Tailwind CSS',
    'Vite', 'shadcn/ui', 'Storybook', 'Astro', 'Freqtrade', 'Appwrite',
    'PocketBase', 'Prisma ORM', 'Playwright', 'Grafana', 'Sentry',
    'Zod', 'tRPC', 'Claude Code', 'MediaPipe', 'Expo',
  ]);
  // Precompute each card's title once (avoids 70 DOM reads per filter pass)
  const cardTitle = new Map(
    [...cards].map((c) => [c, (c.querySelector('.card-title')?.textContent || '').trim()])
  );

  function matchesFilter(card, kinds) {
    switch (activeFilter) {
      case 'all':      return true;
      case 'frontend': return kinds.includes('interface');
      case 'backend':  return kinds.includes('server');
      case 'recent':   return RECENT.has(cardTitle.get(card));
      case 'top':      return TOP.has(cardTitle.get(card));
      default:         return kinds.includes(activeFilter);
    }
  }

  function runFilterPass() {
    const q = normalize(searchInput?.value.trim() || '');
    let count = 0;

    cards.forEach((card) => {
      const kinds  = (card.dataset.kind || '').split(' ');
      const inKind = matchesFilter(card, kinds);
      const inText = !q || normalize(card.textContent).includes(q);
      const show   = inKind && inText;
      card.classList.toggle('hidden', !show);
      if (show) count += 1;
    });

    chapters.forEach((chap) => {
      const next = chap.nextElementSibling;
      if (!next) return;
      const hasVisible = next.querySelector('.card:not(.hidden)');
      chap.style.display = hasVisible ? '' : 'none';
    });

    if (visibleEl) visibleEl.textContent = count;
    if (emptyEl)   emptyEl.classList.toggle('hidden', count > 0);
  }

  // Wrap filter in View Transitions API for smooth crossfade
  function applyFilters() {
    if (document.startViewTransition && !reduced) {
      document.startViewTransition(runFilterPass);
    } else {
      runFilterPass();
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-current', 'true');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  // Set aria-current on the initially active filter
  document.querySelector('.filter.active')?.setAttribute('aria-current', 'true');

  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyFilters, 120);
  });

  /* ─── Keyboard shortcuts ──────────────────────────────── */
  // ⌘K → focus search   ·   ? → shortcuts dialog
  // Esc → clear search / close dialog
  // 1-8 → filter by category   ·   gt → go to top
  // ↑↑↓↓←→←→ba → matrix mode (konami)
  const dialog       = document.getElementById('shortcutsDialog');
  const dialogClose  = dialog?.querySelector('[data-close]');
  const filterByKey  = ['all', 'kit', 'agents', 'mcp', 'interface', 'server', 'guard', 'run', 'ship', 'trade'];

  let lastKey = '';
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiBuffer = [];

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const inField = target?.matches?.('input, textarea, [contenteditable]');

    // ⌘K / Ctrl+K → open command palette (always, even in field)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog?.open) dialog.close(); // avoid stacking two modals
      openCmdk();
      return;
    }

    // Esc → close dialog OR clear search
    if (e.key === 'Escape') {
      if (dialog?.open) { dialog.close(); return; }
      if (document.activeElement === searchInput) {
        searchInput.value = '';
        applyFilters();
        searchInput.blur();
      }
      return;
    }

    if (inField) return; // remaining shortcuts only outside fields

    // ? → open shortcuts dialog (guard: showModal throws if already open)
    if (e.key === '?') {
      e.preventDefault();
      if (dialog && !dialog.open) dialog.showModal();
      return;
    }

    // 1-8 → filter by category
    if (/^[1-9]$/.test(e.key)) {
      const idx = +e.key;
      const target = filterByKey[idx];
      const btn = document.querySelector(`.filter[data-filter="${target}"]`);
      btn?.click();
      return;
    }
    if (e.key === '0') {
      document.querySelector('.filter[data-filter="all"]')?.click();
      return;
    }

    // g then t → go to top (vim style)
    if (lastKey === 'g' && e.key === 't') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      lastKey = '';
      return;
    }
    lastKey = e.key;
    setTimeout(() => { if (lastKey === e.key) lastKey = ''; }, 600);

    // Konami buffer
    konamiBuffer.push(e.key);
    if (konamiBuffer.length > KONAMI.length) konamiBuffer.shift();
    if (KONAMI.every((k, i) => konamiBuffer[i]?.toLowerCase() === k.toLowerCase())) {
      konamiBuffer = [];
      toggleMatrixMode();
    }
  });

  dialogClose?.addEventListener('click', () => dialog?.close());
  // Click on backdrop closes
  dialog?.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  /* ─── Hero cursor parallax (depth) ─────────────────────── */
  // Subtle, premium: layers shift a few px with the cursor → 3D feel.
  // Compositor transforms only, rAF-throttled, desktop + motion-ok.
  if (fineHover && !reduced) {
    const orb   = document.querySelector('.hero-orb');
    const parts = document.querySelector('.hero-particles');
    const hero  = document.querySelector('.hero');
    if (hero && (orb || parts)) {
      let prafe = null;
      let pe = null;
      const apply = () => {
        const w = innerWidth, h = innerHeight;
        const nx = (pe.clientX / w - 0.5);   // -0.5 .. 0.5
        const ny = (pe.clientY / h - 0.5);
        if (orb)   orb.style.transform   = `translate3d(${nx * 22}px, ${ny * 14}px, 0)`;
        if (parts) parts.style.transform = `translate3d(${nx * -14}px, ${ny * -9}px, 0)`;
        prafe = null;
      };
      addEventListener('mousemove', (e) => {
        pe = e;
        if (!prafe) prafe = requestAnimationFrame(apply);
      }, { passive: true });
    }
  }

  /* ─── DEVLIB mascot — alive book-bot ───────────────────── */
  const mascot       = document.getElementById('mascot');
  const mascotPupils = document.getElementById('mascotPupils');
  const mascotBubble = document.getElementById('mascotBubble');

  if (mascot && mascotBubble) {
    // Dev jokes (PT-BR) + a couple of useful hints
    const TIPS = [
      'Funciona na minha máquina 🤷',
      'Não é bug, é uma <em>feature</em> não documentada.',
      'Tem 10 tipos de gente: as que entendem binário e as que não.',
      '<code>git commit -m "fix"</code> … pela 7ª vez 😅',
      '99 bugs no código. Corrige 1. Agora são 117. 🐛',
      'Por que o dev quebrou? Usou todo o <em>cache</em>. 💸',
      'Eu transformo café em código. ☕ → 💻',
      'Deploy na sexta 17h: coragem ou loucura?',
      'Dark mode porque a luz atrai bugs. 🌚',
      'Estimei 2h. Já se passaram 3 dias. ⏳',
      '<code>// TODO: arrumar isso depois</code> (desde 2019)',
      'Tava funcionando. Não sei por quê. Quebrou. Também não sei.',
      'Vai testar em produção? Corajoso. 🫡',
      '<code>rm -rf node_modules && npm i</code> — a oração do dev 🙏',
      'CSS: centralizar uma div, o chefão final. 🎮',
      'Dica de verdade: <code>⌘K</code> busca tudo aqui.',
      'Psst… <code>devlib.help()</code> no console 👀',
      'Konami: <code>↑↑↓↓←→←→BA</code> 🟢',
    ];
    // shuffle once so it's not predictable
    for (let i = TIPS.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [TIPS[i], TIPS[j]] = [TIPS[j], TIPS[i]];
    }
    let tip = 0;
    let hideT;
    let lastJoke = 0;

    const say = (html) => {
      lastJoke = Date.now();
      mascotBubble.innerHTML = html;
      mascotBubble.classList.add('show');
      mascot.classList.add('talking');
      clearTimeout(hideT);
      // readable: ~70ms/char, clamped 4.5s–9s
      const dur = Math.min(9000, Math.max(4500, html.replace(/<[^>]+>/g, '').length * 75));
      hideT = setTimeout(() => {
        mascotBubble.classList.remove('show');
        mascot.classList.remove('talking');
      }, dur);
    };
    const nextJoke = () => { say(TIPS[tip]); tip = (tip + 1) % TIPS.length; };

    mascot.addEventListener('click', () => {
      mascot.classList.remove('pop');
      void mascot.offsetWidth; // reflow to restart pop
      mascot.classList.add('pop');
      nextJoke();
    });
    mascot.addEventListener('animationend', () => mascot.classList.remove('pop'));

    // Min gap between auto-jokes so it's lively, not spammy
    const JOKE_GAP = 17000;
    const maybeJoke = () => {
      if (reduced || document.hidden) return;
      if (mascotBubble.classList.contains('show')) return;
      if (Date.now() - lastJoke < JOKE_GAP) return;
      nextJoke();
    };

    // Greets a few seconds after load (all devices)
    if (!reduced) setTimeout(nextJoke, 5000);

    // Tells jokes DURING navigation: hide while actively scrolling
    // (never obscure), then crack one when the user pauses to read.
    let navT;
    addEventListener('scroll', () => {
      if (mascotBubble.classList.contains('show')) {
        mascotBubble.classList.remove('show');
        mascot.classList.remove('talking');
      }
      clearTimeout(navT);
      navT = setTimeout(maybeJoke, 1100); // ~1.1s after scrolling stops
    }, { passive: true });

    // Also reacts to browsing the catalog (filter changes)
    filterBtns.forEach((fb) =>
      fb.addEventListener('click', () => setTimeout(maybeJoke, 900)));

    // Eyes follow the cursor (desktop, motion-ok)
    if (fineHover && !reduced && mascotPupils) {
      let raf = null;
      let ev = null;
      addEventListener('mousemove', (e) => {
        ev = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = mascot.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height * 0.42;
          const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          const d = Math.min(2.6, Math.hypot(ev.clientX - cx, ev.clientY - cy) / 60);
          mascotPupils.style.transform =
            `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`;
          raf = null;
        });
      }, { passive: true });
    }

    // Safety net for users who read without scrolling — still gets
    // a joke now and then (gap-guarded, all devices).
    if (!reduced) {
      setInterval(() => { if (Math.random() < 0.55) maybeJoke(); }, 20000);
    }
  }
})();

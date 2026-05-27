/* ─────────────────────────────────────────────────────────────
 * jogos.js — DEVLIB Arcade
 * Catálogo de jogos (apenas links). Comportamentos da página:
 * filtro de categorias, estado da nav ao rolar, botão "voltar ao
 * topo" e ano do rodapé. Sem dependências, sem build.
 * ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  /* ── Filtro de categorias ─────────────────────────────── */
  const gfilters = document.querySelectorAll('[data-gfilter]');
  const gcards = document.querySelectorAll('.game-card');

  gfilters.forEach((f) => f.addEventListener('click', () => {
    gfilters.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    f.classList.add('active');
    f.setAttribute('aria-pressed', 'true');
    const cat = f.dataset.gfilter;
    gcards.forEach((c) => {
      const show = cat === 'all' || (c.dataset.cat || '').split(' ').includes(cat);
      c.classList.toggle('hidden', !show);
    });
  }));

  /* ── Chrome da página ─────────────────────────────────── */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const nav = $('.nav');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 20);
    toTop?.classList.toggle('visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

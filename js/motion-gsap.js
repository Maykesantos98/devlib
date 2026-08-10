(() => {
  'use strict';

  const root = document.documentElement;
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add(reducedQuery.matches ? 'reduced-motion' : 'motion-ready');

  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');

  const closeMenu = () => {
    if (!toggle || !menu) return;
    menu.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  };

  toggle?.addEventListener('click', () => {
    const willOpen = !menu?.classList.contains('is-open');
    menu?.classList.toggle('is-open', willOpen);
    toggle.classList.toggle('is-open', willOpen);
    toggle.setAttribute('aria-expanded', String(willOpen));
    toggle.setAttribute('aria-label', willOpen ? 'Fechar menu' : 'Abrir menu');
  });
  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  if (!window.gsap || reducedQuery.matches) {
    root.classList.add('gsap-fallback');
    return;
  }

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from('.nav-inner', { y: -18, opacity: 0, duration: 0.55 })
      .from('.hero-pill', { y: 18, opacity: 0, duration: 0.45 }, '-=0.25')
      .from('.hero-title .word', { yPercent: 110, opacity: 0, duration: 0.72, stagger: 0.065 }, '-=0.25')
      .from('.hero-lead, .home-search, .home-actions', { y: 20, opacity: 0, duration: 0.55, stagger: 0.08 }, '-=0.4')
      .from('.home-preview', { x: 28, opacity: 0, duration: 0.65 }, '-=0.5');

    if (window.ScrollTrigger) {
      gsap.utils.toArray('.blueprint-card, .principle').forEach((element) => {
        gsap.from(element, {
          scrollTrigger: { trigger: element, start: 'top 88%', once: true },
          y: 28,
          opacity: 0,
          duration: 0.65,
          ease: 'power3.out',
        });
      });

      gsap.to('.hero-title', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
        yPercent: 8,
        opacity: 0.45,
        ease: 'none',
      });
    }
  });
})();

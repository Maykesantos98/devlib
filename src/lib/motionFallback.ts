/**
 * Fallback de revelação por scroll para navegadores sem `animation-timeline`.
 *
 * O motion.css faz toda a coreografia com view-timelines nativos, dentro de
 * `@supports (animation-timeline: view())`. Chrome, Edge e Safari 18+ entram
 * nesse bloco. O Firefox não — e, sem isto, o site chega lá completamente
 * estático.
 *
 * Regras de segurança, nesta ordem:
 *
 *   1. Sem JS, nada fica escondido. A classe `js-motion` é adicionada por este
 *      módulo; é ela que aplica o estado inicial no CSS. Se o script não rodar,
 *      o conteúdo aparece. (Foi o oposto disso — um `opacity: 0` órfão — que
 *      apagava o índice de categorias no Firefox.)
 *   2. Se o navegador tem view-timeline, este módulo não faz nada.
 *   3. Se o usuário pediu menos movimento, este módulo não faz nada.
 */

/*
 * Precisa espelhar exatamente a lista do bloco 7c em motion.css. Se um seletor
 * aparece lá (que aplica `opacity: 0`) e some daqui, o elemento nunca recebe
 * `.is-in` e fica invisível para sempre no Firefox.
 *
 * `.toolbar` está fora de propósito: é `sticky`, e um controle de busca não
 * deve nascer transparente.
 */
const SELECTORS = [
  '.card',
  '.toc a',
  '.chapter-bar',
  '.section-eyebrow',
  '.section-title',
  '.section-desc',
  '.filters',
  '.stats-strip',
  '.principle',
  '.footer-v05-inner > *',
].join(', ');

const REVEALED = 'is-in';

/** Quantos vizinhos escalonam antes do atraso reiniciar. */
const STAGGER_WRAP = 3;

function supportsViewTimeline(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'view()');
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initMotionFallback(): () => void {
  const noop = () => {};

  if (supportsViewTimeline() || prefersReducedMotion()) return noop;
  if (typeof IntersectionObserver === 'undefined') return noop;

  const root = document.documentElement;
  root.classList.add('js-motion');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        entry.target.classList.add(REVEALED);
        // Um elemento revelado não volta a esconder — solta o observer.
        observer.unobserve(entry.target);
      }
    },
    // Dispara um pouco antes da borda inferior, para o elemento chegar já em movimento.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  );

  const seen = new WeakSet<Element>();

  function observeAll() {
    document.querySelectorAll(SELECTORS).forEach((el, index) => {
      if (seen.has(el)) return;
      seen.add(el);

      // Escalonamento por posição na linha, imitando o ritmo do view-timeline.
      (el as HTMLElement).style.setProperty('--reveal-i', String(index % STAGGER_WRAP));

      // Já está na tela no primeiro paint? Revela sem esperar scroll.
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) {
        el.classList.add(REVEALED);
        return;
      }

      observer.observe(el);
    });
  }

  observeAll();

  // O acervo é filtrado e re-renderizado; cards novos precisam ser observados.
  const mutation = new MutationObserver(() => observeAll());
  mutation.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    mutation.disconnect();
    root.classList.remove('js-motion');
  };
}

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

interface CountUpProps {
  readonly to: number;
  readonly durationMs?: number;
  readonly className?: string;
}

/** Rápido no início, assenta no fim. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Conta de 0 até `to` quando entra na viewport, uma única vez.
 *
 * O valor final fica sempre no DOM para leitores de tela — o número em
 * movimento é `aria-hidden`. Quem pediu menos movimento vê o número direto,
 * por valor derivado, sem `setState` dentro de efeito.
 */
export function CountUp({ to, durationMs = 1100, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  // Sem IntersectionObserver não há gatilho: começa já no valor final,
  // decidido no render, sem efeito.
  const [progressValue, setProgressValue] = useState(() =>
    typeof IntersectionObserver === 'undefined' ? to : 0,
  );

  useEffect(() => {
    if (reduced) return;

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let frame = 0;
    let start = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const step = (now: number) => {
          if (!start) start = now;
          const progress = Math.min((now - start) / durationMs, 1);
          setProgressValue(Math.round(easeOutCubic(progress) * to));
          if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, durationMs, reduced]);

  // Derivado, não sincronizado por efeito.
  const shown = reduced ? to : progressValue;

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{to}</span>
    </span>
  );
}

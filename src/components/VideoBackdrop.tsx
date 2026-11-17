import { useEffect, useRef } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery';

interface VideoBackdropProps {
  /** Base do par `<name>.mp4` + `<name>.jpg` em /video/. */
  readonly name: string;
  readonly className?: string;
}

/**
 * Loop de vídeo atrás do hero.
 *
 * O clipe pesa ~1,2 MB — mais que todo o JavaScript do site. Então ele só é
 * baixado por quem realmente vai vê-lo:
 *
 *   - `prefers-reduced-motion` → nunca. Fica o poster.
 *   - Telas estreitas (≤ 900px) → nunca. Dado móvel é caro e o vídeo fica
 *     ilegível atrás do texto de qualquer forma.
 *   - Fora da viewport → pausa. Ninguém decodifica frames que não vê.
 *
 * O <video> só entra no DOM quando essas condições passam, e o poster fica
 * sempre visível por baixo — sem tela preta enquanto o primeiro frame decodifica.
 */
export function VideoBackdrop({ name, className = '' }: VideoBackdropProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const isNarrow = useMediaQuery('(max-width: 900px)');

  const enabled = !reduced && !isNarrow;

  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [enabled]);

  const poster = `/video/${name}.jpg`;

  return (
    <div className={`video-backdrop ${className}`} aria-hidden="true">
      <img className="video-backdrop-poster" src={poster} alt="" />

      {enabled && (
        <video
          ref={ref}
          className="video-backdrop-video"
          src={`/video/${name}.mp4`}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
        />
      )}

      <div className="video-backdrop-wash" />
    </div>
  );
}

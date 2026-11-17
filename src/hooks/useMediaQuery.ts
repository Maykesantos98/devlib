import { useCallback, useSyncExternalStore } from 'react';

/**
 * Assina uma media query.
 *
 * `useSyncExternalStore` é o caminho certo aqui: a media query é um estado
 * externo ao React. Um `useEffect` que chama `setState` na montagem dispara
 * render em cascata — e o eslint-plugin-react-hooks reclama, com razão.
 *
 * Fora do browser (ou sem `matchMedia`), devolve `false`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};

      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** `true` quando o usuário pediu menos movimento. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

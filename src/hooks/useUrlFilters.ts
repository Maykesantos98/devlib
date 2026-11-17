import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { INITIAL_FILTERS, type FilterState } from '../components/filterState';

/**
 * Filtros e busca vivem na URL, não em `useState`.
 *
 * Isso dá três coisas de graça: um recorte do acervo é compartilhável por link,
 * o botão voltar do navegador desfaz o filtro, e um F5 não perde o contexto.
 *
 * Só o que difere do padrão entra na query string — `?cat=mcp` em vez de
 * `?cat=mcp&nivel=any&tipo=any&lang=any&q=`.
 */

const PARAM = {
  category: 'cat',
  difficulty: 'nivel',
  type: 'tipo',
  lang: 'lang',
} as const satisfies Record<keyof FilterState, string>;

const QUERY_PARAM = 'q';

/** Anima a re-montagem da grade onde o navegador suportar. */
function withViewTransition(mutate: () => void): void {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => void;
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || typeof doc.startViewTransition !== 'function') {
    mutate();
    return;
  }

  doc.startViewTransition(mutate);
}

export interface UrlFilters {
  readonly filters: FilterState;
  readonly searchQuery: string;
  readonly setFilters: (next: FilterState) => void;
  readonly setSearchQuery: (next: string) => void;
  readonly clearAll: () => void;
  readonly activeCount: number;
}

export function useUrlFilters(): UrlFilters {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<FilterState>(
    () => ({
      category: params.get(PARAM.category) ?? INITIAL_FILTERS.category,
      difficulty: params.get(PARAM.difficulty) ?? INITIAL_FILTERS.difficulty,
      type: params.get(PARAM.type) ?? INITIAL_FILTERS.type,
      lang: params.get(PARAM.lang) ?? INITIAL_FILTERS.lang,
    }),
    [params],
  );

  const searchQuery = params.get(QUERY_PARAM) ?? '';

  const write = useCallback(
    (next: FilterState, query: string, animate: boolean) => {
      const draft = new URLSearchParams();

      for (const key of Object.keys(PARAM) as Array<keyof FilterState>) {
        if (next[key] !== INITIAL_FILTERS[key]) draft.set(PARAM[key], next[key]);
      }
      if (query.trim()) draft.set(QUERY_PARAM, query);

      const commit = () => setParams(draft, { replace: true });
      if (animate) withViewTransition(commit);
      else commit();
    },
    [setParams],
  );

  const setFilters = useCallback(
    (next: FilterState) => write(next, searchQuery, true),
    [write, searchQuery],
  );

  // A busca dispara a cada tecla: animar aqui seria ruído, não coreografia.
  const setSearchQuery = useCallback(
    (next: string) => write(filters, next, false),
    [write, filters],
  );

  const clearAll = useCallback(
    () => write(INITIAL_FILTERS, '', true),
    [write],
  );

  const activeCount = useMemo(() => {
    const changed = (Object.keys(PARAM) as Array<keyof FilterState>).filter(
      (key) => filters[key] !== INITIAL_FILTERS[key],
    ).length;
    return changed + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

  return { filters, searchQuery, setFilters, setSearchQuery, clearAll, activeCount };
}

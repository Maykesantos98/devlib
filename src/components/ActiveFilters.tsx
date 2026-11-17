import { CATEGORIES } from '../lib/schema';
import { INITIAL_FILTERS, type FilterState } from './filterState';

interface ActiveFiltersProps {
  readonly filters: FilterState;
  readonly searchQuery: string;
  readonly onChange: (next: FilterState) => void;
  readonly onClearSearch: () => void;
  readonly onClearAll: () => void;
}

const LABELS: Record<string, string> = {
  recent: 'Recentes',
  iniciante: 'Iniciante',
  producao: 'Produção',
  'bleeding-edge': 'Bleeding-edge',
  oss: 'Open source',
  saas: 'SaaS',
  'lang:typescript': 'TypeScript',
  'lang:python': 'Python',
  'lang:rust': 'Rust',
  'lang:go': 'Go',
  'lang:dart': 'Dart',
};

function labelFor(value: string): string {
  return LABELS[value] ?? CATEGORIES.find((c) => c.id === value)?.name ?? value;
}

/**
 * Mostra o que está filtrado agora e deixa remover um eixo por vez.
 * Sem isto, o usuário que rola até o meio do acervo não tem como saber por que
 * está vendo poucos itens.
 */
export function ActiveFilters({
  filters,
  searchQuery,
  onChange,
  onClearSearch,
  onClearAll,
}: ActiveFiltersProps) {
  const chips = (Object.keys(INITIAL_FILTERS) as Array<keyof FilterState>)
    .filter((key) => filters[key] !== INITIAL_FILTERS[key])
    .map((key) => ({
      key,
      label: labelFor(filters[key]),
      clear: () => onChange({ ...filters, [key]: INITIAL_FILTERS[key] }),
    }));

  const hasSearch = Boolean(searchQuery.trim());
  if (!chips.length && !hasSearch) return null;

  return (
    <div className="active-filters" role="group" aria-label="Filtros ativos">
      {hasSearch && (
        <button type="button" className="active-chip" onClick={onClearSearch}>
          <span>busca: “{searchQuery}”</span>
          <span aria-hidden="true">×</span>
          <span className="sr-only">Limpar busca</span>
        </button>
      )}

      {chips.map((chip) => (
        <button key={chip.key} type="button" className="active-chip" onClick={chip.clear}>
          <span>{chip.label}</span>
          <span aria-hidden="true">×</span>
          <span className="sr-only">Remover filtro {chip.label}</span>
        </button>
      ))}

      {chips.length + Number(hasSearch) > 1 && (
        <button type="button" className="active-chip active-chip-clear" onClick={onClearAll}>
          Limpar tudo
        </button>
      )}
    </div>
  );
}

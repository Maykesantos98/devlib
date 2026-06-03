import { CATEGORIES } from '../lib/schema';

export interface FilterState {
  category: string;
  difficulty: string;
  type: string;
}

export const INITIAL_FILTERS: FilterState = {
  category: 'all',
  difficulty: 'any',
  type: 'any',
};

interface FiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
}

interface PillGroupProps<K extends keyof FilterState> {
  label: string;
  field: K;
  value: FilterState[K];
  options: ReadonlyArray<{ id: string; label: string; accent?: boolean }>;
  onChange: (next: FilterState) => void;
  state: FilterState;
}

function PillGroup<K extends keyof FilterState>({
  label,
  field,
  value,
  options,
  onChange,
  state,
}: PillGroupProps<K>) {
  return (
    <div className="filter-group" role="group" aria-label={label}>
      <span className="filter-group-label">{label}</span>
      <div className="filter-group-pills">
        {options.map(({ id, label: optLabel, accent }) => (
          <button
            key={id}
            type="button"
            className={`filter ${accent ? 'filter-accent' : ''} ${value === id ? 'active' : ''}`}
            onClick={() => onChange({ ...state, [field]: id })}
            aria-pressed={value === id}
          >
            {optLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

const CATEGORY_OPTIONS = [
  { id: 'all',    label: 'Todas' },
  { id: 'recent', label: '● Recentes', accent: true },
  ...CATEGORIES.map((c) => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
] as const;

const DIFFICULTY_OPTIONS = [
  { id: 'any',           label: 'Qualquer nível' },
  { id: 'iniciante',     label: 'Iniciante' },
  { id: 'producao',      label: 'Produção' },
  { id: 'bleeding-edge', label: 'Bleeding-edge' },
] as const;

const TYPE_OPTIONS = [
  { id: 'any',  label: 'Qualquer tipo' },
  { id: 'oss',  label: 'Open source' },
  { id: 'saas', label: 'SaaS' },
] as const;

/**
 * Multi-axis filter panel.
 * Renders 3 pill groups: category, difficulty, type.
 */
export function Filters({ value, onChange }: FiltersProps) {
  return (
    <div className="filters-panel" aria-label="Filtros do acervo">
      <PillGroup
        label="Categoria"
        field="category"
        value={value.category}
        options={CATEGORY_OPTIONS}
        onChange={onChange}
        state={value}
      />
      <PillGroup
        label="Difficulty"
        field="difficulty"
        value={value.difficulty}
        options={DIFFICULTY_OPTIONS}
        onChange={onChange}
        state={value}
      />
      <PillGroup
        label="Tipo"
        field="type"
        value={value.type}
        options={TYPE_OPTIONS}
        onChange={onChange}
        state={value}
      />
    </div>
  );
}

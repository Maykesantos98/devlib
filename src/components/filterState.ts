export interface FilterState {
  category: string;
  difficulty: string;
  type: string;
  lang: string;
}

export const INITIAL_FILTERS: FilterState = {
  category: 'all',
  difficulty: 'any',
  type: 'any',
  lang: 'any',
};

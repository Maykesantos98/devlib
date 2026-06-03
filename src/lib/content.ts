/**
 * Content loader for libraries, recipes and guides.
 *
 * Frontmatter + body are extracted at build time by a custom Vite plugin
 * (`contentFrontmatter`) and exposed via the `virtual:content-frontmatter`
 * module. This avoids conflicts with the MDX plugin (which intercepts
 * `.mdx?raw` queries).
 *
 * MDX bodies (compiled to React components) are loaded lazily via
 * `import.meta.glob` — those go through the MDX plugin as intended.
 */
import type { ComponentType } from 'react';
import frontmatter from 'virtual:content-frontmatter';
import {
  LibrarySchema,
  RecipeSchema,
  GuideSchema,
  CATEGORIES,
  type CategoryId,
  type Library,
  type Recipe,
  type Guide,
} from './schema';
import type { CardData, ChapterData } from '../types';

/* ── Lazy body loaders (React components) ────────────────── */

const libraryBody = import.meta.glob('/content/libraries/*.mdx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

const recipeBody = import.meta.glob('/content/recipes/*.mdx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

const guideBody = import.meta.glob('/content/guides/*.mdx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

/* ── Validate ────────────────────────────────────────────── */

function validate<T>(
  raw: unknown[],
  schema: { safeParse(input: unknown): { success: true; data: T } | { success: false; error: unknown } },
  kind: string,
): T[] {
  const items: T[] = [];
  for (const entry of raw) {
    const result = schema.safeParse(entry);
    if (result.success) {
      items.push(result.data);
    } else {
      const slug = (entry as { slug?: string })?.slug ?? '<unknown>';
      console.error(`[content] invalid ${kind} "${slug}":`, result.error);
    }
  }
  return items;
}

/* ── Public API ──────────────────────────────────────────── */

export const libraries: Library[] = validate(frontmatter.libraries ?? [], LibrarySchema, 'library');
export const recipes: Recipe[] = validate(frontmatter.recipes ?? [], RecipeSchema, 'recipe');
export const guides: Guide[] = validate(frontmatter.guides ?? [], GuideSchema, 'guide');

export function findLibrary(slug: string): Library | undefined {
  return libraries.find((l) => l.slug === slug);
}

export function findRecipe(slug: string): Recipe | undefined {
  return recipes.find((r) => r.slug === slug);
}

export function findGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export function loadLibraryBody(slug: string) {
  return libraryBody[`/content/libraries/${slug}.mdx`];
}

export function loadRecipeBody(slug: string) {
  return recipeBody[`/content/recipes/${slug}.mdx`];
}

export function loadGuideBody(slug: string) {
  return guideBody[`/content/guides/${slug}.mdx`];
}

/* ── Cross-references (B) ────────────────────────────────── */

/**
 * Recipes that include this library in their stack.
 */
export function recipesUsingLibrary(librarySlug: string): Recipe[] {
  return recipes.filter((r) => r.stack.some((s) => s.library === librarySlug));
}

/**
 * Guides that explicitly relate to this library.
 */
export function guidesMentioningLibrary(librarySlug: string): Guide[] {
  return guides.filter((g) => g.relatedLibraries.includes(librarySlug));
}

/**
 * Suggest alternatives: same category, sorted by editorial weight.
 * Items with a hand-written body win; then `featured`; then alphabetical.
 */
export function alternativesFor(library: Library, limit = 4): Library[] {
  return libraries
    .filter((l) => l.category === library.category && l.slug !== library.slug)
    .sort((a, b) => {
      const aHasBody = a.body && a.body.length > 50 ? 1 : 0;
      const bHasBody = b.body && b.body.length > 50 ? 1 : 0;
      if (aHasBody !== bHasBody) return bHasBody - aHasBody;
      const aFeat = a.featured ? 1 : 0;
      const bFeat = b.featured ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

/* ── BentoGrid adapter ───────────────────────────────────── */

const CATEGORY_TONE: Record<CategoryId, CardData['tone']> = {
  'ai-agents':           'violet',
  'mcp':                 'cyan',
  'frontend-ui':         'pink',
  'frontend-frameworks': 'amber',
  'backend-data':        'emerald',
  'backend-toolkit':     'cyan',
  'mobile-ai':           'violet',
  'security':            'amber',
  'devops':              'emerald',
  'trade-quant':         'pink',
};

const CATEGORY_NUM: Record<CategoryId, string> = {
  'ai-agents':           '§01 · Agents',
  'mcp':                 '§02 · MCP',
  'frontend-ui':         '§03 · Frontend UI',
  'frontend-frameworks': '§04 · Frontend Frameworks',
  'backend-data':        '§05 · Backend (Data)',
  'backend-toolkit':     '§06 · Backend (Toolkit)',
  'mobile-ai':           '§07 · Mobile & AI',
  'security':            '§08 · Security',
  'devops':              '§09 · DevOps',
  'trade-quant':         '§10 · Trade & Quant',
};

const CATEGORY_TITLE: Record<CategoryId, string> = {
  'ai-agents':           'Frameworks & SDKs — escolha seu runtime.',
  'mcp':                 'Model Context Protocol — a fiação.',
  'frontend-ui':         'Interface — componentes & blocos.',
  'frontend-frameworks': 'Interface — frameworks & gráficos.',
  'backend-data':        'Servidor — bancos de dados & APIs.',
  'backend-toolkit':     'Servidor — ORMs, auth & validação.',
  'mobile-ai':           'Apps — mobile & IA on-device.',
  'security':            'Segurança — auth & appsec.',
  'devops':              'Build — build, testes & obs.',
  'trade-quant':         'Trade — agentes & quant.',
};

function libraryToCard(lib: Library): CardData {
  const classes = ['card'];
  if (lib.featured) classes.push('feature');
  return {
    slug: lib.slug,
    title: lib.title,
    classes: classes.join(' '),
    kind: lib.category,
    tone: CATEGORY_TONE[lib.category],
    meta: '',
    badge: lib.badge ?? '',
    body: lib.summary,
    tags: lib.tags,
    link_text: '',
    link_url: lib.url,
  };
}

/**
 * Groups libraries by category into the ChapterData[] shape that the
 * existing BentoGrid + CmdkPalette consume. Empty categories are dropped.
 */
export const chapters: ChapterData[] = CATEGORIES.map((cat) => {
  const items = libraries.filter((l) => l.category === cat.id);
  return {
    id: cat.id,
    chapter: cat.id,
    num: CATEGORY_NUM[cat.id],
    title: CATEGORY_TITLE[cat.id],
    count: `${items.length} itens`,
    cards: items.map(libraryToCard),
  };
}).filter((c) => c.cards.length > 0);

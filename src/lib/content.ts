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
  type Library,
  type Recipe,
  type Guide,
} from './schema';

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

import { describe, it, expect } from 'vitest';
import { libraries, recipes, guides, chapters, findLibrary, findRecipe, findGuide } from './content';

describe('content loader', () => {
  it('loads libraries from MDX', () => {
    expect(libraries.length).toBeGreaterThan(100);
    for (const lib of libraries) {
      expect(lib.slug).toMatch(/^[a-z0-9-]+$/);
      expect(lib.title).toBeTruthy();
      expect(lib.summary.length).toBeGreaterThanOrEqual(20);
      expect(lib.url).toMatch(/^https?:\/\//);
    }
  });

  it('loads recipes with valid stack references', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(6);
    for (const recipe of recipes) {
      expect(recipe.stack.length).toBeGreaterThan(0);
    }
  });

  it('loads guides', () => {
    expect(guides.length).toBeGreaterThanOrEqual(8);
    for (const guide of guides) {
      expect(guide.readingMinutes).toBeGreaterThanOrEqual(1);
    }
  });

  it('exposes chapters in v04 category order', () => {
    expect(chapters.length).toBeGreaterThan(0);
    const ids = chapters.map((c) => c.id);
    expect(ids).toContain('ai-agents');
    expect(ids).toContain('security');
  });

  it('finds items by slug', () => {
    const first = libraries[0];
    expect(findLibrary(first.slug)?.title).toBe(first.title);
    expect(findRecipe('launch-saas-2026')).toBeDefined();
    expect(findGuide('escolher-stack-saas-2026')).toBeDefined();
  });
});

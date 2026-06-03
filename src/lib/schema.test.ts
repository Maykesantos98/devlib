import { describe, it, expect } from 'vitest';
import {
  CategoryId,
  Difficulty,
  LibrarySchema,
  RecipeSchema,
  GuideSchema,
  categoryMeta,
  CATEGORIES,
} from './schema';

describe('CategoryId', () => {
  it('accepts known ids', () => {
    expect(CategoryId.safeParse('ai-agents').success).toBe(true);
    expect(CategoryId.safeParse('mcp').success).toBe(true);
  });

  it('rejects unknown ids', () => {
    expect(CategoryId.safeParse('unknown').success).toBe(false);
    expect(CategoryId.safeParse('').success).toBe(false);
  });
});

describe('Difficulty', () => {
  it('accepts the 3 levels', () => {
    expect(Difficulty.safeParse('iniciante').success).toBe(true);
    expect(Difficulty.safeParse('producao').success).toBe(true);
    expect(Difficulty.safeParse('bleeding-edge').success).toBe(true);
  });
});

describe('CATEGORIES', () => {
  it('has 10 entries with unique ids', () => {
    expect(CATEGORIES).toHaveLength(10);
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(ids.size).toBe(10);
  });

  it('categoryMeta returns the matching entry', () => {
    expect(categoryMeta('ai-agents').name).toBe('AI Agents');
    expect(categoryMeta('mcp').emoji).toBe('🔌');
  });
});

describe('LibrarySchema', () => {
  const valid = {
    slug: 'my-lib',
    title: 'My Lib',
    summary: 'A short description that is at least twenty characters long.',
    url: 'https://example.com',
    category: 'ai-agents' as const,
    addedAt: '2026-06-02',
  };

  it('parses a minimal valid library', () => {
    const result = LibrarySchema.parse(valid);
    expect(result.slug).toBe('my-lib');
    expect(result.difficulty).toBe('producao'); // default
    expect(result.featured).toBe(false); // default
    expect(result.tags).toEqual([]); // default
  });

  it('rejects non-kebab-case slug', () => {
    expect(LibrarySchema.safeParse({ ...valid, slug: 'My_Lib' }).success).toBe(false);
    expect(LibrarySchema.safeParse({ ...valid, slug: 'minha lib' }).success).toBe(false);
  });

  it('rejects malformed date', () => {
    expect(LibrarySchema.safeParse({ ...valid, addedAt: '02/06/2026' }).success).toBe(false);
  });

  it('rejects too-short summary', () => {
    expect(LibrarySchema.safeParse({ ...valid, summary: 'short' }).success).toBe(false);
  });
});

describe('RecipeSchema', () => {
  const valid = {
    slug: 'my-recipe',
    title: 'My Recipe',
    goal: 'Do X',
    summary: 'Resumo',
    stack: [{ library: 'lib-a', role: 'role A' }],
    publishedAt: '2026-06-02',
  };

  it('parses a minimal recipe', () => {
    const result = RecipeSchema.parse(valid);
    expect(result.stack).toHaveLength(1);
  });

  it('rejects empty stack', () => {
    expect(RecipeSchema.safeParse({ ...valid, stack: [] }).success).toBe(false);
  });
});

describe('GuideSchema', () => {
  const valid = {
    slug: 'my-guide',
    title: 'My Guide',
    summary: 'Resumo do guia',
    publishedAt: '2026-06-02',
    readingMinutes: 5,
  };

  it('parses a minimal guide', () => {
    const result = GuideSchema.parse(valid);
    expect(result.readingMinutes).toBe(5);
    expect(result.relatedRecipes).toEqual([]);
  });

  it('rejects readingMinutes < 1', () => {
    expect(GuideSchema.safeParse({ ...valid, readingMinutes: 0 }).success).toBe(false);
  });
});

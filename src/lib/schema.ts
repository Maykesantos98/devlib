/**
 * Single source of truth for DEVLIB v04 data shapes.
 * Schemas drive: content validation, TS types, and runtime guards.
 */
import { z } from 'zod';

/* ── Eixo 1 · Categorias ─────────────────────────────────── */

export const CATEGORY_IDS = [
  'ai-agents',
  'mcp',
  'frontend-ui',
  'frontend-frameworks',
  'backend-data',
  'backend-toolkit',
  'mobile-ai',
  'security',
  'devops',
  'trade-quant',
] as const;

export const CategoryId = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof CategoryId>;

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  description: string;
  emoji: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: 'ai-agents',           name: 'AI Agents',            description: 'Frameworks, SDKs e runtimes para construir agentes',  emoji: '🤖' },
  { id: 'mcp',                 name: 'Model Context Protocol', description: 'Servidores MCP, ferramentas e clientes',            emoji: '🔌' },
  { id: 'frontend-ui',         name: 'Frontend UI',          description: 'Componentes, design systems e blocos visuais',         emoji: '🎨' },
  { id: 'frontend-frameworks', name: 'Frontend Frameworks',  description: 'Build tools, runtimes web, 3D e motion',               emoji: '⚛️' },
  { id: 'backend-data',        name: 'Backend (Data)',       description: 'Bancos, BaaS, caches, filas',                          emoji: '🗄️' },
  { id: 'backend-toolkit',     name: 'Backend (Toolkit)',    description: 'ORMs, validators, auth, RPC',                          emoji: '🧰' },
  { id: 'mobile-ai',           name: 'Mobile & On-device AI', description: 'React Native, Expo, ExecuTorch, MLC',                emoji: '📱' },
  { id: 'security',            name: 'Segurança',            description: 'Auth, appsec, scanners, guardrails',                   emoji: '🔒' },
  { id: 'devops',              name: 'DevOps & Build',       description: 'Build, deploy, observability, CI',                     emoji: '🛠️' },
  { id: 'trade-quant',         name: 'Trade & Quant',        description: 'Agentes financeiros, backtesting, dados',              emoji: '📈' },
];

/* ── Eixo 4 · Difficulty ─────────────────────────────────── */

export const Difficulty = z.enum(['iniciante', 'producao', 'bleeding-edge']);
export type Difficulty = z.infer<typeof Difficulty>;

/* ── Common ──────────────────────────────────────────────── */

const Slug = z.string().regex(/^[a-z0-9-]+$/, 'slug deve ser kebab-case ASCII');
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve ser YYYY-MM-DD');

/* ── Library ─────────────────────────────────────────────── */

export const LibrarySchema = z.object({
  slug: Slug,
  title: z.string().min(1).max(80),
  summary: z.string().min(20).max(280),
  url: z.string().url(),
  repo: z.string().url().optional(),
  category: CategoryId,
  tags: z.array(z.string()).default([]),
  difficulty: Difficulty.default('producao'),
  badge: z.string().max(20).optional(),
  featured: z.boolean().default(false),
  recipes: z.array(z.string()).default([]),
  addedAt: IsoDate,
  // body is the MDX content (filled by content loader)
  body: z.string().optional(),
});
export type Library = z.infer<typeof LibrarySchema>;

/* ── Recipe ──────────────────────────────────────────────── */

export const RecipeStackItem = z.object({
  library: z.string(),   // slug
  role: z.string(),
  note: z.string().optional(),
});

export const RecipeSchema = z.object({
  slug: Slug,
  title: z.string(),
  goal: z.string(),
  emoji: z.string().optional(),
  summary: z.string(),
  stack: z.array(RecipeStackItem).min(1),
  templateRepo: z.string().url().optional(),
  publishedAt: IsoDate,
  body: z.string().optional(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

/* ── Guide ───────────────────────────────────────────────── */

export const GuideSchema = z.object({
  slug: Slug,
  title: z.string(),
  summary: z.string(),
  category: CategoryId.optional(),
  relatedRecipes: z.array(z.string()).default([]),
  relatedLibraries: z.array(z.string()).default([]),
  publishedAt: IsoDate,
  updatedAt: IsoDate.optional(),
  readingMinutes: z.number().int().min(1),
  body: z.string().optional(),
});
export type Guide = z.infer<typeof GuideSchema>;

/* ── Helpers ─────────────────────────────────────────────── */

export function categoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

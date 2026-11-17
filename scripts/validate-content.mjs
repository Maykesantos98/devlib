#!/usr/bin/env node
/**
 * Validates ALL MDX content against Zod schemas.
 * - Frontmatter required fields present
 * - No duplicate slugs
 * - All `recipes[]` references point to real recipes
 * - All `stack[].library` references point to real libraries
 *
 * Run: node scripts/validate-content.mjs
 * Exits non-zero on any error — wire into CI.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import {
  LibrarySchema,
  RecipeSchema,
  GuideSchema,
} from '../src/lib/schema.ts';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseFrontmatter(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { data: {}, content: source };
  const data = yaml.load(match[1]) ?? {};
  return { data, content: match[2] };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const errors = [];

function err(file, msg) {
  errors.push(`  ✗ ${file}: ${msg}`);
}

async function loadDir(subdir) {
  const dir = join(root, 'content', subdir);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mdx') && !f.startsWith('_'));
  const items = [];

  for (const file of files) {
    const path = join(dir, file);
    const source = await readFile(path, 'utf8');
    const { data, content } = parseFrontmatter(source);
    const slug = basename(file, '.mdx');
    // YAML can parse bare numbers like 2026 — coerce tags to strings
    // to match what the Vite plugin does at runtime.
    if (Array.isArray(data.tags)) {
      data.tags = data.tags.map((t) => String(t));
    }
    items.push({ slug, data: { ...data, slug, body: content.trim() }, file: `content/${subdir}/${file}` });
  }
  return items;
}

function check(items, schema, kind) {
  const validated = [];
  for (const { slug, data, file } of items) {
    const result = schema.safeParse(data);
    if (!result.success) {
      err(file, `invalid ${kind} frontmatter:\n${result.error.message}`);
      continue;
    }
    validated.push({ ...result.data, file });
  }
  // duplicate slug check
  // NOTA: o slug vem do nome do arquivo, então dois arquivos jamais colidem
  // aqui. Esta checagem nunca dispara — ver a de título logo abaixo, que é a
  // que realmente pega entrada repetida no acervo.
  const seen = new Map();
  for (const v of validated) {
    if (seen.has(v.slug)) {
      err(v.file, `duplicate slug "${v.slug}" (also in ${seen.get(v.slug)})`);
    } else {
      seen.set(v.slug, v.file);
    }
  }

  // duplicate title check — a mesma biblioteca cadastrada em dois arquivos
  // infla a contagem do acervo e mostra o item duas vezes na home.
  const titles = new Map();
  for (const v of validated) {
    if (typeof v.title !== 'string') continue;
    const key = v.title.trim().toLowerCase();
    if (titles.has(key)) {
      err(v.file, `duplicate title "${v.title}" (also in ${titles.get(key)})`);
    } else {
      titles.set(key, v.file);
    }
  }

  return validated;
}

async function main() {
  const libraryItems = await loadDir('libraries');
  const recipeItems = await loadDir('recipes');
  const guideItems = await loadDir('guides');

  const libraries = check(libraryItems, LibrarySchema, 'library');
  const recipes = check(recipeItems, RecipeSchema, 'recipe');
  const guides = check(guideItems, GuideSchema, 'guide');

  const librarySlugs = new Set(libraries.map((l) => l.slug));
  const recipeSlugs = new Set(recipes.map((r) => r.slug));

  // cross-reference checks
  for (const r of recipes) {
    for (const item of r.stack) {
      if (!librarySlugs.has(item.library)) {
        err(r.file, `stack references unknown library "${item.library}"`);
      }
    }
  }

  for (const l of libraries) {
    for (const rs of l.recipes) {
      if (!recipeSlugs.has(rs)) {
        err(l.file, `recipes references unknown recipe "${rs}"`);
      }
    }
  }

  for (const g of guides) {
    for (const rs of g.relatedRecipes) {
      if (!recipeSlugs.has(rs)) {
        err(g.file, `relatedRecipes references unknown recipe "${rs}"`);
      }
    }
    for (const ls of g.relatedLibraries) {
      if (!librarySlugs.has(ls)) {
        err(g.file, `relatedLibraries references unknown library "${ls}"`);
      }
    }
  }

  console.log(`Libraries: ${libraries.length}  Recipes: ${recipes.length}  Guides: ${guides.length}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):\n${errors.join('\n')}`);
    process.exit(1);
  }

  console.log('✓ all content valid');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

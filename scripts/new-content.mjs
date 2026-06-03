#!/usr/bin/env node
/**
 * Scaffolds a new content file from template.
 *
 * Usage:
 *   node scripts/new-content.mjs library my-lib-slug
 *   node scripts/new-content.mjs recipe my-recipe-slug
 *   node scripts/new-content.mjs guide my-guide-slug
 *
 * Or via npm script: pnpm new:library my-lib-slug
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const KIND_DIR = {
  library: 'libraries',
  recipe: 'recipes',
  guide: 'guides',
};

async function main() {
  const [, , kind, slug] = process.argv;

  if (!kind || !slug || !KIND_DIR[kind]) {
    console.error('Usage: node scripts/new-content.mjs <library|recipe|guide> <slug>');
    process.exit(1);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error(`Slug "${slug}" must be kebab-case ASCII (a-z, 0-9, -).`);
    process.exit(1);
  }

  const dir = KIND_DIR[kind];
  const templatePath = join(root, 'content', dir, '_template.mdx');
  const destPath = join(root, 'content', dir, `${slug}.mdx`);

  try {
    await access(destPath);
    console.error(`File already exists: content/${dir}/${slug}.mdx`);
    process.exit(1);
  } catch {
    // not found — good
  }

  const template = await readFile(templatePath, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  const content = template.replace(/'2026-06-02'/g, `'${today}'`);

  await writeFile(destPath, content, 'utf8');

  console.log(`✓ Created content/${dir}/${slug}.mdx`);
  console.log(`  Edit frontmatter and body, then run \`pnpm dev\` or \`pnpm build\` to validate.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

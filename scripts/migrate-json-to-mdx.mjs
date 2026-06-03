#!/usr/bin/env node
/**
 * One-shot migration: src/data/libraries.json → content/libraries/*.mdx
 *
 * Maps the legacy v03 chapter taxonomy onto v04 categories, derives
 * slugs from titles, and preserves badge/body/tags/url verbatim.
 *
 * Skips items whose slug already exists in content/libraries/ — they
 * have been authored editorially and should win.
 *
 * Run: node scripts/migrate-json-to-mdx.mjs
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SRC = join(root, 'src/data/libraries.json');
const DEST_DIR = join(root, 'content/libraries');

const today = new Date().toISOString().slice(0, 10);

/* ── Chapter → v04 category mapping ──────────────────────── */
// Most chapters map 1:1. The "kit" chapter is heterogeneous —
// we redistribute its items based on kind heuristics.

const CHAPTER_TO_CATEGORY = {
  agents:                 'ai-agents',
  mcp:                    'mcp',
  'interface-components': 'frontend-ui',
  'interface-frameworks': 'frontend-frameworks',
  'server-db':            'backend-data',
  'server-utils':         'backend-toolkit',
  guard:                  'security',
  run:                    'devops',
  ship:                   'mobile-ai',
  trade:                  'trade-quant',
};

function categoryForKit(card) {
  const kind = (card.kind ?? '').toLowerCase();
  const tags = (card.tags ?? []).map((t) => String(t).toLowerCase());
  const all = `${kind} ${tags.join(' ')}`;
  if (all.includes('agents') || all.includes('agent')) return 'ai-agents';
  if (all.includes('mcp')) return 'mcp';
  if (all.includes('interface') || all.includes('ui')) return 'frontend-ui';
  if (all.includes('skills')) return 'ai-agents';
  if (all.includes('docs')) return 'devops';
  if (all.includes('run') || all.includes('build')) return 'devops';
  return 'ai-agents'; // default for kit items
}

/* ── Slug derivation ─────────────────────────────────────── */

function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
}

/* ── Tag derivation from kind + url + classes ────────────── */

function deriveTags(card) {
  const tags = new Set();
  const all = `${card.kind ?? ''} ${(card.tags ?? []).join(' ')} ${card.link_url ?? ''}`.toLowerCase();

  // language / runtime hints
  if (/python|fastmcp|pypi|pip\b/.test(all)) tags.add('lang:python');
  if (/typescript|\bts\b|tsx/.test(all)) tags.add('lang:typescript');
  if (/javascript|\bjs\b|npm/.test(all)) tags.add('lang:javascript');
  if (/\brust\b|cargo/.test(all)) tags.add('lang:rust');
  if (/\bgo\b|golang/.test(all)) tags.add('lang:go');
  if (/swift\b/.test(all)) tags.add('lang:swift');
  if (/kotlin/.test(all)) tags.add('lang:kotlin');
  if (/dart|flutter/.test(all)) tags.add('lang:dart');

  // distribution
  if (/oss|opensource|open-source/.test(all)) tags.add('oss');
  if (/saas/.test(all)) tags.add('saas');
  if (/selfhost|self-host/.test(all)) tags.add('selfhost');

  // freshness — items badged "Novo" → recent
  if ((card.badge ?? '').toLowerCase() === 'novo') tags.add('2026');

  // github repos are likely oss
  if ((card.link_url ?? '').includes('github.com')) tags.add('oss');

  return [...tags];
}

/* ── Difficulty heuristic ────────────────────────────────── */

function difficulty(card) {
  const badge = (card.badge ?? '').toLowerCase();
  if (badge === 'novo' || badge === 'beta' || badge === 'experimental') return 'bleeding-edge';
  if (badge === 'destaque' || badge === 'default' || badge === 'estável') return 'producao';
  return 'producao';
}

/* ── YAML frontmatter writer ─────────────────────────────── */

function yamlEscape(value) {
  if (value == null) return '';
  const str = String(value);
  // quote if contains :, #, special chars, or starts with -
  if (/[:#\n\r\t]|^-|^\s|\s$|['"]/.test(str)) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  return str;
}

function writeFrontmatter(data) {
  const lines = [];
  lines.push('---');
  lines.push(`title: ${yamlEscape(data.title)}`);
  lines.push(`summary: ${yamlEscape(data.summary)}`);
  lines.push(`url: ${yamlEscape(data.url)}`);
  if (data.repo) lines.push(`repo: ${yamlEscape(data.repo)}`);
  lines.push(`category: ${data.category}`);
  if (data.tags?.length) {
    lines.push(`tags: [${data.tags.map((t) => yamlEscape(t)).join(', ')}]`);
  }
  lines.push(`difficulty: ${data.difficulty}`);
  if (data.badge) lines.push(`badge: ${yamlEscape(data.badge)}`);
  if (data.featured) lines.push(`featured: true`);
  lines.push(`addedAt: '${data.addedAt}'`);
  lines.push('---');
  return lines.join('\n');
}

/* ── Body composer ───────────────────────────────────────── */

function composeBody(card) {
  // Strip the trailing arrow icon (→ etc) and trim
  const body = (card.body ?? '').trim();
  // If body is empty or just symbols, omit body section
  if (body.length < 20) return '';
  return `\n\n${body}\n`;
}

/* ── Main ────────────────────────────────────────────────── */

async function main() {
  const json = JSON.parse(await readFile(SRC, 'utf8'));
  const existing = new Set(
    (await readdir(DEST_DIR)).filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, '')),
  );

  let created = 0;
  let skipped = 0;
  const slugCounts = new Map();

  await mkdir(DEST_DIR, { recursive: true });

  for (const chapter of json) {
    for (const card of chapter.cards) {
      let slug = slugify(card.title);
      // disambiguate slug collisions within the migration
      const count = (slugCounts.get(slug) ?? 0) + 1;
      slugCounts.set(slug, count);
      if (count > 1) slug = `${slug}-${count}`;

      if (existing.has(slug)) {
        skipped += 1;
        continue;
      }

      const category =
        chapter.chapter === 'kit'
          ? categoryForKit(card)
          : (CHAPTER_TO_CATEGORY[chapter.chapter] ?? 'devops');

      const url = card.link_url;
      const isGithub = url.includes('github.com');

      const frontmatter = writeFrontmatter({
        title: card.title,
        summary: (card.body ?? '').slice(0, 280).trim() || card.title,
        url,
        repo: isGithub ? url : undefined,
        category,
        tags: deriveTags(card),
        difficulty: difficulty(card),
        badge: card.badge && card.badge !== 'Destaque' ? card.badge : undefined,
        featured: card.badge === 'Destaque' || (card.classes ?? '').includes('feature'),
        addedAt: today,
      });

      await writeFile(join(DEST_DIR, `${slug}.mdx`), frontmatter, 'utf8');
      created += 1;
    }
  }

  console.log(`✓ Migration complete`);
  console.log(`  Created: ${created} new MDX files`);
  console.log(`  Skipped: ${skipped} (already authored)`);
  console.log(`  Run \`npm run validate:content\` to verify.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

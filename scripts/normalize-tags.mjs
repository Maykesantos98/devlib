#!/usr/bin/env node
/**
 * One-shot tag normalizer for content/libraries/*.mdx
 *
 * Goal: replace the noisy auto-derived tags (116/146 had only "oss")
 * with a deterministic canonical set drawn from a fixed vocabulary.
 *
 * Inputs per file:
 *   - title, summary, url, category, badge
 * Output:
 *   - Replaces `tags: [...]` in the frontmatter with a sorted, de-duped,
 *     canonical list. Keeps existing curated tags that are in the vocabulary.
 *
 * Run: node scripts/normalize-tags.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const DIR = join(root, 'content/libraries');

/* ── Canonical vocabulary ────────────────────────────────── */

const CANON = new Set([
  // Languages
  'lang:typescript', 'lang:javascript', 'lang:python', 'lang:rust',
  'lang:go', 'lang:swift', 'lang:kotlin', 'lang:dart', 'lang:php',
  'lang:c++', 'lang:any',
  // Runtimes
  'runtime:node', 'runtime:bun', 'runtime:deno', 'runtime:edge',
  'runtime:browser', 'runtime:mobile', 'runtime:cli', 'runtime:desktop',
  // Distribution
  'oss', 'saas', 'freemium', 'selfhost', 'commercial',
  // License
  'license:mit', 'license:apache-2.0', 'license:agpl',
  'license:bsd', 'license:gpl',
  // Maturity
  'production-ready', 'experimental', '2026', 'well-documented',
  // Subcategory tags
  'db:postgres', 'db:sqlite', 'db:vector', 'db:redis',
  'ai:rag', 'ai:provider', 'ai:agent-framework', 'ai:on-device', 'ai:eval',
  'auth:oauth', 'auth:passwordless', 'auth:saml',
  'ui:headless', 'ui:styled', 'motion',
  'serverless', 'observability', 'security', 'rate-limit', 'waf',
  'payments', 'email', 'transactional', 'billing', 'charts', 'dashboards',
  'data', 'sast', 'sca', 'cli', 'docs',
]);

/* ── Heuristics ──────────────────────────────────────────── */

const RULES = [
  // Language hints
  { match: /\b(typescript|tsx?\b|next\.js|nuxt|astro|sveltekit|remix|drizzle|prisma|zod|trpc|biome|pnpm|bun|deno)/i, tags: ['lang:typescript'] },
  { match: /\b(javascript|node\.?js|npm|express|fastify)/i, tags: ['lang:javascript'] },
  { match: /\b(python|fastmcp|fastapi|django|pytest|pip\b|pypi|crewai|langgraph|pydantic|llama\.cpp|llama-cpp|pytorch|whisper|scrapling)/i, tags: ['lang:python'] },
  { match: /\b(rust\b|cargo|rust-lang|tauri)/i, tags: ['lang:rust'] },
  { match: /\bgo(?:lang)?\b|n8n|coolify/i, tags: ['lang:go'] },
  { match: /\bswift\b|swiftui/i, tags: ['lang:swift'] },
  { match: /\b(kotlin|jetpack|compose)/i, tags: ['lang:kotlin'] },
  { match: /\b(dart|flutter)/i, tags: ['lang:dart'] },
  { match: /\bphp\b|laravel|symfony/i, tags: ['lang:php'] },

  // Runtime hints
  { match: /\b(node|express|fastify|hono|drizzle|prisma|trpc|next\.js)/i, tags: ['runtime:node'] },
  { match: /\b(edge|cloudflare workers|vercel edge|deno deploy)/i, tags: ['runtime:edge'] },
  { match: /\b(react native|expo|flutter|swift|kotlin|cactus|executorch|mlc llm)/i, tags: ['runtime:mobile'] },
  { match: /\b(browser|spa|frontend|three\.?js|tailwind|shadcn|magic.?ui|aceternity|reui|heroui|framer)/i, tags: ['runtime:browser'] },
  { match: /\b(cli|terminal|command.line)/i, tags: ['runtime:cli'] },
  { match: /\b(tauri|electron|desktop)/i, tags: ['runtime:desktop'] },

  // Distribution
  { match: /github\.com|gitlab\.com|gitea/i, tags: ['oss'] },
  { match: /\b(open.source|mit licen|apache.licen|free.software)/i, tags: ['oss'] },
  { match: /\b(self.host|selfhost)/i, tags: ['selfhost'] },
  { match: /\b(saas|hosted|cloud platform)/i, tags: ['saas'] },
  { match: /\b(freemium|free tier|plano gratuito)/i, tags: ['freemium'] },
  { match: /\b(stripe|polar|paddle|lemonsqueezy|asaas|pagar.me)/i, tags: ['payments', 'commercial'] },

  // AI subcategories
  { match: /\b(llm|gpt|claude|gemini|llama|mistral|qwen|gemma|phi-?\d)/i, tags: ['ai:provider'] },
  { match: /\b(agent|crewai|langgraph|autogen|pydanticai|mastra|agno|swarm)/i, tags: ['ai:agent-framework'] },
  { match: /\b(rag|vector|embedding|retrieval)/i, tags: ['ai:rag'] },
  { match: /\b(on.device|edge.ai|executorch|mlc|mediapipe|cactus|whisper.cpp)/i, tags: ['ai:on-device'] },
  { match: /\b(eval|benchmark|guardrails|llm guard|garak|nemo)/i, tags: ['ai:eval'] },

  // Database
  { match: /\b(postgres|postgresql|neon|supabase)/i, tags: ['db:postgres'] },
  { match: /\b(sqlite|turso|libsql)/i, tags: ['db:sqlite'] },
  { match: /\b(redis|upstash|valkey)/i, tags: ['db:redis'] },
  { match: /\b(vector|embedding|pgvector|chroma|qdrant|pinecone)/i, tags: ['db:vector'] },

  // Auth
  { match: /\b(oauth|sso|openid)/i, tags: ['auth:oauth'] },
  { match: /\b(passwordless|passkey|magic.link|webauthn)/i, tags: ['auth:passwordless'] },
  { match: /\b(saml|enterprise sso)/i, tags: ['auth:saml'] },

  // UI
  { match: /\b(headless|primitives|radix|tanstack)/i, tags: ['ui:headless'] },
  { match: /\b(design system|component library|kit visual|tailwind)/i, tags: ['ui:styled'] },
  { match: /\b(motion|anima|gsap|framer|lottie|three\.?js)/i, tags: ['motion'] },

  // Categories of utility
  { match: /\b(observabil|monitor|tracing|sentry|grafana|datadog|posthog|opentelemetry)/i, tags: ['observability'] },
  { match: /\b(security|auth|authn|authz|csrf|xss|owasp|cve|secrets?|vault|appsec)/i, tags: ['security'] },
  { match: /\b(rate limit|throttle|arcjet|upstash)/i, tags: ['rate-limit'] },
  { match: /\b(waf|firewall|shield)/i, tags: ['waf'] },
  { match: /\b(email|resend|mailgun|sendgrid|postmark|brevo)/i, tags: ['email', 'transactional'] },
  { match: /\b(charts?|grafico|visualiz|recharts|tremor|echarts|nivo)/i, tags: ['charts'] },
  { match: /\b(dashboard|kpi|metrics)/i, tags: ['dashboards'] },
  { match: /\b(serverless|lambda|edge function|workers)/i, tags: ['serverless'] },
  { match: /\b(sast|static analysis|code scan)/i, tags: ['sast'] },
  { match: /\b(sca|dependency|cve|snyk|dependabot|trivy|aikido|gitleaks|trufflehog)/i, tags: ['sca'] },
  { match: /\b(docs|documentation|context7|api reference)/i, tags: ['docs'] },
  { match: /\b(cli|terminal|command|llama\.cpp)/i, tags: ['cli'] },
];

/* ── Maturity heuristic ──────────────────────────────────── */

const RECENT_PROJECTS = new Set([
  'claude-code', 'cline', 'goose', 'openhands', 'aider',
  'claude-mem', 'superpowers', 'crewai', 'agno', 'mastra',
  'fastmcp', 'mcp-inspector', 'playwright-mcp', 'composio',
  'arcjet', 'better-auth', 'ai-sdk', 'ai-gateway',
  'executorch', 'mlc-llm', 'cactus', 'react-native-executorch',
  'magic-ui', 'aceternity-ui', 'reui', 'heroui', 'shadcn-ui',
  'shadcn-blocks', 'eldora-ui', 'cult-ui', 'skiper-ui', 'square-ui',
  '21st-dev', 'mobbin', 'turborepo', 'biome', 'bun',
  'ali-imam-components', 'liquid-metal', 'dot-matrix', 'uiverse',
  'balloons-js', 'react-native-ai', 'webapp-testing',
  'tradingagents', 'ai-trader', 'agentictrading', 'freqtrade',
  'awesome-ai-in-finance', 'bybit-exchange-skills',
  'flutter', 'react-native',
]);

const PRODUCTION_PROJECTS = new Set([
  'nextjs', 'next-js', 'astro', 'sveltekit', 'remix', 'vite',
  'react', 'react-native', 'flutter', 'tailwind-css',
  'drizzle', 'drizzle-orm', 'prisma-orm', 'kysely', 'zod',
  'postgres', 'supabase', 'neon', 'turso', 'mongodb', 'pocketbase',
  'appwrite', 'firebase', 'redis', 'pgvector',
  'stripe', 'resend', 'better-auth', 'auth-js', 'clerk',
  'sentry', 'grafana', 'plausible-analytics', 'opentelemetry-js',
  'playwright', 'vitest', 'storybook',
  'three-js', 'framer-motion', 'shadcn-ui', 'tanstack-table',
  'tanstack-query', 'hono', 'fastify', 'trpc', 'recharts', 'tremor',
  'expo', 'capacitor',
]);

/* ── Frontmatter helpers ─────────────────────────────────── */

function getField(text, key) {
  const re = new RegExp(`^${key}:\\s*(.*?)$`, 'm');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function getTagsLine(text) {
  return text.match(/^tags:\s*\[(.*?)\]/m);
}

function deriveTags(file, lib) {
  const slug = file.replace(/\.mdx$/, '');
  const haystack = [lib.title, lib.summary, lib.url, lib.category, lib.badge]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const out = new Set();

  for (const rule of RULES) {
    if (rule.match.test(haystack)) {
      for (const t of rule.tags) out.add(t);
    }
  }

  // Always add 'oss' for github-hosted libs
  if ((lib.url ?? '').includes('github.com')) out.add('oss');

  // Maturity by lookup
  if (RECENT_PROJECTS.has(slug)) {
    out.add('2026');
  }
  if (PRODUCTION_PROJECTS.has(slug)) {
    out.add('production-ready');
  }

  // Filter to canonical vocabulary
  return [...out].filter((t) => CANON.has(t)).sort();
}

/* ── Apply ───────────────────────────────────────────────── */

function formatTagList(tags) {
  return `tags: [${tags.join(', ')}]`;
}

async function main() {
  const files = (await readdir(DIR))
    .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'));

  let changed = 0;
  let unchanged = 0;
  const stats = new Map();

  for (const file of files) {
    const path = join(DIR, file);
    const src = await readFile(path, 'utf8');

    const lib = {
      title: getField(src, 'title'),
      summary: getField(src, 'summary'),
      url: getField(src, 'url').replace(/^['"]|['"]$/g, ''),
      category: getField(src, 'category'),
      badge: getField(src, 'badge'),
    };

    const tags = deriveTags(file, lib);
    for (const t of tags) stats.set(t, (stats.get(t) ?? 0) + 1);

    const tagsLine = getTagsLine(src);
    const next = formatTagList(tags);
    const updated = tagsLine ? src.replace(tagsLine[0], next) : src;

    if (updated !== src) {
      await writeFile(path, updated, 'utf8');
      changed += 1;
    } else {
      unchanged += 1;
    }
  }

  console.log(`✓ tags normalized: ${changed} changed, ${unchanged} unchanged`);
  console.log(`\nTag histogram:`);
  for (const [t, c] of [...stats].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(c).padStart(4)}  ${t}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

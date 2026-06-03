# DEVLIB v04 — Taxonomia

> Modelo de classificação para o acervo, receitas e guias.
> Fonte de verdade para schemas Zod e telas de filtro.

## Princípio de design

Dev descobre conteúdo de **três jeitos diferentes**:

1. **"Quero algo da categoria X"** → eixo Categoria
2. **"Quero fazer Y"** → eixo Recipe (receita por objetivo)
3. **"Quero algo que use Z"** → eixo Tags (livres, runtime/linguagem/licença)

Mais um eixo transversal:

4. **Difficulty** — quão pronto para produção é

Itens podem aparecer em múltiplos eixos. Um item sempre tem **exatamente uma** categoria primária, mas pode estar em N receitas e ter N tags.

---

## Eixo 1 · Categorias (taxonomia primária)

Refinamento do que já existe. Cada item pertence a exatamente uma.

| ID | Nome | Descrição curta |
|---|---|---|
| `ai-agents` | AI Agents | Frameworks, SDKs e runtimes para construir agentes |
| `mcp` | Model Context Protocol | Servidores MCP, ferramentas, clientes |
| `frontend-ui` | Frontend UI | Componentes, design systems, blocos visuais |
| `frontend-frameworks` | Frontend Frameworks | Build tools, runtimes web, 3D, motion |
| `backend-data` | Backend (Data) | Bancos, BaaS, caches, filas |
| `backend-toolkit` | Backend (Toolkit) | ORMs, validators, auth, RPC |
| `mobile-ai` | Mobile & On-device AI | React Native, Expo, ExecuTorch, MLC |
| `security` | Segurança | Auth, appsec, scanners, guardrails |
| `devops` | DevOps & Build | Build, deploy, observability, CI |
| `trade-quant` | Trade & Quant | Agentes financeiros, backtesting, dados |

**Migração do atual:**

| v03 chapter | v04 categoria |
|---|---|
| `kit` | distribuído (a maioria vira "fundação", ver tag `kit`) |
| `agents` | `ai-agents` |
| `mcp` | `mcp` |
| `interface-components` | `frontend-ui` |
| `interface-frameworks` | `frontend-frameworks` |
| `server-db` | `backend-data` |
| `server-utils` | `backend-toolkit` |
| `guard` | `security` |
| `run` | `devops` |
| `ship` | `mobile-ai` |
| `trade` | `trade-quant` |

---

## Eixo 2 · Recipes (por objetivo) — NOVO

Curado: cada Recipe = página com stack final + setup + alternativas + gotchas + repo template (quando existir).

| ID | Nome | Para quem |
|---|---|---|
| `launch-saas-2026` | 🚀 Lançar um SaaS em 2026 | Quem vai criar produto B2B/B2C do zero |
| `build-ai-agent` | 🤖 Construir um agente com IA | Quem vai integrar LLM com tools |
| `security-stack` | 🔒 Stack de segurança em produção | Quem está prestes a abrir ao público |
| `mobile-on-device-ai` | 📱 App mobile com IA on-device | Quem precisa de IA sem servidor |
| `ecommerce-modern` | 🛒 E-commerce moderno | Quem quer alternativa ao Shopify |
| `portfolio-landing` | 🎨 Portfólio / Landing | Quem quer presença visual rápida |
| `dashboard-analytics` | 📊 Dashboard / Analytics | Quem vai mostrar dados |
| `interactive-sites` | 🎮 Sites interativos / Jogos | Quem quer experiências ricas |

**Sprint 4 entrega 6 das 8** (`ecommerce-modern` e `interactive-sites` ficam para um próximo ciclo).

---

## Eixo 3 · Tags (livres, controladas)

Vocabulário curto e estável. Mostradas como chips no card e como filtros secundários.

### Runtime / Linguagem

`lang:typescript`, `lang:javascript`, `lang:python`, `lang:rust`, `lang:go`, `lang:swift`, `lang:kotlin`, `lang:dart`

`runtime:node`, `runtime:bun`, `runtime:deno`, `runtime:edge`, `runtime:browser`, `runtime:mobile`

### Modelo de distribuição

`oss` (open source), `commercial`, `freemium`, `selfhost`, `saas`

### Licença

`license:mit`, `license:apache-2.0`, `license:agpl`, `license:proprietary`

### Atributos de qualidade

`production-ready`, `experimental`, `2026`, `well-documented`, `active`, `archived`

### Categoria fina (subcategoria)

`db:postgres`, `db:sqlite`, `db:vector`, `auth:oauth`, `auth:passwordless`, `ui:headless`, `ui:styled`, `ai:rag`, `ai:agent-framework`, `ai:provider`

---

## Eixo 4 · Difficulty

| Valor | Quando usar |
|---|---|
| `iniciante` | Setup simples, doc didática, comunidade abundante |
| `producao` | Default — pronto para uso sério |
| `bleeding-edge` | API instável, pode mudar, vale como aposta |

---

## Schema de dados (preview do Sprint 2)

```ts
// lib/schema.ts (Sprint 2 vai implementar)
import { z } from 'zod';

export const CategoryId = z.enum([
  'ai-agents', 'mcp', 'frontend-ui', 'frontend-frameworks',
  'backend-data', 'backend-toolkit', 'mobile-ai',
  'security', 'devops', 'trade-quant',
]);

export const Difficulty = z.enum(['iniciante', 'producao', 'bleeding-edge']);

export const LibrarySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(80),
  summary: z.string().min(20).max(280),
  body: z.string().optional(),         // MDX longo opcional
  url: z.string().url(),
  repo: z.string().url().optional(),
  category: CategoryId,
  tags: z.array(z.string()).default([]),
  difficulty: Difficulty.default('producao'),
  badge: z.string().max(20).optional(),
  featured: z.boolean().default(false),
  recipes: z.array(z.string()).default([]),
  addedAt: z.string().date(),          // ISO YYYY-MM-DD
});

export const RecipeSchema = z.object({
  slug: z.string(),
  title: z.string(),
  goal: z.string(),                    // "Lançar SaaS em 2026"
  emoji: z.string().optional(),
  stack: z.array(z.object({
    library: z.string(),               // slug da library
    role: z.string(),                  // "ORM", "Auth", "Pagamentos"
    note: z.string().optional(),
  })),
  setup: z.string(),                   // MDX
  alternatives: z.string().optional(),
  gotchas: z.string().optional(),
  templateRepo: z.string().url().optional(),
});

export const GuideSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),                    // MDX
  category: CategoryId.optional(),
  relatedRecipes: z.array(z.string()).default([]),
  relatedLibraries: z.array(z.string()).default([]),
  publishedAt: z.string().date(),
  updatedAt: z.string().date().optional(),
  readingMinutes: z.number().int().min(1),
});
```

---

## Guias planejados (Sprint 5)

1. **Como escolher stack para um SaaS em 2026** — decisão por critério (escala, custo, time)
2. **Setup mínimo de segurança em produção** — checklist + libs essenciais
3. **Construindo o primeiro agente com MCP — fim a fim** — passo a passo
4. **ORM em 2026: Drizzle vs Prisma vs Kysely** — comparativo prático
5. **Auth moderna: Better Auth, Clerk, Auth.js** — qual usar e por quê
6. **Edge vs Serverless vs Node** — quando usar cada
7. **Stack mobile com IA on-device** — Expo + ExecuTorch + MLC
8. **Observability básica** — Sentry + PostHog + Vercel Analytics

---

## Receitas planejadas (Sprint 4)

1. **🚀 SaaS 2026** — Next/Vite + Drizzle + Neon + Better Auth + Stripe + Resend
2. **🤖 AI Agent Production** — AI SDK v6 + AI Gateway + LangSmith + Guardrails
3. **🔒 Security Checklist** — Better Auth + Arcjet + Snyk + Helmet
4. **📱 Mobile On-device AI** — Expo + RN ExecuTorch + MLC LLM
5. **🎨 Landing / Portfólio** — Vite + shadcn + Magic UI + Framer Motion
6. **📊 Dashboard / Analytics** — Vite + TanStack Table + Recharts + Tremor

---

## Decisões abertas

- **Slugs:** kebab-case ASCII. Sem acento, sem espaço. Permanente — slug é a chave canônica.
- **Renomear item:** título pode mudar, slug não. Para casos extremos, redirect 301 (Sprint 3).
- **Item em duas categorias?** Não. Categoria primária é única. Use tags ou `recipes` para múltiplo pertencimento.
- **Estrelas/contagens:** não incluídas no schema v04 — manutenção manual é fonte de erro. Pode entrar via build-time scrape do GitHub depois.

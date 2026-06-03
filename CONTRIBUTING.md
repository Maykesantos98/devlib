# Contribuindo para o DEVLIB

Obrigado pelo interesse. O DEVLIB é um acervo editorial curado — qualidade > quantidade.

## Tipos de contribuição

| Tipo | O que fazer | Esforço |
|---|---|---|
| **Sugerir biblioteca** | Issue com link + 1 parágrafo de por que entra | 5 min |
| **Adicionar biblioteca** | PR com 1 arquivo MDX | 15 min |
| **Sugerir receita** | Issue com objetivo + stack proposta | 15 min |
| **Escrever guia** | PR com 1 arquivo MDX (mín. 600 palavras) | 1-3 h |
| **Corrigir conteúdo** | PR direto, sem issue prévia | 5 min |

## Padrões

- **Tom editorial**: direto, técnico, sem hype. Evite "revolucionário", "game-changer", "AI-powered".
- **Trade-offs explícitos**: toda escolha tem custo. Liste o custo.
- **Comparação com alternativas**: se existem 3 ferramentas para a mesma função, cite 2 + por que esta venceu.
- **Sem links afiliados** — DEVLIB é independente.
- **Tudo em português (BR)**.

## Como adicionar uma biblioteca

### 1. Scaffold

```bash
pnpm new:library nome-da-lib
# cria content/libraries/nome-da-lib.mdx a partir do template
```

### 2. Preencha o frontmatter

Campos obrigatórios: `title`, `summary`, `url`, `category`, `addedAt`.

Categorias válidas (ver [docs/taxonomy.md](docs/taxonomy.md)):

`ai-agents`, `mcp`, `frontend-ui`, `frontend-frameworks`, `backend-data`,
`backend-toolkit`, `mobile-ai`, `security`, `devops`, `trade-quant`.

### 3. Escreva o corpo (opcional, mas recomendado)

Seções padrão:

- **Por que escolher** — 3-5 bullets
- **Cuidados** — 2-3 bullets com limitações reais
- **Alternativas** (opcional) — comparação com 2-3 concorrentes próximas

### 4. Valide

```bash
pnpm validate:content
pnpm build
```

Tudo precisa passar antes do PR.

### 5. PR

Title: `add lib: NomeDaLib`.
Description: link + 1 frase do porquê de entrar no acervo.

## Como adicionar uma receita

Receita = stack pronta para um objetivo. Cada peça deve apontar para uma biblioteca **já existente** no acervo (adicione antes se faltar).

```bash
pnpm new:recipe nome-da-receita
```

Estrutura mínima do corpo:

- **Setup em N passos** — código real, executável
- **Alternativas** — quando preferir outras stacks
- **Gotchas** — armadilhas não óbvias

## Como adicionar um guia

```bash
pnpm new:guide titulo-do-guia
```

Bom guia:

- Resolve uma decisão concreta (ex: "Drizzle vs Prisma")
- Tem trade-offs **explícitos**
- Inclui pelo menos 1 tabela comparativa
- Mín. 600 palavras, ideal 1000-1500

Não-guias:

- Tutorial passo-a-passo (vai pra Receita)
- Lista de links (Awesome-style — DEVLIB já é isso)
- Opinião sem trade-off

## Estrutura do conteúdo

```
content/
├── libraries/        # 1 arquivo .mdx por biblioteca
│   ├── _template.mdx
│   └── *.mdx
├── recipes/          # 1 arquivo .mdx por receita
│   ├── _template.mdx
│   └── *.mdx
└── guides/           # 1 arquivo .mdx por guia
    ├── _template.mdx
    └── *.mdx
```

Slugs:
- kebab-case ASCII (`drizzle`, `next.js`, `better-auth`)
- **Permanente** — nunca renomeie. Título pode mudar, slug não.

## Validação automática

CI roda:

- `validate:content` — todos os MDX passam Zod
- `build` — Vite + TS sem erro
- Link check em URLs externos (TODO Sprint 8)

PRs com falha em CI não são revisados até passarem.

## Estilo de escrita

- **Frase curta**. Pontos cortantes.
- **Sem "Em conclusão", "Em resumo"** — vá direto.
- **Listas paralelas** — não misture estrutura entre bullets.
- **Code blocks** com linguagem (` ```ts `, ` ```bash `).
- **Tabelas** quando comparação > 3 dimensões.
- **Emojis** com moderação (só nas Receitas, no eyebrow).

## Código de conduta

Profissional, técnico, gentil. Sem ataques pessoais. Sem flame war de tooling — se você precisa convencer alguém de Vim vs Emacs, este não é o lugar.

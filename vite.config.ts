import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve, relative } from 'node:path'
import yaml from 'js-yaml'

const SITE_URL = process.env.SITE_URL || 'https://devlib.dev'

/**
 * Virtual module that loads ALL MDX frontmatter + body at dev/build time.
 * Avoids the conflict between `?raw` queries and the MDX plugin (which
 * intercepts .mdx files regardless of query string).
 */
function contentFrontmatter(): Plugin {
  const VIRTUAL_ID = 'virtual:content-frontmatter'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
  const kinds = ['libraries', 'recipes', 'guides'] as const

  return {
    name: 'content-frontmatter',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null

      const root = resolve(__dirname)
      const result: Record<string, unknown[]> = {}

      for (const kind of kinds) {
        result[kind] = []
        const dir = join(root, 'content', kind)
        let files: string[] = []
        try {
          files = await readdir(dir)
        } catch {
          continue
        }
        for (const file of files) {
          if (!file.endsWith('.mdx') || file.startsWith('_')) continue
          const source = await readFile(join(dir, file), 'utf8')
          const match = source.match(FRONTMATTER_RE)
          if (!match) continue
          const data = (yaml.load(match[1]) ?? {}) as Record<string, unknown>
          // YAML can parse bare values like 2026 as numbers — force tag strings.
          if (Array.isArray(data.tags)) {
            data.tags = data.tags.map((t) => String(t))
          }
          const slug = file.replace(/\.mdx$/, '')
          result[kind].push({ ...data, slug, body: match[2].trim() })
        }
      }

      return `export default ${JSON.stringify(result)}`
    },

    handleHotUpdate({ file, server }) {
      const rel = relative(__dirname, file).replace(/\\/g, '/')
      if (rel.startsWith('content/') && rel.endsWith('.mdx')) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
    },
  }
}

/**
 * Emits sitemap.xml and robots.txt into dist/ during build.
 * Routes are derived from the same MDX content used by the app — there is
 * no separate route list to keep in sync.
 */
function sitemapAndRobots(): Plugin {
  return {
    name: 'sitemap-and-robots',
    apply: 'build',
    async writeBundle(options) {
      const outDir = options.dir ?? resolve(__dirname, 'dist')
      await mkdir(outDir, { recursive: true })
      const today = new Date().toISOString().slice(0, 10)

      const collect = async (subdir: string): Promise<string[]> => {
        const dir = join(__dirname, 'content', subdir)
        try {
          const files = await readdir(dir)
          return files
            .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'))
            .map((f) => f.replace(/\.mdx$/, ''))
        } catch {
          return []
        }
      }

      const libs = await collect('libraries')
      const recipes = await collect('recipes')
      const guides = await collect('guides')
      const categories = [
        'ai-agents', 'mcp', 'frontend-ui', 'frontend-frameworks',
        'backend-data', 'backend-toolkit', 'mobile-ai',
        'security', 'devops', 'trade-quant',
      ]

      const routes = [
        { path: '/',          priority: '1.0' },
        { path: '/receitas',  priority: '0.9' },
        { path: '/guias',     priority: '0.9' },
        ...categories.map((c) => ({ path: `/categoria/${c}`, priority: '0.8' })),
        ...recipes.map((s) => ({ path: `/receita/${s}`,      priority: '0.7' })),
        ...guides.map((s) => ({ path: `/guia/${s}`,          priority: '0.7' })),
        ...libs.map((s) => ({ path: `/biblioteca/${s}`,      priority: '0.5' })),
      ]

      const sitemap =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        routes
          .map((r) =>
            `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${r.priority}</priority>\n  </url>`,
          )
          .join('\n') +
        `\n</urlset>\n`

      await writeFile(join(outDir, 'sitemap.xml'), sitemap, 'utf8')

      const robots =
        `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
      await writeFile(join(outDir, 'robots.txt'), robots, 'utf8')

      // eslint-disable-next-line no-console
      console.log(`✓ sitemap.xml: ${routes.length} URLs · robots.txt emitted`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    contentFrontmatter(),
    sitemapAndRobots(),
    // MDX runs BEFORE react so JSX inside .mdx is transformed first.
    // remarkFrontmatter makes MDX skip YAML frontmatter blocks.
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter],
      }),
    },
    react({ include: /\.(mdx?|jsx?|tsx?)$/ }),
  ],
})

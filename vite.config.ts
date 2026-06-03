import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve, relative } from 'node:path'
import yaml from 'js-yaml'

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    contentFrontmatter(),
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

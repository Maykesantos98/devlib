import { Link, useSearchParams } from 'react-router-dom';
import { findLibrary, libraries } from '../lib/content';
import { categoryMeta } from '../lib/schema';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { CategoryIcon } from '../components/IconSystem';

/**
 * Side-by-side comparison page.
 *
 * Usage: /comparar?slugs=drizzle,prisma-orm,kysely
 *  - 2 to 4 libraries
 *  - Shows: title, summary, category, badge, difficulty, tags, URL
 *  - When a slug doesn't exist, the column is rendered as a faded
 *    placeholder so the URL stays diff-able.
 */
export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const requested = (params.get('slugs') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const items = requested.slice(0, 4).map((slug) => ({ slug, lib: findLibrary(slug) }));

  // If no slugs requested, show a quick picker hint.
  if (items.length === 0) {
    return (
      <PageShell>
        <Seo title="Comparar bibliotecas" description="Compare 2 a 4 bibliotecas lado a lado." />
        <section className="shell" style={{ paddingTop: '4rem', maxWidth: '780px' }}>
          <span className="section-eyebrow">— Comparar</span>
          <h1 className="section-title">Coloque <em>lado a lado.</em></h1>
          <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>
            Use <code>?slugs=</code> separados por vírgula. Exemplo:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem', display: 'grid', gap: '0.6rem' }}>
            {[
              { slugs: 'drizzle,prisma-orm', label: 'Drizzle vs Prisma' },
              { slugs: 'nextjs,astro,sveltekit', label: 'Next.js vs Astro vs SvelteKit (se existirem)' },
              { slugs: 'better-auth,clerk', label: 'Better Auth vs Clerk' },
              { slugs: 'ollama,llama-cpp', label: 'Ollama vs llama.cpp' },
              { slugs: 'sentry,grafana', label: 'Sentry vs Grafana' },
            ].map((ex) => (
              <li key={ex.slugs}>
                <Link
                  to={`/comparar?slugs=${ex.slugs}`}
                  style={{
                    display: 'inline-flex',
                    gap: '0.6rem',
                    padding: '0.7rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>→</span>
                  {ex.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageShell>
    );
  }

  const removeSlug = (slug: string) => {
    const next = items.map((i) => i.slug).filter((s) => s !== slug).join(',');
    if (next) setParams({ slugs: next });
    else setParams({});
  };

  const valid = items.filter((i): i is { slug: string; lib: NonNullable<typeof i.lib> } => Boolean(i.lib));

  return (
    <PageShell>
      <Seo
        title={`Comparar — ${valid.map((i) => i.lib.title).join(' vs ')}`}
        description={`Compare lado a lado: ${valid.map((i) => i.lib.title).join(', ')}.`}
        canonical={`/comparar?slugs=${items.map((i) => i.slug).join(',')}`}
      />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-soft)' }}>Acervo</Link>
          <span style={{ color: 'var(--text-dim)' }}> / </span>
          <Link to="/comparar" style={{ color: 'var(--text-soft)' }}>Comparar</Link>
        </nav>

        <span className="section-eyebrow">— Comparar</span>
        <h1 className="section-title">{valid.map((i) => i.lib.title).join(' vs ')}</h1>
        <p className="section-desc">Tabela curada das diferenças visíveis no frontmatter.</p>

        <div className="compare-grid">
          {items.map(({ slug, lib }) => (
            <div key={slug} className={`compare-col ${lib ? '' : 'compare-col-missing'}`}>
              <header className="compare-col-head">
                {lib ? (
                  <Link to={`/biblioteca/${lib.slug}`} className="compare-col-title">
                    {lib.title}
                  </Link>
                ) : (
                  <span className="compare-col-title">{slug}</span>
                )}
                <button
                  type="button"
                  className="compare-col-remove"
                  onClick={() => removeSlug(slug)}
                  aria-label={`Remover ${slug} da comparação`}
                  title="Remover da comparação"
                >
                  ×
                </button>
              </header>

              {lib ? (
                <dl className="compare-dl">
                  <dt>Categoria</dt>
                  <dd>
                    <Link to={`/categoria/${lib.category}`}>
                      <span className="inline-icon-label">
                        <CategoryIcon id={lib.category} className="ui-icon" />
                        {categoryMeta(lib.category).name}
                      </span>
                    </Link>
                  </dd>

                  <dt>Resumo</dt>
                  <dd>{lib.summary}</dd>

                  <dt>Badge</dt>
                  <dd>{lib.badge ?? <span className="compare-dim">—</span>}</dd>

                  <dt>Nível</dt>
                  <dd><code>{lib.difficulty}</code></dd>

                  <dt>Tags</dt>
                  <dd>
                    {lib.tags.length > 0 ? (
                      <div className="compare-tags">
                        {lib.tags.map((t) => <span key={t}>{t}</span>)}
                      </div>
                    ) : <span className="compare-dim">—</span>}
                  </dd>

                  <dt>Adicionado em</dt>
                  <dd><code>{lib.addedAt}</code></dd>

                  <dt>URL</dt>
                  <dd>
                    <a href={lib.url} target="_blank" rel="noopener noreferrer">
                      {lib.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </dd>

                  {lib.repo && (
                    <>
                      <dt>Repositório</dt>
                      <dd>
                        <a href={lib.repo} target="_blank" rel="noopener noreferrer">
                          {lib.repo.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </dd>
                    </>
                  )}

                  {lib.recipes.length > 0 && (
                    <>
                      <dt>Receitas</dt>
                      <dd>
                        <ul className="compare-list">
                          {lib.recipes.map((r) => (
                            <li key={r}><Link to={`/receita/${r}`}>{r}</Link></li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                </dl>
              ) : (
                <div className="empty" style={{ padding: '1.5rem' }}>
                  <b>Não encontrada.</b>
                  <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-soft)' }}>
                    O slug <code>{slug}</code> não existe no acervo.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {valid.length < 4 && (
          <details className="compare-add" style={{ marginTop: '2rem' }}>
            <summary>+ Adicionar outra biblioteca</summary>
            <div className="compare-add-grid">
              {libraries
                .filter((l) => !items.some((i) => i.slug === l.slug))
                .slice(0, 30)
                .map((l) => {
                  const next = [...items.map((i) => i.slug), l.slug].join(',');
                  return (
                    <Link key={l.slug} to={`/comparar?slugs=${next}`} className="compare-add-item">
                      {l.title}
                    </Link>
                  );
                })}
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
              Mostrando 30 primeiras. Use ⌘K para buscar e copiar slug.
            </p>
          </details>
        )}
      </section>
    </PageShell>
  );
}

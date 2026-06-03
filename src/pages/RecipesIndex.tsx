import { Link } from 'react-router-dom';
import { recipes } from '../lib/content';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';

export default function RecipesIndex() {
  const sorted = [...recipes].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <PageShell>
      <Seo
        title="Receitas — stacks prontas por objetivo"
        description="Receitas curadas: stack + setup + alternativas para SaaS, agentes, mobile, dashboards e mais."
        canonical="/receitas"
      />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <span className="section-eyebrow">— Receitas</span>
        <h1 className="section-title">Stacks <em>por objetivo.</em></h1>
        <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>
          Em vez de escolher peça por peça, comece por uma receita pronta. Cada uma cobre escolhas técnicas para um objetivo concreto.
        </p>

        {sorted.length === 0 ? (
          <div className="empty" style={{ marginTop: '3rem' }}>
            <b>Receitas a caminho.</b>
            <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-soft)' }}>
              6 receitas iniciais serão publicadas no Sprint 4.
            </span>
          </div>
        ) : (
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: '1.25rem',
            marginTop: '3rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}>
            {sorted.map((r) => (
              <li key={r.slug}>
                <Link to={`/receita/${r.slug}`} style={{
                  display: 'block',
                  padding: '1.5rem',
                  border: '1px solid var(--border-bright)',
                  borderRadius: '16px',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  background: 'var(--bg-card)',
                  height: '100%',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{r.emoji ?? '📘'}</div>
                  <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{r.title}</h2>
                  <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>{r.summary}</p>
                  <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {r.stack.length} peças na stack
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

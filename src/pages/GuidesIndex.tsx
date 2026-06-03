import { Link } from 'react-router-dom';
import { guides, GUIDE_SERIES, guidesInSeries } from '../lib/content';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';

export default function GuidesIndex() {
  const standalone = [...guides]
    .filter((g) => !g.series)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const seriesWithItems = GUIDE_SERIES
    .map((s) => ({ meta: s, items: guidesInSeries(s.id) }))
    .filter(({ items }) => items.length > 0);

  return (
    <PageShell>
      <Seo
        title="Guias — artigos editoriais"
        description="Guias práticos sobre stacks, segurança, agentes, ORM, auth, edge e observability."
        canonical="/guias"
      />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <span className="section-eyebrow">— Guias</span>
        <h1 className="section-title">Decisões <em>com contexto.</em></h1>
        <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>
          Artigos curtos com trade-offs explícitos. Para quando a documentação oficial é completa mas não te ajuda a escolher.
        </p>

        {/* H · Reading paths (series) */}
        {seriesWithItems.length > 0 && (
          <section style={{ marginTop: '3rem' }}>
            <span className="section-eyebrow">— Caminhos de leitura</span>
            <h2 className="section-title" style={{ fontSize: 'var(--t-h4)' }}>
              Sequências <em>na ordem certa.</em>
            </h2>

            <div className="series-grid">
              {seriesWithItems.map(({ meta, items }) => (
                <article key={meta.id} className="series-card">
                  <header className="series-card-head">
                    <span className="series-card-emoji" aria-hidden="true">{meta.emoji}</span>
                    <div>
                      <h3 className="series-card-title">{meta.title}</h3>
                      <p className="series-card-desc">{meta.description}</p>
                    </div>
                  </header>
                  <ol className="series-list">
                    {items.map((g, idx) => (
                      <li key={g.slug}>
                        <Link to={`/guia/${g.slug}`} className="series-item">
                          <span className="series-item-num">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="series-item-body">
                            <strong>{g.title}</strong>
                            <span>{g.readingMinutes} min</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Standalone guides */}
        {standalone.length > 0 && (
          <section style={{ marginTop: '4rem' }}>
            <span className="section-eyebrow">— Outros guias</span>
            <h2 className="section-title" style={{ fontSize: 'var(--t-h4)' }}>
              Artigos <em>independentes.</em>
            </h2>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'grid', gap: '1.25rem' }}>
              {standalone.map((g) => (
                <li key={g.slug}>
                  <Link to={`/guia/${g.slug}`} style={{
                    display: 'block',
                    padding: '1.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    background: 'var(--bg-card)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.2rem' }}>{g.title}</h3>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {g.publishedAt} · {g.readingMinutes} min
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-soft)', fontSize: '0.95rem', marginTop: '0.75rem' }}>
                      {g.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {standalone.length === 0 && seriesWithItems.length === 0 && (
          <div className="empty" style={{ marginTop: '3rem' }}>
            <b>Guias a caminho.</b>
          </div>
        )}
      </section>
    </PageShell>
  );
}

import { Link } from 'react-router-dom';
import { guides } from '../lib/content';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';

export default function GuidesIndex() {
  const sorted = [...guides].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

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

        {sorted.length === 0 ? (
          <div className="empty" style={{ marginTop: '3rem' }}>
            <b>Guias a caminho.</b>
            <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-soft)' }}>
              8 guias iniciais serão publicados no Sprint 5.
            </span>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '3rem', display: 'grid', gap: '1.25rem' }}>
            {sorted.map((g) => (
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
                    <h2 style={{ fontSize: '1.2rem' }}>{g.title}</h2>
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
        )}
      </section>
    </PageShell>
  );
}

import { Link } from 'react-router-dom';
import { guides } from '../../lib/content';

export function LatestGuides() {
  if (guides.length === 0) return null;

  const latest = [...guides]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4);

  return (
    <section className="shell" id="guias-recentes" style={{ marginTop: '4rem' }}>
      <span className="section-eyebrow">— Guias</span>
      <h2 className="section-title" style={{ fontSize: 'var(--t-h2)' }}>
        Decisões <em>com contexto.</em>
      </h2>
      <p className="section-desc">
        Artigos curtos sobre escolhas de stack, segurança, auth, ORM, edge — quando a documentação oficial é completa mas não te ajuda a escolher.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem', display: 'grid', gap: '0.75rem' }}>
        {latest.map((g) => (
          <li key={g.slug}>
            <Link to={`/guia/${g.slug}`} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1rem',
              alignItems: 'baseline',
              padding: '1rem 1.25rem',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: 'var(--text)',
              textDecoration: 'none',
              background: 'var(--bg-card)',
              transition: 'border-color var(--dur-fast) var(--ease)',
            }}>
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>{g.title}</strong>
                <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem', display: 'block', marginTop: '0.3rem' }}>
                  {g.summary}
                </span>
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                {g.readingMinutes} min
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <Link to="/guias" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
          Ver todos os guias →
        </Link>
      </p>
    </section>
  );
}

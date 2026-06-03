import { useParams, Link, Navigate } from 'react-router-dom';
import { libraries } from '../lib/content';
import { CATEGORIES, CategoryId, categoryMeta } from '../lib/schema';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const parsed = CategoryId.safeParse(id);

  if (!parsed.success) {
    return <Navigate to="/" replace />;
  }

  const meta = categoryMeta(parsed.data);
  const items = libraries.filter((l) => l.category === parsed.data);

  return (
    <PageShell>
      <Seo
        title={`${meta.name} — bibliotecas curadas`}
        description={meta.description}
        canonical={`/categoria/${meta.id}`}
      />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-soft)' }}>Acervo</Link>
        </nav>

        <span className="section-eyebrow">— Categoria</span>
        <h1 className="section-title" style={{ marginTop: '0.5rem' }}>
          {meta.emoji} {meta.name}
        </h1>
        <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>
          {meta.description}
        </p>

        <div style={{ marginTop: '3rem' }}>
          <span className="count">
            <b>{items.length}</b>itens nesta categoria
          </span>
        </div>

        {items.length === 0 ? (
          <div className="empty" style={{ marginTop: '2rem' }}>
            <b>Categoria ainda vazia.</b>
            <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-soft)' }}>
              O acervo está sendo migrado para o modelo v04. Em breve com conteúdo.
            </span>
          </div>
        ) : (
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: '1rem',
            marginTop: '2rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}>
            {items.map((l) => (
              <li key={l.slug}>
                <Link to={`/biblioteca/${l.slug}`} style={{
                  display: 'block',
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  background: 'var(--bg-card)',
                  height: '100%',
                }}>
                  <strong style={{ fontSize: '1rem' }}>{l.title}</strong>
                  <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {l.summary}
                  </p>
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {l.badge && <span className="card-badge">{l.badge}</span>}
                    <span className="card-badge">{l.difficulty}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <section style={{ marginTop: '4rem' }}>
          <span className="section-eyebrow">— Outras categorias</span>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: '0.5rem',
            marginTop: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          }}>
            {CATEGORIES.filter((c) => c.id !== meta.id).map((c) => (
              <li key={c.id}>
                <Link to={`/categoria/${c.id}`} style={{
                  display: 'block',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-soft)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}>
                  {c.emoji} {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </PageShell>
  );
}

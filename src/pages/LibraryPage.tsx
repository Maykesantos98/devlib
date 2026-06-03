import { useParams, Link, Navigate } from 'react-router-dom';
import { findLibrary, loadLibraryBody, libraries } from '../lib/content';
import { categoryMeta } from '../lib/schema';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { MdxBody } from '../components/MdxBody';

export default function LibraryPage() {
  const { slug } = useParams<{ slug: string }>();
  const lib = slug ? findLibrary(slug) : undefined;

  if (!lib) {
    return <Navigate to="/" replace />;
  }

  const meta = categoryMeta(lib.category);
  const related = libraries
    .filter((l) => l.category === lib.category && l.slug !== lib.slug)
    .slice(0, 6);

  return (
    <PageShell>
      <Seo title={lib.title} description={lib.summary} canonical={`/biblioteca/${lib.slug}`} />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-soft)' }}>Acervo</Link>
          <span style={{ color: 'var(--text-dim)' }}> / </span>
          <Link to={`/categoria/${lib.category}`} style={{ color: 'var(--text-soft)' }}>
            {meta.emoji} {meta.name}
          </Link>
        </nav>

        <span className="section-eyebrow">— {meta.name}</span>
        <h1 className="section-title" style={{ marginTop: '0.5rem' }}>{lib.title}</h1>
        <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>{lib.summary}</p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.5rem 0 2rem' }}>
          {lib.badge && <span className="card-badge">{lib.badge}</span>}
          <span className="card-badge">{lib.difficulty}</span>
          {lib.tags.map((t) => (
            <span key={t} className="card-badge">{t}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          <a className="nav-cta" href={lib.url} target="_blank" rel="noopener noreferrer">
            Abrir site →
          </a>
          {lib.repo && (
            <a className="nav-cta" href={lib.repo} target="_blank" rel="noopener noreferrer">
              Repositório →
            </a>
          )}
        </div>

        <MdxBody loader={loadLibraryBody(lib.slug)} />

        {related.length > 0 && (
          <section style={{ marginTop: '4rem' }}>
            <span className="section-eyebrow">— Relacionados</span>
            <h2 className="section-title" style={{ fontSize: 'var(--t-h4)' }}>
              Mais em {meta.name}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to={`/biblioteca/${r.slug}`}
                    style={{
                      display: 'block',
                      padding: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      color: 'var(--text)',
                      textDecoration: 'none',
                    }}
                  >
                    <strong>{r.title}</strong>
                    <span style={{ display: 'block', color: 'var(--text-soft)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                      {r.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </PageShell>
  );
}

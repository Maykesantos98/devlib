import { useParams, Link, Navigate } from 'react-router-dom';
import {
  findLibrary,
  loadLibraryBody,
  recipesUsingLibrary,
  guidesMentioningLibrary,
  alternativesFor,
} from '../lib/content';
import { categoryMeta } from '../lib/schema';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { MdxBody } from '../components/MdxBody';
import { CategoryIcon, ContentIcon } from '../components/IconSystem';

export default function LibraryPage() {
  const { slug } = useParams<{ slug: string }>();
  const lib = slug ? findLibrary(slug) : undefined;

  if (!lib) {
    return <Navigate to="/" replace />;
  }

  const meta = categoryMeta(lib.category);
  const inRecipes = recipesUsingLibrary(lib.slug);
  const inGuides = guidesMentioningLibrary(lib.slug);
  const alternatives = alternativesFor(lib);

  return (
    <PageShell>
      <Seo title={lib.title} description={lib.summary} canonical={`/biblioteca/${lib.slug}`} />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-soft)' }}>Acervo</Link>
          <span style={{ color: 'var(--text-dim)' }}> / </span>
          <Link to={`/categoria/${lib.category}`} style={{ color: 'var(--text-soft)' }}>
            <span className="inline-icon-label">
              <CategoryIcon id={meta.id} className="ui-icon" />
              {meta.name}
            </span>
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

        {/* B · Cross-links — "Aparece em N receitas" */}
        {inRecipes.length > 0 && (
          <section className="cross-section">
            <span className="section-eyebrow">— Em receitas</span>
            <h2 className="cross-title">
              Aparece em <em>{inRecipes.length}</em> receita{inRecipes.length > 1 ? 's' : ''}.
            </h2>
            <ul className="cross-list">
              {inRecipes.map((r) => (
                <li key={r.slug}>
                  <Link to={`/receita/${r.slug}`} className="cross-card">
                    <span className="cross-emoji" aria-hidden="true">
                      <ContentIcon kind="recipe" size={18} />
                    </span>
                    <span className="cross-body">
                      <strong>{r.title}</strong>
                      <span>{r.goal} · {r.stack.length} peças no stack</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* B · Cross-links — "Mencionada em N guias" */}
        {inGuides.length > 0 && (
          <section className="cross-section">
            <span className="section-eyebrow">— Em guias</span>
            <h2 className="cross-title">
              Mencionada em <em>{inGuides.length}</em> guia{inGuides.length > 1 ? 's' : ''}.
            </h2>
            <ul className="cross-list">
              {inGuides.map((g) => (
                <li key={g.slug}>
                  <Link to={`/guia/${g.slug}`} className="cross-card">
                    <span className="cross-emoji cross-emoji-pill" aria-hidden="true">
                      {g.readingMinutes}min
                    </span>
                    <span className="cross-body">
                      <strong>{g.title}</strong>
                      <span>{g.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* B · Cross-links — "Alternativas" */}
        {alternatives.length > 0 && (
          <section className="cross-section">
            <span className="section-eyebrow">— Alternativas próximas</span>
            <h2 className="cross-title">
              Outras opções em <em>{meta.name}</em>.
            </h2>
            <ul className="cross-grid">
              {alternatives.map((a) => (
                <li key={a.slug}>
                  <Link to={`/biblioteca/${a.slug}`} className="cross-card cross-card-grid">
                    <span className="cross-card-meta">{a.badge ?? a.difficulty}</span>
                    <strong>{a.title}</strong>
                    <span>{a.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {alternatives.length >= 2 && (
              <p style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <Link
                  to={`/comparar?slugs=${[lib.slug, ...alternatives.slice(0, 2).map((a) => a.slug)].join(',')}`}
                  style={{ color: 'var(--accent)', fontSize: '0.9rem' }}
                >
                  Comparar lado a lado →
                </Link>
              </p>
            )}
          </section>
        )}
      </section>
    </PageShell>
  );
}

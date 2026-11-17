import { useParams, Link, Navigate } from 'react-router-dom';
import {
  findGuide,
  loadGuideBody,
  findLibrary,
  findRecipe,
  neighborsInSeries,
  GUIDE_SERIES,
} from '../lib/content';
import { categoryMeta } from '../lib/schema';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { MdxBody } from '../components/MdxBody';
import { CategoryIcon, ContentIcon } from '../components/IconSystem';

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? findGuide(slug) : undefined;

  if (!guide) {
    return <Navigate to="/guias" replace />;
  }

  const meta = guide.category ? categoryMeta(guide.category) : null;
  const { prev, next } = neighborsInSeries(guide);
  const seriesMeta = guide.series ? GUIDE_SERIES.find((s) => s.id === guide.series) : null;

  return (
    <PageShell>
      <Seo
        title={guide.title}
        description={guide.summary}
        canonical={`/guia/${guide.slug}`}
      />

      <article className="shell" style={{ paddingTop: '4rem', maxWidth: '780px' }}>
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/guias" style={{ color: 'var(--text-soft)' }}>← Guias</Link>
          {seriesMeta && (
            <>
              <span style={{ color: 'var(--text-dim)' }}> · </span>
              <span className="inline-icon-label" style={{ color: 'var(--text-soft)' }}>
                <ContentIcon kind="series" className="ui-icon" />
                {seriesMeta.title}
                {guide.seriesOrder && ` · parte ${guide.seriesOrder}`}
              </span>
            </>
          )}
        </nav>

        {meta && (
          <span className="section-eyebrow section-eyebrow-icon">
            <CategoryIcon id={meta.id} className="ui-icon" />
            {meta.name}
          </span>
        )}
        <h1 className="section-title" style={{ marginTop: '0.5rem' }}>{guide.title}</h1>
        <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>{guide.summary}</p>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginTop: '1rem' }}>
          {guide.publishedAt}
          {guide.updatedAt && guide.updatedAt !== guide.publishedAt && ` · atualizado ${guide.updatedAt}`}
          {' · '}
          {guide.readingMinutes} min de leitura
        </p>

        <div style={{ marginTop: '3rem' }}>
          <MdxBody loader={loadGuideBody(guide.slug)} />
        </div>

        {/* H · Prev/Next in series */}
        {(prev || next) && (
          <nav className="series-nav" aria-label="Navegação na série">
            {prev ? (
              <Link to={`/guia/${prev.slug}`} className="series-nav-link series-nav-prev">
                <span className="series-nav-label">← Anterior</span>
                <span className="series-nav-title">{prev.title}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link to={`/guia/${next.slug}`} className="series-nav-link series-nav-next">
                <span className="series-nav-label">Próximo →</span>
                <span className="series-nav-title">{next.title}</span>
              </Link>
            ) : <span />}
          </nav>
        )}

        {(guide.relatedRecipes.length > 0 || guide.relatedLibraries.length > 0) && (
          <aside style={{ marginTop: '4rem', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Leitura relacionada</strong>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
              {guide.relatedRecipes.map((s) => {
                const r = findRecipe(s);
                return r && (
                  <li key={`r-${s}`}>
                    <Link to={`/receita/${s}`} style={{ color: 'var(--accent)' }}>
                      <span className="inline-icon-label">
                        <ContentIcon kind="recipe" className="ui-icon" />
                        {r.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {guide.relatedLibraries.map((s) => {
                const l = findLibrary(s);
                return l && (
                  <li key={`l-${s}`}>
                    <Link to={`/biblioteca/${s}`} style={{ color: 'var(--accent)' }}>
                      <span className="inline-icon-label">
                        <ContentIcon kind="library" className="ui-icon" />
                        {l.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </article>
    </PageShell>
  );
}

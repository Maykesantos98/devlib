import { useParams, Link, Navigate } from 'react-router-dom';
import { findRecipe, loadRecipeBody, findLibrary } from '../lib/content';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { MdxBody } from '../components/MdxBody';
import { ContentIcon } from '../components/IconSystem';

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const recipe = slug ? findRecipe(slug) : undefined;

  if (!recipe) {
    return <Navigate to="/receitas" replace />;
  }

  return (
    <PageShell>
      <Seo
        title={recipe.title}
        description={recipe.summary}
        canonical={`/receita/${recipe.slug}`}
      />

      <section className="shell" style={{ paddingTop: '4rem' }}>
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/receitas" style={{ color: 'var(--text-soft)' }}>← Receitas</Link>
        </nav>

        <span className="section-eyebrow">— {recipe.goal}</span>
        <h1 className="section-title title-with-icon" style={{ marginTop: '0.5rem' }}>
          <ContentIcon kind="recipe" className="title-icon" size={34} />
          {recipe.title}
        </h1>
        <p className="section-desc" style={{ fontSize: 'var(--t-lead)' }}>{recipe.summary}</p>

        {recipe.templateRepo && (
          <a className="nav-cta" href={recipe.templateRepo} target="_blank" rel="noopener noreferrer"
             style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
            Template no GitHub →
          </a>
        )}

        <section style={{ marginTop: '3rem' }}>
          <span className="section-eyebrow">— Stack</span>
          <h2 className="section-title" style={{ fontSize: 'var(--t-h4)' }}>Peças escolhidas.</h2>

          <ol style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gap: '0.75rem',
            marginTop: '1.5rem',
            counterReset: 'stack',
          }}>
            {recipe.stack.map((item, idx) => {
              const lib = findLibrary(item.library);
              return (
                <li key={idx} style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      {lib ? (
                        <Link to={`/biblioteca/${lib.slug}`} style={{ color: 'var(--text)', fontWeight: 600 }}>
                          {lib.title}
                        </Link>
                      ) : (
                        <strong>{item.library}</strong>
                      )}
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        {item.role}
                      </span>
                    </div>
                    {item.note && (
                      <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                        {item.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section style={{ marginTop: '3rem' }}>
          <MdxBody loader={loadRecipeBody(recipe.slug)} />
        </section>
      </section>
    </PageShell>
  );
}

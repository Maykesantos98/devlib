import { Link } from 'react-router-dom';
import { recipes } from '../../lib/content';

export function FeaturedRecipes() {
  if (recipes.length === 0) return null;

  const featured = [...recipes]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 6);

  return (
    <section className="shell" id="receitas-destaque" style={{ marginTop: '4rem' }}>
      <span className="section-eyebrow">— Receitas</span>
      <h2 className="section-title" style={{ fontSize: 'var(--t-h2)' }}>
        Comece por uma <em>stack pronta.</em>
      </h2>
      <p className="section-desc">
        Em vez de escolher peça por peça, parta de uma combinação curada por objetivo. Cada receita inclui setup, alternativas e gotchas.
      </p>

      <div className="recipes-strip">
        {featured.map((r) => (
          <Link key={r.slug} to={`/receita/${r.slug}`} className="recipe-card">
            <span className="recipe-card-emoji" aria-hidden="true">{r.emoji ?? '📘'}</span>
            <h3>{r.title}</h3>
            <p>{r.summary}</p>
            <p className="recipe-card-meta">{r.stack.length} peças · {r.goal}</p>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <Link to="/receitas" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
          Ver todas as receitas →
        </Link>
      </p>
    </section>
  );
}

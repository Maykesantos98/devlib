import { Link } from 'react-router-dom';
import { recipes, guides } from '../../lib/content';
import { ContentIcon } from '../IconSystem';

/**
 * Consolidates the previous FeaturedRecipes + LatestGuides + BlueprintStrip
 * (3 sections doing the same job) into a single "editorial" grid.
 * One column for recipes, one for guides.
 */
export function EditorialStrip() {
  const featuredRecipes = [...recipes]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4);

  const latestGuides = [...guides]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4);

  if (featuredRecipes.length === 0 && latestGuides.length === 0) return null;

  return (
    <section className="shell editorial-strip" aria-labelledby="editorial-title">
      <span className="section-eyebrow">— Editorial</span>
      <h2 id="editorial-title" className="section-title" style={{ fontSize: 'var(--t-h2)' }}>
        Comece <em>com contexto.</em>
      </h2>
      <p className="section-desc">
        Receitas: stacks prontas por objetivo. Guias: decisões com trade-offs explícitos.
      </p>

      <div className="editorial-grid">
        <div>
          <h3 className="editorial-col-title">
            <ContentIcon kind="recipe" className="ui-icon" /> Receitas
            <Link to="/receitas" className="editorial-col-more">Ver todas →</Link>
          </h3>
          <ul className="editorial-list">
            {featuredRecipes.map((r) => (
              <li key={r.slug}>
                <Link to={`/receita/${r.slug}`} className="editorial-item">
                  <span className="editorial-item-emoji" aria-hidden="true">
                    <ContentIcon kind="recipe" size={18} />
                  </span>
                  <span className="editorial-item-body">
                    <strong>{r.title}</strong>
                    <span>{r.goal} · {r.stack.length} peças</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="editorial-col-title">
            <ContentIcon kind="guide" className="ui-icon" /> Guias
            <Link to="/guias" className="editorial-col-more">Ver todos →</Link>
          </h3>
          <ul className="editorial-list">
            {latestGuides.map((g) => (
              <li key={g.slug}>
                <Link to={`/guia/${g.slug}`} className="editorial-item">
                  <span className="editorial-item-emoji editorial-item-pill" aria-hidden="true">
                    {g.readingMinutes}min
                  </span>
                  <span className="editorial-item-body">
                    <strong>{g.title}</strong>
                    <span>{g.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

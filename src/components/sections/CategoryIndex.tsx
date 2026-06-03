import { Link } from 'react-router-dom';
import { libraries } from '../../lib/content';
import { CATEGORIES } from '../../lib/schema';

/**
 * Table of contents section. Renders one entry per v04 category
 * with the real count of items (computed from the MDX tree).
 */
export function CategoryIndex() {
  const items = CATEGORIES.map((c) => ({
    ...c,
    count: libraries.filter((l) => l.category === c.id).length,
  })).filter((c) => c.count > 0);

  return (
    <section className="index shell" id="indice" aria-labelledby="indice-title">
      <span className="section-eyebrow">— Índice</span>
      <h2 className="section-title" id="indice-title">
        {items.length} <em>categorias.</em>
      </h2>
      <p className="section-desc">
        Navegue direto para a área que interessa. Cada categoria abre na sua página própria.
      </p>

      <ol className="toc">
        {items.map((c, idx) => (
          <li key={c.id}>
            <Link to={`/categoria/${c.id}`}>
              <span className="toc-num">§{String(idx + 1).padStart(2, '0')}</span>
              <span className="toc-meta">
                <span className="toc-name">
                  <span aria-hidden="true">{c.emoji}</span> {c.name}
                </span>
                <span className="toc-desc">{c.description}</span>
              </span>
              <span className="toc-right">
                <span className="toc-count">{c.count}</span>
                <svg className="toc-arrow" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

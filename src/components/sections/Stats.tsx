import { libraries, recipes, guides } from '../../lib/content';
import { CATEGORIES } from '../../lib/schema';

/**
 * Stats strip — real counts pulled from content, not hardcoded.
 */
export function Stats() {
  return (
    <section className="stats-strip" aria-label="Resumo do acervo">
      <div className="shell stats-inner">
        <div className="stat-item">
          <span className="stat-num gradient">{libraries.length}</span>
          <span className="stat-tag">bibliotecas</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <span className="stat-num">{CATEGORIES.length}</span>
          <span className="stat-tag">categorias</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <span className="stat-num">{recipes.length}</span>
          <span className="stat-tag">receitas</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <span className="stat-num">{guides.length}</span>
          <span className="stat-tag">guias</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <span className="stat-num live">
            <span className="status-dot" aria-hidden="true" />
            Ativo
          </span>
          <span className="stat-tag">status</span>
        </div>
      </div>
    </section>
  );
}

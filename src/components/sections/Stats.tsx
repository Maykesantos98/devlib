import { libraries, recipes, guides } from '../../lib/content';
import { CATEGORIES } from '../../lib/schema';
import { CountUp } from '../CountUp';

/**
 * Stats strip — real counts pulled from content, not hardcoded.
 * Os números contam ao entrar na tela; o valor final fica sempre no DOM
 * para leitores de tela (ver CountUp).
 */
export function Stats() {
  return (
    <section className="stats-strip" aria-label="Resumo do acervo">
      <div className="shell stats-inner">
        <div className="stat-item">
          <CountUp to={libraries.length} className="stat-num gradient" />
          <span className="stat-tag">bibliotecas</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <CountUp to={CATEGORIES.length} className="stat-num" />
          <span className="stat-tag">categorias</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <CountUp to={recipes.length} className="stat-num" />
          <span className="stat-tag">receitas</span>
        </div>
        <span className="stat-divider" aria-hidden="true" />
        <div className="stat-item">
          <CountUp to={guides.length} className="stat-num" />
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

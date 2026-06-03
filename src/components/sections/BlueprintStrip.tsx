import { Link } from 'react-router-dom';

/**
 * Three-card teaser strip linking to category pages.
 * Replaces the previous strip that used #anchors to the legacy
 * chapter slugs (#agentes, #interface-components).
 */
export function BlueprintStrip() {
  return (
    <section className="blueprint-strip shell" aria-label="Exemplos de stack visual">
      <Link className="blueprint-card" to="/categoria/frontend-ui">
        <span className="blueprint-kicker">Components</span>
        <h2>shadcn + Magic UI</h2>
        <p>Base editável, padrões complexos e blocos prontos para montar interfaces reais.</p>
      </Link>
      <Link className="blueprint-card" to="/receita/portfolio-landing">
        <span className="blueprint-kicker">Motion</span>
        <h2>Framer + Magic + Aceternity</h2>
        <p>Hero sections, backgrounds, microinterações e CTAs com acabamento visual.</p>
      </Link>
      <Link className="blueprint-card" to="/categoria/ai-agents">
        <span className="blueprint-kicker">Agents</span>
        <h2>SDK + browser tools</h2>
        <p>Combine frameworks de agentes com automação de navegador e MCP.</p>
      </Link>
    </section>
  );
}

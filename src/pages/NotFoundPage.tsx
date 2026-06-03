import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';

export default function NotFoundPage() {
  return (
    <PageShell>
      <Seo title="404 — Não encontrado" />
      <section className="shell" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.85rem' }}>
          404
        </p>
        <h1 className="section-title" style={{ marginTop: '1rem' }}>
          Página <em>não encontrada.</em>
        </h1>
        <p className="section-desc" style={{ maxWidth: '480px', margin: '1rem auto 2rem' }}>
          O link pode ter mudado, ou o item ainda não foi publicado neste novo modelo de conteúdo.
        </p>
        <Link to="/" className="nav-cta">Voltar ao acervo</Link>
      </section>
    </PageShell>
  );
}

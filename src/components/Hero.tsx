import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { libraries, recipes, guides } from '../lib/content';
import { CATEGORIES } from '../lib/schema';

interface HeroProps {
  onOpenCmdk: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCmdk }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<HTMLDivElement>(null);

  // Parallax cursor effect — kept from previous Hero
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let rafId: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30;
        const y = (e.clientY / window.innerHeight - 0.5) * 30;
        if (orbRef.current) {
          orbRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
        if (partsRef.current) {
          partsRef.current.style.transform = `translate(${x * -0.4}px, ${y * -0.4}px)`;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const stats = {
    libraries: libraries.length,
    recipes: recipes.length,
    guides: guides.length,
    categories: CATEGORIES.length,
  };

  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-orbit" aria-hidden="true">
        <div className="hero-orb" ref={orbRef} />
        <div className="hero-parts" ref={partsRef} />
      </div>

      <div className="hero-eyebrow">
        <span className="hero-dot" aria-hidden="true" />
        Acervo curado · v04 · atualizado em 2026
      </div>

      <h1 id="hero-title" className="hero-title">
        Bibliotecas para quem
        <br />
        <em>constrói com agentes.</em>
      </h1>

      <p className="hero-lead">
        {stats.libraries} bibliotecas, {stats.recipes} receitas prontas e {stats.guides} guias editoriais
        sobre como escolher entre elas. Sem hype — trade-offs explícitos, decisões com contexto.
      </p>

      <div className="hero-actions">
        <button
          type="button"
          className="hero-cta hero-cta-primary"
          onClick={onOpenCmdk}
          data-magnetic
        >
          <Search size={16} aria-hidden="true" />
          Buscar no acervo
          <kbd>⌘K</kbd>
        </button>

        <Link to="/receitas" className="hero-cta">
          Ver receitas
          <ChevronRight size={16} aria-hidden="true" />
        </Link>

        <Link to="/guias" className="hero-cta">
          Ler guias
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="hero-chips" role="list" aria-label="Atalhos por categoria">
        {CATEGORIES.slice(0, 6).map((c) => (
          <Link key={c.id} to={`/categoria/${c.id}`} className="hero-chip" role="listitem">
            <span aria-hidden="true">{c.emoji}</span>
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
};

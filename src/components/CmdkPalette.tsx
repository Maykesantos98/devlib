import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { libraries, recipes, guides } from '../lib/content';
import { CATEGORIES, categoryMeta } from '../lib/schema';
import type { CategoryId } from '../lib/schema';
import { CategoryIcon, ContentIcon, type ContentIconKind } from './IconSystem';

interface CmdkPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Hit {
  kind: 'library' | 'recipe' | 'guide' | 'category' | 'action';
  title: string;
  sub: string;
  to: string;
  iconKind?: ContentIconKind;
  categoryId?: CategoryId;
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Global command palette — searches libraries, recipes, guides and categories.
 * v05 replaces the v03 palette that only knew the legacy JSON catalog.
 */
export function CmdkPalette({ isOpen, onClose }: CmdkPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  // Toggle native dialog
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen) {
      if (!d.open) {
        d.showModal();
        setQuery('');
        setActive(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else if (d.open) {
      d.close();
    }
  }, [isOpen]);

  // Forward native close (esc, backdrop) to parent
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCloseNative = () => onClose();
    d.addEventListener('close', onCloseNative);
    return () => d.removeEventListener('close', onCloseNative);
  }, [onClose]);

  // Build searchable hit list — memoized per query.
  const hits = useMemo<Hit[]>(() => {
    const q = normalize(query.trim());
    const out: Hit[] = [];

    const matchLib = libraries.filter((l) =>
      !q || normalize(`${l.title} ${l.summary} ${l.tags.join(' ')}`).includes(q),
    );
    const matchRec = recipes.filter((r) =>
      !q || normalize(`${r.title} ${r.goal} ${r.summary}`).includes(q),
    );
    const matchGuide = guides.filter((g) =>
      !q || normalize(`${g.title} ${g.summary}`).includes(q),
    );
    const matchCat = CATEGORIES.filter((c) =>
      !q || normalize(`${c.name} ${c.description}`).includes(q),
    );

    // No query → show curated entry points (categories + recent recipes/guides)
    if (!q) {
      for (const c of CATEGORIES.slice(0, 6)) {
        out.push({
          kind: 'category',
          title: c.name,
          sub: c.description,
          to: `/categoria/${c.id}`,
          categoryId: c.id,
        });
      }
      for (const r of matchRec.slice(0, 3)) {
        out.push({
          kind: 'recipe',
          title: r.title,
          sub: r.goal,
          to: `/receita/${r.slug}`,
          iconKind: 'recipe',
        });
      }
      for (const g of matchGuide.slice(0, 3)) {
        out.push({
          kind: 'guide',
          title: g.title,
          sub: g.summary,
          to: `/guia/${g.slug}`,
        });
      }
      return out;
    }

    // With query: libraries first (up to 8), then recipes, guides, categories.
    for (const l of matchLib.slice(0, 8)) {
      const meta = categoryMeta(l.category);
      out.push({
        kind: 'library',
        title: l.title,
        sub: `${meta.name} · ${l.summary.slice(0, 100)}`,
        to: `/biblioteca/${l.slug}`,
        categoryId: l.category,
      });
    }
    for (const r of matchRec.slice(0, 3)) {
      out.push({
        kind: 'recipe',
        title: r.title,
        sub: `Receita · ${r.goal}`,
        to: `/receita/${r.slug}`,
        iconKind: 'recipe',
      });
    }
    for (const g of matchGuide.slice(0, 3)) {
      out.push({
        kind: 'guide',
        title: g.title,
        sub: `Guia · ${g.summary.slice(0, 100)}`,
        to: `/guia/${g.slug}`,
      });
    }
    for (const c of matchCat.slice(0, 2)) {
      out.push({
        kind: 'category',
        title: c.name,
        sub: `Categoria · ${c.description}`,
        to: `/categoria/${c.id}`,
        categoryId: c.id,
      });
    }
    return out;
  }, [query]);

  const activeIndex = Math.min(active, Math.max(hits.length - 1, 0));

  const select = (hit: Hit) => {
    onClose();
    navigate(hit.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[activeIndex];
      if (hit) select(hit);
    }
  };

  return (
    <dialog ref={dialogRef} className="cmdk-dialog" aria-label="Busca global">
      <div className="cmdk-shell" onKeyDown={onKeyDown}>
        <header className="cmdk-head">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="cmdk-input"
            placeholder="Buscar bibliotecas, receitas, guias…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            autoComplete="off"
            aria-label="Buscar"
          />
          <kbd className="cmdk-esc">esc</kbd>
        </header>

        <ol className="cmdk-list" role="listbox">
          {hits.length === 0 ? (
            <li className="cmdk-empty">Nada encontrado para "{query}".</li>
          ) : (
            hits.map((hit, idx) => (
              <li
                key={`${hit.kind}-${hit.to}`}
                role="option"
                aria-selected={idx === activeIndex}
                className={`cmdk-item ${idx === activeIndex ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(idx)}
                onClick={() => select(hit)}
              >
                <span className="cmdk-kind">
                  {hit.categoryId ? (
                    <CategoryIcon id={hit.categoryId} size={16} />
                  ) : (
                    <ContentIcon kind={hit.iconKind ?? hit.kind} size={16} />
                  )}
                </span>
                <span className="cmdk-meta">
                  <strong>{hit.title}</strong>
                  <span>{hit.sub}</span>
                </span>
                <ArrowRight size={14} className="cmdk-arrow" aria-hidden="true" />
              </li>
            ))
          )}
        </ol>

        <footer className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>enter</kbd> abrir</span>
          <span><kbd>esc</kbd> fechar</span>
        </footer>
      </div>
    </dialog>
  );
}

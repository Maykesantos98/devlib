import React, { useEffect, useRef, useState } from 'react';
import type { ChapterData, CardData } from '../types';
import { getInstallCommand } from './Dock';

interface CmdkPaletteProps {
  data: ChapterData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: CardData) => void;
  onSelectFilter: (filter: string) => void;
  onTriggerMatrix: () => void;
}

interface CommandEntry {
  type: 'cmd' | 'repo';
  label: string;
  sub: string;
  desc?: string;
  keywords: string;
  run: () => void;
}

export const CmdkPalette: React.FC<CmdkPaletteProps> = ({
  data,
  isOpen,
  onClose,
  onSelectCard,
  onSelectFilter,
  onTriggerMatrix,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Toggle dialog display
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setQuery('');
        setActiveIndex(0);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // Command palette entries
  const commandEntries: CommandEntry[] = [
    { 
      type: 'cmd', 
      label: 'Ir para o Índice', 
      sub: 'navegação', 
      desc: 'Navega diretamente até o índice/tabela de conteúdos com as 9 categorias principais do acervo.',
      keywords: 'indice toc', 
      run: () => { document.getElementById('indice')?.scrollIntoView({ behavior: 'smooth' }); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Ir para o Acervo', 
      sub: 'navegação', 
      desc: 'Foca a visualização na grade Bento de cartões do acervo aberto de ferramentas.',
      keywords: 'acervo cards', 
      run: () => { document.getElementById('acervo')?.scrollIntoView({ behavior: 'smooth' }); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Ir para o Método', 
      sub: 'navegação', 
      desc: 'Mostra os quatro princípios de engenharia e boas práticas sugeridas do DEVLIB.',
      keywords: 'metodo principios', 
      run: () => { document.getElementById('metodo')?.scrollIntoView({ behavior: 'smooth' }); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Voltar ao topo', 
      sub: 'navegação', 
      desc: 'Realiza scroll suave de volta para a primeira linha da página e hero area.',
      keywords: 'topo top home', 
      run: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Filtrar: Todos', 
      sub: 'filtro', 
      desc: 'Limpa todos os filtros ativos e exibe todas as 133 ferramentas cadastradas.',
      keywords: 'todos all reset', 
      run: () => { onSelectFilter('all'); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Filtrar: Top estrelas', 
      sub: 'filtro', 
      desc: 'Filtra os cartões bento exibindo apenas as bibliotecas mais famosas/estreladas do GitHub.',
      keywords: 'top estrelas stars github populares', 
      run: () => { onSelectFilter('top'); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Filtrar: Recentes', 
      sub: 'filtro', 
      desc: 'Filtra e foca nos pacotes e servidores adicionados recentemente no catálogo.',
      keywords: 'recente recent novo new', 
      run: () => { onSelectFilter('recent'); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Filtrar: Front-end', 
      sub: 'filtro', 
      desc: 'Exibe ferramentas, bibliotecas e assets focados em UI/UX e Frontend.',
      keywords: 'frontend front ui interface', 
      run: () => { onSelectFilter('frontend'); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Filtrar: Back-end', 
      sub: 'filtro', 
      desc: 'Exibe APIs, bancos de dados, ORMs e frameworks para servidores.',
      keywords: 'backend back server api', 
      run: () => { onSelectFilter('backend'); onClose(); } 
    },
    { 
      type: 'cmd', 
      label: 'Ativar Matrix mode', 
      sub: 'easter egg', 
      desc: 'Ativa o tema verde hackerman estilo console Matrix em toda a aplicação.',
      keywords: 'matrix verde konami', 
      run: () => { onTriggerMatrix(); onClose(); } 
    },
  ];

  const repoEntries: CommandEntry[] = data.flatMap(chapter =>
    chapter.cards.map(card => ({
      type: 'repo',
      label: card.title,
      sub: card.meta.split('·')[0]?.trim() || 'lib',
      keywords: `${card.title} ${card.meta} ${card.kind}`,
      run: () => {
        onSelectCard(card);
        onClose();
      }
    }))
  );

  const allEntries = [...commandEntries, ...repoEntries];

  // Filtering list
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredEntries = React.useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      return [...commandEntries.slice(0, 4), ...repoEntries.slice(0, 8)];
    }
    return allEntries
      .filter((it) => normalize(`${it.label} ${it.sub} ${it.keywords}`).includes(q))
      .slice(0, 40);
  }, [query, data]);

  // Find active card for dual pane preview
  const activeEntry = filteredEntries[activeIndex];
  const activeCard: CardData | null = React.useMemo(() => {
    if (!activeEntry || activeEntry.type !== 'repo') return null;
    for (const chapter of data) {
      const found = chapter.cards.find(c => c.title === activeEntry.label);
      if (found) return found;
    }
    return null;
  }, [activeEntry, data]);

  // Manage keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredEntries.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredEntries.length) % filteredEntries.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEntries[activeIndex]) {
        filteredEntries[activeIndex].run();
      }
    }
  };

  useEffect(() => {
    // Scroll active item into view
    const activeEl = document.querySelector('.cmdk-item.active');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <dialog
      ref={dialogRef}
      className="cmdk"
      id="cmdk"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="cmdk-box">
        {/* Left Pane: Search Input & Results (Main) */}
        <div className="cmdk-main-pane">
          <div className="cmdk-input-row" onKeyDown={handleKeyDown}>
            <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              id="cmdkInput"
              type="text"
              placeholder="Buscar biblioteca ou comando…"
              autoComplete="off"
              spellCheck="false"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
            />
            <kbd>esc</kbd>
          </div>

          <ul className="cmdk-list" id="cmdkList" role="listbox">
            {filteredEntries.map((it, i) => (
              <li
                key={`${it.type}-${it.label}-${i}`}
                className={`cmdk-item${i === activeIndex ? ' active' : ''}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => it.run()}
                onMouseMove={() => setActiveIndex(i)}
              >
                <span className="cmdk-kind">{it.type === 'repo' ? 'lib' : 'cmd'}</span>
                <span className="cmdk-label">{it.label}</span>
                <span className="cmdk-sub">{it.sub}</span>
              </li>
            ))}
            {filteredEntries.length === 0 && (
              <li className="cmdk-empty">Nada encontrado · tente outro termo</li>
            )}
          </ul>

          <div className="cmdk-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
            <span><kbd>↵</kbd> abrir</span>
            <span><kbd>esc</kbd> fechar</span>
            <span className="cmdk-count" id="cmdkCount">
              {filteredEntries.length} itens
            </span>
          </div>
        </div>

        {/* Right Pane: Live Preview Panel */}
        <div className="cmdk-preview-pane">
          {activeEntry ? (
            activeEntry.type === 'repo' && activeCard ? (
              // Library Info Preview
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--violet-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {activeCard.meta}
                  </span>
                  <h3 className="cmdk-preview-title">{activeCard.title}</h3>
                </div>

                <p className="cmdk-preview-desc">{activeCard.body}</p>

                <div className="cmdk-preview-section">
                  <h4>Comando de instalação</h4>
                  <div className="cmdk-preview-cmd">
                    {getInstallCommand(activeCard.title)}
                  </div>
                </div>

                <div className="cmdk-preview-section">
                  <h4>Tipo / Seção</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', textTransform: 'capitalize' }}>
                    {activeCard.kind}
                  </span>
                </div>

                {activeCard.tags && activeCard.tags.length > 0 && (
                  <div className="cmdk-preview-section">
                    <h4>Tags associadas</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {activeCard.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          style={{ 
                            fontSize: '0.62rem', 
                            fontFamily: 'var(--font-mono)', 
                            background: 'rgba(255,255,255,0.04)', 
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '0.1rem 0.35rem',
                            color: 'var(--text-soft)'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Command Info Preview
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--violet-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    AÇÃO DO SISTEMA
                  </span>
                  <h3 className="cmdk-preview-title">{activeEntry.label}</h3>
                </div>

                <p className="cmdk-preview-desc">
                  {activeEntry.desc || 'Executa um comando local ou altera filtros da aplicação instantaneamente.'}
                </p>

                <div className="cmdk-preview-section">
                  <h4>Categoria</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', textTransform: 'capitalize' }}>
                    {activeEntry.sub}
                  </span>
                </div>

                <div className="cmdk-preview-section">
                  <h4>Atalho rápido</h4>
                  <div className="cmdk-preview-cmd" style={{ color: 'var(--text-soft)' }}>
                    Pressione <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.05rem 0.3rem' }}>Enter ↵</kbd> para executar
                  </div>
                </div>
              </div>
            )
          ) : (
            // Fallback empty preview
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              Selecione um item para ver detalhes
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
};

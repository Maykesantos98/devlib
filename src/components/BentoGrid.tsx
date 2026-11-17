import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ChapterData, CardData } from '../types';
import { Card } from './Card';
import { libraries } from '../lib/content';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { FilterState } from './filterState';

interface BentoGridProps {
  data: ChapterData[];
  searchQuery: string;
  filters: FilterState;
  selectedStack: string[];
  onToggleStack: (title: string) => void;
  onCardClick: (card: CardData) => void;
  onVisibleCountChange: (count: number) => void;
}

const RECENT = new Set([
  'Claude Code', 'OpenHands', 'Cline', 'Goose',
  'FastMCP', 'MCP Inspector', 'GitHub MCP Server', 'Playwright MCP', 'Composio',
  'NeMo Guardrails', 'Guardrails AI', 'LLM Guard', 'Garak',
  'TradingAgents', 'AI-Trader', 'AgenticTrading', 'Freqtrade',
  'bybit-exchange/skills', 'awesome-ai-in-finance',
  'Flutter', 'React Native', 'MLC LLM', 'ExecuTorch',
  'react-native-executorch', 'MediaPipe', 'Capacitor',
  'react-native-ai', 'Cactus', 'UIverse', 'Mobbin',
  'ReUI', 'Magic UI', 'Aceternity UI', 'HeroUI', 'Shadcn Blocks',
  'Eldora UI', 'Cult UI', 'Skiper UI', 'Square UI',
  'Ali Imam Components', 'Liquid Metal', 'Dot Matrix', 'Balloons.js',
]);

/*
 * Quantos cards cada capítulo mostra na home antes do "ver categoria completa".
 * No celular a grade vira uma coluna só: seis cards por capítulo, vezes onze
 * capítulos, produziam uma home de ~26.000 px. Três é o suficiente para dar
 * amostra da categoria sem transformar a página num rolo.
 */
const CARDS_PER_CHAPTER_DESKTOP = 6;
const CARDS_PER_CHAPTER_MOBILE = 3;

export const BentoGrid: React.FC<BentoGridProps> = ({
  data,
  searchQuery,
  filters,
  selectedStack,
  onToggleStack,
  onCardClick,
  onVisibleCountChange,
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const cardsPerChapter = isMobile ? CARDS_PER_CHAPTER_MOBILE : CARDS_PER_CHAPTER_DESKTOP;

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Title → Library lookup so difficulty + tags can drive multi-axis filter.
  const metaByTitle = useMemo(() => {
    const map = new Map<string, { difficulty: string; tags: ReadonlyArray<string> }>();
    for (const lib of libraries) {
      map.set(lib.title, { difficulty: lib.difficulty, tags: lib.tags });
    }
    return map;
  }, []);

  // Filter logic — multi-axis (category + difficulty + type + text).
  const filteredData = useMemo(() => {
    const q = normalize(searchQuery.trim());

    return data.map((chapter) => {
      const filteredCards = chapter.cards.filter((card) => {
        // 1. Kind/category match
        const inKind = (() => {
          switch (filters.category) {
            case 'all':
              return true;
            case 'recent':
              return RECENT.has(card.title);
            default:
              return chapter.chapter === filters.category;
          }
        })();
        if (!inKind) return false;

        // Difficulty + type axes via Library lookup
        const meta = metaByTitle.get(card.title);
        if (filters.difficulty !== 'any' && meta?.difficulty !== filters.difficulty) {
          return false;
        }
        if (filters.type !== 'any' && !meta?.tags.includes(filters.type)) {
          return false;
        }
        if (filters.lang !== 'any' && !meta?.tags.includes(filters.lang)) {
          return false;
        }

        // 2. Text match (title, body, kinds, tags)
        const contentString = `${card.title} ${card.body} ${card.meta} ${card.kind} ${(card.tags || []).join(' ')}`;
        const inText = !q || normalize(contentString).includes(q);

        return inKind && inText;
      });

      return {
        ...chapter,
        cards: filteredCards,
      };
    }).filter((chapter) => chapter.cards.length > 0); // Hide empty chapters
  }, [data, searchQuery, filters, metaByTitle]);

  // Notify parent of visible count — kept as side effect so render stays pure.
  useEffect(() => {
    const total = filteredData.reduce((sum, chapter) => sum + chapter.cards.length, 0);
    onVisibleCountChange(total);
  }, [filteredData, onVisibleCountChange]);

  const getChapterTitle = (chap: string) => {
    const titles: Record<string, string> = {
      'kit': 'Fundações — a gaveta ao lado do teclado.',
      'agents': 'Frameworks & SDKs — escolha seu runtime.',
      'mcp': 'Model Context Protocol — a fiação.',
      'interface-components': 'Interface — UI Kits & Componentes.',
      'interface-frameworks': 'Interface — Frameworks & Gráficos.',
      'server-db': 'Servidor — Bancos de dados & APIs.',
      'server-utils': 'Servidor — ORMs & Validação.',
      'guard': 'Segurança — auth & appsec.',
      'run': 'Build — build, testes & obs.',
      'ship': 'Apps — mobile & IA on-device.',
      'trade': 'Trade — agentes & quant.',
    };
    return titles[chap] || 'Biblioteca';
  };

  return (
    <>
      {filteredData.map((chapter) => {
        const limit = filters.category === 'all' && !searchQuery.trim()
          ? cardsPerChapter
          : chapter.cards.length;
        const visibleCards = chapter.cards.slice(0, limit);
        const hiddenCount = chapter.cards.length - visibleCards.length;

        return (
        /*
         * Cada capítulo é uma <section> própria. Sem isso, as barras `sticky`
         * dividem o mesmo bloco-contêiner e se empilham no topo umas sobre as
         * outras. O escopo do sticky é o pai — então o pai tem que ser o capítulo.
         */
        <section className="chapter" key={chapter.id}>
          <div className="chapter-bar" data-chapter={chapter.chapter} id={chapter.id}>
            <span className="chapter-num">{chapter.num}</span>
            <h3>{chapter.title || getChapterTitle(chapter.chapter)}</h3>
            <span className="count-pill">{chapter.cards.length} itens</span>
          </div>

          <div className="bento">
            {visibleCards.map((card) => (
              <Card
                key={card.slug ?? `${chapter.id}-${card.title}`}
                data={card}
                isInStack={selectedStack.includes(card.title)}
                onToggleStack={onToggleStack}
                onClick={() => onCardClick(card)}
              />
            ))}
          </div>

          {/* <Link>, não <a>: um <a> recarregava a SPA inteira a cada clique. */}
          {hiddenCount > 0 && (
            <Link
              className="catalog-more"
              to={`/categoria/${chapter.id}`}
              aria-label={`Ver categoria completa: ${hiddenCount} itens restantes`}
            >
              <span>Ver categoria completa</span>
              <span>{hiddenCount} itens restantes</span>
            </Link>
          )}
        </section>
        );
      })}

      {filteredData.length === 0 && (
        <div className="empty" id="emptyState" role="status">
          <b>Nada encontrado para essa busca.</b> Tente outro termo ou limpe o filtro.
        </div>
      )}
    </>
  );
};

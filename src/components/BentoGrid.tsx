import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ChapterData, CardData } from '../types';
import { Card } from './Card';

interface BentoGridProps {
  data: ChapterData[];
  searchQuery: string;
  activeFilter: string;
  selectedStack: string[];
  onToggleStack: (title: string) => void;
  onCardClick: (card: CardData) => void;
  onVisibleCountChange: (count: number) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

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

const TOP = new Set([
  'Flutter', 'React Native', 'Next.js', 'Three.js', 'Ollama', 'Bun',
  'llama.cpp', 'OpenHands', 'Cline', 'Goose', 'Supabase', 'Tailwind CSS',
  'Vite', 'shadcn/ui', 'ReUI', 'Magic UI', 'Aceternity UI', 'HeroUI',
  'Storybook', 'Astro', 'Freqtrade', 'Appwrite',
  'PocketBase', 'Prisma ORM', 'Playwright', 'Grafana', 'Sentry',
  'Zod', 'tRPC', 'Claude Code', 'MediaPipe', 'Expo',
]);

export const BentoGrid: React.FC<BentoGridProps> = ({
  data,
  searchQuery,
  activeFilter,
  selectedStack,
  onToggleStack,
  onCardClick,
  onVisibleCountChange,
}) => {
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Filter logic — pure computation, no side effects.
  const filteredData = useMemo(() => {
    const q = normalize(searchQuery.trim());

    return data.map((chapter) => {
      const filteredCards = chapter.cards.filter((card) => {
        // 1. Kind/category match
        let inKind = false;

        switch (activeFilter) {
          case 'all':
            inKind = true;
            break;
          case 'frontend':
            inKind = chapter.chapter.startsWith('interface');
            break;
          case 'backend':
            inKind = chapter.chapter.startsWith('server');
            break;
          case 'recent':
            inKind = RECENT.has(card.title);
            break;
          case 'top':
            inKind = TOP.has(card.title);
            break;
          default:
            inKind = chapter.chapter === activeFilter;
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
  }, [data, searchQuery, activeFilter]);

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
      {filteredData.map((chapter) => (
        <React.Fragment key={chapter.id}>
          <div className="chapter-bar" data-chapter={chapter.chapter} id={chapter.id}>
            <span className="chapter-num">{chapter.num}</span>
            <h3>{chapter.title || getChapterTitle(chapter.chapter)}</h3>
            <span className="count-pill">{chapter.cards.length} itens</span>
          </div>

          <motion.div 
            className="bento"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            layout
          >
            {chapter.cards.map((card) => (
              <Card
                key={card.title}
                data={card}
                isInStack={selectedStack.includes(card.title)}
                onToggleStack={onToggleStack}
                onClick={() => onCardClick(card)}
              />
            ))}
          </motion.div>
        </React.Fragment>
      ))}

      {filteredData.length === 0 && (
        <div className="empty" id="emptyState" role="status">
          <b>Nada encontrado para essa busca.</b> Tente outro termo ou limpe o filtro.
        </div>
      )}
    </>
  );
};

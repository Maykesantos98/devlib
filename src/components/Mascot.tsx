import React, { useEffect, useRef, useState } from 'react';
import { Palette, Terminal, Sparkles, AlertCircle } from 'lucide-react';

const TIPS = [
  'Funciona na minha máquina 🤷',
  'Não é bug, é uma <em>feature</em> não documentada.',
  'Tem 10 tipos de gente: as que entendem binário e as que não.',
  '<code>git commit -m "fix"</code> … pela 7ª vez 😅',
  '99 bugs no código. Corrige 1. Agora são 133.',
  'Por que o dev quebrou? Usou todo o <em>cache</em>. 💸',
  'Eu transformo café em código. ☕ → 💻',
  'Deploy na sexta 17h: coragem ou loucura?',
  'Dark mode porque a luz atrai bugs. 🌚',
  'Estimei 2h. Já se passaram 3 dias. ⏳',
  '<code>// TODO: arrumar isso depois</code> (desde 2019)',
  'Tava funcionando. Não sei por quê. Quebrou. Também não sei.',
  'Vai testar em produção? Corajoso. 🫡',
  '<code>rm -rf node_modules && npm i</code> — a oração do dev 🙏',
  'CSS: centralizar uma div, o chefão final. 🎮',
  'Dica de verdade: <code>⌘K</code> busca tudo aqui.',
  'Psst… <code>devlib.help()</code> no console 👀',
  'Konami: <code>↑↑↓↓←→←→BA</code> 🟢',
];

export const Mascot: React.FC = () => {
  const mascotRef = useRef<HTMLButtonElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const [bubbleText, setBubbleText] = useState('Olá! Sou o droid do DEVLIB. Clique em mim para receber dicas de dev!');
  const [isBubbleShown, setIsBubbleShown] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [isPop, setIsPop] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const tipsArray = useRef<string[]>([]);
  const hideTimerRef = useRef<number | null>(null);
  const lastJokeTimeRef = useRef<number>(0);

  // Initialize and shuffle tips once
  useEffect(() => {
    const shuffled = [...TIPS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    tipsArray.current = shuffled;
    
    // Auto hide initial bubble after 6s
    hideTimerRef.current = window.setTimeout(() => {
      setIsBubbleShown(false);
    }, 6000);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Pupil eye-tracking cursor
  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const mascot = mascotRef.current;
        const pupils = pupilsRef.current;
        if (!mascot || !pupils) {
          rafId = null;
          return;
        }

        const rect = mascot.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height * 0.42;
        
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const distance = Math.min(2.6, Math.hypot(e.clientX - cx, e.clientY - cy) / 60);
        
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        pupils.style.transform = `translate(${tx}px, ${ty}px)`;
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Auto-talk during inactivity / scroll stop
  useEffect(() => {
    let scrollTimer: number;

    const handleScroll = () => {
      setIsBubbleShown(false);
      setIsTalking(false);
      
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const now = Date.now();
        const GAP = 22000;
        if (now - lastJokeTimeRef.current > GAP) {
          sayNextTip();
        }
      }, 2000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  const say = (htmlText: string, keepOpen = false) => {
    lastJokeTimeRef.current = Date.now();
    setBubbleText(htmlText);
    setIsBubbleShown(true);
    setIsTalking(true);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (!keepOpen) {
      const cleanLength = htmlText.replace(/<[^>]+>/g, '').length;
      const duration = Math.min(9500, Math.max(5000, cleanLength * 70));

      hideTimerRef.current = window.setTimeout(() => {
        setIsBubbleShown(false);
        setIsTalking(false);
      }, duration);
    }
  };

  const sayNextTip = () => {
    if (!tipsArray.current.length) return;
    const nextText = tipsArray.current[tipIndex];
    say(nextText);
    setTipIndex((prev) => (prev + 1) % tipsArray.current.length);
  };

  const handleClick = () => {
    setIsPop(true);
    // Open bubble and stay open to show interactive options
    say("Olá! Escolha um dos tópicos abaixo para eu te recomendar as melhores tecnologias:", true);
  };

  const handleOptionClick = (e: React.MouseEvent, type: string) => {
    e.stopPropagation(); // Avoid triggering parent handleClick
    setIsPop(true);

    if (type === 'mcp') {
      say("Para MCP (Model Context Protocol), recomendo o <b>FastMCP</b> (Python) e o <b>MCP Inspector</b> para testes, além do <b>Playwright MCP</b> para navegar.");
    } else if (type === 'orm') {
      say("Para bancos de dados, o <b>Supabase</b> é incrível como BaaS. Se for usar ORMs tradicionais, recomendo o <b>Prisma ORM</b> ou o <b>Drizzle ORM</b>.");
    } else if (type === 'ui') {
      say("Para interfaces premium, confira o <b>shadcn/ui</b> (blocos), <b>ReUI</b> (fundações) e <b>Magic UI</b> ou <b>Aceternity UI</b> para efeitos e movimento.");
    } else if (type === 'joke') {
      sayNextTip();
    }
  };

  return (
    <button
      ref={mascotRef}
      className={`mascot ${isTalking ? 'talking' : ''} ${isPop ? 'pop' : ''}`}
      id="mascot"
      type="button"
      aria-label="Mascote DEVLIB — clique para conselhos"
      onClick={handleClick}
      onAnimationEnd={() => setIsPop(false)}
      style={{ overflow: 'visible', outline: 'none' }}
    >
      {/* Speech Bubble Container */}
      <div 
        className={`mascot-bubble ${isBubbleShown ? 'show' : ''}`}
        id="mascotBubble"
        role="status"
        aria-live="polite"
        style={{
          pointerEvents: isBubbleShown ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem'
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: bubbleText }} />
        
        {/* Interactive Option Buttons */}
        {isBubbleShown && (
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.35rem', 
              borderTop: '1px solid var(--border)',
              paddingTop: '0.5rem',
              marginTop: '0.2rem'
            }}
          >
            <button 
              onClick={(e) => handleOptionClick(e, 'mcp')}
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <Terminal size={10} />
              Recomende MCP
            </button>
            <button 
              onClick={(e) => handleOptionClick(e, 'orm')}
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <AlertCircle size={10} />
              Bancos & ORM
            </button>
            <button 
              onClick={(e) => handleOptionClick(e, 'ui')}
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <Palette size={10} />
              UI Kits
            </button>
            <button 
              onClick={(e) => handleOptionClick(e, 'joke')}
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <Sparkles size={10} />
              Outra Dica
            </button>
          </div>
        )}
      </div>

      <svg className="mascot-svg" viewBox="0 0 88 100" aria-hidden="true">
        <defs>
          <linearGradient id="mHead" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#252a44" />
            <stop offset="0.55" stopColor="#171a2c" />
            <stop offset="1" stopColor="#0d0f1c" />
          </linearGradient>
          <linearGradient id="mVisor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0c16" />
            <stop offset="1" stopColor="#04050b" />
          </linearGradient>
        </defs>

        {/* floating ground shadow */}
        <ellipse className="m-shadow" cx="44" cy="95" rx="22" ry="4.5" />

        {/* droid body */}
        <g className="m-droid">
          {/* head */}
          <ellipse className="m-head" cx="44" cy="42" rx="33" ry="31" fill="url(#mHead)" />
          {/* top specular highlight */}
          <ellipse className="m-spec" cx="34" cy="24" rx="15" ry="8" />
          {/* visor band */}
          <rect className="m-visor" x="16" y="33" width="56" height="24" rx="12" fill="url(#mVisor)" />
          <rect className="m-sheen" x="20" y="35" width="48" height="6" rx="3" />
          {/* status dot */}
          <circle className="m-led" cx="63" cy="45" r="2.4" />
          {/* eyes */}
          <g className="m-eyes">
            <g className="m-pupils" id="mascotPupils" ref={pupilsRef}>
              <rect className="m-eye" x="33" y="40" width="7" height="10" rx="3.5" transform="rotate(-8 36.5 45)" />
              <rect className="m-eye" x="48" y="40" width="7" height="10" rx="3.5" transform="rotate(8 51.5 45)" />
            </g>
          </g>
        </g>
      </svg>
    </button>
  );
};

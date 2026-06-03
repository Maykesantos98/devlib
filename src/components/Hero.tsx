import React, { useState, useEffect, useRef } from 'react';
import { Terminal, FileCode, Play, Check, Copy } from 'lucide-react';

interface HeroProps {
  onOpenCmdk: () => void;
}

const FILES = {
  'fastmcp.py': {
    lang: 'python',
    code: `from fastmcp import FastMCP

# Criar servidor MCP para o DEVLIB
mcp = FastMCP("DevlibHelper")

@mcp.tool()
def get_library_cmd(name: str) -> str:
    """Retorna comando de instalação."""
    return f"npm install {name}"
`,
    output: `[fastmcp] Servidor inicializado em http://localhost:8000
[fastmcp] Ferramenta registrada: get_library_cmd
✓ Pronto para conexões!`
  },
  'agent.ts': {
    lang: 'typescript',
    code: `import { Agent } from "@devlib/core";
import { google } from "@ai-sdk/google";

const mascot = new Agent({
  model: google("gemini-2.5-flash"),
  system: "Você é o droid do DEVLIB.",
  skills: ["search_tool", "add_to_stack"]
});

await mascot.run("Recomende um ORM");
`,
    output: `🤖 Droid log: Pesquisando por "ORM" no acervo MDX...
🤖 Droid log: Encontrado "Supabase" (Ch. 05) e "Prisma" (Ch. 05).
Recomendação: Prisma ORM possui melhor integração com TypeScript.`
  },
  'ui-layout.tsx': {
    lang: 'typescript',
    code: `import { BentoGrid, Card } from "devlib-ui";

export default function Dashboard() {
  return (
    <BentoGrid columns={6} gap={4}>
      <Card title="shadcn" tone="cyan" />
      <Card title="ReUI" tone="emerald" />
      <Card title="Magic UI" tone="violet" />
    </BentoGrid>
  );
}
`,
    output: `[Vite] dev server running at http://localhost:5174/
[Vite] HMR connection established.
✓ Compilação concluída com sucesso (181ms).`
  }
};

export const Hero: React.FC<HeroProps> = ({ onOpenCmdk }) => {
  const [activeTab, setActiveTab] = useState<keyof typeof FILES>('fastmcp.py');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [copied, setCopied] = useState(false);
  
  const orbRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<HTMLDivElement>(null);

  // Parallax cursor effect
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const orb = orbRef.current;
        const parts = partsRef.current;
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        const nx = (e.clientX / w - 0.5); // -0.5 .. 0.5
        const ny = (e.clientY / h - 0.5);

        if (orb) {
          orb.style.transform = `translate3d(${nx * 20}px, ${ny * 12}px, 0)`;
        }
        if (parts) {
          parts.style.transform = `translate3d(${nx * -12}px, ${ny * -8}px, 0)`;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Run code simulation
  const handleRunCode = () => {
    setIsRunning(true);
    setTerminalOutput('> executando compilador...\n');
    setTimeout(() => {
      setTerminalOutput(prev => prev + FILES[activeTab].output);
      setIsRunning(false);
    }, 1200);
  };

  // Copy code simulation
  const handleCopyCode = () => {
    navigator.clipboard.writeText(FILES[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset terminal when changing tabs
  useEffect(() => {
    setTerminalOutput(`$ rodar ${activeTab === 'fastmcp.py' ? 'python' : 'ts-node'} ${activeTab}`);
  }, [activeTab]);

  return (
    <section className="hero home-catalog shell">
      {/* Background Animated Particle Field */}
      <div className="hero-particles" ref={partsRef} aria-hidden="true">
        <span style={{ left: '10%', top: '20%', animationDuration: '4s' }}></span>
        <span style={{ left: '25%', top: '40%', animationDuration: '6s' }}></span>
        <span style={{ left: '45%', top: '15%', animationDuration: '5s' }}></span>
        <span style={{ left: '70%', top: '35%', animationDuration: '7s' }}></span>
        <span style={{ left: '85%', top: '55%', animationDuration: '6s' }}></span>
        <span style={{ left: '50%', top: '70%', animationDuration: '8s' }}></span>
        <span style={{ left: '15%', top: '80%', animationDuration: '5s' }}></span>
        <span style={{ left: '90%', top: '20%', animationDuration: '7s' }}></span>
      </div>

      <aside className="home-rail" aria-label="Menu de descoberta">
        <span className="home-rail-kicker">Explorar</span>
        <a href="#interface-components"><span>Interface (UI)</span><b>18</b></a>
        <a href="#interface-frameworks"><span>Interface (Dev)</span><b>16</b></a>
        <a href="#agentes"><span>Agentes</span><b>13</b></a>
        <a href="#mcp"><span>MCP</span><b>10</b></a>
        <a href="#server-db"><span>Bancos &amp; APIs</span><b>9</b></a>
        <a href="#server-utils"><span>ORMs &amp; Utils</span><b>8</b></a>
      </aside>

      <div className="home-main">
        <a href="#acervo" className="hero-pill">
          <span className="badge">Nova Era</span>
          <b>133 bibliotecas</b>
          <span>·&nbsp;redesign interativo</span>
          <svg className="hero-pill-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </a>

        <h1 className="hero-title">
          <span className="line line-grad"><span className="word">Construa</span> <span className="word">stacks</span></span>
          <span className="line line-plain"><span className="word">com rapidez</span> <span className="word">e precisão.</span></span>
        </h1>

        <p className="hero-lead">
          O <b>DEVLIB</b> é um acervo de desenvolvimento para IA, Front-end e Back-end. Busque bibliotecas, monte sua stack modular e exporte em segundos.
        </p>

        <div className="home-search" role="search" onClick={onOpenCmdk} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <button type="button">Buscar React, MCP, FastMCP, Ollama...</button>
          <kbd>⌘K</kbd>
        </div>

        <div className="home-actions">
          <a href="#acervo" className="btn primary">Explorar acervo</a>
          <button onClick={onOpenCmdk} className="btn ghost">Busca rápida</button>
        </div>
      </div>

      {/* Renders the interactive terminal block */}
      <div className="home-preview" ref={orbRef}>
        <div 
          className="editor-window" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Header tabs */}
          <div 
            className="editor-header" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.6rem 0.8rem',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            <div className="editor-tabs" style={{ display: 'flex', gap: '0.4rem' }}>
              {(Object.keys(FILES) as Array<keyof typeof FILES>).map(fileName => (
                <button
                  key={fileName}
                  onClick={() => setActiveTab(fileName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    background: activeTab === fileName ? 'var(--bg-elev)' : 'transparent',
                    border: '1px solid',
                    borderColor: activeTab === fileName ? 'var(--border-bright)' : 'transparent',
                    borderRadius: '6px',
                    color: activeTab === fileName ? 'var(--text)' : 'var(--text-soft)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)'
                  }}
                >
                  <FileCode size={12} className={activeTab === fileName ? 'icon-glow' : ''} style={{ color: activeTab === fileName ? 'var(--violet-400)' : 'inherit' }} />
                  {fileName}
                </button>
              ))}
            </div>
            
            {/* Actions (Play & Copy) */}
            <div className="editor-actions" style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={handleCopyCode}
                title="Copiar código"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-soft)',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, var(--violet-500), var(--violet-700))',
                  border: 0,
                  color: 'white',
                  fontSize: '0.72rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  opacity: isRunning ? 0.7 : 1
                }}
              >
                <Play size={10} fill="currentColor" />
                {isRunning ? 'Rodando...' : 'Executar'}
              </button>
            </div>
          </div>

          {/* Code display */}
          <div 
            className="editor-body" 
            style={{ 
              flex: 1, 
              padding: '1rem', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.78rem',
              lineHeight: '1.6',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.1)',
              color: 'var(--text-soft)'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              <code>
                {FILES[activeTab].code.split('\n').map((line, idx) => {
                  // Simple high-fidelity inline highlighting
                  let highlighted = line;
                  if (line.startsWith('import') || line.startsWith('from')) {
                    highlighted = line.replace(/(import|from|as)/g, '<span style="color:#f43f5e">$1</span>');
                  } else if (line.startsWith('const') || line.startsWith('let') || line.startsWith('function') || line.startsWith('class') || line.startsWith('def')) {
                    highlighted = line.replace(/(const|let|function|class|def)/g, '<span style="color:#38bdf8">$1</span>');
                  } else if (line.includes('return')) {
                    highlighted = line.replace(/(return)/g, '<span style="color:#f43f5e">$1</span>');
                  }
                  // Highlight comments
                  if (line.includes('#') || line.includes('//')) {
                    const char = line.includes('#') ? '#' : '//';
                    const parts = line.split(char);
                    highlighted = parts[0] + `<span style="color:var(--text-dim);font-style:italic">${char}${parts.slice(1).join(char)}</span>`;
                  }
                  // Highlight strings
                  highlighted = highlighted.replace(/(["'])(.*?)\1/g, '<span style="color:#a855f7">"$2"</span>');
                  
                  return (
                    <div key={idx} className="code-line" style={{ display: 'flex' }}>
                      <span className="line-num" style={{ width: '24px', color: 'var(--text-dim)', textAlign: 'right', marginRight: '1rem', userSelect: 'none' }}>{idx + 1}</span>
                      <span dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>

          {/* Interactive Shell terminal emulator */}
          <div 
            className="editor-terminal" 
            style={{ 
              height: '110px', 
              borderTop: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.3)',
              padding: '0.6rem 0.8rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: '#a3e635', /* Lime green console text */
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.3rem', color: 'var(--text-soft)' }}>
              <Terminal size={11} />
              <span>TERMINAL</span>
              {isRunning && <span className="status-dot" style={{ background: 'var(--accent)', marginLeft: 'auto', width: '6px', height: '6px' }}></span>}
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: isRunning ? 'var(--text-dim)' : 'inherit' }}>
              {terminalOutput}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

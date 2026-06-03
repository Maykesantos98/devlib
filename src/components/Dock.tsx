import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Copy, Check, Trash2, ChevronUp, ChevronDown, Terminal } from 'lucide-react';

interface DockProps {
  selectedStack: string[];
  onRemoveItem: (title: string) => void;
  onClearStack?: () => void;
}

const getInstallCommand = (title: string) => {
  const cmds: Record<string, string> = {
    'Context7': 'npx ctx7',
    'skills.sh': 'npx skills.sh',
    'claude-mem': 'npm install -g claude-mem',
    'Superpowers': 'npm install -g @obra/superpowers',
    'Claude Code': 'npm install -g @anthropic-ai/claude-code',
    'OpenHands': 'docker run -d -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/all-hands-ai/openhands:latest',
    'Cline': 'code --install-extension cline.cline',
    'Goose': 'cargo install goose-cli',
    'FastMCP': 'pip install fastmcp',
    'Ollama': 'ollama run llama3',
    'llama.cpp': 'git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && make',
    'Aider': 'pip install aider-chat',
    'Agent Browser': 'cargo install agent-browser',
    'Playwright MCP': 'npx -y @microsoft/playwright-mcp',
    'Composio': 'pip install composio-core',
    'shadcn/ui': 'npx shadcn@latest init',
    'ReUI': 'npm install reui',
    'Magic UI': 'npm install framer-motion clsx tailwind-merge',
    'Aceternity UI': 'npm install framer-motion clsx tailwind-merge canvas-confetti',
    'HeroUI': 'npm install @heroui/react framer-motion',
    'Next.js': 'npx create-next-app@latest',
    'Astro': 'npm create astro@latest',
    'Three.js': 'npm install three',
    'Framer Motion': 'npm install framer-motion',
    'Supabase': 'npm install @supabase/supabase-js',
    'Hono': 'npm install hono',
    'Fastify': 'npm install fastify',
    'Prisma ORM': 'npm install prisma --save-dev',
    'Drizzle ORM': 'npm install drizzle-orm drizzle-kit',
    'Zod': 'npm install zod',
    'tRPC': 'npm install @trpc/server @trpc/client',
    'Playwright': 'npm init playwright@latest',
    'Sentry': 'npx @sentry/wizard@latest -i sourcemaps',
    'Bun': 'powershell -c "irm bun.sh/install.ps1 | iex"',
    'Vite': 'npm create vite@latest',
    'Tailwind CSS': 'npm install -D tailwindcss postcss autoprefixer',
    'NextAuth.js': 'npm install next-auth',
    'Clerk': 'npm install @clerk/nextjs',
    'Lucia': 'npm install lucia',
    'Supabase Auth': 'npm install @supabase/supabase-js',
    'Auth0': 'npm install @auth0/nextjs-auth0',
    'Kinde': 'npm install @kinde-oss/kinde-auth-nextjs',
  };
  if (cmds[title]) return cmds[title];
  const low = title.toLowerCase();
  if (low.includes('python') || low.includes('ai') || low.includes('crew') || low.includes('agent')) {
    return `pip install ${low.replace(/\s+/g, '-')}`;
  }
  return `npm install ${low.replace(/\s+/g, '-')}`;
};

function generateCombinedCommand(titles: string[]) {
  if (!titles.length) return 'npm install';
  
  const npmPackages: string[] = [];
  const pipPackages: string[] = [];
  const otherCmds: string[] = [];
  
  titles.forEach(title => {
    const cmd = getInstallCommand(title);
    if (cmd.startsWith('npm install -g ')) {
      otherCmds.push(cmd);
    } else if (cmd.startsWith('npm install ')) {
      npmPackages.push(cmd.replace('npm install ', ''));
    } else if (cmd.startsWith('pip install ')) {
      pipPackages.push(cmd.replace('pip install ', ''));
    } else {
      otherCmds.push(cmd);
    }
  });
  
  const parts: string[] = [];
  if (npmPackages.length) parts.push(`npm install ${npmPackages.join(' ')}`);
  if (pipPackages.length) parts.push(`pip install ${pipPackages.join(' ')}`);
  otherCmds.forEach(c => parts.push(c));
  
  return parts.join(' && ');
}

const getInitials = (name: string) => {
  return name.split(/[\s/_-]/).map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
};

const getThemeGradient = (title: string) => {
  const code = title.charCodeAt(0) % 4;
  if (code === 0) return 'linear-gradient(135deg, #a855f7, #6366f1)'; // Purple
  if (code === 1) return 'linear-gradient(135deg, #2dd4bf, #0d9488)'; // Teal
  if (code === 2) return 'linear-gradient(135deg, #f59e0b, #ea580c)'; // Amber
  return 'linear-gradient(135deg, #f43f5e, #be123c)'; // Rose/Pink
};

// macOS Dock individual icon item
const DockIcon = ({ 
  title, 
  onRemove, 
  mouseX 
}: { 
  title: string; 
  onRemove: () => void; 
  mouseX: any 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [42, 60, 42]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [42, 60, 42]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <div 
      ref={ref}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && (
        <div 
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            background: 'var(--bg-elev)',
            border: '1px solid var(--border-bright)',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            color: 'var(--text)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          {title}
        </div>
      )}

      <motion.div
        style={{
          width,
          height,
          background: getThemeGradient(title),
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '700',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          position: 'relative'
        }}
        whileTap={{ scale: 0.9 }}
      >
        {getInitials(title)}
        
        {/* Small badge delete icon on hover */}
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              border: 0,
              fontSize: '8px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        )}
      </motion.div>
    </div>
  );
};

export const Dock: React.FC<DockProps> = ({ selectedStack, onRemoveItem, onClearStack }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const mouseX = useMotionValue(Infinity);

  const command = generateCombinedCommand(selectedStack);

  const handleCopy = () => {
    navigator.clipboard.writeText(command).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });
  };

  if (selectedStack.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        width: 'max-content',
        maxWidth: '92vw'
      }}
    >
      {/* Collapsible command drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          style={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--border-bright)',
            borderRadius: '16px',
            padding: '1rem',
            width: 'min(500px, 90vw)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
            display: 'grid',
            gap: '0.75rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.75rem' }}>
            <Terminal size={14} style={{ color: 'var(--violet-400)' }} />
            <span>INSTALAR STACK ({selectedStack.length} ITENS)</span>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border)',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: 'var(--text-soft)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              maxHeight: '100px'
            }}
          >
            <code>{command}</code>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.55rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--violet-500), var(--violet-700))',
                border: 0,
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{isCopied ? 'Copiado!' : 'Copiar Comando'}</span>
            </button>
            {onClearStack && (
              <button
                onClick={onClearStack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-soft)',
                  cursor: 'pointer'
                }}
                title="Limpar tudo"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Floating macOS-Style Dock Capsule */}
      <motion.div
        layout
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={{
          background: 'rgba(17, 19, 31, 0.72)',
          border: '1px solid var(--border-bright)',
          borderRadius: '24px',
          padding: '0.5rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.55), 0 0 0 1px rgb(var(--accent-rgb) / 0.1)',
          height: '66px',
          overflow: 'visible'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {selectedStack.map((title) => (
            <DockIcon
              key={title}
              title={title}
              onRemove={() => onRemoveItem(title)}
              mouseX={mouseX}
            />
          ))}
        </div>

        {/* Separator line */}
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />

        {/* Console drawer toggle & copy */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              color: 'var(--text-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={isOpen ? 'Fechar detalhes' : 'Ver comando'}
          >
            {isOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          <button
            onClick={handleCopy}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              color: 'var(--text-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Copiar comando rápido"
          >
            {isCopied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export { getInstallCommand };

export function getInstallCommand(title: string) {
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
}

export function generateCombinedCommand(titles: string[]) {
  if (!titles.length) return 'npm install';

  const npmPackages: string[] = [];
  const pipPackages: string[] = [];
  const otherCmds: string[] = [];

  titles.forEach((title) => {
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
  otherCmds.forEach((cmd) => parts.push(cmd));

  return parts.join(' && ');
}

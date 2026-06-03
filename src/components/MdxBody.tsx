import { lazy, Suspense, type ComponentType } from 'react';

type Loader = () => Promise<{ default: ComponentType }>;

interface MdxBodyProps {
  loader: Loader | undefined;
}

/**
 * Renders an MDX file as a React component, lazy-loaded.
 * Falls back to nothing if the loader is missing (item without long body).
 */
export function MdxBody({ loader }: MdxBodyProps) {
  if (!loader) return null;
  const Lazy = lazy(loader);
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-soft)' }}>Carregando conteúdo…</p>}>
      <article className="mdx-content">
        <Lazy />
      </article>
    </Suspense>
  );
}

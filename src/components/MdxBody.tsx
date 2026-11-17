/* eslint-disable react-hooks/static-components -- MDX route bodies are selected from runtime loaders. */
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';

type Loader = () => Promise<{ default: ComponentType }>;
type LazyMdxComponent = LazyExoticComponent<ComponentType>;

const lazyCache = new WeakMap<Loader, LazyMdxComponent>();

function getLazyMdx(loader: Loader): LazyMdxComponent {
  const cached = lazyCache.get(loader);
  if (cached) return cached;

  const component = lazy(loader);
  lazyCache.set(loader, component);
  return component;
}

interface MdxBodyProps {
  loader: Loader | undefined;
}

/**
 * Renders an MDX file as a React component, lazy-loaded.
 * Falls back to nothing if the loader is missing (item without long body).
 */
export function MdxBody({ loader }: MdxBodyProps) {
  if (!loader) return null;
  const Lazy = getLazyMdx(loader);
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-soft)' }}>Carregando conteúdo…</p>}>
      <article className="mdx-content">
        <Lazy />
      </article>
    </Suspense>
  );
}

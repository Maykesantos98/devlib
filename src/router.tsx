import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';

const LibraryPage  = lazy(() => import('./pages/LibraryPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const RecipePage   = lazy(() => import('./pages/RecipePage'));
const RecipesIndex = lazy(() => import('./pages/RecipesIndex'));
const GuidePage    = lazy(() => import('./pages/GuidePage'));
const GuidesIndex  = lazy(() => import('./pages/GuidesIndex'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function Fallback() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-soft)' }}>
      Carregando…
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/',                       element: <App /> },
  { path: '/biblioteca/:slug',       element: <Suspense fallback={<Fallback />}><LibraryPage  /></Suspense> },
  { path: '/categoria/:id',          element: <Suspense fallback={<Fallback />}><CategoryPage /></Suspense> },
  { path: '/receitas',               element: <Suspense fallback={<Fallback />}><RecipesIndex /></Suspense> },
  { path: '/receita/:slug',          element: <Suspense fallback={<Fallback />}><RecipePage   /></Suspense> },
  { path: '/guias',                  element: <Suspense fallback={<Fallback />}><GuidesIndex  /></Suspense> },
  { path: '/guia/:slug',             element: <Suspense fallback={<Fallback />}><GuidePage    /></Suspense> },
  { path: '*',                       element: <Suspense fallback={<Fallback />}><NotFoundPage /></Suspense> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}

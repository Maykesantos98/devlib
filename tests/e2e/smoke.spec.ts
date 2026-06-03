import { test, expect } from '@playwright/test';

/**
 * DEVLIB smoke tests — the 4 flows we care about.
 * Run: pnpm test:e2e (after `npx playwright install chromium`)
 */

test.describe('home', () => {
  test('renders hero, stats and acervo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DEVLIB/i);

    // Hero CTA — "Buscar no acervo"
    await expect(page.getByRole('button', { name: /buscar no acervo/i })).toBeVisible();

    // Hero has at least one category chip
    await expect(page.getByText(/AI Agents/i).first()).toBeVisible();

    // Acervo section is reachable
    await expect(page.locator('#acervo')).toBeVisible();
  });

  test('skip link focuses #acervo', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /pular para o acervo/i })).toBeFocused();
  });
});

test.describe('navigation', () => {
  test('navigates from home to a library detail page', async ({ page }) => {
    await page.goto('/biblioteca/drizzle');
    await expect(page.getByRole('heading', { name: /Drizzle ORM/i })).toBeVisible();
    await expect(page.getByText(/SQL-first/i)).toBeVisible();
  });

  test('navigates to a recipe', async ({ page }) => {
    await page.goto('/receita/launch-saas-2026');
    await expect(page.getByRole('heading', { name: /SaaS Production-Ready 2026/i })).toBeVisible();
  });

  test('navigates to a guide', async ({ page }) => {
    await page.goto('/guia/escolher-stack-saas-2026');
    await expect(
      page.getByRole('heading', { name: /escolher stack para um saas/i }),
    ).toBeVisible();
  });

  test('compare page shows 2 libraries side by side', async ({ page }) => {
    await page.goto('/comparar?slugs=drizzle,prisma-orm');
    await expect(page.getByRole('heading', { name: /Drizzle ORM vs Prisma ORM/i })).toBeVisible();
    await expect(page.getByText(/SQL-first/i)).toBeVisible();
    await expect(page.getByText(/Schema-first/i)).toBeVisible();
  });
});

test.describe('cmdk palette', () => {
  test('opens with cmd+k and surfaces results', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+K');

    const palette = page.getByRole('searchbox', { name: /buscar/i });
    await expect(palette).toBeFocused();

    await palette.fill('drizzle');
    await expect(page.getByText(/Drizzle/i).first()).toBeVisible();
  });
});

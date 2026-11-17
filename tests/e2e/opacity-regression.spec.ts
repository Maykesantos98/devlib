import { test, expect } from '@playwright/test';

/**
 * Regressão de opacidade.
 *
 * `expect(locator).toBeVisible()` ignora `opacity: 0` — um elemento totalmente
 * transparente passa como visível. Foi por isso que o smoke test nunca pegou o
 * bug do índice sumindo em navegadores sem `animation-timeline` (Firefox).
 *
 * Estes testes olham a opacidade computada, não a visibilidade do Playwright.
 */

test.describe('conteúdo visível sem depender de scroll-driven animations', () => {
  test('os links do índice de categorias não nascem transparentes', async ({ page }) => {
    await page.goto('/');

    const toc = page.locator('.toc a');
    await expect(toc.first()).toBeAttached();
    await toc.first().scrollIntoViewIfNeeded();

    // Onde há view-timeline, a revelação só completa em `cover 30%`.
    // Rolar mais um pouco leva o elemento até o fim da faixa.
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);

    const opacity = await toc.first().evaluate((el) => Number(getComputedStyle(el).opacity));

    expect(
      opacity,
      'O índice ficou transparente. Provavelmente voltou um `opacity: 0` esperando ' +
        'uma classe `.in` que nenhum código adiciona.',
    ).toBeGreaterThan(0.05);
  });

  test('nenhum card do acervo fica transparente depois de entrar na viewport', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.locator('.card').first();
    await expect(firstCard).toBeAttached();
    await firstCard.scrollIntoViewIfNeeded();

    // O view-timeline completa a revelação em `cover 25%`; dá folga para o frame.
    await page.waitForTimeout(600);

    const opacity = await firstCard.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.05);
  });
});

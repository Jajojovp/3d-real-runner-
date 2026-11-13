import { expect, test } from '@playwright/test';

test('loads the MY RUNNER 3D game and its canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Corre a tu/i })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByTestId('start-game')).toBeVisible();
});

test('starts a run and advances the score', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('start-game')).toBeHidden();
  await page.waitForTimeout(900);
  await expect(page.getByTestId('score')).not.toHaveText('0');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
});

test('shows touch controls on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Mover a la izquierda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saltar' })).toBeVisible();
});

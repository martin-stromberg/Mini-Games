import { expect, test } from '@playwright/test';
import { LEVELS, SIZE, WORDS_PER_ROUND } from '../src/word-search/game.js';

test('published overview links to the game under the project path', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Spiel, lerne, entdecke.' })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(246, 247, 251)');
  await page.getByRole('link', { name: 'Englisches Wortsuchrätsel' }).click();
  await expect(page.getByRole('heading', { name: 'Wortsuchrätsel' })).toBeVisible();
});

test('published game loads assets and vocabulary, shows levels and starts a round after reload', async ({ page }) => {
  const vocabularyResponse = page.waitForResponse(response => response.url().endsWith('/data/vocabulary/a1.json') && response.ok());
  await page.goto('games/word-search/');
  await vocabularyResponse;
  await page.reload();
  await expect(page.locator('[data-level]')).toHaveCount(LEVELS.length);
  await expect(page.locator('[data-setup-status]')).toContainText('Wörter stehen zur Auswahl bereit');
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('.cell')).toHaveCount(SIZE * SIZE);
  await expect(page.locator('.translations li')).toHaveCount(WORDS_PER_ROUND);
});

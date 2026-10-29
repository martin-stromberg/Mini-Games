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

test('published memory game starts a round and shows a symbol image', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Vokabel-Memory' }).click();
  await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible();
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('[data-card]')).toHaveCount(16);
  const imageCard = page.locator('.card-image').first();
  await imageCard.click();
  await expect(imageCard.locator('img')).toBeVisible();
  await expect.poll(() => imageCard.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
});

test('published vocabulary quiz starts a round with four options', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Vokabel-Quiz' }).click();
  await expect(page.getByRole('heading', { name: 'Vokabel-Quiz' })).toBeVisible();
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('[data-option]')).toHaveCount(4);
});

test('published letter scramble starts a round with tiles and slots', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Buchstabensalat' }).click();
  await expect(page.getByRole('heading', { name: 'Buchstabensalat' })).toBeVisible();
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('.scramble-tile').first()).toBeVisible();
  await expect(page.locator('.scramble-slot').first()).toBeVisible();
});

test('published word guessing starts a game with keys and slots', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Wort raten' }).click();
  await expect(page.getByRole('heading', { name: 'Wort raten' })).toBeVisible();
  await page.getByRole('button', { name: 'Spiel starten' }).click();
  await expect(page.locator('[data-key]')).toHaveCount(26);
  await expect(page.locator('[data-word] .guess-slot').first()).toBeVisible();
  await expect(page.locator('[data-flower]')).toBeVisible();
});

test('published crossword starts a round with clues and input cells', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Kreuzworträtsel' }).click();
  await expect(page.getByRole('heading', { name: 'Kreuzworträtsel' })).toBeVisible();
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('.crossword-input').first()).toBeVisible();
  await expect(page.locator('[data-clue]')).toHaveCount(12);
});

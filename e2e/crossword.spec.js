import { expect, test } from '@playwright/test';
import { DEFAULT_WORD_COUNT, STORAGE_KEY, WORD_COUNT_OPTIONS, allCellKeys, createRound } from '../src/crossword/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { vocabulary } from '../test/fixtures/rounds.js';

const GAME_PATH = 'games/crossword/';
const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });
const cell = (page, key) => page.locator(`[data-cell="${key}"]`);
const clue = (page, word) => page.locator(`[data-clue="${word.id}"]`);
const result = page => page.locator('[data-result]');

async function openGame(page, { seed = 5, settings } = {}) {
  if (settings) {
    await page.goto(GAME_PATH);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(settings)]);
  }
  await page.goto(`${GAME_PATH}?seed=${seed}`);
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('.crossword-input').first()).toBeVisible();
  return roundFor(seed, { levels: settings?.levels ?? LEVELS, count: settings?.count ?? DEFAULT_WORD_COUNT });
}

test.describe('Kreuzworträtsel: Einstellungen', () => {
  test('the overview links to the crossword game', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Kreuzworträtsel' }).click();
    await expect(page.getByRole('heading', { name: 'Kreuzworträtsel' })).toBeVisible();
    await expect(page).toHaveTitle('Kreuzworträtsel · Mini-Games');
  });

  test('the setup shows levels and word count options', async ({ page }) => {
    await page.goto(GAME_PATH);
    await expect(page.locator('[data-level]')).toHaveCount(LEVELS.length);
    await expect(page.locator('input[name=count]')).toHaveCount(WORD_COUNT_OPTIONS.length);
    await expect(page.getByRole('radio', { name: `${DEFAULT_WORD_COUNT} Wörter` })).toBeChecked();
    await expect(page.locator('[data-setup-status]')).toContainText('Wörter stehen zur Auswahl bereit');
  });

  test('settings are kept after a reload', async ({ page }) => {
    await page.goto(GAME_PATH);
    await page.getByRole('radio', { name: '15 Wörter' }).check();
    await page.getByLabel('A2').uncheck();
    await page.reload();
    await expect(page.getByRole('radio', { name: '15 Wörter' })).toBeChecked();
    await expect(page.getByLabel('A2')).not.toBeChecked();
    const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
    expect(stored.count).toBe(15);
    expect(stored.levels).not.toContain('A2');
  });
});

test.describe('Kreuzworträtsel: Spielablauf', () => {
  test('a seeded round shows grid, numbered clues and the active clue', async ({ page }) => {
    const round = await openGame(page, { seed: 5 });
    await expect(page.locator('.crossword-square')).toHaveCount(round.rows * round.cols);
    await expect(page.locator('.crossword-input')).toHaveCount(allCellKeys(round).length);
    await expect(page.locator('[data-clue]')).toHaveCount(round.words.length);
    const firstAcross = round.wordById[round.across[0]];
    await expect(page.locator('[data-active-clue]')).toContainText(`${firstAcross.number} Waagerecht:`);
    await expect(page.locator('[data-active-clue]')).toContainText(firstAcross.clue);
  });

  test('a clue selects a word and typing fills its cells', async ({ page }) => {
    const round = await openGame(page, { seed: 7 });
    const word = round.wordById[round.across[0]];
    await clue(page, word).click();
    await page.keyboard.type(word.answer.toLowerCase());
    for (const [index, key] of word.cells.entries()) await expect(cell(page, key)).toHaveValue(word.answer[index]);
    await expect(clue(page, word)).toHaveClass(/complete/);
    await expect(result(page)).toHaveText(`1 von ${round.words.length} Wörtern vollständig · Hilfen: 0`);
  });

  test('checking marks wrong cells and revealing enters the active word', async ({ page }) => {
    const round = await openGame(page, { seed: 9 });
    const word = round.wordById[round.down[0]];
    await clue(page, word).click();
    const key = word.cells[0];
    const wrongLetter = round.cells[key].letter === 'A' ? 'B' : 'A';
    await page.keyboard.press(wrongLetter.toLowerCase());
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.locator(`[data-square="${key}"].wrong`)).toHaveCount(1);
    await expect(cell(page, key)).toHaveAttribute('aria-invalid', 'true');
    await page.getByRole('button', { name: 'Wort aufdecken' }).click();
    for (const [index, cellKey] of word.cells.entries()) await expect(cell(page, cellKey)).toHaveValue(word.answer[index]);
    await expect(page.locator(`[data-square="${key}"].wrong`)).toHaveCount(0);
    await expect(result(page)).toHaveText(`1 von ${round.words.length} Wörtern vollständig · Hilfen: 1`);
  });

  test('clicking a crossing twice switches from across to down', async ({ page }) => {
    const round = await openGame(page, { seed: 11 });
    const crossingCell = Object.values(round.cells).find(cell => cell.words.length > 1);
    const key = `${crossingCell.row},${crossingCell.col}`;
    await cell(page, key).click();
    await expect(page.locator('[data-active-clue]')).toContainText('Waagerecht:');
    await cell(page, key).click();
    await expect(page.locator('[data-active-clue]')).toContainText('Senkrecht:');
  });

  test('backspace and arrow keys edit and navigate the active word', async ({ page }) => {
    const round = await openGame(page, { seed: 13 });
    const word = round.wordById[round.across[0]];
    await clue(page, word).click();
    await page.keyboard.type(word.answer[0].toLowerCase());
    await expect(cell(page, word.cells[1])).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(cell(page, word.cells[0])).toHaveValue('');
    await page.keyboard.type(word.answer.slice(0, 2).toLowerCase());
    await page.keyboard.press('ArrowLeft');
    await expect(cell(page, word.cells[1])).toBeFocused();
  });

  test('revealing every word solves the puzzle and disables the cells', async ({ page }) => {
    const settings = { levels: LEVELS, count: 8 };
    const round = await openGame(page, { seed: 15, settings });
    for (const word of round.words) {
      await clue(page, word).click();
      await page.getByRole('button', { name: 'Wort aufdecken' }).click();
    }
    await expect(result(page)).toHaveText('Alle 8 Wörter sind richtig. Hilfen: 8');
    await expect(page.locator('.crossword-input:disabled')).toHaveCount(allCellKeys(round).length);
    await expect(page.locator('[data-message]')).toContainText('Geschafft');
  });
});

test.describe('Kreuzworträtsel: Smartphone', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('the game fits a phone screen without horizontal scrolling', async ({ page }) => {
    await openGame(page, { seed: 17 });
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const board = await page.locator('[data-board]').boundingBox();
    expect(board.x).toBeGreaterThanOrEqual(0);
    expect(board.x + board.width).toBeLessThanOrEqual(375);
    await expect(page.locator('.clue-columns')).toBeVisible();
  });
});

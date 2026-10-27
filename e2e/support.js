import { expect } from '@playwright/test';
import { DIFFICULTY, LEVELS, MIN_WORD_LENGTH, SIZE, WORDS_PER_ROUND } from '../src/word-search/game.js';
import { pathKeys, roundFor } from '../test/fixtures/rounds.js';

export { DIFFICULTY, LEVELS, MIN_WORD_LENGTH, SIZE, WORDS_PER_ROUND };
export * from '../test/fixtures/rounds.js';
export const STORAGE_KEY = 'mini-games.word-search.levels';
export const GAME_PATH = 'games/word-search/';

export async function storeLevels(page, value) {
  await page.goto(GAME_PATH);
  await page.evaluate(([key, stored]) => localStorage.setItem(key, stored), [STORAGE_KEY, value]);
}

export async function openGame(page, { seed, difficulty = DIFFICULTY.EASY, levels } = {}) {
  if (levels) await storeLevels(page, JSON.stringify(levels));
  await page.goto(`${GAME_PATH}?seed=${seed}`);
  if (difficulty === DIFFICULTY.HARD) await page.getByLabel(/Schwierig/).check();
  await page.getByRole('button', { name: 'Runde starten' }).click();
  await expect(page.locator('.cell')).toHaveCount(SIZE * SIZE);
  return roundFor(seed, difficulty, levels ?? LEVELS);
}

export const cell = (page, key) => page.locator(`[data-cell="${key}"]`);
export const slot = (page, index) => page.locator(`[data-slot="${index}"]`);
export const message = page => page.locator('[data-message]');
export const result = page => page.locator('[data-result]');
export const draftState = page => page.locator('[data-draft-state]');

export async function clickCells(page, keys) {
  for (const key of keys) await cell(page, key).click();
}

export async function commit(page) {
  await page.getByRole('button', { name: 'Markierung übernehmen' }).click();
}

export async function markByClick(page, keys) {
  await clickCells(page, keys);
  await commit(page);
}

export async function drag(page, fromKey, toKey) {
  await page.locator('[data-board]').evaluate(board => board.scrollIntoView({ block: 'center' }));
  const from = await cell(page, fromKey).boundingBox();
  const to = await cell(page, toKey).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
  await page.mouse.up();
}

export async function dragTarget(page, target) {
  const keys = pathKeys(target);
  await drag(page, keys[0], keys[keys.length - 1]);
}

export async function solve(page) {
  await page.getByRole('button', { name: 'Lösen' }).click();
}

export async function hint(page) {
  await page.getByRole('button', { name: 'Tipp' }).click();
}

export async function hintedCells(page) {
  return page.locator('.cell.hinted').evaluateAll(cells => cells.map(element => element.dataset.cell));
}

export async function expectFound(page, count) {
  await expect(result(page)).toHaveText(`${count} von ${WORDS_PER_ROUND} Wörtern korrekt gefunden.`);
}

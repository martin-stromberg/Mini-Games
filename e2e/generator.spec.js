import { expect, test } from '@playwright/test';
import { DIFFICULTY, MIN_WORD_LENGTH, SIZE, WORDS_PER_ROUND, cell, dragTarget, drag, draftState, expectFound, findSeed, message, openGame, pathKeys, slot, solve } from './support.js';

const gridText = page => page.locator('.cell').allTextContents();

test.describe('Generatorinvarianten', () => {
  for (const difficulty of Object.values(DIFFICULTY)) for (const seed of [1, 42]) {
    test(`seed ${seed} on ${difficulty} renders the generated grid with ten exact word paths`, async ({ page }) => {
      const round = await openGame(page, { seed, difficulty });
      const letters = await gridText(page);
      expect(letters).toHaveLength(SIZE * SIZE);
      expect(letters.every(letter => /^[A-Z]$/.test(letter))).toBe(true);
      expect(letters).toEqual(round.grid.flat());
      await expect(page.locator('.translations li')).toHaveCount(WORDS_PER_ROUND);
      for (const target of round.targets) {
        expect(target.path).toHaveLength(target.english.length);
        expect(target.path.length).toBeGreaterThanOrEqual(MIN_WORD_LENGTH);
        expect(target.path.length).toBeLessThanOrEqual(SIZE);
        expect(target.path.map(position => letters[position.row * SIZE + position.col]).join('')).toBe(target.english);
      }
    });
  }

  test('two seeds vary word selection and fill pattern', async ({ page }) => {
    const first = await openGame(page, { seed: 1 });
    const firstLetters = await gridText(page);
    const firstWords = await page.locator('.translations li').allTextContents();
    const second = await openGame(page, { seed: 2 });
    expect(await gridText(page)).not.toEqual(firstLetters);
    expect(await page.locator('.translations li').allTextContents()).not.toEqual(firstWords);
    expect(second.targets.map(t => t.id)).not.toEqual(first.targets.map(t => t.id));
  });

  test('a two-letter and a thirteen-letter word are generated, marked and solved', async ({ page }) => {
    const levels = ['A1', 'C1'];
    const { seed } = findSeed(round => round.targets.some(t => t.english.length === MIN_WORD_LENGTH) && round.targets.some(t => t.english.length === SIZE), DIFFICULTY.EASY, levels);
    const round = await openGame(page, { seed, levels });
    for (const target of round.targets) await dragTarget(page, target);
    await solve(page);
    await expectFound(page, WORDS_PER_ROUND);
    await expect(message(page)).toHaveText('Geschafft! Alle Wörter sind korrekt markiert.');
  });
});

test.describe('Schwierigkeit', () => {
  test('easy rounds only contain horizontal and vertical words', async ({ page }) => {
    const round = await openGame(page, { seed: 8 });
    await expect(page.locator('.eyebrow')).toHaveText('Einfach');
    for (const target of round.targets) {
      const dr = target.path[1].row - target.path[0].row, dc = target.path[1].col - target.path[0].col;
      expect(dr === 0 || dc === 0).toBe(true);
    }
  });

  test('a diagonal drag is rejected neutrally on easy', async ({ page }) => {
    await openGame(page, { seed: 8 });
    await drag(page, '2,2', '5,5');
    await expect(message(page)).toHaveText('Im einfachen Modus kannst du nur waagerecht oder senkrecht ziehen.');
    await expect(slot(page, 0)).toContainText('leer');
    await expect(draftState(page)).toHaveText('Keine offene Auswahl.');
  });

  test('hard rounds can contain diagonal words that can be marked by a diagonal drag', async ({ page }) => {
    const { seed } = findSeed(round => round.targets.some(t => t.path[1].row !== t.path[0].row && t.path[1].col !== t.path[0].col), DIFFICULTY.HARD);
    const round = await openGame(page, { seed, difficulty: DIFFICULTY.HARD });
    await expect(page.locator('.eyebrow')).toHaveText('Schwierig');
    const diagonal = round.targets.find(t => t.path[1].row !== t.path[0].row && t.path[1].col !== t.path[0].col);
    await dragTarget(page, diagonal);
    await expect(slot(page, 0)).toContainText(`${diagonal.path.length} Felder markiert`);
    await solve(page);
    await expectFound(page, 1);
    await expect(cell(page, pathKeys(diagonal)[0])).toHaveClass(/result-exact/);
  });
});

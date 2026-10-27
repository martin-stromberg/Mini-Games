import { expect, test } from '@playwright/test';
import { WORDS_PER_ROUND, assign, cell, exactSlot, expectFound, findCrossing, findSeed, freeCell, hint, hintedCells, isolatedTargetIndex, markByClick, markTarget, message, openGame, pathKeys, result, roundFor, slot, solve } from './support.js';

const SEED = 21;
const reference = roundFor(SEED);
const first = isolatedTargetIndex(reference, 3);
const second = isolatedTargetIndex(reference, 2, [first]);

test.describe('Kreuzungen und Teilmarkierung', () => {
  test('a single crossing cell is partial and the hint circles a free neighbour of the chosen word', async ({ page }) => {
    const { seed } = findSeed(round => findCrossing(round) !== null);
    const round = await openGame(page, { seed });
    const crossing = findCrossing(round);
    await markByClick(page, [crossing.key], round.targets[crossing.indexes[0]]);
    await solve(page);
    await expect(slot(page, 0)).toContainText('unvollständig');
    await hint(page);
    const keys = pathKeys(round.targets[crossing.indexes[0]]);
    const position = keys.indexOf(crossing.key);
    expect(await hintedCells(page)).toEqual([position > 0 ? keys[position - 1] : keys[position + 1]]);
  });

  test('a selection with a skipped cell is an error and the circle is on a selected cell, not the gap', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[first]);
    await markByClick(page, [keys[0], keys[2]], round.targets[first]);
    await solve(page);
    await expect(slot(page, 0)).toContainText('fehlerhaft');
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Ein falsch markiertes Feld ist eingekreist.');
    expect(await hintedCells(page)).toEqual([keys[2]]);
  });
});

test.describe('Extrafelder und Fehlerpriorität', () => {
  test('an exact word plus a neutral extra cell gives no hit and the hint circles the extra', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const extra = freeCell(round);
    await markByClick(page, [...pathKeys(round.targets[first]), extra], round.targets[first]);
    await solve(page);
    await expectFound(page, 0);
    await hint(page);
    expect(await hintedCells(page)).toEqual([extra]);
  });

  test('an extra cell on another target is circled as well', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const extra = pathKeys(round.targets[second])[0];
    await markByClick(page, [...pathKeys(round.targets[first]), extra], round.targets[first]);
    await solve(page);
    await expectFound(page, 0);
    await hint(page);
    expect(await hintedCells(page)).toEqual([extra]);
  });

  test('two complete words in one slot give no hit and the hint circles a cell of the word outside the chosen translation', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const a = round.targets[first], b = round.targets[second];
    await markByClick(page, [...pathKeys(a), ...pathKeys(b)], a);
    await solve(page);
    await expectFound(page, 0);
    await expect(slot(page, 0)).toContainText('fehlerhaft');
    await hint(page);
    expect(await hintedCells(page)).toEqual([exactSlot(b)[0]]);
  });

  test('the same two words in two separate slots give two hits', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const a = round.targets[first], b = round.targets[second];
    await markTarget(page, a);
    await markTarget(page, b);
    await solve(page);
    await expectFound(page, 2);
  });
});

test.describe('Lösen, Invalidierung und Neustart', () => {
  test('solving a partial round shows only exact hits and highlights open translations', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[second]);
    await markByClick(page, pathKeys(round.targets[first]).slice(0, 2), round.targets[first]);
    await solve(page);
    await expectFound(page, 1);
    await expect(page.locator('.translations .unfound')).toHaveCount(WORDS_PER_ROUND - 1);
    await expect(page.locator('.translations li').nth(second)).toHaveClass('found');
    await expect(cell(page, pathKeys(round.targets[second])[0])).toHaveClass(/result-exact/);
    await expect(cell(page, pathKeys(round.targets[first])[0])).toHaveClass(/result-partial/);
  });

  test('a correction hides the result until the next solve', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const extra = freeCell(round);
    await markByClick(page, [...pathKeys(round.targets[first]), extra], round.targets[first]);
    await solve(page);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await expect(result(page)).toHaveText('Erst „Lösen“ prüft deine Markierungen.');
    await expect(page.locator('.translations .unfound')).toHaveCount(0);
    await cell(page, extra).click();
    await page.getByRole('button', { name: 'Markierung übernehmen' }).click();
    await expect(slot(page, 0)).toContainText('Felder markiert');
    await assign(page, round.targets[first]);
    await solve(page);
    await expectFound(page, 1);
  });

  test('a new round clears slots, draft, hint and result', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[0]);
    await solve(page);
    await hint(page);
    await cell(page, pathKeys(round.targets[1])[0]).click();
    await page.getByRole('button', { name: 'Neue Runde' }).click();
    for (let index = 0; index < WORDS_PER_ROUND; index++) await expect(slot(page, index)).toContainText('leer');
    await expect(page.locator('[data-draft-state]')).toHaveText('Keine offene Auswahl.');
    await expect(page.locator('.cell.hinted, .cell.selected, .cell.marked')).toHaveCount(0);
    await expect(page.locator('.translation.assigned')).toHaveCount(0);
    await expect(result(page)).toHaveText('Erst „Lösen“ prüft deine Markierungen.');
  });
});

import { expect, test } from '@playwright/test';
import { toSortedCellKeys } from '../src/word-search/game.js';
import { cell, dragTarget, markByClick, openGame, pathKeys, slot } from './support.js';

const SEED = 21;
const startCell = target => toSortedCellKeys(pathKeys(target))[0];

test.describe('Nummern der Markierungen', () => {
  test('the first cell of each marking shows the number of its list entry', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await dragTarget(page, round.targets[1]);
    await expect(cell(page, startCell(round.targets[0]))).toHaveAttribute('data-slot-badge', '1');
    await expect(cell(page, startCell(round.targets[1]))).toHaveAttribute('data-slot-badge', '2');
    await expect(cell(page, startCell(round.targets[1]))).toHaveAttribute('aria-label', /Beginn von Markierung 2/);
    await expect(page.locator('[data-slot-badge]')).toHaveCount(2);
    await expect(slot(page, 1).locator('.slot-number')).toHaveText('2');
  });

  test('removing a marking removes its number from the grid', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await page.getByRole('button', { name: 'Markierung 1 entfernen', exact: true }).click();
    await expect(page.locator('[data-slot-badge]')).toHaveCount(0);
  });

  test('hovering a list entry highlights exactly the cells of that marking', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await dragTarget(page, round.targets[1]);
    await slot(page, 1).hover();
    const keys = pathKeys(round.targets[1]);
    await expect(page.locator('.cell.slot-highlight')).toHaveCount(keys.length);
    for (const key of keys) await expect(cell(page, key)).toHaveClass(/slot-highlight/);
    await page.locator('h1').hover();
    await expect(page.locator('.cell.slot-highlight')).toHaveCount(0);
  });

  test('focusing a list entry button highlights its marking for keyboard users', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).focus();
    await expect(page.locator('.cell.slot-highlight')).toHaveCount(round.targets[0].path.length);
  });
});

import { expect, test } from '@playwright/test';
import { WORDS_PER_ROUND, cell, clickCells, commit, draftState, dragTarget, expectFound, exactSlot, hint, hintedCells, markByClick, message, openGame, pathKeys, result, slot, solve } from './support.js';

const SEED = 21;

test.describe('Zehn Markierungen per Klick', () => {
  test('ten click selections stay separate and one solve finds ten targets', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const [index, target] of round.targets.entries()) {
      await clickCells(page, pathKeys(target));
      await expect(draftState(page)).toHaveText(`Noch nicht übernommen: ${target.path.length} Felder.`);
      await commit(page);
      await expect(slot(page, index)).toContainText(`${target.path.length} Felder markiert`);
    }
    await expect(result(page)).toHaveText('Erst „Lösen“ prüft deine Markierungen.');
    await expect(page.locator('.translations .found, .translations .unfound, .cell[class*=result-]')).toHaveCount(0);
    await solve(page);
    await expectFound(page, WORDS_PER_ROUND);
    for (let index = 0; index < WORDS_PER_ROUND; index++) await expect(slot(page, index)).toContainText('korrekt');
  });

  test('committed markings stay visible in the grid without revealing correctness', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    for (const key of pathKeys(round.targets[0])) {
      await expect(cell(page, key)).toHaveClass(/marked/);
      await expect(cell(page, key)).not.toHaveClass(/result-/);
    }
  });
});

test.describe('Zehn Markierungen per Drag', () => {
  test('ten separate drags create ten slots and one solve finds ten targets', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const [index, target] of round.targets.entries()) {
      await dragTarget(page, target);
      await expect(slot(page, index)).toContainText(`${target.path.length} Felder markiert`);
      await expect(draftState(page)).toHaveText('Keine offene Auswahl.');
    }
    await solve(page);
    await expectFound(page, WORDS_PER_ROUND);
  });

  test('a drag shows a live preview of the straight path while the pointer is down', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[0]);
    await page.locator('[data-board]').evaluate(board => board.scrollIntoView({ block: 'center' }));
    const from = await cell(page, keys[0]).boundingBox();
    const to = await cell(page, keys[keys.length - 1]).boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
    await expect(page.locator('.cell.preview')).toHaveCount(keys.length);
    await page.mouse.up();
    await expect(page.locator('.cell.preview')).toHaveCount(0);
  });
});

test.describe('Zwei Wörter, Pflege und Duplikate', () => {
  test('two click words and two drag words are each solved separately with two hits', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await markByClick(page, pathKeys(round.targets[1]));
    await solve(page);
    await expectFound(page, 2);
    await page.getByRole('button', { name: 'Markierung 1 entfernen', exact: true }).click();
    await page.getByRole('button', { name: 'Markierung 2 entfernen', exact: true }).click();
    await dragTarget(page, round.targets[2]);
    await dragTarget(page, round.targets[3]);
    await solve(page);
    await expectFound(page, 2);
    const found = page.locator('.translations .found');
    await expect(found).toHaveCount(2);
    await expect(found.nth(0)).toContainText(round.targets[2].german);
    await expect(found.nth(1)).toContainText(round.targets[3].german);
  });

  test('changing affects exactly the chosen slot', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await markByClick(page, pathKeys(round.targets[1]));
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await cell(page, pathKeys(round.targets[0])[0]).click();
    await commit(page);
    await expect(slot(page, 0)).toContainText(`${round.targets[0].path.length - 1} Felder markiert`);
    await expect(slot(page, 1)).toContainText(`${round.targets[1].path.length} Felder markiert`);
  });

  test('removing affects exactly the chosen slot', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await markByClick(page, pathKeys(round.targets[1]));
    await page.getByRole('button', { name: 'Markierung 2 entfernen', exact: true }).click();
    await expect(slot(page, 1)).toContainText('leer');
    await expect(slot(page, 0)).toContainText(`${round.targets[0].path.length} Felder markiert`);
  });

  test('a duplicate exact marking counts once and the hint points to the next open target', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    await markByClick(page, pathKeys(round.targets[0]));
    await solve(page);
    await expectFound(page, 1);
    await expect(slot(page, 1)).toContainText('korrekt, doppelt');
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Ein noch fehlendes Feld ist eingekreist.');
    const marked = new Set(exactSlot(round.targets[0]));
    const expected = round.targets.slice(1).map(pathKeys).flat().find(key => !marked.has(key));
    expect(await hintedCells(page)).toEqual([expected]);
  });
});

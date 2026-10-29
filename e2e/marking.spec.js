import { expect, test } from '@playwright/test';
import { WORDS_PER_ROUND, assign, cell, clickCells, commit, draftState, dragTarget, expectFound, exactSlot, hint, hintedCells, markTarget, message, openGame, pathKeys, result, slot, solve, startDrag } from './support.js';

const SEED = 21;

test.describe('Zehn Markierungen per Klick', () => {
  test('ten click selections stay separate and one solve finds ten targets', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const [index, target] of round.targets.entries()) {
      await clickCells(page, pathKeys(target));
      await expect(draftState(page)).toHaveText(`Noch nicht übernommen: ${target.path.length} Felder.`);
      await commit(page);
      await expect(slot(page, index)).toContainText(`${target.path.length} Felder markiert – Übersetzung fehlt`);
      await assign(page, target);
      await expect(slot(page, index)).toContainText(`${target.path.length} Felder markiert – „${target.german}“`);
    }
    await expect(result(page)).toHaveText('Erst „Lösen“ prüft deine Markierungen.');
    await expect(page.locator('.translations .found, .translations .unfound, .cell[class*=result-]')).toHaveCount(0);
    await solve(page);
    await expectFound(page, WORDS_PER_ROUND);
    for (let index = 0; index < WORDS_PER_ROUND; index++) await expect(slot(page, index)).toContainText('korrekt');
  });

  test('committed markings stay visible in the grid without revealing correctness', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[0]);
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
      await expect(slot(page, index)).toContainText(`${target.path.length} Felder markiert – „${target.german}“`);
      await expect(draftState(page)).toHaveText('Keine offene Auswahl.');
    }
    await solve(page);
    await expectFound(page, WORDS_PER_ROUND);
  });

  test('a drag shows a live preview of the straight path while the pointer is down', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[0]);
    await startDrag(page, keys[0], keys[keys.length - 1]);
    await expect(page.locator('.cell.preview')).toHaveCount(keys.length);
    await page.mouse.up();
    await expect(page.locator('.cell.preview')).toHaveCount(0);
  });
});

test.describe('Zwei Wörter, Pflege und Duplikate', () => {
  test('two click words are solved separately with two hits', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[0]);
    await markTarget(page, round.targets[1]);
    await solve(page);
    await expectFound(page, 2);
    const found = page.locator('.translations .found');
    await expect(found).toHaveCount(2);
    await expect(found.nth(0)).toContainText(round.targets[0].german);
    await expect(found.nth(1)).toContainText(round.targets[1].german);
  });

  test('two drag words are solved separately with two hits', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
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
    await markTarget(page, round.targets[0]);
    await markTarget(page, round.targets[1]);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await cell(page, pathKeys(round.targets[0])[0]).click();
    await commit(page);
    await expect(slot(page, 0)).toContainText(`${round.targets[0].path.length - 1} Felder markiert`);
    await expect(slot(page, 1)).toContainText(`${round.targets[1].path.length} Felder markiert`);
  });

  test('removing affects exactly the chosen slot', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[0]);
    await markTarget(page, round.targets[1]);
    await page.getByRole('button', { name: 'Markierung 2 entfernen', exact: true }).click();
    await expect(slot(page, 1)).toContainText('leer');
    await expect(slot(page, 0)).toContainText(`${round.targets[0].path.length} Felder markiert`);
  });

  test('a duplicate marking counts once and after removing it the hint points to the next open target', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[0]);
    // Die Übersetzung von Wort 0 ist schon vergeben; das Duplikat bekommt zwangsläufig eine andere.
    await clickCells(page, pathKeys(round.targets[0]));
    await commit(page);
    await assign(page, round.targets[1]);
    await solve(page);
    await expectFound(page, 1);
    await expect(slot(page, 1)).toContainText('Wort gefunden, aber falsche Übersetzung');
    await page.getByRole('button', { name: 'Markierung 2 entfernen', exact: true }).click();
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Ein noch fehlendes Feld ist eingekreist.');
    const marked = new Set(exactSlot(round.targets[0]));
    const expected = round.targets.slice(1).map(pathKeys).flat().find(key => !marked.has(key));
    expect(await hintedCells(page)).toEqual([expected]);
  });
});

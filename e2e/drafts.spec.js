import { expect, test } from '@playwright/test';
import { WORDS_PER_ROUND, assign, cell, clickCells, commit, draftState, drag, dragTarget, expectFound, freeCell, hint, hintedCells, isolatedTargetIndex, markByClick, markTarget, message, openGame, pathKeys, result, roundFor, slot, solve } from './support.js';

const SEED = 21;
const reference = roundFor(SEED);
const isolated = isolatedTargetIndex(reference, 3);
const other = isolated === 0 ? 1 : 0;

test.describe('Entwurfsübergänge', () => {
  test('solve commits an open new click selection into the next slot and solves once its translation is chosen', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await clickCells(page, pathKeys(round.targets[0]));
    await solve(page);
    await expect(slot(page, 0)).toContainText(`${round.targets[0].path.length} Felder markiert – Übersetzung fehlt`);
    await expect(result(page)).toHaveText('Erst „Lösen“ prüft deine Markierungen.');
    await assign(page, round.targets[0]);
    await solve(page);
    await expect(slot(page, 0)).toContainText('korrekt');
    await expect(draftState(page)).toHaveText('Keine offene Auswahl.');
    await expectFound(page, 1);
  });

  test('solve replaces exactly the slot that is being changed', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[isolated]).slice(0, 2), round.targets[isolated]);
    await markTarget(page, round.targets[other]);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await clickCells(page, pathKeys(round.targets[isolated]).slice(2));
    await solve(page);
    await expect(slot(page, 0)).toContainText(`${round.targets[isolated].path.length} Felder markiert – Übersetzung fehlt`);
    await expect(slot(page, 1)).toContainText(`„${round.targets[other].german}“`);
    await assign(page, round.targets[isolated]);
    await solve(page);
    await expect(slot(page, 0)).toContainText('korrekt');
    await expect(slot(page, 1)).toContainText('korrekt');
    await expectFound(page, 2);
  });

  test('an emptied change keeps the previous slot when solving', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[0]);
    await markByClick(page, keys, round.targets[0]);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await clickCells(page, keys);
    await expect(draftState(page)).toContainText('noch nicht übernommen: 0 Felder');
    await solve(page);
    await expect(slot(page, 0)).toContainText('korrekt');
    await expectFound(page, 1);
  });

  test('hint is blocked with an open selection and changes neither selection nor slots', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[1]);
    await clickCells(page, pathKeys(round.targets[0]).slice(0, 2));
    await hint(page);
    await expect(message(page)).toHaveText('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du einen Tipp nutzt.');
    await expect(draftState(page)).toHaveText('Noch nicht übernommen: 2 Felder.');
    await expect(slot(page, 0)).toContainText(`${round.targets[1].path.length} Felder markiert`);
    await expect(slot(page, 1)).toContainText('leer');
    expect(await hintedCells(page)).toEqual([]);
  });

  test('dragging during an open click selection is blocked without losing anything', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await clickCells(page, [pathKeys(round.targets[0])[0]]);
    await dragTarget(page, round.targets[1], null);
    await expect(message(page)).toHaveText('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du ziehst.');
    await expect(draftState(page)).toHaveText('Noch nicht übernommen: 1 Feld.');
    await expect(slot(page, 0)).toContainText('leer');
  });

  test('dragging during an open change is blocked without losing anything', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markTarget(page, round.targets[0]);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await dragTarget(page, round.targets[1], null);
    await expect(message(page)).toHaveText('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du ziehst.');
    await expect(draftState(page)).toContainText(`Markierung 1 wird geändert – noch nicht übernommen: ${round.targets[0].path.length} Felder`);
  });

  test('"Neu ziehen" replaces exactly the chosen slot and discarding keeps it', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await dragTarget(page, round.targets[0]);
    await dragTarget(page, round.targets[1]);
    await page.getByRole('button', { name: 'Markierung 1 neu ziehen', exact: true }).click();
    await page.getByRole('button', { name: 'Auswahl verwerfen' }).click();
    await page.getByRole('button', { name: 'Markierung 1 neu ziehen', exact: true }).click();
    await dragTarget(page, round.targets[2]);
    await expect(slot(page, 0)).toContainText(`${round.targets[2].path.length} Felder markiert`);
    await expect(slot(page, 1)).toContainText(`${round.targets[1].path.length} Felder markiert`);
    await expect(slot(page, 2)).toContainText('leer');
    await solve(page);
    await expectFound(page, 2);
    await expect(page.locator('.translations li').nth(0)).toHaveClass('unfound');
  });

  test('with all slots full and a new selection, solve is blocked and asks to change, remove or discard', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const target of round.targets) await dragTarget(page, target);
    await cell(page, freeCell(round)).click();
    await solve(page);
    await expect(message(page)).toHaveText(`Alle ${WORDS_PER_ROUND} Markierungen sind belegt. Ändere oder entferne eine Markierung oder verwirf die offene Auswahl.`);
    await expect(page.locator('[data-result]')).toHaveText('Erst „Lösen“ prüft deine Markierungen.');
    await expect(draftState(page)).toHaveText('Noch nicht übernommen: 1 Feld.');
  });

  test('with all slots full and an open selection, a drag is blocked by the open selection', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const target of round.targets) await dragTarget(page, target);
    await cell(page, freeCell(round)).click();
    await drag(page, '0,0', '0,1');
    await expect(message(page)).toHaveText('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du ziehst.');
    await expect(draftState(page)).toHaveText('Noch nicht übernommen: 1 Feld.');
  });

  test('with all slots full and no open selection, a drag is blocked and asks to free a slot', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const target of round.targets) await dragTarget(page, target);
    await drag(page, '0,0', '0,1');
    await expect(message(page)).toHaveText(`Alle ${WORDS_PER_ROUND} Markierungen sind belegt. Entferne oder ändere zuerst eine Markierung.`);
  });

  test('a wrong selection is corrected by clicking the extra away and adding the missing cell', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[isolated]);
    const extra = freeCell(round);
    await markByClick(page, [...keys.slice(0, -1), extra], round.targets[isolated]);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await cell(page, extra).click();
    await cell(page, keys[keys.length - 1]).click();
    await commit(page);
    await assign(page, round.targets[isolated]);
    await solve(page);
    await expect(slot(page, 0)).toContainText('korrekt');
    await expectFound(page, 1);
  });
});

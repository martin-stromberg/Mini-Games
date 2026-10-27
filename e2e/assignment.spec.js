import { expect, test } from '@playwright/test';
import { assign, assignPrompt, cell, clickCells, commit, draftState, drag, dragTarget, exactSlot, expectFound, freeCell, hint, hintedCells, markByClick, markTarget, message, openGame, pathKeys, result, slot, solve, translation } from './support.js';

const SEED = 21;
const NOT_SOLVED = 'Erst „Lösen“ prüft deine Markierungen.';

// Blockierte Aktionen setzen dieselbe Meldung erneut; der Text wird vorher geleert, damit jede Aktion sie nachweislich selbst zeigt.
const clearMessage = page => message(page).evaluate(element => { element.textContent = ''; });

test.describe('Übersetzung zuordnen', () => {
  test('after a marking the prompt appears and choosing a translation shows it bold with the marking number', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [target] = round.targets;
    await dragTarget(page, target, null);
    await expect(message(page)).toHaveText('Markierung 1 gespeichert. Wähle jetzt die passende deutsche Übersetzung.');
    await expect(assignPrompt(page)).toHaveText('Welche Übersetzung gehört zu Markierung 1?');
    await expect(slot(page, 0)).toContainText(`${target.path.length} Felder markiert – Übersetzung fehlt`);
    await assign(page, target);
    await expect(assignPrompt(page)).toHaveCount(0);
    await expect(translation(page, target)).toHaveClass(/assigned/);
    await expect(translation(page, target)).toHaveCSS('font-weight', '700');
    await expect(translation(page, target).locator('.slot-number')).toHaveText('1');
    await expect(translation(page, target)).toHaveAttribute('aria-pressed', 'true');
    await expect(translation(page, target)).toHaveAttribute('aria-label', `${target.german}, zugeordnet zu Markierung 1`);
    await expect(slot(page, 0)).toContainText(`${target.path.length} Felder markiert – „${target.german}“`);
    await expect(page.locator('.translation.assigned')).toHaveCount(1);
  });

  test('without a chosen translation further cell clicks, drags, hint and solve are blocked and change nothing', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await markByClick(page, pathKeys(round.targets[0]));
    const blocked = 'Wähle zuerst die deutsche Übersetzung zu Markierung 1.';
    const actions = [
      () => cell(page, freeCell(round)).click(),
      () => drag(page, pathKeys(round.targets[1])[0], pathKeys(round.targets[1]).at(-1)),
      () => hint(page),
      () => solve(page)
    ];
    for (const action of actions) {
      await clearMessage(page);
      await action();
      await expect(message(page)).toHaveText(blocked);
    }
    await expect(draftState(page)).toHaveText('Keine offene Auswahl.');
    await expect(page.locator('.cell.selected, .cell.hinted')).toHaveCount(0);
    await expect(slot(page, 0)).toContainText('Übersetzung fehlt');
    await expect(slot(page, 1)).toContainText('leer');
    await expect(result(page)).toHaveText(NOT_SOLVED);
    await expect(assignPrompt(page)).toHaveText('Welche Übersetzung gehört zu Markierung 1?');
  });

  test('a translation that already belongs to another marking is rejected and keeps its assignment', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [first, second] = round.targets;
    await markTarget(page, first);
    await dragTarget(page, second, null);
    await assign(page, first);
    await expect(message(page)).toHaveText(`„${first.german}“ ist schon Markierung 1 zugeordnet. Wähle eine andere Übersetzung oder entferne bzw. ändere Markierung 1.`);
    await expect(translation(page, first).locator('.slot-number')).toHaveText('1');
    await expect(slot(page, 0)).toContainText(`„${first.german}“`);
    await expect(slot(page, 1)).toContainText('Übersetzung fehlt');
    await expect(assignPrompt(page)).toHaveText('Welche Übersetzung gehört zu Markierung 2?');
  });

  test('removing a marking frees its translation for another marking', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [first, second] = round.targets;
    await markTarget(page, first);
    await page.getByRole('button', { name: 'Markierung 1 entfernen', exact: true }).click();
    await expect(translation(page, first)).not.toHaveClass(/assigned/);
    await expect(translation(page, first)).toHaveAttribute('aria-pressed', 'false');
    await expect(translation(page, first).locator('.slot-number')).toHaveCount(0);
    await dragTarget(page, second, first);
    await expect(slot(page, 0)).toContainText(`„${first.german}“`);
    await expect(translation(page, first).locator('.slot-number')).toHaveText('1');
  });

  test('removing the marking that waits for its translation ends the prompt', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await dragTarget(page, round.targets[0], null);
    await page.getByRole('button', { name: 'Markierung 1 entfernen', exact: true }).click();
    await expect(assignPrompt(page)).toHaveCount(0);
    await expect(message(page)).toHaveText('Markierung 1 entfernt.');
    await cell(page, freeCell(round)).click();
    await expect(draftState(page)).toHaveText('Noch nicht übernommen: 1 Feld.');
  });

  test('changing a marking asks for its translation again', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [target] = round.targets;
    await markTarget(page, target);
    await page.getByRole('button', { name: 'Markierung 1 ändern', exact: true }).click();
    await commit(page);
    await expect(message(page)).toHaveText('Markierung 1 gespeichert. Wähle jetzt die passende deutsche Übersetzung.');
    await expect(assignPrompt(page)).toHaveText('Welche Übersetzung gehört zu Markierung 1?');
    await expect(slot(page, 0)).toContainText('Übersetzung fehlt');
    await expect(translation(page, target)).not.toHaveClass(/assigned/);
    await assign(page, target);
    await expect(slot(page, 0)).toContainText(`„${target.german}“`);
  });

  test('the right word with the wrong translation is reported after solving and its translation stays unfound', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [word, other] = round.targets;
    await dragTarget(page, word, other);
    await solve(page);
    await expectFound(page, 0);
    await expect(slot(page, 0)).toContainText('Wort gefunden, aber falsche Übersetzung');
    await expect(page.locator('.translations li').nth(0)).toHaveClass('unfound');
    await expect(page.locator('.translations li').nth(1)).toHaveClass('unfound');
    for (const key of pathKeys(word)) await expect(cell(page, key)).toHaveClass(/result-mismatch/);
  });

  test('the hint circles the start cell of a marking with the wrong translation', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [word, other] = round.targets;
    await dragTarget(page, word, other);
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Die Markierung, die am eingekreisten Feld beginnt, gehört zu einer anderen Übersetzung.');
    expect(await hintedCells(page)).toEqual([exactSlot(word)[0]]);
  });

  test('solve with an open click selection saves it and asks for the translation before solving', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const [target] = round.targets;
    await clickCells(page, pathKeys(target));
    await solve(page);
    await expect(message(page)).toHaveText('Markierung 1 gespeichert. Wähle die passende deutsche Übersetzung und klicke dann erneut auf „Lösen“.');
    await expect(assignPrompt(page)).toHaveText('Welche Übersetzung gehört zu Markierung 1?');
    await expect(draftState(page)).toHaveText('Keine offene Auswahl.');
    await expect(slot(page, 0)).toContainText(`${target.path.length} Felder markiert – Übersetzung fehlt`);
    await expect(result(page)).toHaveText(NOT_SOLVED);
  });
});

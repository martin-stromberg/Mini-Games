import { expect, test } from '@playwright/test';
import { cell, clickCells, dragTarget, freeCell, hint, hintedCells, isolatedTargetIndex, markByClick, message, openGame, pathKeys, roundFor, slot } from './support.js';

const SEED = 91;
const reference = roundFor(SEED);
const isolated = isolatedTargetIndex(reference, 4);

test.describe('Tipp ohne falschen Kreis', () => {
  test('a wrong slot takes precedence over missing cells of other slots', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const extra = freeCell(round);
    await markByClick(page, pathKeys(round.targets[isolated]).slice(0, 2));
    await markByClick(page, [...pathKeys(round.targets[0 === isolated ? 1 : 0]), extra]);
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Ein falsch markiertes Feld ist eingekreist.');
    expect(await hintedCells(page)).toEqual([extra]);
  });

  test('an incomplete line only gets a neighbour that is not selected in any slot', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[isolated]);
    await markByClick(page, keys.slice(0, 2));
    await markByClick(page, [keys[2]]);
    await hint(page);
    expect(await hintedCells(page)).toEqual([keys[3]]);
  });

  test('without free target neighbours the next open target is used', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const keys = pathKeys(round.targets[isolated]);
    await markByClick(page, keys.slice(0, 2));
    await markByClick(page, keys.slice(2));
    await hint(page);
    const marked = new Set(keys);
    const next = round.targets.find((target, index) => index !== isolated && pathKeys(target).some(key => !marked.has(key)));
    expect(await hintedCells(page)).toEqual([pathKeys(next).find(key => !marked.has(key))]);
  });

  test('the next input removes the hint circle', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await hint(page);
    expect(await hintedCells(page)).toEqual([pathKeys(round.targets[0])[0]]);
    await cell(page, freeCell(round)).click();
    expect(await hintedCells(page)).toEqual([]);
  });

  test('an open selection only produces a neutral prompt', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    await clickCells(page, [pathKeys(round.targets[0])[0]]);
    await hint(page);
    await expect(message(page)).toHaveText('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du einen Tipp nutzt.');
    expect(await hintedCells(page)).toEqual([]);
    await expect(slot(page, 0)).toContainText('leer');
  });

  test('ten exact slots before the first solve give no field hint', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    for (const target of round.targets) await dragTarget(page, target);
    await hint(page);
    await expect(message(page)).toHaveText('Für den aktuellen Stand gibt es keinen weiteren Feldhinweis.');
    expect(await hintedCells(page)).toEqual([]);
    for (let index = 0; index < 10; index++) await expect(slot(page, index)).toContainText('Felder markiert');
  });
});

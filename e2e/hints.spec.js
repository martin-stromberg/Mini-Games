import { expect, test } from '@playwright/test';
import { WORDS_PER_ROUND, cell, cellOwners, clickCells, dragTarget, findSeed, freeCell, hint, hintedCells, isolatedTargetIndex, markByClick, markTarget, message, openGame, pathKeys, roundFor, slot } from './support.js';

const SEED = 91;
const reference = roundFor(SEED);
const isolated = isolatedTargetIndex(reference, 4);

// Jede Übersetzung gehört zu höchstens einer Markierung. Damit ein Nachbarfeld von Wort a schon in einer
// anderen Markierung liegt, wird ein kreuzendes Wort b exakt markiert; fits prüft die Lage der Kreuzung in a.
function crossingWith(round, fits) {
  for (const [key, indexes] of cellOwners(round)) {
    if (indexes.length !== 2) continue;
    for (const [a, b] of [indexes, [...indexes].reverse()]) {
      const keys = pathKeys(round.targets[a]);
      const position = keys.indexOf(key);
      if (fits(keys, position, new Set(pathKeys(round.targets[b])))) return { a, b, keys, position };
    }
  }
  return null;
}

async function openCrossingRound(page, fits) {
  const { seed } = findSeed(round => crossingWith(round, fits) !== null);
  const round = await openGame(page, { seed });
  return { round, ...crossingWith(round, fits) };
}

test.describe('Tipp ohne falschen Kreis', () => {
  test('a wrong slot takes precedence over missing cells of other slots', async ({ page }) => {
    const round = await openGame(page, { seed: SEED });
    const extra = freeCell(round);
    const other = round.targets[isolated === 0 ? 1 : 0];
    await markByClick(page, pathKeys(round.targets[isolated]).slice(0, 2), round.targets[isolated]);
    await markByClick(page, [...pathKeys(other), extra], other);
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Ein falsch markiertes Feld ist eingekreist.');
    expect(await hintedCells(page)).toEqual([extra]);
  });

  test('an incomplete line only gets a neighbour that is not selected in any slot', async ({ page }) => {
    // Das Feld vor der Teilmarkierung ist die Kreuzung mit b und damit schon markiert.
    const { round, a, b, keys, position } = await openCrossingRound(page, (keys, position, other) =>
      position + 2 < keys.length && !other.has(keys[position + 1]) && !other.has(keys[position + 2]));
    await markTarget(page, round.targets[b]);
    await markByClick(page, [keys[position + 1]], round.targets[a]);
    await hint(page);
    await expect(message(page)).toHaveText('Tipp: Ein noch fehlendes Feld ist eingekreist.');
    expect(await hintedCells(page)).toEqual([keys[position + 2]]);
  });

  test('without free target neighbours the next open target is used', async ({ page }) => {
    // a ist bis auf die Kreuzung an seinem Rand markiert; die Kreuzung liegt in der Markierung von b.
    const { round, a, b, keys } = await openCrossingRound(page, (keys, position, other) =>
      keys.length >= 3 && (position === 0 || position === keys.length - 1) && keys.filter(key => other.has(key)).length === 1);
    await markTarget(page, round.targets[b]);
    await markByClick(page, keys.filter(key => !pathKeys(round.targets[b]).includes(key)), round.targets[a]);
    await hint(page);
    const marked = new Set([...keys, ...pathKeys(round.targets[b])]);
    const next = round.targets.find((target, index) => index !== b && pathKeys(target).some(key => !marked.has(key)));
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
    for (let index = 0; index < WORDS_PER_ROUND; index++) await expect(slot(page, index)).toContainText('Felder markiert');
  });
});

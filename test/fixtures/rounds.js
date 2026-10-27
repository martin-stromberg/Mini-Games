import { readFileSync } from 'node:fs';
import { DIFFICULTY, LEVELS, SIZE, coordKey, generateRound, pathKeys, seededRandom, toSortedCellKeys, validateVocabulary } from '../../src/word-search/game.js';

export const rawVocabulary = JSON.parse(readFileSync(new URL('../../public/data/vocabulary.json', import.meta.url), 'utf8'));
export const vocabulary = validateVocabulary(rawVocabulary);

export const roundFor = (seed, difficulty = DIFFICULTY.EASY, levels = LEVELS) => generateRound(vocabulary, levels, difficulty, seededRandom(seed));
export { pathKeys };
export const exactSlot = target => toSortedCellKeys(target.path);

export function cellOwners(round) {
  const owners = new Map();
  round.targets.forEach((target, index) => pathKeys(target).forEach(key => owners.set(key, [...(owners.get(key) || []), index])));
  return owners;
}

export function isolatedTargetIndex(round, minLength, exclude = []) {
  const owners = cellOwners(round);
  return round.targets.findIndex((target, index) => !exclude.includes(index) && target.path.length >= minLength && pathKeys(target).every(key => owners.get(key).length === 1));
}

export function freeCell(round) {
  const owners = cellOwners(round);
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) if (!owners.has(coordKey({ row, col }))) return coordKey({ row, col });
  throw new Error('Kein freies Feld gefunden.');
}

export function findCrossing(round) {
  for (const [key, indexes] of cellOwners(round)) if (indexes.length > 1) return { key, indexes };
  return null;
}

export function findSeed(predicate, difficulty = DIFFICULTY.EASY, levels = LEVELS) {
  for (let seed = 1; seed < 5000; seed++) {
    const round = roundFor(seed, difficulty, levels);
    if (predicate(round)) return { seed, round };
  }
  throw new Error('Keine passende Saat gefunden.');
}

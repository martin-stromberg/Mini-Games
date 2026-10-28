import { LEVELS, germanKey, validateVocabulary, vocabularyFile } from '../shared/vocabulary.js';
import { seededRandom, shuffle } from '../shared/random.js';

// Gemeinsame Bausteine bleiben hier verfügbar, damit Tests und Skripte sie weiter aus game.js beziehen können.
export { LEVELS, germanKey, seededRandom, validateVocabulary, vocabularyFile };

export const SIZE = 13;
export const MIN_WORD_LENGTH = 2;
export const WORDS_PER_ROUND = 10;
export const MAX_GENERATION_ATTEMPTS = 120;
export const DIFFICULTY = Object.freeze({ EASY: 'easy', HARD: 'hard' });
export const STORAGE_KEY = 'mini-games.word-search.levels';

export const coordKey = ({ row, col }) => `${row},${col}`;
export const pathKeys = target => target.path.map(coordKey);
export const parseKey = key => {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
};
export const toSortedCellKeys = cells => [...new Set([...cells].map(cell => typeof cell === 'string' ? cell : coordKey(cell)))].sort((a, b) => {
  const x = parseKey(a), y = parseKey(b);
  return x.row - y.row || x.col - y.col;
});
export const WORD_PATTERN = new RegExp(`^[A-Z]{${MIN_WORD_LENGTH},${SIZE}}$`);
export const normalizeWord = word => String(word || '').trim().toUpperCase();
// Englische Verben stehen im Bestand als Infinitiv mit „to“; im Gitter steht nur das Verb.
export const toGridWord = english => normalizeWord(String(english || '').trim().replace(/^to\s+/i, ''));

// Wählt die Einträge, die als Wort ins Gitter passen. `english` ist danach das Gitterwort (A–Z, Großbuchstaben).
export function toPuzzleWords(vocabulary) {
  const seen = new Set();
  return vocabulary.flatMap(entry => {
    const word = toGridWord(entry.english);
    if (!WORD_PATTERN.test(word) || seen.has(word)) return [];
    seen.add(word);
    return [{ ...entry, english: word }];
  });
}

// Zieht bis zu `count` Wörter mit unterschiedlichen deutschen Übersetzungen, damit jede Übersetzung eindeutig zuordenbar ist.
function pickWords(pool, rng, count) {
  const usedGerman = new Set();
  const chosen = [];
  for (const item of shuffle(pool, rng)) {
    if (usedGerman.has(germanKey(item.german))) continue;
    usedGerman.add(germanKey(item.german));
    chosen.push(item);
    if (chosen.length === count) break;
  }
  return chosen;
}


const directionsFor = difficulty => difficulty === DIFFICULTY.HARD ? [[0, 1], [1, 0], [1, 1], [1, -1]] : [[0, 1], [1, 0]];

function placementCandidates(grid, word, directions) {
  const size = grid.length;
  const candidates = [];
  for (const [dr, dc] of directions) for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    const endRow = row + dr * (word.length - 1), endCol = col + dc * (word.length - 1);
    if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
    const path = Array.from({ length: word.length }, (_, i) => ({ row: row + dr * i, col: col + dc * i }));
    if (path.every((cell, i) => !grid[cell.row][cell.col] || grid[cell.row][cell.col] === word[i])) candidates.push(path);
  }
  return candidates;
}

function tryPlaceWords(chosen, directions, rng, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placed = new Map();
  for (const item of [...chosen].sort((a, b) => b.english.length - a.english.length)) {
    const candidates = placementCandidates(grid, item.english, directions);
    if (!candidates.length) return null;
    const path = candidates[Math.floor(rng() * candidates.length)];
    path.forEach((cell, i) => { grid[cell.row][cell.col] = item.english[i]; });
    placed.set(item.id, path);
  }
  return { grid, placed };
}

export function generateRound(vocabulary, selectedLevels = LEVELS, difficulty = DIFFICULTY.EASY, rng = Math.random, { size = SIZE } = {}) {
  const pool = toPuzzleWords(validateVocabulary(vocabulary)).filter(item => selectedLevels.includes(item.level));
  const chosen = pickWords(pool, rng, WORDS_PER_ROUND);
  if (chosen.length < WORDS_PER_ROUND) throw new Error(`Für die Auswahl stehen nur ${chosen.length} geeignete Wörter bereit; mindestens ${WORDS_PER_ROUND} sind nötig.`);
  const directions = directionsFor(difficulty);
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const placement = tryPlaceWords(chosen, directions, rng, size);
    if (!placement) continue;
    const { grid, placed } = placement;
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) if (!grid[row][col]) grid[row][col] = String.fromCharCode(65 + Math.floor(rng() * 26));
    return { grid, difficulty, targets: chosen.map(item => ({ ...item, path: placed.get(item.id) })) };
  }
  throw new Error('Das Rätsel konnte nach mehreren Versuchen nicht erzeugt werden. Bitte starte eine neue Runde.');
}

const equalSortedKeys = (a, b) => a.length === b.length && a.every((key, index) => key === b[index]);

function longestContiguousSegment(selected, target) {
  const keys = pathKeys(target);
  let best = [];
  for (let start = 0; start < keys.length; start++) {
    const segment = [];
    for (let end = start; end < keys.length && selected.includes(keys[end]); end++) {
      segment.push(keys[end]);
      if (segment.length > best.length) best = [...segment];
    }
  }
  return best;
}

function classifySlot(slot, slotIndex, allTargets, found, assignedId) {
  if (!slot?.length) return { kind: 'empty', slotIndex, candidates: [], extras: [] };
  const selected = toSortedCellKeys(slot);
  const assigned = allTargets.find(target => target.id === assignedId);
  const targets = assigned ? [assigned] : allTargets;
  if (assigned && !equalSortedKeys(selected, toSortedCellKeys(assigned.path))) {
    const other = allTargets.find(target => equalSortedKeys(selected, toSortedCellKeys(target.path)));
    if (other) return { kind: 'mismatch', slotIndex, candidates: [other.id], extras: [] };
  }
  const exactCandidates = targets.filter(target => equalSortedKeys(selected, toSortedCellKeys(target.path)));
  if (exactCandidates.length) {
    const target = exactCandidates.find(candidate => !found.has(candidate.id));
    if (target) found.add(target.id);
    return { kind: 'exact', slotIndex, candidates: exactCandidates.map(x => x.id), targetId: target?.id, extras: [] };
  }
  const partialCandidates = targets.filter(target => {
    const path = pathKeys(target);
    return selected.length < path.length && path.some((_, start) => equalSortedKeys(selected, toSortedCellKeys(path.slice(start, start + selected.length))));
  });
  if (partialCandidates.length) return { kind: 'partial', slotIndex, candidates: partialCandidates.map(x => x.id), extras: [] };
  let bestSegment = [];
  for (const target of targets) {
    const segment = longestContiguousSegment(selected, target);
    if (segment.length > bestSegment.length) bestSegment = segment;
  }
  const segmentSet = new Set(bestSegment);
  return { kind: 'error', slotIndex, candidates: [], extras: selected.filter(key => !segmentSet.has(key)) };
}

// assignments[i] ist die id der Übersetzung, die der Spieler Markierung i zugeordnet hat.
// Mit Zuordnung zählt eine Markierung nur, wenn sie genau das Wort dieser Übersetzung trifft.
export function classifySlots(slots, targets, assignments = []) {
  const found = new Set();
  const classifications = slots.map((slot, slotIndex) => classifySlot(slot, slotIndex, targets, found, assignments[slotIndex]));
  return { classifications, found };
}

function missingNeighbour(slot, target, globallyMarked) {
  const selected = new Set(slot);
  const path = pathKeys(target);
  const indexes = path.map((cell, index) => selected.has(cell) ? index : -1).filter(index => index >= 0);
  return [indexes[0] - 1, indexes[indexes.length - 1] + 1]
    .filter(index => index >= 0 && index < path.length)
    .map(index => path[index])
    .find(candidate => !globallyMarked.has(candidate));
}

export function getHint(slots, targets, assignments = []) {
  const result = classifySlots(slots, targets, assignments);
  const globallyMarked = new Set(slots.flatMap(slot => slot || []));
  const bad = result.classifications.find(item => item.kind === 'error');
  if (bad) return { type: 'error', cell: bad.extras[0], result };
  const mismatch = result.classifications.find(item => item.kind === 'mismatch');
  if (mismatch) return { type: 'mismatch', cell: toSortedCellKeys(slots[mismatch.slotIndex])[0], result };
  for (const partial of result.classifications.filter(item => item.kind === 'partial')) for (const id of partial.candidates) {
    const cell = missingNeighbour(slots[partial.slotIndex], targets.find(item => item.id === id), globallyMarked);
    if (cell) return { type: 'missing', cell, result };
  }
  for (const target of targets) if (!result.found.has(target.id)) {
    const cell = pathKeys(target).find(key => !globallyMarked.has(key));
    if (cell) return { type: 'missing', cell, result };
  }
  return { type: 'none', cell: null, result };
}

export function straightPath(start, end, difficulty) {
  const dr = end.row - start.row, dc = end.col - start.col;
  const diagonal = Math.abs(dr) === Math.abs(dc) && dr !== 0;
  const straight = (dr === 0 && dc !== 0) || (dc === 0 && dr !== 0) || (difficulty === DIFFICULTY.HARD && diagonal);
  if (!straight) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  return Array.from({ length: steps + 1 }, (_, i) => ({ row: start.row + Math.sign(dr) * i, col: start.col + Math.sign(dc) * i }));
}

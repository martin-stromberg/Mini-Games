export const SIZE = 13;
export const MIN_WORD_LENGTH = 2;
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
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

export function validateVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary)) throw new Error('Die Vokabeldatei enthält keine Liste.');
  const seen = new Set();
  vocabulary.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`Vokabeleintrag ${index + 1} ist kein Objekt.`);
    const word = normalizeWord(entry.english);
    if (typeof entry.english !== 'string' || !WORD_PATTERN.test(word)) throw new Error(`Ungültiges englisches Wort in Eintrag ${index + 1}: ${entry.english}`);
    if (typeof entry.german !== 'string' || !entry.german.trim()) throw new Error(`Fehlende deutsche Übersetzung in Eintrag ${index + 1}: ${word}`);
    if (!LEVELS.includes(entry.level)) throw new Error(`Ungültiges GER-Niveau in Eintrag ${index + 1}: ${word}`);
    if (seen.has(word)) throw new Error(`Doppeltes englisches Wort: ${word}`);
    seen.add(word);
  });
  return vocabulary.map((entry, index) => ({ ...entry, id: entry.id || `vocab-${index}`, english: normalizeWord(entry.english), german: entry.german.trim() }));
}

export function seededRandom(seed = Date.now()) {
  let state = (Number(seed) >>> 0) || 1;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function shuffle(items, rng) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
  const valid = validateVocabulary(vocabulary);
  const pool = valid.filter(item => selectedLevels.includes(item.level));
  if (pool.length < WORDS_PER_ROUND) throw new Error(`Für die Auswahl stehen nur ${pool.length} geeignete Wörter bereit; mindestens ${WORDS_PER_ROUND} sind nötig.`);
  const chosen = shuffle(pool, rng).slice(0, WORDS_PER_ROUND);
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

function classifySlot(slot, slotIndex, targets, found) {
  if (!slot?.length) return { kind: 'empty', slotIndex, candidates: [], extras: [] };
  const selected = toSortedCellKeys(slot);
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

export function classifySlots(slots, targets) {
  const found = new Set();
  const classifications = slots.map((slot, slotIndex) => classifySlot(slot, slotIndex, targets, found));
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

export function getHint(slots, targets) {
  const result = classifySlots(slots, targets);
  const globallyMarked = new Set(slots.flatMap(slot => slot || []));
  const bad = result.classifications.find(item => item.kind === 'error');
  if (bad) return { type: 'error', cell: bad.extras[0], result };
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

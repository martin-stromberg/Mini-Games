import { LEVELS, germanKey, validateVocabulary } from '../shared/vocabulary.js';
import { shuffle } from '../shared/random.js';
import { toPuzzleWords } from '../word-search/game.js';

export const DIRECTION = Object.freeze({ ACROSS: 'across', DOWN: 'down' });
export const WORD_COUNT_OPTIONS = [8, 12, 15];
export const DEFAULT_WORD_COUNT = 12;
export const MAX_GRID_SPAN = 18;
export const MAX_GENERATION_ATTEMPTS = 100;
export const EXTRA_CANDIDATES = 10;
export const STORAGE_KEY = 'mini-games.crossword.settings';

const STEPS = {
  [DIRECTION.ACROSS]: [0, 1],
  [DIRECTION.DOWN]: [1, 0]
};
const SIDE_STEPS = {
  [DIRECTION.ACROSS]: [[-1, 0], [1, 0]],
  [DIRECTION.DOWN]: [[0, -1], [0, 1]]
};

export const coordKey = ({ row, col }) => `${row},${col}`;
export const parseKey = key => {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
};

// Einzelwörter für das Kreuzworträtsel: Verben ohne „to“, nur A–Z, dedupliziert.
export function crosswordWords(vocabulary) {
  return toPuzzleWords(validateVocabulary(vocabulary)).map(word => ({ word, answer: word.english }));
}

export function countByLevel(items) {
  const counts = Object.fromEntries(LEVELS.map(level => [level, 0]));
  for (const item of items) counts[item.word.level] += 1;
  return counts;
}

export const distinctGermanCount = items => new Set(items.map(item => germanKey(item.word.german))).size;

function pickWords(pool, rng, count) {
  const usedGerman = new Set();
  const chosen = [];
  for (const item of shuffle(pool, rng)) {
    const key = germanKey(item.word.german);
    if (usedGerman.has(key)) continue;
    usedGerman.add(key);
    chosen.push(item);
    if (chosen.length === count) break;
  }
  return chosen;
}

const cellPath = (answer, row, col, direction) => {
  const [dr, dc] = STEPS[direction];
  return [...answer].map((letter, index) => ({ row: row + dr * index, col: col + dc * index, letter }));
};

function boundsAfter(occupied, cells) {
  const bounds = { minRow: Infinity, minCol: Infinity, maxRow: -Infinity, maxCol: -Infinity };
  const add = (row, col) => {
    bounds.minRow = Math.min(bounds.minRow, row);
    bounds.minCol = Math.min(bounds.minCol, col);
    bounds.maxRow = Math.max(bounds.maxRow, row);
    bounds.maxCol = Math.max(bounds.maxCol, col);
  };
  for (const cell of occupied.values()) add(cell.row, cell.col);
  for (const cell of cells) add(cell.row, cell.col);
  return { ...bounds, rows: bounds.maxRow - bounds.minRow + 1, cols: bounds.maxCol - bounds.minCol + 1 };
}

// Prüft die Kreuzwortregeln für eine mögliche Platzierung: Überlagerungen nur als
// Kreuzung mit gleichem Buchstaben, keine seitlich anliegenden Parallelwörter und
// freie Enden in Schreibrichtung.
function placementFor(occupied, answer, row, col, direction) {
  const [dr, dc] = STEPS[direction];
  const cells = cellPath(answer, row, col, direction);
  let crossings = 0;
  const before = { row: row - dr, col: col - dc };
  const after = { row: row + dr * answer.length, col: col + dc * answer.length };
  if (occupied.has(coordKey(before)) || occupied.has(coordKey(after))) return null;

  for (const [index, cell] of cells.entries()) {
    const existing = occupied.get(coordKey(cell));
    if (existing) {
      if (existing.letter !== answer[index] || existing.directions.has(direction)) return null;
      crossings += 1;
      continue;
    }
    for (const [sr, sc] of SIDE_STEPS[direction]) {
      if (occupied.has(coordKey({ row: cell.row + sr, col: cell.col + sc }))) return null;
    }
  }

  const bounds = boundsAfter(occupied, cells);
  if (bounds.rows > MAX_GRID_SPAN || bounds.cols > MAX_GRID_SPAN) return null;
  return { cells, crossings, bounds };
}

// Alle legalen Platzierungen entstehen aus Ankerpunkten an vorhandenen Wörtern der
// Gegenrichtung. Dadurch ist jede neue Platzierung automatisch mindestens einmal verkreuzt.
function placementsForItem(occupied, item) {
  const candidates = new Map();
  for (const direction of Object.values(DIRECTION)) {
    const [dr, dc] = STEPS[direction];
    for (const existing of occupied.values()) {
      if (existing.directions.has(direction)) continue;
      for (let index = 0; index < item.answer.length; index++) {
        if (item.answer[index] !== existing.letter) continue;
        const row = existing.row - dr * index;
        const col = existing.col - dc * index;
        const key = `${direction}:${row}:${col}`;
        if (candidates.has(key)) continue;
        const placement = placementFor(occupied, item.answer, row, col, direction);
        if (placement?.crossings) candidates.set(key, { item, row, col, direction, ...placement });
      }
    }
  }
  return [...candidates.values()];
}

const candidateScore = candidate => {
  const area = candidate.bounds.rows * candidate.bounds.cols;
  const span = Math.max(candidate.bounds.rows, candidate.bounds.cols);
  const uneven = Math.abs(candidate.bounds.rows - candidate.bounds.cols);
  return candidate.crossings * 100000 - area * 40 - span * 15 - uneven * 8;
};

function choosePlacement(candidates, rng) {
  const ranked = candidates.map(candidate => ({ candidate, score: candidateScore(candidate) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, Math.min(4, ranked.length));
  return top[Math.floor(rng() * top.length)].candidate;
}

function place(occupied, placement, wordId) {
  for (const cell of placement.cells) {
    const key = coordKey(cell);
    const existing = occupied.get(key) || { row: cell.row, col: cell.col, letter: cell.letter, directions: new Set(), words: new Set() };
    existing.directions.add(placement.direction);
    existing.words.add(wordId);
    occupied.set(key, existing);
  }
}

function tryBuild(candidates, targetCount, rng) {
  const remaining = shuffle(candidates, rng).sort((a, b) => b.answer.length - a.answer.length || a.answer.localeCompare(b.answer));
  const occupied = new Map();
  const placed = [];
  const first = remaining.shift();
  const firstDirection = rng() < 0.5 ? DIRECTION.ACROSS : DIRECTION.DOWN;
  const firstPlacement = {
    item: first,
    row: 0,
    col: 0,
    direction: firstDirection,
    cells: cellPath(first.answer, 0, 0, firstDirection),
    crossings: 0
  };
  const firstId = `word-${placed.length + 1}`;
  place(occupied, firstPlacement, firstId);
  placed.push({ ...firstPlacement, id: firstId });

  while (placed.length < targetCount && remaining.length) {
    const candidatesForStep = remaining.flatMap(item => placementsForItem(occupied, item));
    if (!candidatesForStep.length) return null;
    const chosen = choosePlacement(candidatesForStep, rng);
    const id = `word-${placed.length + 1}`;
    place(occupied, chosen, id);
    placed.push({ ...chosen, id });
    remaining.splice(remaining.indexOf(chosen.item), 1);
  }
  return placed.length === targetCount ? placed : null;
}

function normalizeRound(placed) {
  const bounds = boundsAfter(new Map(), placed.flatMap(placement => placement.cells));
  const normalize = cell => ({ ...cell, row: cell.row - bounds.minRow, col: cell.col - bounds.minCol });
  const normalized = placed.map(placement => ({ ...placement, cells: placement.cells.map(normalize) }));
  const startKeys = [...new Set(normalized.map(placement => coordKey(placement.cells[0])))].sort((a, b) => {
    const first = parseKey(a), second = parseKey(b);
    return first.row - second.row || first.col - second.col;
  });
  const numberAtStart = new Map(startKeys.map((key, index) => [key, index + 1]));
  const cells = new Map();
  const words = normalized.map((placement, index) => {
    const id = `word-${index + 1}`;
    const keys = placement.cells.map(coordKey);
    const startKey = keys[0];
    const word = {
      id,
      vocabularyId: placement.item.word.id,
      answer: placement.item.answer,
      clue: placement.item.word.german,
      german: placement.item.word.german,
      partOfSpeech: placement.item.word.partOfSpeech,
      level: placement.item.word.level,
      direction: placement.direction,
      number: numberAtStart.get(startKey),
      cells: keys
    };
    for (const [letterIndex, cell] of placement.cells.entries()) {
      const key = keys[letterIndex];
      const entry = cells.get(key) || { row: cell.row, col: cell.col, letter: cell.letter, number: null, words: [] };
      entry.number = entry.number ?? numberAtStart.get(key) ?? null;
      entry.words.push(id);
      cells.set(key, entry);
    }
    return word;
  });
  const wordById = new Map(words.map(word => [word.id, word]));
  const sortedKeys = [...cells.keys()].sort((a, b) => {
    const first = parseKey(a), second = parseKey(b);
    return first.row - second.row || first.col - second.col;
  });
  const grid = Array.from({ length: bounds.rows }, () => Array(bounds.cols).fill(null));
  const cellMap = {};
  for (const key of sortedKeys) {
    const cell = cells.get(key);
    grid[cell.row][cell.col] = cell.letter;
    cellMap[key] = { ...cell };
  }
  const sortedWords = [...words].sort((a, b) => a.number - b.number || a.direction.localeCompare(b.direction));
  return {
    grid,
    rows: bounds.rows,
    cols: bounds.cols,
    cells: cellMap,
    words: sortedWords,
    across: sortedWords.filter(word => word.direction === DIRECTION.ACROSS).map(word => word.id),
    down: sortedWords.filter(word => word.direction === DIRECTION.DOWN).map(word => word.id),
    wordById: Object.fromEntries(wordById)
  };
}

export function createRound(vocabulary, { levels = LEVELS, count = DEFAULT_WORD_COUNT, rng = Math.random } = {}) {
  if (!WORD_COUNT_OPTIONS.includes(count)) throw new Error(`Ungültige Anzahl Wörter: ${count}`);
  const chosenLevels = levels.filter(level => LEVELS.includes(level));
  if (!chosenLevels.length) throw new Error('Mindestens ein Niveau muss gewählt sein.');
  const pool = crosswordWords(vocabulary).filter(item => chosenLevels.includes(item.word.level));
  const candidateCount = Math.min(pool.length, Math.max(count, Math.min(count + EXTRA_CANDIDATES, 24)));
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const chosen = pickWords(pool, rng, candidateCount);
    if (chosen.length < count) break;
    const placed = tryBuild(chosen, count, rng);
    if (placed) return normalizeRound(placed);
  }
  const usable = distinctGermanCount(pool);
  if (usable < count) throw new Error(`Für die Auswahl stehen nur ${usable} geeignete Wörter bereit; für ${count} Wörter werden ${count} benötigt.`);
  throw new Error('Das Kreuzworträtsel konnte nach mehreren Versuchen nicht erzeugt werden. Bitte starte eine neue Runde.');
}

const sameKeys = (first, second) => first.length === second.length && first.every((key, index) => key === second[index]);

// Regelprüfung für Tests und Generator: Alle Wörter liegen korrekt im Gitter, jede
// Buchstabenfolge gehört zu genau einem eingetragenen Wort und alle Felder hängen zusammen.
export function validatePuzzle(round) {
  const errors = [];
  const words = new Map(round.words.map(word => [word.id, word]));
  const playable = new Set(Object.keys(round.cells));
  for (const word of round.words) {
    if (word.cells.length !== word.answer.length) errors.push(`${word.id}: Länge stimmt nicht`);
    word.cells.forEach((key, index) => {
      if (!playable.has(key)) errors.push(`${word.id}: Feld ${key} fehlt`);
      else if (round.cells[key].letter !== word.answer[index]) errors.push(`${word.id}: falscher Buchstabe in ${key}`);
    });
  }

  for (const key of playable) {
    const { row, col } = parseKey(key);
    for (const direction of Object.values(DIRECTION)) {
      const [dr, dc] = STEPS[direction];
      const neighbour = coordKey({ row: row + dr, col: col + dc });
      if (!playable.has(neighbour)) continue;
      const sharesWord = round.cells[key].words.some(id => round.cells[neighbour].words.includes(id) && words.get(id).direction === direction);
      if (!sharesWord) errors.push(`Unerlaubte Berührung zwischen ${key} und ${neighbour}`);
    }
  }

  for (const direction of Object.values(DIRECTION)) {
    const [dr, dc] = STEPS[direction];
    for (const key of playable) {
      const { row, col } = parseKey(key);
      const previous = coordKey({ row: row - dr, col: col - dc });
      if (playable.has(previous)) continue;
      const run = [];
      let current = key;
      while (playable.has(current)) {
        run.push(current);
        const next = parseKey(current);
        current = coordKey({ row: next.row + dr, col: next.col + dc });
      }
      if (run.length < 2) continue;
      const matches = round.words.filter(word => word.direction === direction && sameKeys(word.cells, run));
      if (matches.length !== 1) errors.push(`Unerwartete Buchstabenfolge ${direction} ab ${key}`);
    }
  }

  const seen = new Set();
  const first = round.words[0]?.cells[0];
  if (first) {
    const queue = [first];
    seen.add(first);
    for (const key of queue) {
      const { row, col } = parseKey(key);
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const next = coordKey({ row: row + dr, col: col + dc });
        if (playable.has(next) && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
  }
  if (seen.size !== playable.size) errors.push('Das Gitter ist nicht zusammenhängend');
  return { valid: errors.length === 0, errors };
}

export const allCellKeys = round => Object.keys(round.cells).sort((a, b) => {
  const first = parseKey(a), second = parseKey(b);
  return first.row - second.row || first.col - second.col;
});

export const initialAnswers = round => Object.fromEntries(allCellKeys(round).map(key => [key, '']));

export function wordsAtCell(round, key, preferredDirection = null) {
  const cell = round.cells[key];
  if (!cell) return [];
  const words = cell.words.map(id => round.wordById[id]);
  return preferredDirection ? [...words.filter(word => word.direction === preferredDirection), ...words.filter(word => word.direction !== preferredDirection)] : words;
}

export const firstEmptyIndex = (round, answers, word) => {
  const index = word.cells.findIndex(key => !answers[key]);
  return index === -1 ? 0 : index;
};

export function checkAnswers(round, answers) {
  const wrong = [];
  let empty = 0;
  for (const key of allCellKeys(round)) {
    const value = String(answers[key] || '').toUpperCase();
    if (!value) empty += 1;
    else if (value !== round.cells[key].letter) wrong.push(key);
  }
  return { wrong, empty, filled: empty === 0, solved: empty === 0 && wrong.length === 0 };
}

export const completedWords = (round, answers) => round.words.filter(word => word.cells.every(key => String(answers[key] || '').toUpperCase() === round.cells[key].letter));

export function revealWord(round, answers, wordId) {
  const word = round.wordById[wordId];
  if (!word) return answers;
  const next = { ...answers };
  for (const key of word.cells) next[key] = round.cells[key].letter;
  return next;
}

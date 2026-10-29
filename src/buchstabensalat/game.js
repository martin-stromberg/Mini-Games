import { LEVELS, germanKey } from '../shared/vocabulary.js';
import { shuffle } from '../shared/random.js';

export const WORD_COUNT_OPTIONS = [5, 10, 15];
export const DEFAULT_WORD_COUNT = 10;
export const MIN_WORD_LENGTH = 2;
export const WORD_LENGTH = Object.freeze({ SHORT: 'short', MEDIUM: 'medium', LONG: 'long' });
export const LENGTH_FILTERS = Object.freeze(Object.values(WORD_LENGTH));
export const STORAGE_KEY = 'mini-games.buchstabensalat.settings';
export const WORD_PATTERN = new RegExp(`^[a-z]{${MIN_WORD_LENGTH},}$`);

// Englische Verben stehen im Bestand als Infinitiv mit „to“; gelegt wird nur das Verb.
export const normalizeEnglish = english => String(english || '').trim().toLowerCase().replace(/^to\s+/, '');

// Wörter für den Buchstabensalat: nur durchgehende a–z-Wörter mit mindestens zwei verschiedenen
// Buchstaben (sonst kann keine vom Original abweichende Mischung existieren), dedupliziert.
export function scrambleWords(vocabulary) {
  const seen = new Set();
  return vocabulary.flatMap(entry => {
    const answer = normalizeEnglish(entry.english);
    if (!WORD_PATTERN.test(answer) || new Set(answer).size < 2 || seen.has(answer)) return [];
    seen.add(answer);
    return [{ word: entry, answer }];
  });
}

export const matchesLength = (answer, length) => {
  const size = answer.length;
  if (length === WORD_LENGTH.SHORT) return size <= 5;
  if (length === WORD_LENGTH.MEDIUM) return size >= 6 && size <= 9;
  if (length === WORD_LENGTH.LONG) return size >= 10;
  return false;
};

export function countByLevel(items) {
  const counts = Object.fromEntries(LEVELS.map(level => [level, 0]));
  for (const item of items) counts[item.word.level] += 1;
  return counts;
}

// Mischt die Buchstaben; bleibt die Mischung gleich der Lösung, werden deterministisch zwei
// Positionen mit unterschiedlichen Buchstaben getauscht (existiert immer, siehe scrambleWords).
function shuffleLetters(answer, rng) {
  const letters = shuffle([...answer], rng);
  if (letters.join('') === answer) {
    const second = letters.findIndex(letter => letter !== letters[0]);
    [letters[0], letters[second]] = [letters[second], letters[0]];
  }
  return letters;
}

// Pro Runde nur Wörter mit paarweise verschiedenen deutschen Übersetzungen, damit der Hinweis eindeutig bleibt.
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

export function createRound(vocabulary, { levels = LEVELS, count = DEFAULT_WORD_COUNT, lengths = LENGTH_FILTERS, rng = Math.random } = {}) {
  if (!WORD_COUNT_OPTIONS.includes(count)) throw new Error(`Ungültige Anzahl Wörter: ${count}`);
  const chosenLengths = lengths.filter(length => LENGTH_FILTERS.includes(length));
  if (!chosenLengths.length) throw new Error('Mindestens eine Wortlänge muss gewählt sein.');
  const pool = scrambleWords(vocabulary).filter(item => levels.includes(item.word.level) && chosenLengths.some(length => matchesLength(item.answer, length)));
  const picked = pickWords(pool, rng, count);
  if (picked.length < count) throw new Error(`Für die Auswahl gibt es nur ${picked.length} Wörter; für ${count} Wörter werden ${count} benötigt.`);
  const entries = picked.map(({ word, answer }) => ({
    word,
    answer,
    tiles: shuffleLetters(answer, rng),
    slots: Array(answer.length).fill(null),
    fixed: Array(answer.length).fill(false),
    state: 'open',
    helps: 0,
    wrong: false
  }));
  return { entries, position: 0 };
}

export const currentEntry = round => round.entries[round.position];
export const isFinished = round => round.position >= round.entries.length;
export const assembled = entry => entry.slots.map(tileIndex => (tileIndex === null ? '' : entry.tiles[tileIndex])).join('');

const usedTiles = entry => new Set(entry.slots.filter(tileIndex => tileIndex !== null));
export const freeTiles = entry => entry.tiles.map((letter, index) => index).filter(index => !usedTiles(entry).has(index));

const replaceEntry = (round, entry) => ({ ...round, entries: round.entries.map((item, index) => (index === round.position ? entry : item)) });
const advance = round => ({ ...round, position: Math.min(round.position + 1, round.entries.length) });

// Prüft ein vollständig gelegtes Wort: richtig → gelöst, falsch → Markierung zum erneuten Versuch.
function evaluate(entry) {
  if (entry.slots.includes(null)) return { entry, result: 'placed' };
  const solved = assembled(entry) === entry.answer;
  return solved
    ? { entry: { ...entry, state: 'solved', wrong: false }, result: 'correct' }
    : { entry: { ...entry, wrong: true }, result: 'wrong' };
}

const applyResult = (round, entry, result) => ({
  round: result === 'correct' ? advance(replaceEntry(round, entry)) : replaceEntry(round, entry),
  result
});

// Legt eine Pool-Kachel auf den ersten freien Slot. Ergebnis: 'ignored', 'placed', 'correct' oder 'wrong'.
export function placeLetter(round, tileIndex) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  if (!Number.isInteger(tileIndex) || tileIndex < 0 || tileIndex >= entry.tiles.length || usedTiles(entry).has(tileIndex)) return { round, result: 'ignored' };
  const slotIndex = entry.slots.indexOf(null);
  if (slotIndex === -1) return { round, result: 'ignored' };
  const slots = [...entry.slots];
  slots[slotIndex] = tileIndex;
  const { entry: evaluated, result } = evaluate({ ...entry, slots });
  return applyResult(round, evaluated, result);
}

// Tastatureingabe: sucht im Pool eine Kachel mit dem getippten Buchstaben.
export function typeLetter(round, letter) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  const wanted = String(letter || '').toLowerCase();
  const tileIndex = freeTiles(entry).find(index => entry.tiles[index] === wanted);
  return tileIndex === undefined ? { round, result: 'ignored' } : placeLetter(round, tileIndex);
}

// Entfernt den Buchstaben eines Slots zurück in den Pool. Fixierte und leere Slots bleiben unberührt.
export function removeLetter(round, slotIndex) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= entry.slots.length || entry.slots[slotIndex] === null || entry.fixed[slotIndex]) return { round, result: 'ignored' };
  const slots = [...entry.slots];
  slots[slotIndex] = null;
  return { round: replaceEntry(round, { ...entry, slots, wrong: false }), result: 'removed' };
}

// Rücktaste: entfernt den zuletzt gesetzten, nicht fixierten Buchstaben.
export function removeLastLetter(round) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  for (let slotIndex = entry.slots.length - 1; slotIndex >= 0; slotIndex--) {
    if (entry.slots[slotIndex] !== null && !entry.fixed[slotIndex]) return removeLetter(round, slotIndex);
  }
  return { round, result: 'ignored' };
}

// Leert alle nicht fixierten Slots.
export function resetWord(round) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  const slots = entry.slots.map((tileIndex, index) => (entry.fixed[index] ? tileIndex : null));
  return { round: replaceEntry(round, { ...entry, slots, wrong: false }), result: 'reset' };
}

// Deckt den nächsten richtigen Buchstaben auf: fixiert den linksten offenen Slot mit dem
// korrekten Buchstaben — aus dem Pool oder verschoben aus einem späteren freien Slot. Zählt als Hilfe.
export function revealLetter(round) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  const slotIndex = entry.fixed.indexOf(false);
  if (slotIndex === -1) return { round, result: 'ignored' };
  const needed = entry.answer[slotIndex];
  const slots = [...entry.slots];
  const fixed = [...entry.fixed];
  let tileIndex;
  if (slots[slotIndex] !== null && entry.tiles[slots[slotIndex]] === needed) {
    tileIndex = slots[slotIndex];
  } else {
    slots[slotIndex] = null;
    const used = usedTiles({ ...entry, slots });
    tileIndex = entry.tiles.findIndex((letter, index) => letter === needed && !used.has(index));
    if (tileIndex === -1) {
      const source = slots.findIndex((tile, index) => index !== slotIndex && !fixed[index] && tile !== null && entry.tiles[tile] === needed);
      if (source === -1) return { round, result: 'ignored' };
      tileIndex = slots[source];
      slots[source] = null;
    }
  }
  slots[slotIndex] = tileIndex;
  fixed[slotIndex] = true;
  const { entry: evaluated, result } = evaluate({ ...entry, slots, fixed, helps: entry.helps + 1 });
  return applyResult(round, evaluated, result);
}

// Überspringt das aktuelle Wort; es zählt in der Auswertung als übersprungen.
export function skipWord(round) {
  const entry = currentEntry(round);
  if (!entry || entry.state !== 'open') return { round, result: 'ignored' };
  return { round: advance(replaceEntry(round, { ...entry, state: 'skipped' })), result: 'skipped' };
}

// Auswertung der Runde: gelöste und übersprungene Wörter sowie die genutzten Hilfen.
export function results(round) {
  return {
    total: round.entries.length,
    solved: round.entries.filter(entry => entry.state === 'solved').length,
    helped: round.entries.filter(entry => entry.helps > 0).length,
    helps: round.entries.reduce((sum, entry) => sum + entry.helps, 0),
    skipped: round.entries.filter(entry => entry.state === 'skipped').length,
    entries: round.entries
  };
}

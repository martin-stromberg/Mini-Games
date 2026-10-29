import { LEVELS } from '../shared/vocabulary.js';
import { shuffle } from '../shared/random.js';

export const MISS_OPTIONS = [6, 8, 10];
export const DEFAULT_MISSES = 8;
export const MIN_LETTERS = 2;
export const WORD_LENGTH = Object.freeze({ SHORT: 'short', MEDIUM: 'medium', LONG: 'long' });
export const LENGTH_FILTERS = Object.freeze(Object.values(WORD_LENGTH));
export const STORAGE_KEY = 'mini-games.wort-raten.settings';
export const LETTERS = Object.freeze([...'abcdefghijklmnopqrstuvwxyz']);
export const WORD_PATTERN = /^[a-z]+(?:[ -][a-z]+)*$/;

// Englische Verben stehen im Bestand als Infinitiv mit „to“; geraten wird nur das Verb.
export const normalizeEnglish = english => String(english || '').trim().toLowerCase().replace(/^to\s+/, '');

// Zählbare Buchstaben eines Lösungswortes: Leerzeichen und Bindestriche werden direkt angezeigt.
export const letterCount = answer => (answer.match(/[a-z]/g) || []).length;

// Wörter zum Erraten: a–z mit optionalen Leerzeichen und Bindestrichen dazwischen (z. B.
// „train station“, „mother-in-law“), mindestens zwei Buchstaben, dedupliziert nach der Lösung.
export function guessingWords(vocabulary) {
  const seen = new Set();
  return vocabulary.flatMap(entry => {
    const answer = normalizeEnglish(entry.english);
    if (!WORD_PATTERN.test(answer) || letterCount(answer) < MIN_LETTERS || seen.has(answer)) return [];
    seen.add(answer);
    return [{ word: entry, answer }];
  });
}

export const matchesLength = (answer, length) => {
  const size = letterCount(answer);
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

// Startet ein Wortratespiel: ein zufälliges Wort aus dem Pool der gewählten Niveaus und
// Längen. „exclude“ (Lösungen bereits gespielter Wörter) vermeidet Wiederholungen, bis der
// Pool erschöpft ist — dann wird er wieder vollständig freigegeben.
export function createGame(vocabulary, { levels = LEVELS, lengths = LENGTH_FILTERS, misses = DEFAULT_MISSES, rng = Math.random, exclude = [] } = {}) {
  if (!MISS_OPTIONS.includes(misses)) throw new Error(`Ungültige Anzahl Fehlversuche: ${misses}`);
  const chosenLengths = lengths.filter(length => LENGTH_FILTERS.includes(length));
  if (!chosenLengths.length) throw new Error('Mindestens eine Wortlänge muss gewählt sein.');
  const pool = guessingWords(vocabulary).filter(item => levels.includes(item.word.level) && chosenLengths.some(length => matchesLength(item.answer, length)));
  if (!pool.length) throw new Error('Für die Auswahl gibt es keine Wörter; wähle weitere Niveaus oder Wortlängen.');
  const excluded = new Set(exclude);
  const fresh = pool.filter(item => !excluded.has(item.answer));
  const { word, answer } = shuffle(fresh.length ? fresh : pool, rng)[0];
  return { word, answer, guessed: [], wrong: [], maxMisses: misses, status: 'playing' };
}

export const isOver = game => game.status !== 'playing';
export const missesLeft = game => game.maxMisses - game.wrong.length;
export const guessedLetters = game => new Set(game.guessed);

// Sichtbare Lösung: erratene Buchstaben, Leerzeichen und Bindestriche stehen offen,
// der Rest bleibt null (Platzhalter).
export const revealed = game => {
  const seen = guessedLetters(game);
  return [...game.answer].map(char => (char === ' ' || char === '-' || seen.has(char) ? char : null));
};

const solved = game => revealed(game).every(char => char !== null);

// Rät einen Buchstaben. Ergebnis: 'ignored' (Spiel vorbei oder kein a–z), 'repeat'
// (schon versucht), 'hit', 'miss', 'won' oder 'lost'.
export function guess(game, letter) {
  if (isOver(game)) return { game, result: 'ignored' };
  const wanted = String(letter || '').toLowerCase();
  if (!/^[a-z]$/.test(wanted)) return { game, result: 'ignored' };
  if (game.guessed.includes(wanted)) return { game, result: 'repeat', letter: wanted };
  const guessed = [...game.guessed, wanted];
  if (game.answer.includes(wanted)) {
    const next = { ...game, guessed, status: 'playing' };
    const won = solved(next);
    return { game: won ? { ...next, status: 'won' } : next, result: won ? 'won' : 'hit', letter: wanted };
  }
  const wrong = [...game.wrong, wanted];
  const lost = wrong.length >= game.maxMisses;
  return { game: { ...game, guessed, wrong, status: lost ? 'lost' : 'playing' }, result: lost ? 'lost' : 'miss', letter: wanted };
}

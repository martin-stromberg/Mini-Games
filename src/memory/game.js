import { LEVELS, germanKey } from '../shared/vocabulary.js';
import { shuffle } from '../shared/random.js';

export const PAIR_OPTIONS = [6, 8, 10, 12];
export const DEFAULT_PAIRS = 8;
export const CARD_KIND = Object.freeze({ IMAGE: 'image', TEXT: 'text' });
export const CARD_LANGUAGE = Object.freeze({ ENGLISH: 'english', GERMAN: 'german' });
export const STORAGE_KEY = 'mini-games.memory.settings';

// Nur Vokabeln mit Symbolbild kommen ins Memory: Zu jeder gehören eine Bild- und eine Textkarte.
export const memoryWords = vocabulary => vocabulary.filter(entry => typeof entry.image === 'string' && entry.image.trim());

export function countByLevel(words) {
  const counts = Object.fromEntries(LEVELS.map(level => [level, 0]));
  for (const word of words) counts[word.level] += 1;
  return counts;
}

// Zieht `count` Vokabeln, deren Bild, englischer Text und deutscher Text in der Runde jeweils nur einmal vorkommen,
// damit jede Karte genau ein Gegenstück hat.
function pickWords(pool, rng, count) {
  const used = { image: new Set(), english: new Set(), german: new Set() };
  const chosen = [];
  for (const word of shuffle(pool, rng)) {
    const keys = { image: word.image, english: word.english.toLowerCase(), german: germanKey(word.german) };
    if (Object.entries(keys).some(([field, key]) => used[field].has(key))) continue;
    Object.entries(keys).forEach(([field, key]) => used[field].add(key));
    chosen.push(word);
    if (chosen.length === count) break;
  }
  return chosen;
}

export function createRound(vocabulary, { levels = LEVELS, pairs = DEFAULT_PAIRS, rng = Math.random } = {}) {
  if (!PAIR_OPTIONS.includes(pairs)) throw new Error(`Ungültige Anzahl Paare: ${pairs}`);
  const pool = memoryWords(vocabulary).filter(word => levels.includes(word.level));
  const words = pickWords(pool, rng, pairs);
  if (words.length < pairs) throw new Error(`Für die Auswahl gibt es nur ${words.length} Vokabeln mit Bild; für ${pairs} Paare werden ${pairs} benötigt.`);
  const cards = shuffle(words.flatMap(word => [CARD_KIND.IMAGE, CARD_KIND.TEXT].map(kind => ({ id: `${word.id}-${kind}`, pairId: word.id, kind }))), rng);
  return { words, cards, revealed: [], matched: new Set(), moves: 0 };
}

export const isFinished = round => round.matched.size === round.words.length;

// Deckt eine Karte auf. Ergebnis: 'ignored' (Karte schon offen oder gefunden), 'first', 'match' oder 'mismatch'.
// Nach 'mismatch' bleiben beide Karten offen, bis die nächste Karte aufgedeckt wird.
export function flipCard(round, index) {
  const card = round.cards[index];
  if (!card) throw new Error(`Keine Karte an Position ${index}.`);
  const pending = round.revealed.length === 2 ? [] : round.revealed;
  if (round.matched.has(card.pairId) || pending.includes(index)) return { round, result: 'ignored' };
  const revealed = [...pending, index];
  if (revealed.length === 1) return { round: { ...round, revealed }, result: 'first' };
  const moves = round.moves + 1;
  const [first, second] = revealed.map(position => round.cards[position]);
  if (first.pairId === second.pairId) {
    return { round: { ...round, revealed: [], matched: new Set([...round.matched, card.pairId]), moves }, result: 'match' };
  }
  return { round: { ...round, revealed, moves }, result: 'mismatch' };
}

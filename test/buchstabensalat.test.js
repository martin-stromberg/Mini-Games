import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WORD_COUNT, LENGTH_FILTERS, WORD_COUNT_OPTIONS, WORD_LENGTH, assembled, countByLevel, createRound, currentEntry, freeTiles, isFinished, matchesLength, normalizeEnglish, placeLetter, removeLastLetter, removeLetter, resetWord, results, revealLetter, scrambleWords, skipWord, typeLetter } from '../src/buchstabensalat/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS, germanKey } from '../src/shared/vocabulary.js';
import { vocabulary } from './fixtures/rounds.js';

const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });
const word = (id, english, german, { partOfSpeech = 'noun', topic = 'Tiere', synonyms = [], image = '', level = 'A1' } = {}) => ({
  id, english, german, partOfSpeech, topic, synonyms, level,
  exampleGerman: 'Beispielsatz.', exampleEnglish: 'Example sentence.', ...(image ? { image } : {})
});
const letterCount = text => [...text].reduce((counts, letter) => counts.set(letter, (counts.get(letter) || 0) + 1), new Map());

// Eigene Runde mit kontrollierter Kachelreihenfolge für Zug-Tests.
const roundOf = (answer, tiles = answer, wordEntry = word('w1', answer, 'Lösung')) => ({
  entries: [{
    word: wordEntry, answer,
    tiles: [...tiles],
    slots: Array(answer.length).fill(null),
    fixed: Array(answer.length).fill(false),
    state: 'open', helps: 0, wrong: false
  }],
  position: 0
});

// Legt die Lösung über die angegebene Kachelreihenfolge (Index pro Lösungsbuchstabe).
function solveEntry(round, order) {
  for (const tileIndex of order) round = placeLetter(round, tileIndex).round;
  return round;
}

test('scrambleWords normalizes, filters and deduplicates', () => {
  const items = scrambleWords([
    word('v1', 'to improve', 'verbessern', { partOfSpeech: 'verb' }),
    word('n1', 'cat', 'Katze'),
    word('p1', 'train station', 'Bahnhof'),
    word('h1', 'mother-in-law', 'Schwiegermutter'),
    word('s1', 'a', 'ein'),
    word('d1', 'cat', 'Katze'),
    word('d2', '  CAT ', 'Katze')
  ]);
  assert.deepEqual(items.map(item => item.answer).sort(), ['cat', 'improve']);
  assert.equal(items.find(item => item.answer === 'improve').word.id, 'v1');
});

test('scrambleWords drops words without two distinct letters', () => {
  const items = scrambleWords([word('x1', 'aa', 'Doppel-A'), word('x2', 'ab', 'ab')]);
  assert.deepEqual(items.map(item => item.answer), ['ab']);
});

test('every level of the real vocabulary offers scramble words', () => {
  const items = scrambleWords(vocabulary);
  for (const level of LEVELS) assert.ok(items.some(item => item.word.level === level), `keine Wörter für ${level}`);
  for (const item of items) {
    assert.match(item.answer, /^[a-z]{2,}$/);
    assert.ok(new Set(item.answer).size >= 2);
    assert.ok(!item.answer.startsWith('to '));
  }
});

test('normalizeEnglish strips the verb marker and keeps plain words', () => {
  assert.equal(normalizeEnglish('to improve'), 'improve');
  assert.equal(normalizeEnglish('to'), 'to');
  assert.equal(normalizeEnglish(' Apple '), 'apple');
});

test('matchesLength maps answers to the three length bands', () => {
  assert.equal(matchesLength('cat', WORD_LENGTH.SHORT), true);
  assert.equal(matchesLength('cat', WORD_LENGTH.MEDIUM), false);
  assert.equal(matchesLength('banana', WORD_LENGTH.MEDIUM), true);
  assert.equal(matchesLength('kindergarten', WORD_LENGTH.LONG), true);
  assert.equal(matchesLength('banana', WORD_LENGTH.LONG), false);
  assert.equal(matchesLength('cat', 'riesig'), false);
});

test('countByLevel counts the scramble words of every level', () => {
  const counts = countByLevel(scrambleWords(vocabulary));
  assert.equal(Object.keys(counts).length, LEVELS.length);
  assert.ok(counts.A1 > 0);
});

test('createRound builds words whose tiles differ from the answer', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const round = roundFor(seed);
    assert.equal(round.entries.length, DEFAULT_WORD_COUNT);
    for (const entry of round.entries) {
      assert.notEqual(entry.tiles.join(''), entry.answer, `Seed ${seed}: Mischung gleich Lösung ${entry.answer}`);
      assert.deepEqual(letterCount(entry.tiles.join('')), letterCount(entry.answer), `Seed ${seed}: Kacheln passen nicht zu ${entry.answer}`);
      assert.equal(entry.state, 'open');
      assert.equal(entry.helps, 0);
    }
    const germanKeys = round.entries.map(entry => germanKey(entry.word.german));
    assert.equal(new Set(germanKeys).size, germanKeys.length, `Seed ${seed}: doppelte Übersetzung`);
  }
});

test('createRound honours levels and length filters', () => {
  const round = roundFor(5, { levels: ['A1'], count: 5, lengths: [WORD_LENGTH.SHORT] });
  assert.equal(round.entries.length, 5);
  for (const entry of round.entries) {
    assert.equal(entry.word.level, 'A1');
    assert.ok(entry.answer.length <= 5);
  }
});

test('createRound validates count, lengths and pool size', () => {
  assert.throws(() => roundFor(1, { count: 7 }), /Ungültige Anzahl Wörter: 7/);
  assert.throws(() => roundFor(1, { lengths: [] }), /Mindestens eine Wortlänge/);
  assert.throws(() => roundFor(1, { lengths: ['riesig'] }), /Mindestens eine Wortlänge/);
  assert.throws(() => roundFor(1, { levels: ['C2'], count: 15, lengths: [WORD_LENGTH.SHORT] }), /gibt es nur .* Wörter; für 15 Wörter werden 15 benötigt/);
});

test('the same seed creates the same round', () => {
  assert.deepEqual(roundFor(3), roundFor(3));
  assert.notDeepEqual(roundFor(3), roundFor(4));
});

test('placeLetter fills the first free slot and used tiles leave the pool', () => {
  const round = roundOf('cat');
  const { round: next, result } = placeLetter(round, 1);
  assert.equal(result, 'placed');
  const entry = currentEntry(next);
  assert.equal(entry.slots[0], 1);
  assert.equal(assembled(entry), 'a');
  assert.deepEqual(freeTiles(entry), [0, 2]);
  assert.equal(placeLetter(next, 1).result, 'ignored');
  assert.equal(placeLetter(next, -1).result, 'ignored');
  assert.equal(placeLetter(next, 3).result, 'ignored');
});

test('typeLetter places a matching pool tile and ignores foreign letters', () => {
  let round = roundOf('cat');
  let step = typeLetter(round, 'x');
  assert.equal(step.result, 'ignored');
  step = typeLetter(round, 'C');
  assert.equal(step.result, 'placed');
  assert.equal(currentEntry(step.round).slots[0], 0);
});

test('a complete correct word is solved and the round advances', () => {
  let round = roundOf('cat', 'tac');
  // Kacheln t(0) a(1) c(2) → Lösung „cat“: Reihenfolge 2, 1, 0
  round = solveEntry(round, [2, 1, 0]);
  const entry = round.entries[0];
  assert.equal(entry.state, 'solved');
  assert.equal(entry.wrong, false);
  assert.equal(round.position, 1);
});

test('a complete wrong word is marked wrong and can be corrected', () => {
  let round = roundOf('cat', 'act');
  // Lösung c a t, gelegt a c t: Kacheln 0 (a), 1 (c), 2 (t) → „act“
  let last;
  for (const tileIndex of [0, 1, 2]) last = placeLetter(round, tileIndex), round = last.round;
  assert.equal(last.result, 'wrong');
  assert.equal(currentEntry(round).wrong, true);
  assert.equal(round.position, 0);
  // Buchstaben entfernen löscht die Fehlermarkierung
  const removed = removeLetter(round, 1);
  assert.equal(removed.result, 'removed');
  assert.equal(currentEntry(removed.round).wrong, false);
});

test('duplicate letters solve the word in every valid arrangement', () => {
  // „apple“ aus Kacheln l(0) p(1) a(2) p(3) e(4): die p-Kacheln 1 und 3 sind austauschbar.
  for (const pOrder of [[1, 3], [3, 1]]) {
    let round = roundOf('apple', 'lpape');
    let last;
    for (const tileIndex of [2, pOrder[0], pOrder[1], 0, 4]) last = placeLetter(round, tileIndex), round = last.round;
    assert.equal(last.result, 'correct', `Reihenfolge ${pOrder} wurde nicht als Lösung gewertet`);
    assert.equal(round.entries[0].state, 'solved');
  }
});

test('removeLetter only frees unfixed filled slots', () => {
  let round = roundOf('cat', 'act');
  round = placeLetter(round, 1).round; // slot 0 = c (Kachel 1)
  round = revealLetter(round).round;   // fixiert slot 0, „c“ liegt bereits dort
  const entry = currentEntry(round);
  assert.equal(entry.fixed[0], true);
  assert.equal(removeLetter(round, 0).result, 'ignored'); // fixiert
  assert.equal(removeLetter(round, 1).result, 'ignored'); // leer
  round = placeLetter(round, 0).round;  // slot 1 = a (Kachel 0)
  const removed = removeLetter(round, 1);
  assert.equal(removed.result, 'removed');
  assert.equal(currentEntry(removed.round).slots[1], null);
});

test('removeLastLetter removes the last placed unfixed letter', () => {
  let round = roundOf('cat', 'act');
  round = placeLetter(round, 0).round; // a → slot 0
  round = placeLetter(round, 2).round; // t → slot 1
  const step = removeLastLetter(round);
  assert.equal(step.result, 'removed');
  const entry = currentEntry(step.round);
  assert.equal(entry.slots[1], null);
  assert.equal(entry.slots[0], 0);
});

test('resetWord clears every unfixed slot but keeps revealed letters', () => {
  let round = roundOf('cat', 'act');
  let step = revealLetter(round);
  round = step.round;                 // slot 0 = c fixiert
  round = placeLetter(round, 0).round; // slot 1 = a
  const cleared = resetWord(round).round;
  const entry = currentEntry(cleared);
  assert.equal(entry.slots[0] !== null && entry.fixed[0], true);
  assert.equal(entry.slots[1], null);
  assert.equal(entry.slots[2], null);
});

test('revealLetter fixes the next correct letter, counts a help and steals misplaced tiles', () => {
  // Lösung „bake“, Kacheln e(0) k(1) a(2) b(3) — komplett falsch gelegt.
  let round = roundOf('bake', 'ekab');
  for (const tileIndex of [0, 1, 2, 3]) round = placeLetter(round, tileIndex).round;
  assert.equal(currentEntry(round).wrong, true);
  let step = revealLetter(round); // slot 0 braucht „b“: liegt in slot 3 → verschieben
  round = step.round;
  let entry = currentEntry(round);
  assert.equal(entry.tiles[entry.slots[0]], 'b');
  assert.equal(entry.fixed[0], true);
  assert.equal(entry.slots[3], null);
  assert.equal(entry.helps, 1);
  step = revealLetter(round); // slot 1 braucht „a“: „k“ in den Pool, „a“ aus slot 2 verschieben
  round = step.round;
  entry = currentEntry(round);
  assert.equal(entry.tiles[entry.slots[1]], 'a');
  assert.equal(entry.fixed[1], true);
  assert.equal(entry.slots[2], null);
  assert.equal(entry.helps, 2);
  step = revealLetter(round); // slot 2 braucht „k“ aus dem Pool
  assert.equal(step.result, 'placed');
  round = step.round;
  entry = currentEntry(round);
  assert.equal(entry.tiles[entry.slots[2]], 'k');
  assert.equal(entry.helps, 3);
  step = revealLetter(round); // slot 3: „e“ aus dem Pool → Wort gelöst
  assert.equal(step.result, 'correct');
  assert.equal(step.round.entries[0].state, 'solved');
  assert.equal(step.round.position, 1);
  assert.equal(step.round.entries[0].helps, 4);
});

test('revealed letters cannot be removed', () => {
  let round = roundOf('cat', 'act');
  round = revealLetter(round).round;
  assert.equal(removeLetter(round, 0).result, 'ignored');
  assert.equal(removeLastLetter(round).result, 'ignored');
});

test('skipWord marks the word skipped and finishes the round', () => {
  let round = roundOf('cat', 'act');
  const step = skipWord(round);
  assert.equal(step.result, 'skipped');
  assert.equal(step.round.entries[0].state, 'skipped');
  assert.equal(step.round.position, 1);
  assert.equal(isFinished(step.round), true);
  assert.equal(placeLetter(step.round, 0).result, 'ignored');
  assert.equal(skipWord(step.round).result, 'ignored');
});

test('results counts solved words, helps and skipped words', () => {
  let round = roundOf('cat', 'tac');
  round = revealLetter(round).round;
  round = solveEntry(round, [1, 0]); // slots 1,2 frei: a aus Kachel1? tiles t a c → nach fix slot0=c(Kachel2); Pool: 0(t),1(a) → „at“ legen: Kachel1→slot1, Kachel0→slot2
  assert.equal(round.entries[0].state, 'solved');
  const { total, solved, helped, helps, skipped, entries } = results(round);
  assert.equal(total, 1);
  assert.equal(solved, 1);
  assert.equal(helped, 1);
  assert.equal(helps, 1);
  assert.equal(skipped, 0);
  assert.equal(entries[0].answer, 'cat');
});

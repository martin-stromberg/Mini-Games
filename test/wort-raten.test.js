import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MISSES, LENGTH_FILTERS, LETTERS, MISS_OPTIONS, WORD_LENGTH, countByLevel, createGame, guess, guessingWords, isOver, letterCount, matchesLength, missesLeft, normalizeEnglish, revealed } from '../src/wort-raten/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { vocabulary } from './fixtures/rounds.js';

const gameFor = (seed, options = {}) => createGame(vocabulary, { rng: seededRandom(seed), ...options });
const word = (id, english, german, { partOfSpeech = 'noun', topic = 'Tiere', synonyms = [], image = '', level = 'A1' } = {}) => ({
  id, english, german, partOfSpeech, topic, synonyms, level,
  exampleGerman: 'Beispielsatz.', exampleEnglish: 'Example sentence.', ...(image ? { image } : {})
});

// Eigenes Spiel mit kontrolliertem Wort und Fehlversuchs-Limit für Zug-Tests.
const gameOf = (answer, { maxMisses = 3, wordEntry = word('w1', answer, 'Lösung') } = {}) => ({
  word: wordEntry, answer, guessed: [], wrong: [], maxMisses, status: 'playing'
});

// Rät eine Folge von Buchstaben und gibt das letzte Ergebnis zurück.
function guessAll(game, letters) {
  let step = { game, result: 'ignored' };
  for (const letter of letters) step = guess(step.game, letter);
  return step;
}

test('guessingWords normalizes, keeps phrases and deduplicates', () => {
  const items = guessingWords([
    word('v1', 'to improve', 'verbessern', { partOfSpeech: 'verb' }),
    word('n1', 'cat', 'Katze'),
    word('p1', 'train station', 'Bahnhof'),
    word('h1', 'mother-in-law', 'Schwiegermutter'),
    word('s1', 'a', 'ein'),
    word('b1', 'cat!', 'Katze!'),
    word('d1', 'cat', 'Katze'),
    word('d2', '  CAT ', 'Katze')
  ]);
  assert.deepEqual(items.map(item => item.answer).sort(), ['cat', 'improve', 'mother-in-law', 'train station']);
  assert.equal(items.find(item => item.answer === 'improve').word.id, 'v1');
});

test('every level of the real vocabulary offers guessing words', () => {
  const items = guessingWords(vocabulary);
  for (const level of LEVELS) assert.ok(items.some(item => item.word.level === level), `keine Wörter für ${level}`);
  for (const item of items) {
    assert.match(item.answer, /^[a-z]+(?:[ -][a-z]+)*$/);
    assert.ok(letterCount(item.answer) >= 2);
    assert.ok(!item.answer.startsWith('to '));
  }
});

test('normalizeEnglish strips the verb marker and keeps plain words', () => {
  assert.equal(normalizeEnglish('to improve'), 'improve');
  assert.equal(normalizeEnglish('to'), 'to');
  assert.equal(normalizeEnglish(' Apple '), 'apple');
});

test('letterCount ignores spaces and hyphens', () => {
  assert.equal(letterCount('cat'), 3);
  assert.equal(letterCount('train station'), 12);
  assert.equal(letterCount('mother-in-law'), 11);
});

test('matchesLength maps answers to the three length bands', () => {
  assert.equal(matchesLength('cat', WORD_LENGTH.SHORT), true);
  assert.equal(matchesLength('cat', WORD_LENGTH.MEDIUM), false);
  assert.equal(matchesLength('banana', WORD_LENGTH.MEDIUM), true);
  assert.equal(matchesLength('my cat', WORD_LENGTH.SHORT), true); // sechs Zeichen, aber fünf Buchstaben
  assert.equal(matchesLength('kindergarten', WORD_LENGTH.LONG), true);
  assert.equal(matchesLength('banana', WORD_LENGTH.LONG), false);
  assert.equal(matchesLength('cat', 'riesig'), false);
});

test('countByLevel counts the guessing words of every level', () => {
  const counts = countByLevel(guessingWords(vocabulary));
  assert.equal(Object.keys(counts).length, LEVELS.length);
  for (const level of LEVELS) assert.ok(counts[level] > 0, `keine Wörter für ${level}`);
});

test('createGame picks a word of the chosen levels and lengths', () => {
  const game = gameFor(5, { levels: ['A1'], lengths: [WORD_LENGTH.SHORT] });
  assert.equal(game.word.level, 'A1');
  assert.ok(matchesLength(game.answer, WORD_LENGTH.SHORT));
  assert.deepEqual(game.guessed, []);
  assert.deepEqual(game.wrong, []);
  assert.equal(game.maxMisses, DEFAULT_MISSES);
  assert.equal(game.status, 'playing');
});

test('createGame validates options and fails on an empty pool', () => {
  assert.throws(() => gameFor(1, { misses: 7 }), /Ungültige Anzahl Fehlversuche/);
  assert.throws(() => gameFor(1, { lengths: [] }), /Mindestens eine Wortlänge/);
  assert.throws(() => createGame(vocabulary, { levels: ['X9'] }), /keine Wörter/);
});

test('createGame avoids excluded answers until the pool is exhausted', () => {
  const small = [word('a', 'cat', 'Katze'), word('b', 'dog', 'Hund')];
  const excluded = createGame(small, { rng: seededRandom(1), exclude: ['cat'] });
  assert.equal(excluded.answer, 'dog');
  const fallback = createGame(small, { rng: seededRandom(1), exclude: ['cat', 'dog'] });
  assert.ok(['cat', 'dog'].includes(fallback.answer));
});

test('a correct guess reveals the letter at every position, case-insensitively', () => {
  const step = guess(gameOf('letter'), 'E');
  assert.equal(step.result, 'hit');
  assert.deepEqual(step.game.guessed, ['e']);
  assert.deepEqual(revealed(step.game), [null, 'e', null, null, 'e', null]);
});

test('spaces and hyphens are shown from the start', () => {
  assert.deepEqual(revealed(gameOf('mother-in-law')), [null, null, null, null, null, null, '-', null, null, '-', null, null, null]);
  assert.deepEqual(revealed(gameOf('a b')), [null, ' ', null]);
});

test('a repeated guess is reported and does not count', () => {
  let game = gameOf('cat');
  game = guess(game, 'c').game;
  const step = guess(game, 'C');
  assert.equal(step.result, 'repeat');
  assert.equal(step.letter, 'c');
  assert.deepEqual(step.game.guessed, ['c']);
  assert.equal(missesLeft(step.game), 3);
});

test('misses count down to a loss and hits can win the word', () => {
  let game = gameOf('cat', { maxMisses: 2 });
  let step = guess(game, 'x');
  assert.equal(step.result, 'miss');
  assert.equal(missesLeft(step.game), 1);
  step = guess(step.game, 'y');
  assert.equal(step.result, 'lost');
  assert.equal(step.game.status, 'lost');
  assert.equal(isOver(step.game), true);
  assert.equal(guess(step.game, 'c').result, 'ignored');

  game = gameOf('cat', { maxMisses: 2 });
  step = guessAll(game, ['x', 'c', 'a', 't']);
  assert.equal(step.result, 'won');
  assert.equal(step.game.status, 'won');
  assert.equal(step.game.wrong.length, 1);
});

test('the last needed letter wins directly', () => {
  const step = guessAll(gameOf('cat'), ['c', 'a', 't']);
  assert.equal(step.result, 'won');
  assert.ok(revealed(step.game).every(char => char !== null));
});

test('non-letters and multi-character input are ignored', () => {
  const game = gameOf('cat');
  for (const key of ['1', 'ä', 'ab', '', ' ']) assert.equal(guess(game, key).result, 'ignored');
});

test('the alphabet covers exactly the guessable letters', () => {
  assert.equal(LETTERS.length, 26);
  assert.deepEqual([...LETTERS].sort(), [...'abcdefghijklmnopqrstuvwxyz'].sort());
  assert.ok(MISS_OPTIONS.includes(DEFAULT_MISSES));
  assert.deepEqual([...LENGTH_FILTERS].sort(), ['long', 'medium', 'short']);
});

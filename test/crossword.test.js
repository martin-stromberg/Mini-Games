import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WORD_COUNT, DIRECTION, MAX_GRID_SPAN, WORD_COUNT_OPTIONS, allCellKeys, checkAnswers, completedWords, countByLevel, createRound, crosswordWords, distinctGermanCount, firstEmptyIndex, initialAnswers, revealWord, validatePuzzle, wordsAtCell } from '../src/crossword/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { vocabulary } from './fixtures/rounds.js';

const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });
const word = (id, english, german, { level = 'A1', partOfSpeech = 'noun' } = {}) => ({ id, english, german, level, partOfSpeech });

test('crosswordWords keeps only distinct single A-Z words and strips the verb marker', () => {
  const items = crosswordWords([
    word('v1', 'to improve', 'verbessern', { partOfSpeech: 'verb' }),
    word('n1', 'cat', 'Katze'),
    word('p1', 'train station', 'Bahnhof'),
    word('r1', 'to run', 'laufen', { partOfSpeech: 'verb' }),
    word('r2', 'run', 'Rennen'),
    word('s1', 'a', 'ein')
  ]);
  assert.deepEqual(items.map(item => item.answer).sort(), ['CAT', 'IMPROVE', 'RUN']);
  assert.equal(items.find(item => item.answer === 'IMPROVE').word.german, 'verbessern');
});

test('every real level offers enough crossword words with distinct clues', () => {
  const items = crosswordWords(vocabulary);
  const counts = countByLevel(items);
  for (const level of LEVELS) {
    assert.ok(counts[level] >= Math.max(...WORD_COUNT_OPTIONS), `zu wenige Wörter für ${level}`);
    assert.ok(distinctGermanCount(items.filter(item => item.word.level === level)) >= Math.max(...WORD_COUNT_OPTIONS), `zu wenige Hinweise für ${level}`);
  }
});

test('generated crossword rounds are connected, compact and rule-conform', () => {
  for (const count of WORD_COUNT_OPTIONS) for (const seed of [1, 2, 3, 17, 42, 7331]) {
    const round = roundFor(seed, { count });
    const check = validatePuzzle(round);
    assert.equal(round.words.length, count);
    assert.ok(round.rows <= MAX_GRID_SPAN && round.cols <= MAX_GRID_SPAN, `${round.rows}x${round.cols}`);
    assert.deepEqual(check.errors, []);
    assert.equal(new Set(round.words.map(word => word.answer)).size, count);
    assert.equal(new Set(round.words.map(word => word.german.toLocaleLowerCase('de'))).size, count);
  }
});

test('the same seed reproduces the same crossword round', () => {
  assert.deepEqual(roundFor(1234, { count: 12 }), roundFor(1234, { count: 12 }));
});

test('different seeds vary the selected words and grid', () => {
  const first = roundFor(1), second = roundFor(2);
  assert.notDeepEqual(first.words.map(word => word.answer).sort(), second.words.map(word => word.answer).sort());
  assert.notDeepEqual(first.grid, second.grid);
});

test('single-level rounds only use words of the selected level', () => {
  const round = roundFor(77, { levels: ['B2'], count: 8 });
  assert.equal(round.words.length, 8);
  assert.ok(round.words.every(word => word.level === 'B2'));
});

test('createRound validates options and reports an insufficient clue pool', () => {
  assert.throws(() => roundFor(1, { count: 9 }), /Ungültige Anzahl Wörter/);
  assert.throws(() => roundFor(1, { levels: [] }), /Mindestens ein Niveau/);
  const small = ['CAT', 'DOG', 'SUN', 'CAR', 'BUS'].map((english, index) => word(`w${index}`, english, `Wort ${index}`));
  assert.throws(() => createRound(small, { count: 8, rng: seededRandom(1) }), /nur 5 geeignete Wörter/);
});

test('crossing cells expose both crossing words in the preferred order', () => {
  const round = roundFor(5, { count: 12 });
  const crossing = Object.values(round.cells).find(cell => cell.words.length > 1);
  assert.ok(crossing, 'kein Kreuzungsfeld gefunden');
  const key = `${crossing.row},${crossing.col}`;
  const acrossFirst = wordsAtCell(round, key, DIRECTION.ACROSS);
  assert.equal(acrossFirst[0].direction, DIRECTION.ACROSS);
  assert.equal(acrossFirst.length, crossing.words.length);
});

test('answers can be checked, words completed and a word revealed', () => {
  const round = roundFor(9, { count: 8 });
  const answers = initialAnswers(round);
  let result = checkAnswers(round, answers);
  assert.equal(result.empty, allCellKeys(round).length);
  assert.equal(result.solved, false);

  const first = round.words[0];
  for (const key of first.cells) answers[key] = round.cells[key].letter;
  assert.deepEqual(completedWords(round, answers).map(word => word.id), [first.id]);
  assert.equal(firstEmptyIndex(round, answers, first), 0);

  const wrongKey = round.words[1].cells[0];
  answers[wrongKey] = round.cells[wrongKey].letter === 'A' ? 'B' : 'A';
  result = checkAnswers(round, answers);
  assert.deepEqual(result.wrong, [wrongKey]);

  const revealed = revealWord(round, answers, round.words[1].id);
  for (const key of round.words[1].cells) assert.equal(revealed[key], round.cells[key].letter);
  assert.equal(checkAnswers(round, revealed).wrong.length, 0);
});

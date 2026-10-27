import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY, LEVELS, MAX_GENERATION_ATTEMPTS, MIN_WORD_LENGTH, SIZE, WORDS_PER_ROUND, classifySlots, generateRound, seededRandom } from '../src/word-search/game.js';
import { exactSlot, findSeed, roundFor, vocabulary } from './fixtures/rounds.js';

const step = target => ({ dr: target.path[1].row - target.path[0].row, dc: target.path[1].col - target.path[0].col });

for (const level of LEVELS) {
  test(`a round for level ${level} only uses ten distinct words of that level`, () => {
    const round = roundFor(5, DIFFICULTY.EASY, [level]);
    assert.equal(round.targets.length, WORDS_PER_ROUND);
    assert.ok(round.targets.every(target => target.level === level));
    assert.equal(new Set(round.targets.map(target => target.id)).size, WORDS_PER_ROUND);
  });
}

test('generated rounds fill every grid cell and keep exact letter paths', () => {
  for (const difficulty of Object.values(DIFFICULTY)) for (const seed of [1, 42, 7331]) {
    const round = roundFor(seed, difficulty);
    assert.equal(round.grid.length, SIZE);
    assert.ok(round.grid.every(row => row.length === SIZE && row.every(letter => /^[A-Z]$/.test(letter))));
    for (const target of round.targets) {
      assert.equal(target.path.length, target.english.length);
      assert.ok(target.path.length >= MIN_WORD_LENGTH && target.path.length <= SIZE);
      assert.equal(target.path.map(cell => round.grid[cell.row][cell.col]).join(''), target.english);
    }
  }
});

test('generated paths are straight lines without gaps', () => {
  for (const difficulty of Object.values(DIFFICULTY)) for (const seed of [3, 17, 99]) for (const target of roundFor(seed, difficulty).targets) {
    const { dr, dc } = step(target);
    target.path.forEach((cell, index) => {
      assert.equal(cell.row, target.path[0].row + dr * index);
      assert.equal(cell.col, target.path[0].col + dc * index);
    });
  }
});

test('easy rounds only use horizontal and vertical paths', () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) for (const target of roundFor(seed, DIFFICULTY.EASY).targets) {
    const { dr, dc } = step(target);
    assert.ok((dr === 0 && dc === 1) || (dr === 1 && dc === 0));
  }
});

test('hard rounds can use diagonal paths in both slopes', () => {
  const directions = new Set();
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) for (const target of roundFor(seed, DIFFICULTY.HARD).targets) {
    const { dr, dc } = step(target);
    directions.add(`${dr},${dc}`);
  }
  assert.ok(directions.has('1,1'));
  assert.ok(directions.has('1,-1'));
});

test('two-letter and thirteen-letter words are generated and solvable', () => {
  const { round } = findSeed(candidate => candidate.targets.some(t => t.english.length === MIN_WORD_LENGTH) && candidate.targets.some(t => t.english.length === SIZE), DIFFICULTY.EASY, ['A1', 'C1']);
  const result = classifySlots(round.targets.map(exactSlot), round.targets);
  assert.equal(result.found.size, WORDS_PER_ROUND);
});

test('the same seed produces the same round', () => {
  assert.deepEqual(roundFor(1234, DIFFICULTY.HARD), roundFor(1234, DIFFICULTY.HARD));
});

test('different seeds vary the word selection and the fill pattern', () => {
  const first = roundFor(1), second = roundFor(2);
  assert.notDeepEqual(first.targets.map(t => t.id).sort(), second.targets.map(t => t.id).sort());
  assert.notDeepEqual(first.grid, second.grid);
});

test('a pool with too few words ends with a clear error', () => {
  const pool = vocabulary.slice(0, WORDS_PER_ROUND - 1);
  assert.throws(() => generateRound(pool, LEVELS, DIFFICULTY.EASY, seededRandom(1)), new RegExp(`nur ${pool.length} geeignete Wörter.*mindestens ${WORDS_PER_ROUND}`));
});

test('deactivated levels are never used to fill up a round', () => {
  const round = roundFor(77, DIFFICULTY.EASY, ['B1', 'B2']);
  assert.ok(round.targets.every(target => ['B1', 'B2'].includes(target.level)));
});

const unplaceableVocabulary = Array.from({ length: WORDS_PER_ROUND }, (_, index) => ({
  english: String.fromCharCode(65 + 2 * index, 66 + 2 * index),
  german: `Wort ${index + 1}`,
  level: 'A1'
}));

test('an unplaceable input ends with a clear error after the retry limit', () => {
  assert.throws(() => generateRound(unplaceableVocabulary, LEVELS, DIFFICULTY.EASY, seededRandom(1), { size: 2 }), /nach mehreren Versuchen nicht erzeugt/);
});

test('an unplaceable input uses exactly the configured number of placement attempts', () => {
  let calls = 0;
  const base = seededRandom(1);
  const countingRandom = () => { calls += 1; return base(); };
  assert.throws(() => generateRound(unplaceableVocabulary, LEVELS, DIFFICULTY.EASY, countingRandom, { size: 2 }));
  const shuffleCalls = WORDS_PER_ROUND - 1;
  const placedWordsPerAttempt = 2;
  assert.equal(calls, shuffleCalls + placedWordsPerAttempt * MAX_GENERATION_ATTEMPTS);
});

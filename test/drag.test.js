import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY, straightPath } from '../src/word-search/game.js';

test('diagonal drags are rejected in easy mode', () => {
  assert.equal(straightPath({ row: 1, col: 1 }, { row: 3, col: 3 }, DIFFICULTY.EASY), null);
});

test('diagonal drags are accepted in hard mode', () => {
  assert.deepEqual(straightPath({ row: 1, col: 3 }, { row: 3, col: 1 }, DIFFICULTY.HARD), [{ row: 1, col: 3 }, { row: 2, col: 2 }, { row: 3, col: 1 }]);
});

test('horizontal drags cover every cell between start and end', () => {
  assert.deepEqual(straightPath({ row: 1, col: 4 }, { row: 1, col: 1 }, DIFFICULTY.EASY), [1, 2, 3, 4].reverse().map(col => ({ row: 1, col })));
});

test('crooked drags are rejected in hard mode', () => {
  assert.equal(straightPath({ row: 0, col: 0 }, { row: 1, col: 3 }, DIFFICULTY.HARD), null);
});

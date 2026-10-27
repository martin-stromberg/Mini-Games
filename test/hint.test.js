import test from 'node:test';
import assert from 'node:assert/strict';
import { getHint } from '../src/word-search/game.js';
import { exactSlot, findCrossing, findSeed, freeCell, isolatedTargetIndex, pathKeys, roundFor } from './fixtures/rounds.js';

const round = roundFor(91);
const isolated = isolatedTargetIndex(round, 4);
const isolatedKeys = pathKeys(round.targets[isolated]);

test('an extra cell is circled before anything else', () => {
  const hint = getHint([isolatedKeys.slice(0, 2), [...exactSlot(round.targets[isolated]), freeCell(round)]], round.targets);
  assert.equal(hint.type, 'error');
  assert.equal(hint.cell, freeCell(round));
});

test('a partial slot gets the next free neighbouring target cell', () => {
  const hint = getHint([isolatedKeys.slice(1, 3)], round.targets);
  assert.deepEqual(hint, { ...hint, type: 'missing', cell: isolatedKeys[0] });
});

test('a neighbour selected in another slot is never circled as missing', () => {
  const hint = getHint([isolatedKeys.slice(0, 2), [isolatedKeys[2]]], round.targets);
  assert.equal(hint.type, 'missing');
  assert.equal(hint.cell, isolatedKeys[3]);
});

test('a partial slot without free neighbours falls back to the next partial slot', () => {
  const hint = getHint([[isolatedKeys[1]], [isolatedKeys[0]], [isolatedKeys[2]]], round.targets);
  assert.equal(hint.type, 'missing');
  assert.equal(hint.cell, isolatedKeys[3]);
});

test('without free neighbours the first unmarked cell of the next open target is circled', () => {
  const slots = [isolatedKeys.slice(0, 2), isolatedKeys.slice(2)];
  const marked = new Set(isolatedKeys);
  const next = round.targets.find((target, index) => index !== isolated && pathKeys(target).some(key => !marked.has(key)));
  const hint = getHint(slots, round.targets);
  assert.equal(hint.type, 'missing');
  assert.equal(hint.cell, pathKeys(next).find(key => !marked.has(key)));
});

test('without any slots the first cell of the first target is circled', () => {
  assert.equal(getHint([], round.targets).cell, pathKeys(round.targets[0])[0]);
});

test('a duplicate exact slot does not produce an error circle', () => {
  const slot = exactSlot(round.targets[0]);
  const hint = getHint([slot, slot], round.targets);
  assert.equal(hint.type, 'missing');
  assert.ok(!slot.includes(hint.cell));
});

test('ten exact slots give no field hint', () => {
  const hint = getHint(round.targets.map(exactSlot), round.targets);
  assert.equal(hint.type, 'none');
  assert.equal(hint.cell, null);
});

test('a skipped cell circles the selected cell outside the best segment, not the gap', () => {
  const hint = getHint([[isolatedKeys[0], isolatedKeys[2]]], round.targets);
  assert.equal(hint.type, 'error');
  assert.equal(hint.cell, isolatedKeys[2]);
});

test('an isolated crossing cell uses the first candidate path for the hint', () => {
  const { round: crossingRound } = findSeed(candidate => findCrossing(candidate) !== null);
  const crossing = findCrossing(crossingRound);
  const keys = pathKeys(crossingRound.targets[crossing.indexes[0]]);
  const position = keys.indexOf(crossing.key);
  const expected = position > 0 ? keys[position - 1] : keys[position + 1];
  assert.equal(getHint([[crossing.key]], crossingRound.targets).cell, expected);
});

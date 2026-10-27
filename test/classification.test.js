import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS_PER_ROUND, classifySlots, toSortedCellKeys } from '../src/word-search/game.js';
import { exactSlot, findCrossing, findSeed, freeCell, isolatedTargetIndex, pathKeys, roundFor } from './fixtures/rounds.js';

const round = roundFor(21);

test('ten exact slots find ten distinct targets', () => {
  const result = classifySlots(round.targets.map(exactSlot), round.targets);
  assert.equal(result.found.size, WORDS_PER_ROUND);
  assert.ok(result.classifications.every(item => item.kind === 'exact'));
});

test('a reversed selection order counts as the same exact target', () => {
  const result = classifySlots([[...pathKeys(round.targets[0])].reverse()], round.targets);
  assert.equal(result.classifications[0].kind, 'exact');
  assert.equal(result.classifications[0].targetId, round.targets[0].id);
});

test('an exact word plus an extra cell is an error without a hit', () => {
  const result = classifySlots([[...exactSlot(round.targets[0]), freeCell(round)]], round.targets);
  assert.equal(result.classifications[0].kind, 'error');
  assert.deepEqual(result.classifications[0].extras, [freeCell(round)]);
  assert.equal(result.found.size, 0);
});

test('a contiguous part of a target path is partial', () => {
  const index = isolatedTargetIndex(round, 3);
  const result = classifySlots([pathKeys(round.targets[index]).slice(0, 2)], round.targets);
  assert.equal(result.classifications[0].kind, 'partial');
  assert.deepEqual(result.classifications[0].candidates, [round.targets[index].id]);
});

test('a selection that skips a path cell is an error', () => {
  const index = isolatedTargetIndex(round, 3);
  const keys = pathKeys(round.targets[index]);
  const result = classifySlots([[keys[0], keys[2]]], round.targets);
  assert.equal(result.classifications[0].kind, 'error');
  assert.deepEqual(result.classifications[0].extras, [keys[2]]);
});

test('a duplicate exact slot counts its target only once', () => {
  const slot = exactSlot(round.targets[0]);
  const result = classifySlots([slot, slot], round.targets);
  assert.equal(result.found.size, 1);
  assert.equal(result.classifications[1].kind, 'exact');
  assert.equal(result.classifications[1].targetId, undefined);
});

test('identical cell sets for several targets assign the first open target in round order', () => {
  const path = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
  const targets = [{ id: 'a', path }, { id: 'b', path }];
  const result = classifySlots([toSortedCellKeys(path), toSortedCellKeys(path)], targets);
  assert.equal(result.classifications[0].targetId, 'a');
  assert.equal(result.classifications[1].targetId, 'b');
});

test('a single crossing cell is partial for every crossing target', () => {
  const { round: crossingRound } = findSeed(candidate => findCrossing(candidate) !== null);
  const crossing = findCrossing(crossingRound);
  const result = classifySlots([[crossing.key]], crossingRound.targets);
  assert.equal(result.classifications[0].kind, 'partial');
  assert.deepEqual(result.classifications[0].candidates, crossing.indexes.map(index => crossingRound.targets[index].id));
});

test('two complete words in one slot are an error that keeps the longer word as best segment', () => {
  const first = isolatedTargetIndex(round, 2);
  const second = isolatedTargetIndex(round, 2, [first]);
  const [longer, shorter] = round.targets[first].path.length >= round.targets[second].path.length ? [first, second] : [second, first];
  const result = classifySlots([[...exactSlot(round.targets[first]), ...exactSlot(round.targets[second])]], round.targets);
  assert.equal(result.classifications[0].kind, 'error');
  assert.equal(result.found.size, 0);
  const expected = round.targets[longer].path.length === round.targets[shorter].path.length ? Math.max(first, second) : shorter;
  assert.deepEqual(result.classifications[0].extras, exactSlot(round.targets[expected]));
});

test('empty slots are classified as empty', () => {
  const result = classifySlots([null, []], round.targets);
  assert.deepEqual(result.classifications.map(item => item.kind), ['empty', 'empty']);
});

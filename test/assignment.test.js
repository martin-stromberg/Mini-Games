import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS_PER_ROUND, classifySlots, getHint, toSortedCellKeys } from '../src/word-search/game.js';
import { exactSlot, freeCell, isolatedTargetIndex, pathKeys, roundFor } from './fixtures/rounds.js';

const round = roundFor(21);
const ids = round.targets.map(target => target.id);
const first = isolatedTargetIndex(round, 3);
const second = isolatedTargetIndex(round, 3, [first]);

test('ten exact slots with matching translations find ten targets', () => {
  const result = classifySlots(round.targets.map(exactSlot), round.targets, ids);
  assert.equal(result.found.size, WORDS_PER_ROUND);
  assert.ok(result.classifications.every(item => item.kind === 'exact'));
});

test('an exact word assigned to another translation is a mismatch without a hit', () => {
  const result = classifySlots([exactSlot(round.targets[first])], round.targets, [ids[second]]);
  assert.equal(result.classifications[0].kind, 'mismatch');
  assert.deepEqual(result.classifications[0].candidates, [ids[first]]);
  assert.equal(result.found.size, 0);
});

test('a part of the assigned word is partial', () => {
  const result = classifySlots([pathKeys(round.targets[first]).slice(0, 2)], round.targets, [ids[first]]);
  assert.equal(result.classifications[0].kind, 'partial');
  assert.deepEqual(result.classifications[0].candidates, [ids[first]]);
});

test('a part of a different word than the assigned one is an error', () => {
  const result = classifySlots([pathKeys(round.targets[first]).slice(0, 2)], round.targets, [ids[second]]);
  assert.equal(result.classifications[0].kind, 'error');
});

test('a slot without an assignment is still checked against all targets', () => {
  const result = classifySlots([exactSlot(round.targets[first])], round.targets, [null]);
  assert.equal(result.classifications[0].kind, 'exact');
  assert.equal(result.classifications[0].targetId, ids[first]);
});

test('the hint circles the start cell of a marking with the wrong translation', () => {
  const hint = getHint([exactSlot(round.targets[first])], round.targets, [ids[second]]);
  assert.equal(hint.type, 'mismatch');
  assert.equal(hint.cell, toSortedCellKeys(pathKeys(round.targets[first]))[0]);
});

test('an extra cell is circled before a wrong translation', () => {
  const wrongTranslation = exactSlot(round.targets[first]);
  const withExtra = [...exactSlot(round.targets[second]), freeCell(round)];
  const hint = getHint([wrongTranslation, withExtra], round.targets, [ids[second], ids[second]]);
  assert.equal(hint.type, 'error');
  assert.equal(hint.cell, freeCell(round));
});

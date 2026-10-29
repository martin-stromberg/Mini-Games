import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_KIND, DEFAULT_PAIRS, PAIR_OPTIONS, countByLevel, createRound, flipCard, isFinished, memoryWords } from '../src/memory/game.js';
import { seededRandom } from '../src/shared/random.js';
import { germanKey } from '../src/shared/vocabulary.js';
import { vocabulary } from './fixtures/rounds.js';

const words = memoryWords(vocabulary);
const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });
const positionsOf = (round, pairId) => round.cards.flatMap((card, index) => card.pairId === pairId ? [index] : []);

function flipAll(round, indices) {
  let current = round;
  const results = indices.map(index => {
    const step = flipCard(current, index);
    current = step.round;
    return step.result;
  });
  return { round: current, results };
}

test('only vocabulary with a symbol image is used for memory', () => {
  assert.ok(words.length >= PAIR_OPTIONS.at(-1));
  assert.ok(words.every(word => word.image));
  assert.equal(memoryWords([{ english: 'idea', german: 'Idee', image: '' }, { english: 'dog', german: 'Hund', image: 'x.svg' }]).length, 1);
});

test('counts memory words per level, including levels without images', () => {
  const counts = countByLevel(words);
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), words.length);
  assert.ok(counts.A1 > 0);
  assert.equal(typeof counts.C2, 'number');
});

for (const pairs of PAIR_OPTIONS) {
  test(`a round with ${pairs} pairs has one image and one text card per word`, () => {
    const round = roundFor(7, { pairs });
    assert.equal(round.words.length, pairs);
    assert.equal(round.cards.length, pairs * 2);
    for (const word of round.words) {
      const kinds = round.cards.filter(card => card.pairId === word.id).map(card => card.kind).sort();
      assert.deepEqual(kinds, [CARD_KIND.IMAGE, CARD_KIND.TEXT]);
    }
    assert.equal(new Set(round.cards.map(card => card.id)).size, round.cards.length);
  });
}

test('images, English and German texts are unique within a round', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const round = roundFor(seed, { pairs: 12 });
    for (const key of [word => word.image, word => word.english.toLowerCase(), word => germanKey(word.german)]) {
      assert.equal(new Set(round.words.map(key)).size, round.words.length, `Seed ${seed}`);
    }
  }
});

test('the same seed creates the same round and cards are shuffled', () => {
  assert.deepEqual(roundFor(3).cards, roundFor(3).cards);
  assert.notDeepEqual(roundFor(3).cards, roundFor(4).cards);
  const order = roundFor(3).cards.map(card => card.kind).join();
  assert.notEqual(order, Array(DEFAULT_PAIRS).fill('image,text').join());
});

test('the round only uses the selected levels and fails with too few words', () => {
  const a1 = roundFor(5, { levels: ['A1'] });
  assert.ok(a1.words.every(word => word.level === 'A1'));
  assert.throws(() => roundFor(5, { levels: ['C2'] }), /nur 0 Vokabeln mit Bild; für 8 Paare werden 8 benötigt/);
  assert.throws(() => roundFor(5, { pairs: 7 }), /Ungültige Anzahl Paare: 7/);
});

test('flipping both cards of a pair counts one move and keeps the pair found', () => {
  const round = roundFor(9);
  const [first, second] = positionsOf(round, round.words[0].id);
  const { round: after, results } = flipAll(round, [first, second]);
  assert.deepEqual(results, ['first', 'match']);
  assert.equal(after.moves, 1);
  assert.deepEqual(after.revealed, []);
  assert.ok(after.matched.has(round.words[0].id));
  assert.equal(flipCard(after, first).result, 'ignored');
});

test('a mismatch keeps both cards open until the next card is flipped', () => {
  const round = roundFor(9);
  const [a] = positionsOf(round, round.words[0].id);
  const [b] = positionsOf(round, round.words[1].id);
  const [c] = positionsOf(round, round.words[2].id);
  const mismatch = flipAll(round, [a, b]);
  assert.deepEqual(mismatch.results, ['first', 'mismatch']);
  assert.deepEqual(mismatch.round.revealed, [a, b]);
  assert.equal(mismatch.round.moves, 1);
  const next = flipCard(mismatch.round, c);
  assert.equal(next.result, 'first');
  assert.deepEqual(next.round.revealed, [c]);
});

test('flipping the open card again is ignored and does not count as a move', () => {
  const round = roundFor(9);
  const step = flipCard(round, 0);
  const again = flipCard(step.round, 0);
  assert.equal(again.result, 'ignored');
  assert.equal(again.round.moves, 0);
  assert.deepEqual(again.round.revealed, [0]);
});

test('the round is finished when all pairs are found', () => {
  let round = roundFor(11, { pairs: 6 });
  assert.equal(isFinished(round), false);
  for (const word of round.words) round = flipAll(round, positionsOf(round, word.id)).round;
  assert.equal(isFinished(round), true);
  assert.equal(round.moves, 6);
});

test('flipping a position outside the deck is an error', () => {
  assert.throws(() => flipCard(roundFor(1), 99), /Keine Karte an Position 99/);
});

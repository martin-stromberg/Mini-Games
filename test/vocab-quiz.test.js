import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_QUESTION_COUNT, OPTION_COUNT, QUESTION_TYPE, QUESTION_TYPES, advance, answerQuestion, answerText, countByLevel, createRound, hasImage, isAnswered, isFinished, pickDistractors, results, sameMeaning } from '../src/vocab-quiz/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS, germanKey } from '../src/shared/vocabulary.js';
import { vocabulary } from './fixtures/rounds.js';

const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });
const questionIds = round => new Set(round.questions.map(question => question.word.id));
const optionTexts = question => question.options.map(word => answerText(question, word).toLowerCase());

const word = (id, english, german, { partOfSpeech = 'noun', topic = 'Tiere', synonyms = [], image = '', level = 'A1' } = {}) => ({
  id, english, german, partOfSpeech, topic, synonyms, level,
  exampleGerman: 'Beispielsatz.', exampleEnglish: 'Example sentence.', ...(image ? { image } : {})
});

test('every question offers four options with exactly one correct answer', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const round = roundFor(seed);
    assert.equal(round.questions.length, DEFAULT_QUESTION_COUNT);
    for (const question of round.questions) {
      assert.equal(question.options.length, OPTION_COUNT);
      assert.equal(question.options[question.correctIndex], question.word);
      assert.equal(new Set(optionTexts(question)).size, OPTION_COUNT, `Seed ${seed}: doppelte Antworttexte`);
      assert.equal(new Set(question.options.map(entry => entry.id)).size, OPTION_COUNT, `Seed ${seed}: doppelte Vokabeln`);
    }
  }
});

test('distractors are clearly wrong: no synonyms and no matching translations', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const round = roundFor(seed);
    const ids = questionIds(round);
    for (const question of round.questions) {
      for (const [index, option] of question.options.entries()) {
        if (index === question.correctIndex) continue;
        assert.ok(!ids.has(option.id) || option === question.word, 'Fragevokabel als falsche Antwort');
        assert.ok(!sameMeaning(question.word, option), `${question.word.german} ↔ ${option.german} sind sinnverwandt (Seed ${seed})`);
      }
    }
  }
});

test('distractors prefer same part of speech and topic', () => {
  const question = { word: word('w1', 'cat', 'Katze'), type: QUESTION_TYPE.EN_TO_DE };
  const pool = [
    word('w1', 'cat', 'Katze'),
    word('d1', 'dog', 'Hund'),
    word('d2', 'horse', 'Pferd'),
    word('d3', 'bird', 'Vogel'),
    word('x1', 'green', 'grün', { partOfSpeech: 'adjective', topic: 'Farben' }),
    word('x2', 'house', 'Haus', { topic: 'Zuhause' })
  ];
  const picked = pickDistractors(question, pool, new Set(['w1']), seededRandom(3));
  assert.deepEqual(picked.map(entry => entry.id).sort(), ['d1', 'd2', 'd3']);
});

test('synonyms and equal translations are excluded as distractors', () => {
  const house = word('h', 'house', 'Haus', { synonyms: ['Gebäude'], topic: 'Zuhause' });
  const building = word('b', 'building', 'Gebäude', { synonyms: ['Haus'], topic: 'Zuhause' });
  const flat = word('f', 'flat', 'Wohnung', { topic: 'Zuhause' });
  const apartment = word('a', 'apartment', 'Wohnung', { topic: 'Zuhause' });
  const pool = [house, building, flat, apartment, word('d1', 'dog', 'Hund'), word('d2', 'horse', 'Pferd'), word('d3', 'bird', 'Vogel')];
  for (const type of QUESTION_TYPES.filter(type => type !== QUESTION_TYPE.IMAGE_TO_EN)) {
    for (const target of [house, flat]) {
      const picked = pickDistractors({ word: target, type }, pool, new Set(), seededRandom(5));
      assert.ok(picked.every(entry => !sameMeaning(target, entry)), `${target.english}: sinnverwandte Vokabel als falsche Antwort`);
    }
  }
  const picked = pickDistractors({ word: house, type: QUESTION_TYPE.EN_TO_DE }, pool, new Set(), seededRandom(5));
  assert.ok(!picked.some(entry => germanKey(entry.german) === germanKey(house.german)));
});

test('distractor picking fails when too few unambiguous candidates exist', () => {
  const question = { word: word('w1', 'cat', 'Katze'), type: QUESTION_TYPE.EN_TO_DE };
  const pool = [word('w1', 'cat', 'Katze'), word('x', 'kitty', 'Katze', { synonyms: ['Katze'] }), word('d', 'dog', 'Hund')];
  assert.throws(() => pickDistractors(question, pool, new Set(), seededRandom(1)), /eindeutige falsche Antworten/);
});

test('every selected question type appears in a mixed round', () => {
  const round = roundFor(7, { count: 30 });
  const types = new Set(round.questions.map(question => question.type));
  assert.deepEqual([...types].sort(), [...QUESTION_TYPES].sort());
  for (const question of round.questions) if (question.type === QUESTION_TYPE.IMAGE_TO_EN) assert.ok(hasImage(question.word));
});

test('a round with only image questions uses only vocabulary with a symbol image', () => {
  const round = roundFor(9, { types: [QUESTION_TYPE.IMAGE_TO_EN] });
  assert.ok(round.questions.every(question => question.type === QUESTION_TYPE.IMAGE_TO_EN && hasImage(question.word)));
  for (const question of round.questions) for (const option of question.options) assert.ok(hasImage(option));
});

test('image questions are skipped when the selected levels lack enough images', () => {
  const round = roundFor(4, { levels: ['C2'], count: 10 });
  assert.ok(round.questions.every(question => question.type !== QUESTION_TYPE.IMAGE_TO_EN));
  assert.equal(round.questions.length, 10);
});

test('a round only uses the selected levels and never repeats a question word', () => {
  const round = roundFor(11, { levels: ['A1', 'A2'], count: 30 });
  assert.ok(round.questions.every(question => ['A1', 'A2'].includes(question.word.level)));
  assert.equal(new Set(round.questions.map(question => question.word.id)).size, 30);
  const germanKeys = round.questions.map(question => germanKey(question.word.german));
  assert.equal(new Set(germanKeys).size, germanKeys.length);
});

test('the same seed creates the same round', () => {
  assert.deepEqual(roundFor(3), roundFor(3));
  assert.notDeepEqual(roundFor(3), roundFor(4));
});

test('round creation validates count, types and available vocabulary', () => {
  assert.throws(() => roundFor(1, { count: 7 }), /Ungültige Anzahl Fragen: 7/);
  assert.throws(() => roundFor(1, { types: [] }), /Mindestens ein Fragetyp/);
  assert.throws(() => roundFor(1, { levels: [] }), /nur 0 Vokabeln; für 10 Fragen werden 10 benötigt/);
  assert.throws(() => roundFor(1, { levels: ['C2'], types: [QUESTION_TYPE.IMAGE_TO_EN] }), /nur 0 Vokabeln mit Bild; für 10 Bildfragen werden 10 benötigt/);
});

test('answering records the choice once and scoring counts correct answers', () => {
  let round = roundFor(13);
  const question = round.questions[0];
  const correct = answerQuestion(round, question.correctIndex);
  assert.equal(correct.result, 'correct');
  assert.equal(isAnswered(correct.round), true);
  assert.equal(answerQuestion(correct.round, 0).result, 'ignored');
  const wrongIndex = (question.correctIndex + 1) % OPTION_COUNT;
  const wrong = answerQuestion(round, wrongIndex);
  assert.equal(wrong.result, 'wrong');
  assert.equal(wrong.round.answers[0], wrongIndex);
});

test('advancing through all questions finishes the round and lists the mistakes', () => {
  let round = roundFor(17);
  const wrongAnswers = [1, 3];
  for (let index = 0; index < round.questions.length; index++) {
    const question = round.questions[index];
    const choice = wrongAnswers.includes(index) ? (question.correctIndex + 1) % OPTION_COUNT : question.correctIndex;
    round = advance(answerQuestion(round, choice).round);
  }
  assert.equal(isFinished(round), true);
  const { total, correct, mistakes } = results(round);
  assert.equal(total, DEFAULT_QUESTION_COUNT);
  assert.equal(correct, DEFAULT_QUESTION_COUNT - wrongAnswers.length);
  assert.deepEqual(mistakes.map(mistake => mistake.question), wrongAnswers.map(index => round.questions[index]));
  for (const mistake of mistakes) assert.notEqual(mistake.chosen, mistake.question.options[mistake.question.correctIndex]);
});

test('answering outside the options is an error', () => {
  const round = roundFor(1);
  assert.throws(() => answerQuestion(round, 4), /Keine Antwort an Position 4/);
  assert.throws(() => answerQuestion(round, -1), /Keine Antwort an Position -1/);
});

test('countByLevel counts the words of every GER level', () => {
  const counts = countByLevel(vocabulary);
  assert.equal(Object.keys(counts).length, LEVELS.length);
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), vocabulary.length);
  assert.ok(counts.A1 > 0);
});

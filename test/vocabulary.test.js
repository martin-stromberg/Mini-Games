import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, MIN_WORD_LENGTH, SIZE, WORD_PATTERN, WORDS_PER_ROUND, germanKey, toGridWord, toPuzzleWords, validateVocabulary } from '../src/word-search/game.js';
import { levelFiles, puzzleWords, vocabulary } from './fixtures/rounds.js';

const TEXT_FIELDS = ['english', 'german', 'partOfSpeech', 'topic', 'exampleGerman', 'exampleEnglish'];

for (const level of LEVELS) {
  test(`the vocabulary file for level ${level} is a list of entries without a level field`, () => {
    assert.ok(Array.isArray(levelFiles[level]));
    assert.ok(levelFiles[level].every(entry => !('level' in entry)));
  });

  test(`real vocabulary offers at least ten puzzle words with distinct translations for level ${level}`, () => {
    const words = puzzleWords.filter(word => word.level === level);
    assert.ok(new Set(words.map(word => germanKey(word.german))).size >= WORDS_PER_ROUND);
  });
}

test('every real vocabulary entry is complete, including German and English example sentences', () => {
  const incomplete = vocabulary.filter(entry => !TEXT_FIELDS.every(field => typeof entry[field] === 'string' && entry[field].trim()) || !Array.isArray(entry.synonyms));
  assert.deepEqual(incomplete.map(entry => entry.english), []);
});

test('every real vocabulary entry has a specific part of speech', () => {
  const parts = new Set(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun']);
  assert.deepEqual(vocabulary.filter(entry => !parts.has(entry.partOfSpeech)).map(entry => entry.english), []);
});

test('verbs are stored as infinitive with "to", except modal verbs', () => {
  const modals = new Set(['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would']);
  const withoutTo = vocabulary.filter(entry => entry.partOfSpeech === 'verb' && !/^to\s/i.test(entry.english) && !modals.has(entry.english));
  assert.deepEqual(withoutTo.map(entry => entry.english), []);
});

test('real vocabulary keeps phrases that do not fit into the grid', () => {
  assert.ok(vocabulary.some(entry => entry.english.includes(' ') && !entry.english.toLowerCase().startsWith('to ')));
});

test('real vocabulary contains a puzzle word of minimum and of maximum length', () => {
  assert.ok(puzzleWords.some(word => word.english.length === MIN_WORD_LENGTH));
  assert.ok(puzzleWords.some(word => word.english.length === SIZE));
});

test('verbs are stored with "to" and placed without it', () => {
  assert.equal(toGridWord(' to improve '), 'IMPROVE');
  assert.ok(vocabulary.some(entry => entry.english === 'to improve'));
  assert.ok(puzzleWords.some(word => word.english === 'IMPROVE'));
});

test('puzzle words only keep distinct A-Z words that fit into the grid', () => {
  const words = toPuzzleWords([
    { english: 'train station', german: 'Bahnhof', level: 'A1' },
    { english: 'self-employment', german: 'Selbstständigkeit', level: 'B1' },
    { english: 'A'.repeat(SIZE + 1), german: 'zu lang', level: 'C2' },
    { english: 'to present', german: 'präsentieren', level: 'B1' },
    { english: 'present', german: 'Geschenk', level: 'A2' }
  ]);
  assert.deepEqual(words.map(word => [word.english, word.german]), [['PRESENT', 'präsentieren']]);
  assert.ok(words.every(word => WORD_PATTERN.test(word.english)));
});

test('validation trims English and German but keeps the original spelling', () => {
  const [entry] = validateVocabulary([{ english: '  To Eat ', german: ' essen ', level: 'A1' }]);
  assert.equal(entry.english, 'To Eat');
  assert.equal(entry.german, 'essen');
});

test('validation rejects a vocabulary that is not a list', () => {
  assert.throws(() => validateVocabulary({}), /keine Liste/);
});

test('validation rejects entries that are not objects', () => {
  assert.throws(() => validateVocabulary([null]), /Vokabeleintrag 1 ist kein Objekt/);
});

test('validation rejects a blank English term', () => {
  assert.throws(() => validateVocabulary([{ english: ' ', german: 'Haus', level: 'A1' }]), /Fehlender englischer Begriff/);
});

test('validation rejects blank translations', () => {
  assert.throws(() => validateVocabulary([{ english: 'house', german: ' ', level: 'A1' }]), /Fehlende deutsche Übersetzung/);
});

test('validation rejects non-text translations', () => {
  assert.throws(() => validateVocabulary([{ english: 'house', german: 3, level: 'A1' }]), /Fehlende deutsche Übersetzung/);
});

test('validation rejects unknown levels', () => {
  assert.throws(() => validateVocabulary([{ english: 'house', german: 'Haus', level: 'D1' }]), /Ungültiges GER-Niveau/);
});

test('validation rejects English duplicates regardless of case and outer whitespace', () => {
  assert.throws(() => validateVocabulary([{ english: 'house', german: 'Haus', level: 'A1' }, { english: 'HOUSE ', german: 'Gebäude', level: 'A2' }]), /Doppelter englischer Begriff: house/);
});

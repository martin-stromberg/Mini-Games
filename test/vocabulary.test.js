import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, MIN_WORD_LENGTH, SIZE, WORDS_PER_ROUND, validateVocabulary } from '../src/word-search/game.js';
import { vocabulary } from './fixtures/rounds.js';

for (const level of LEVELS) {
  test(`real vocabulary offers at least ten words for level ${level}`, () => {
    assert.ok(vocabulary.filter(word => word.level === level).length >= WORDS_PER_ROUND);
  });
}

test('real vocabulary contains a word of minimum and of maximum length', () => {
  assert.ok(vocabulary.some(word => word.english.length === MIN_WORD_LENGTH));
  assert.ok(vocabulary.some(word => word.english.length === SIZE));
});

test('real vocabulary only contains distinct A-Z words with translations', () => {
  assert.ok(vocabulary.every(word => new RegExp(`^[A-Z]{${MIN_WORD_LENGTH},${SIZE}}$`).test(word.english) && word.german.trim()));
  assert.equal(new Set(vocabulary.map(word => word.english)).size, vocabulary.length);
});

test('validation normalises case and outer whitespace', () => {
  const [entry] = validateVocabulary([{ english: '  apple ', german: ' Apfel ', level: 'A1' }]);
  assert.equal(entry.english, 'APPLE');
  assert.equal(entry.german, 'Apfel');
});

test('validation rejects a vocabulary that is not a list', () => {
  assert.throws(() => validateVocabulary({}), /keine Liste/);
});

test('validation rejects entries that are not objects', () => {
  assert.throws(() => validateVocabulary([null]), /Vokabeleintrag 1 ist kein Objekt/);
});

test('validation rejects words with non-letter characters', () => {
  assert.throws(() => validateVocabulary([{ english: 'ice-cream', german: 'Eis', level: 'A1' }]), /Ungültiges englisches Wort/);
});

test('validation rejects words that are too short', () => {
  assert.throws(() => validateVocabulary([{ english: 'A'.repeat(MIN_WORD_LENGTH - 1), german: 'zu kurz', level: 'A1' }]), /Ungültiges englisches Wort/);
});

test('validation rejects words that are longer than the grid', () => {
  assert.throws(() => validateVocabulary([{ english: 'A'.repeat(SIZE + 1), german: 'zu lang', level: 'A1' }]), /Ungültiges englisches Wort/);
});

test('validation accepts words of minimum and of maximum length', () => {
  const entries = validateVocabulary([{ english: 'AB', german: 'kurz', level: 'A1' }, { english: 'C'.repeat(SIZE), german: 'lang', level: 'A1' }]);
  assert.deepEqual(entries.map(entry => entry.english.length), [MIN_WORD_LENGTH, SIZE]);
});

test('validation rejects blank translations', () => {
  assert.throws(() => validateVocabulary([{ english: 'HOUSE', german: ' ', level: 'A1' }]), /Fehlende deutsche Übersetzung/);
});

test('validation rejects non-text translations', () => {
  assert.throws(() => validateVocabulary([{ english: 'HOUSE', german: 3, level: 'A1' }]), /Fehlende deutsche Übersetzung/);
});

test('validation rejects unknown levels', () => {
  assert.throws(() => validateVocabulary([{ english: 'HOUSE', german: 'Haus', level: 'D1' }]), /Ungültiges GER-Niveau/);
});

test('validation rejects duplicates after normalisation', () => {
  assert.throws(() => validateVocabulary([{ english: 'house', german: 'Haus', level: 'A1' }, { english: 'HOUSE ', german: 'Gebäude', level: 'A2' }]), /Doppeltes englisches Wort: HOUSE/);
});

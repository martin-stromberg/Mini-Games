// Übernimmt Vokabeln aus Quelldateien je GER-Niveau (a1.json … c2.json) in public/data/vocabulary/<niveau>.json.
// Aufruf: node scripts/import-vocabulary.mjs <quellordner>
// Quellformat: [{ "Question": "<deutsch>", "Answer": "<englisch>", "PartOfSpeech", "Topic", "Synonyms",
//                 "ExampleSentence": "<deutsch>", "ExampleSentenceTranslation": "<englisch>" }]
// Neue englische Begriffe werden ihrem Niveau angehängt. Ist ein Begriff schon vorhanden, bleibt er in seinem Niveau,
// fehlende Angaben werden aus der Quelle ergänzt.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS, validateVocabulary, vocabularyFile } from '../src/word-search/game.js';

const FIELDS = ['english', 'german', 'partOfSpeech', 'topic', 'synonyms', 'exampleGerman', 'exampleEnglish'];

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Aufruf: node scripts/import-vocabulary.mjs <quellordner>');
  process.exit(1);
}

const targetFile = level => new URL(`../public/${vocabularyFile(level)}`, import.meta.url);
const readJson = path => JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
const text = value => typeof value === 'string' ? value.trim() : '';
// „to improve“ und „improve“ bezeichnen denselben Begriff.
const matchKey = english => english.trim().toLowerCase().replace(/^to\s+/, '');
const isMissing = value => Array.isArray(value) ? false : !text(value);

function fromSource(entry) {
  return {
    english: text(entry.Answer),
    german: text(entry.Question),
    partOfSpeech: text(entry.PartOfSpeech),
    topic: text(entry.Topic),
    synonyms: Array.isArray(entry.Synonyms) ? entry.Synonyms.map(text).filter(Boolean) : [],
    exampleGerman: text(entry.ExampleSentence),
    exampleEnglish: text(entry.ExampleSentenceTranslation)
  };
}

// Optionales Symbolbild (Pfad unter public/) bleibt erhalten; die Quelle liefert keins.
const ordered = entry => ({
  ...Object.fromEntries(FIELDS.map(field => [field, entry[field] ?? (field === 'synonyms' ? [] : '')])),
  ...(entry.image ? { image: entry.image } : {})
});

const byLevel = new Map(LEVELS.map(level => [level, existsSync(targetFile(level)) ? readJson(targetFile(level)) : []]));
const byKey = new Map([...byLevel.values()].flat().map(entry => [matchKey(entry.english), entry]));
const report = [];

for (const level of LEVELS) {
  const path = join(sourceDir, `${level.toLowerCase()}.json`);
  if (!existsSync(path)) continue;
  const counts = { level, read: 0, added: 0, completed: 0, unchanged: 0, invalid: 0 };
  for (const raw of readJson(path)) {
    counts.read += 1;
    const entry = fromSource(raw);
    if (!entry.english || !entry.german) { counts.invalid += 1; continue; }
    const existing = byKey.get(matchKey(entry.english));
    if (!existing) {
      byLevel.get(level).push(entry);
      byKey.set(matchKey(entry.english), entry);
      counts.added += 1;
      continue;
    }
    const gaps = FIELDS.filter(field => field !== 'english' && isMissing(existing[field]) && !isMissing(entry[field]));
    if (!Array.isArray(existing.synonyms) && entry.synonyms.length) gaps.push('synonyms');
    if (!gaps.length) { counts.unchanged += 1; continue; }
    for (const field of gaps) existing[field] = entry[field];
    // Verben einheitlich als Infinitiv mit „to“ führen.
    if (/^to\s/i.test(entry.english) && !/^to\s/i.test(existing.english)) existing.english = entry.english;
    counts.completed += 1;
  }
  report.push(counts);
}

validateVocabulary(LEVELS.flatMap(level => byLevel.get(level).map(entry => ({ ...entry, level }))));
for (const level of LEVELS) {
  const entries = byLevel.get(level).map(ordered);
  writeFileSync(targetFile(level), `[\n${entries.map(entry => `  ${JSON.stringify(entry)}`).join(',\n')}\n]\n`);
}
console.table(report);
console.table(LEVELS.map(level => ({ level, entries: byLevel.get(level).length })));

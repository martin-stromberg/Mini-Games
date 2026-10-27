// Übernimmt Vokabeln aus Quelldateien je GER-Niveau (a1.json … c2.json) in public/data/vocabulary.json.
// Aufruf: node scripts/import-vocabulary.mjs <quellordner>
// Quellformat: [{ "Question": "<deutsch>", "Answer": "<englisch>", ... }]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS, WORD_PATTERN, validateVocabulary } from '../src/word-search/game.js';

const TARGET = new URL('../public/data/vocabulary.json', import.meta.url);
const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Aufruf: node scripts/import-vocabulary.mjs <quellordner>');
  process.exit(1);
}

const readJson = path => JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
// Verben stehen im Infinitiv mit „to“; im Gitter zählt nur das Verb selbst.
const toGridWord = answer => answer.trim().replace(/^to\s+/i, '').toUpperCase();
const germanKey = german => german.trim().toLocaleLowerCase('de');

const entries = readJson(TARGET);
const englishSeen = new Set(entries.map(entry => entry.english));
const germanSeen = new Set(entries.map(entry => germanKey(entry.german)));
const report = [];

for (const level of LEVELS) {
  const path = join(sourceDir, `${level.toLowerCase()}.json`);
  if (!existsSync(path)) continue;
  const counts = { level, read: 0, added: 0, notPlaceable: 0, duplicateEnglish: 0, duplicateGerman: 0 };
  for (const { Question: german, Answer: answer } of readJson(path)) {
    counts.read += 1;
    const english = toGridWord(String(answer ?? ''));
    const key = germanKey(String(german ?? ''));
    if (!key || !WORD_PATTERN.test(english)) counts.notPlaceable += 1;
    else if (englishSeen.has(english)) counts.duplicateEnglish += 1;
    else if (germanSeen.has(key)) counts.duplicateGerman += 1;
    else {
      entries.push({ english, german: german.trim(), level });
      englishSeen.add(english);
      germanSeen.add(key);
      counts.added += 1;
    }
  }
  report.push(counts);
}

validateVocabulary(entries);
entries.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
writeFileSync(TARGET, `[\n${entries.map(entry => `  ${JSON.stringify(entry)}`).join(',\n')}\n]\n`);
console.table(report);
console.log(`${entries.length} Einträge in public/data/vocabulary.json`);

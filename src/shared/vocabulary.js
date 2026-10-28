// Gemeinsamer Vokabelbestand für alle Spiele: eine Datei je GER-Niveau unter public/data/vocabulary/.
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const vocabularyFile = level => `data/vocabulary/${level.toLowerCase()}.json`;
export const germanKey = german => String(german || '').trim().toLocaleLowerCase('de');

// Prüft den vollständigen Vokabelbestand (alle Spiele). Ein Eintrag braucht Englisch, Deutsch und ein GER-Niveau;
// Wortgruppen sind erlaubt. Englische Begriffe sind eindeutig.
export function validateVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary)) throw new Error('Die Vokabeldatei enthält keine Liste.');
  const seen = new Set();
  vocabulary.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') throw new Error(`Vokabeleintrag ${index + 1} ist kein Objekt.`);
    if (typeof entry.english !== 'string' || !entry.english.trim()) throw new Error(`Fehlender englischer Begriff in Eintrag ${index + 1}.`);
    const english = entry.english.trim().toLowerCase();
    if (typeof entry.german !== 'string' || !entry.german.trim()) throw new Error(`Fehlende deutsche Übersetzung in Eintrag ${index + 1}: ${english}`);
    if (!LEVELS.includes(entry.level)) throw new Error(`Ungültiges GER-Niveau in Eintrag ${index + 1}: ${english}`);
    if (seen.has(english)) throw new Error(`Doppelter englischer Begriff: ${english}`);
    seen.add(english);
  });
  return vocabulary.map((entry, index) => ({ ...entry, id: entry.id || `vocab-${index}`, english: entry.english.trim(), german: entry.german.trim() }));
}

async function loadLevelFile(baseUrl, level) {
  const response = await fetch(`${baseUrl}${vocabularyFile(level)}`);
  if (!response.ok) throw new Error(`Die Vokabeldatei für ${level} konnte nicht geladen werden.`);
  const entries = await response.json();
  if (!Array.isArray(entries)) throw new Error(`Die Vokabeldatei für ${level} enthält keine Liste.`);
  return entries.map(entry => ({ ...entry, level }));
}

// Lädt alle Niveaus parallel; jeder Eintrag erhält das Niveau seiner Datei.
export const loadVocabulary = async baseUrl => (await Promise.all(LEVELS.map(level => loadLevelFile(baseUrl, level)))).flat();

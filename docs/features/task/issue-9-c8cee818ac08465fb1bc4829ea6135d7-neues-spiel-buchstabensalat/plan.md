# Umsetzungsplan: Neues Spiel „Buchstabensalat"

## Übersicht

Neues Lernspiel nach dem etablierten Drei-Dateien-Muster (`games/<spiel>/index.html`, `src/<spiel>/game.js`, `src/<spiel>/main.js`). Die gemischten Buchstaben einer englischen Vokabel werden als Kacheln gelegt — per Klick/Touch oder Tastatur —, die deutsche Übersetzung (und optional das Symbolbild) dient als Hinweis. Betroffen sind zusätzlich Startseite, Vite-Build, gemeinsame Styles, Unit- und E2E-Tests sowie Dokumentation.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Wortgruppen mit Leerzeichen/Sonderzeichen | **Ausschließen**: Nur Wörter, die nach Normalisierung dem Muster `^[a-z]{2,}$` genügen, kommen in den Pool | Einfachste, eindeutige Spielmechanik ohne Sonderbehandlung von Slots; der Bestand (2454 Einträge) ist groß genug; deckt sich mit dem Filteransatz des Wortsuchrätsels (`WORD_PATTERN`). Bindestriche und Apostrophe werden ebenfalls ausgeschlossen |
| Verben | Führendes `to ` wird wie in `toGridWord` entfernt; intern wird mit Kleinbuchstaben gearbeitet | Anforderung; einheitliches Kachelbild ohne Großschreibung (Vokabeln stehen klein im Bestand) |
| Mindestanforderung ans Wort | ≥ 2 Buchstaben **und** ≥ 2 verschiedene Buchstaben | Nur dann existiert eine vom Original verschiedene Anordnung (bei lauter gleichen Buchstaben, z. B. „aa", wäre jede Mischung gleich dem Original) |
| Mischung ≠ Original | `shuffle` per `rng`; ergibt die Mischung das Original, werden deterministisch die ersten zwei Positionen mit unterschiedlichen Buchstaben getauscht | Reproduzierbar per `?seed=`, garantiert Ungleichheit ohne Retries |
| Spielzustand | Unveränderliche Rundenstruktur wie bei `vocab-quiz`/`memory`: `{ entries, position }`; pro Wort `{ word, answer, tiles, slots, fixed, state, helps, wrong }` | Konsistente Konvention, einfache Unit-Tests |
| Automatische Prüfung | Beim letzten gesetzten Buchstaben prüft die Logik automatisch: richtig → `state: 'solved'` + `position++` (nächstes Wort); falsch → `wrong: true`, Buchstaben bleiben liegen und können entfernt werden | Anforderung „richtig → nächstes Wort; falsch → markieren und erneut versuchen"; kein separater Prüf-Button nötig |
| Erfolgsrückmeldung | Sofortiger Wechsel zum nächsten Wort; ein Hinweis „Richtig!" bleibt bis zur nächsten Eingabe sichtbar | Erfüllt den automatischen Übergang ohne Timer; testbar und barrierearm |
| Hilfe „Buchstaben aufdecken" | Fixiert den nächsten (linksten) nicht fixierten Slot mit dem korrekten Buchstaben; belegt dort ein falscher Buchstabe, wandert er zurück in den Pool; stammt der benötigte Buchstabe aus einem späteren, nicht fixierten Slot, wird die Kachel verschoben. Fixierte Kacheln sind nicht mehr entfernbar | Eindeutige, vom Spieler nachvollziehbare Hilfe; zählt als `helps` in die Auswertung |
| Doppelte Buchstaben | Prüfung vergleicht das gesetzte Buchstabenmuster mit der Lösung, nicht Kachel-Identitäten | Erfüllt „jede gültige Reihenfolge zählt" automatisch |
| Wortlängen-Filter | Mehrfachauswahl `kurz` (2–5), `mittel` (6–9), `lang` (≥10); alle vorgewählt | Optionale Anforderung; einfache, nachvollziehbare Bänder |
| Wortanzahl | Auswahl 5 / 10 / 15 Wörter, Standard 10 | Anforderung „wählbare Wortanzahl"; kleinere Werte als beim Quiz, weil das Legen länger dauert als Multiple Choice |
| Eindeutigkeit der Übersetzungen | Wie im Wortsuchrätsel: pro Runde nur Wörter mit paarweise verschiedenen deutschen Übersetzungen | Die Übersetzung ist der Hinweis — Mehrdeutigkeit würde verwirren |
| Überspringen | Button „Überspringen" markiert das Wort `skipped` und geht weiter; übersprungene Wörter erscheinen in der Auswertung mit Lösung | Anforderung (Auswertung: gelöst / Hilfen / übersprungen) |

## Programmabläufe

### Runde erstellen (`createRound`)

1. Validiere `count` gegen `WORD_COUNT_OPTIONS` und `lengths` gegen `LENGTH_FILTERS` (nicht leer).
2. `scrambleWords(vocabulary)`: Normalisiere `english` (trimmen, klein, `to ` entfernen); behalte nur Einträge mit `^[a-z]{2,}$` und ≥ 2 verschiedenen Buchstaben; dedupliziere nach Lösungswort.
3. Filtere nach `levels` und `lengths`, mische mit `rng`, wähle bis zu `count` Einträge mit paarweise verschiedenem `germanKey`. Wirft Fehler, wenn weniger als `count` verfügbar.
4. Pro Wort: `tiles = shuffleLetters(answer, rng)` — Fisher-Yates; identisch zur Lösung → deterministischer Tausch zweier unterschiedlicher Positionen.
5. Rückgabe `{ entries, position: 0 }` mit `slots`/`fixed` als leere Arrays der Wortlänge, `state: 'open'`, `helps: 0`, `wrong: false`.

### Buchstaben setzen (`placeLetter` / `typeLetter`)

1. `placeLetter(round, tileIndex)`: Kachel muss ungenutzt sein (nicht in `slots`); belegt den ersten freien Slot. `typeLetter(round, letter)` sucht im Pool eine passende Kachel und ruft `placeLetter`.
2. Nach dem Setzen `evaluate`: alle Slots belegt → zusammengesetztes Wort mit `answer` vergleichen. Gleich → `state: 'solved'`, `position++`, Ergebnis `'correct'`; ungleich → `wrong: true`, Ergebnis `'wrong'`. Sonst `'placed'`; unzulässige Eingaben `'ignored'`.

### Buchstaben entfernen (`removeLetter` / `removeLastLetter` / `resetWord`)

1. `removeLetter(round, slotIndex)`: frei belegter, nicht fixierter Slot → leeren, `wrong` zurücksetzen, `'removed'`; fixiert oder leer → `'ignored'`.
2. `removeLastLetter`: rechterster frei belegter, nicht fixierter Slot (Rücktaste).
3. `resetWord`: alle nicht fixierten Slots leeren.

### Buchstaben aufdecken (`revealLetter`)

1. Linkster Slot mit `fixed === false`; alle fixiert oder Wort nicht `open` → `'ignored'`.
2. Dort falscher Buchstabe → Kachel zurück in den Pool. Bereits richtige Kachel → nur fixieren.
3. Benötigte Kachel: zuerst im Pool suchen; sonst in einem späteren, nicht fixierten Slot — dorthin wird sie verschoben (jener Slot wird frei).
4. Slot belegen + `fixed[i] = true`, `helps++`, `wrong` neu bewerten; danach `evaluate` (kann das Wort abschließen).

### Rundenende (`results`)

`{ total, solved, helped, helps, skipped, entries }`: gelöste Wörter, Wörter mit mindestens einer Hilfe, Summe der Hilfen, übersprungene Wörter samt Lösung.

## Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/buchstabensalat/game.js` | DOM-freie Spiellogik (siehe neue Exporte unten) |
| `src/buchstabensalat/main.js` | Oberfläche: Setup, Spielbildschirm, Auswertung |
| `games/buchstabensalat/index.html` | Einstiegsseite (Muster `games/vocab-quiz/index.html`) |
| `test/buchstabensalat.test.js` | Unit-Tests der Spiellogik (Node-Testrunner) |
| `e2e/buchstabensalat.spec.js` | Playwright-E2E des Spielablaufs |
| `docs/help/buchstabensalat/index.md` | Hilfeseite des Spiels |

## Exporte von `src/buchstabensalat/game.js`

- Konstanten: `WORD_COUNT_OPTIONS = [5, 10, 15]`, `DEFAULT_WORD_COUNT = 10`, `MIN_WORD_LENGTH = 2`, `WORD_LENGTH = {SHORT:'short', MEDIUM:'medium', LONG:'long'}`, `LENGTH_FILTERS`, `STORAGE_KEY = 'mini-games.buchstabensalat.settings'`, `WORD_PATTERN`
- Wortaufbereitung: `normalizeEnglish`, `scrambleWords`, `matchesLength`, `countByLevel`
- Runde: `createRound`, `currentEntry`, `isFinished`
- Züge: `placeLetter`, `typeLetter`, `removeLetter`, `removeLastLetter`, `resetWord`, `revealLetter`, `skipWord`
- Auswertung: `assembled`, `results`

## Änderungen an bestehenden Dateien

- `index.html`: zusätzlicher `a.primary-link` „Buchstabensalat" → `./games/buchstabensalat/`
- `vite.config.js`: `rollupOptions.input` um `buchstabensalat` ergänzen
- `src/styles.css`: Kachel- und Slot-Styles (`.scramble-tiles`, `.scramble-tile`, `.scramble-slots`, `.scramble-slot` mit Zuständen `.fixed`, `.wrong`, `.empty`), Bildrahmen analog `.quiz-figure`, Responsive-Umbruch
- `docs/help/index.md`: Eintrag unter „Spiele"
- `smoke/pages.spec.js`: Smoke-Test der neuen Spielseite (Muster der bestehenden Tests)
- `.github/workflows/pages.yml`: zusätzlicher `curl`-Erreichbarkeitscheck für `games/buchstabensalat/` im Smoke-Job
- `README.md`, `changes.log`, `docs/RELEASE_NOTES.md`: Änderungsnotizen

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `count` | ∈ `WORD_COUNT_OPTIONS` | `Error`: „Ungültige Anzahl Wörter" |
| `lengths` | nicht leer, nur `LENGTH_FILTERS`-Werte | `Error`: „Mindestens eine Wortlänge muss gewählt sein." |
| Wortpool | ≥ `count` nach Filtern | `Error` mit verfügbarer/benötigter Anzahl (wie `vocab-quiz`) |
| Mischung | `tiles.join('') !== answer` | deterministischer Tausch |
| `localStorage`-Einstellungen | ungültige Werte → Defaults (Muster `loadSettings`) | stiller Fallback |

## Seiteneffekte und Risiken

- **`test/vocabulary.test.js`**: prüft den Vokabelbestand spielübergreifend; keine Anpassung nötig, aber neuer Filter (`scrambleWords`) muss mit dem Bestand funktionieren (durch Unit-Test mit echtem Bestand abgesichert).
- **Startseite/Build**: neue Seite muss in `vite.config.js` registriert werden, sonst 404 im Build.
- Keine bekannten Seiteneffekte auf bestehende Spiele — ausschließlich additive Änderungen.

## Umsetzungsreihenfolge

1. **`src/buchstabensalat/game.js` anlegen**
   - Voraussetzungen: `src/shared/vocabulary.js`, `src/shared/random.js` (vorhanden)
   - Beschreibung: Wortaufbereitung, Rundenbau, Züge, Auswertung wie oben spezifiziert
2. **`test/buchstabensalat.test.js` anlegen und grün machen**
   - Voraussetzungen: Schritt 1
   - Beschreibung: Unit-Tests gemäß Abschnitt „Tests"; Lauf `npm test`
3. **`games/buchstabensalat/index.html`, `src/buchstabensalat/main.js`, `src/styles.css`, `index.html`, `vite.config.js`**
   - Voraussetzungen: Schritt 1
   - Beschreibung: Seite, Oberfläche mit Kacheln/Slots/Hilfe/Tastatur, Styles, Startseiten-Link, Build-Eintrag
4. **`e2e/buchstabensalat.spec.js` + `smoke/pages.spec.js` + `pages.yml`**
   - Voraussetzungen: Schritt 3, Chromium lokal (globaler Cache, Revision 1248, vorhanden)
   - Beschreibung: E2E-Szenarien gemäß Abschnitt „E2E-Tests"; Lauf `npx playwright test`
5. **Dokumentation**: `docs/help/buchstabensalat/index.md`, `docs/help/index.md`, `README.md`, `changes.log`, `docs/RELEASE_NOTES.md`
   - Voraussetzungen: Schritte 1–4

## Tests

### Neue Unit-Tests (`test/buchstabensalat.test.js`, Node-Testrunner, `node:test`/`assert`)

| # | Szenario | Erwartung |
|---|----------|-----------|
| 1 | `scrambleWords` mit echtem Bestand | Verben ohne `to`, keine Einträge mit Leerzeichen/Bindestrich, jedes Wort ≥ 2 verschiedene Buchstaben, dedupliziert |
| 2 | `matchesLength` | Bänder 2–5 / 6–9 / ≥10 korrekt abgegrenzt |
| 3 | `createRound` (20 Seeds) | `count` Wörter, nur gewählte Niveaus/Längen, `tiles` als Multimenge der Lösung, `tiles.join('') !== answer`, deutsche Übersetzungen paarweise verschieden, keine Wortwiederholung |
| 4 | `createRound` Validierung | Fehler bei ungültigem `count`, leeren `lengths`, zu kleinem Pool |
| 5 | `placeLetter`/`typeLetter` | Erster freier Slot wird belegt; Kachel danach ungenutzt; `typeLetter` ignoriert fremde Buchstaben |
| 6 | Vollständiges richtiges Wort | `state: 'solved'`, `position` weitergeschaltet, Ergebnis `'correct'` |
| 7 | Vollständiges falsches Wort | Ergebnis `'wrong'`, `wrong: true`, `position` bleibt; nach Entfernen eines Buchstabens `wrong` gelöscht |
| 8 | Doppelte Buchstaben | Wort mit Doppelbuchstaben (z. B. `apple`) in jeder gültigen Anordnung als `solved` gewertet |
| 9 | `removeLetter`/`removeLastLetter` | Nur nicht fixierte, belegte Slots; `removeLastLetter` überspringt fixierte |
| 10 | `revealLetter` | Fixiert linksten offenen Slot mit korrektem Buchstaben (Pool oder verschobene Kachel), `helps++`, fixierte Kachel nicht entfernbar; schließt das Wort ggf. ab |
| 11 | `resetWord` | Leert alle nicht fixierten Slots |
| 12 | `skipWord` | `state: 'skipped'`, `position++`; `isFinished` nach letztem Wort |
| 13 | `results` | Zählt gelöst/Hilfe genutzt/Hilfesumme/übersprungen korrekt |
| 14 | Seed-Determinismus | Gleicher Seed → identische Runde; anderer Seed → andere |
| 15 | Negative: `placeLetter` mit bereits genutzter/ungültiger Kachel, `removeLetter` auf fixierten Slot | `'ignored'`, Zustand unverändert |

### Neue E2E-Tests (`e2e/buchstabensalat.spec.js`)

| Priorität | Szenario | Abgedecktes Akzeptanzkriterium |
|-----------|----------|-------------------------------|
| Pflicht | Startseite verlinkt das Spiel; Setup zeigt Niveaus mit Zahlen, Wortanzahl, Längen | Grundgerüst |
| Pflicht | Einstellungen überstehen Reload (`localStorage`) | Rahmenbedingung Einstellungen |
| Pflicht | Runde starten: Slots + gemischte Kacheln sichtbar, deutsche Übersetzung als Hinweis; `tiles.join('') !== answer` | „Gemischt unterscheidet sich vom Original" |
| Pflicht | Klick-Eingabe in korrekter Reihenfolge → nächstes Wort + „Richtig!"-Hinweis | „Eingabe per Klick", „richtig → nächstes Wort" |
| Pflicht | Falsche Anordnung → Fehlermarkierung + Hinweis; Entfernen und korrekt legen → gelöst | „falsch → markieren und erneut versuchen", „gesetzte Buchstaben lassen sich entfernen" |
| Pflicht | Tastatur: Buchstabentasten setzen, Rücktaste entfernt | „Eingabe per Tastatur" |
| Pflicht | „Buchstaben aufdecken" fixiert einen Buchstaben (nicht entfernbar) | Hilfe-Button |
| Pflicht | „Überspringen" → nächstes Wort; komplette Runde → Auswertung mit gelöst/Hilfen/übersprungen | „Auswertung am Rundenende" |
| Pflicht | Smartphone-Viewport (375 px): kein horizontales Scrollen | Rahmenbedingung |
| Optional | Wort mit Symbolbild zeigt das Bild | „optional auch das Bild" |

### Betroffene bestehende Tests

- `e2e/setup.spec.js` (Projekt-Unterpfad): prüft bestehende Routen — bleibt unverändert, neue Route über `e2e/buchstabensalat.spec.js` abgedeckt
- `smoke/pages.spec.js`: wird um eine Buchstabensalat-Prüfung ergänzt (läuft nur im Deploy)
- Keine bestehenden Unit-Tests betroffen.

## Offene Punkte

Keine.

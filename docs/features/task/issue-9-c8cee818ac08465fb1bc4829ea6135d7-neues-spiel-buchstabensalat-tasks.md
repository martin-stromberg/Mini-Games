# Tasks: Neues Spiel „Buchstabensalat"

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Spiellogik | `src/buchstabensalat/game.js`: Konstanten (`WORD_COUNT_OPTIONS`, `DEFAULT_WORD_COUNT`, `MIN_WORD_LENGTH`, `WORD_LENGTH`, `LENGTH_FILTERS`, `STORAGE_KEY`, `WORD_PATTERN`) | Offen | — |
| 2 | Spiellogik | `normalizeEnglish`, `scrambleWords`, `matchesLength`, `countByLevel` | Offen | — |
| 3 | Spiellogik | `createRound` inkl. garantiert vom Original abweichender Mischung | Offen | — |
| 4 | Spiellogik | `placeLetter`, `typeLetter`, `removeLetter`, `removeLastLetter`, `resetWord` | Offen | — |
| 5 | Spiellogik | `revealLetter`, `skipWord`, `assembled`, `results`, `currentEntry`, `isFinished` | Offen | — |
| 6 | UI | `games/buchstabensalat/index.html` | Offen | — |
| 7 | UI | `src/buchstabensalat/main.js`: Setup mit Niveaus/Wortanzahl/Längen + `localStorage` | Offen | — |
| 8 | UI | `src/buchstabensalat/main.js`: Spielbildschirm (Hinweis, Slots, Kacheln, Hilfe, Zurücksetzen, Überspringen, Tastatur) | Offen | — |
| 9 | UI | `src/buchstabensalat/main.js`: Auswertungsbildschirm | Offen | — |
| 10 | UI | `src/styles.css`: Kachel-/Slot-Styles | Offen | — |
| 11 | Integration | `index.html` Startseiten-Link, `vite.config.js` Build-Eintrag | Offen | — |
| 12 | Tests | `test/buchstabensalat.test.js` (15 Szenarien laut Plan) | Offen | — |
| 13 | E2E-Tests | `e2e/buchstabensalat.spec.js` (Pflichtszenarien laut Plan) | Offen | — |
| 14 | Smoke/CI | `smoke/pages.spec.js` + `pages.yml` curl-Check | Offen | — |
| 15 | Dokumentation | `docs/help/buchstabensalat/index.md`, `docs/help/index.md` | Offen | — |
| 16 | Dokumentation | `README.md`, `changes.log`, `docs/RELEASE_NOTES.md` | Offen | — |

# Tasks: Neues Spiel „Buchstabensalat"

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Spiellogik | `src/buchstabensalat/game.js`: Konstanten (`WORD_COUNT_OPTIONS`, `DEFAULT_WORD_COUNT`, `MIN_WORD_LENGTH`, `WORD_LENGTH`, `LENGTH_FILTERS`, `STORAGE_KEY`, `WORD_PATTERN`) | Erledigt | `createRound validates count, lengths and pool size` |
| 2 | Spiellogik | `normalizeEnglish`, `scrambleWords`, `matchesLength`, `countByLevel` | Erledigt | `scrambleWords normalizes, filters and deduplicates`, `matchesLength maps answers to the three length bands`, `countByLevel counts the scramble words of every level` |
| 3 | Spiellogik | `createRound` inkl. garantiert vom Original abweichender Mischung | Erledigt | `createRound builds words whose tiles differ from the answer` |
| 4 | Spiellogik | `placeLetter`, `typeLetter`, `removeLetter`, `removeLastLetter`, `resetWord` | Erledigt | `placeLetter fills the first free slot and used tiles leave the pool`, `typeLetter places a matching pool tile`, `removeLetter only frees unfixed filled slots`, `removeLastLetter removes the last placed unfixed letter`, `resetWord clears every unfixed slot but keeps revealed letters` |
| 5 | Spiellogik | `revealLetter`, `skipWord`, `assembled`, `results`, `currentEntry`, `isFinished` | Erledigt | `revealLetter fixes the next correct letter, counts a help and steals misplaced tiles`, `skipWord marks the word skipped and finishes the round`, `results counts solved words, helps and skipped words` |
| 6 | UI | `games/buchstabensalat/index.html` | Erledigt | E2E `the overview links to the letter scramble game` |
| 7 | UI | `src/buchstabensalat/main.js`: Setup mit Niveaus/Wortanzahl/Längen + `localStorage` | Erledigt | E2E `the setup shows levels, word counts and length filters`, `settings are kept after a reload` |
| 8 | UI | `src/buchstabensalat/main.js`: Spielbildschirm (Hinweis, Slots, Kacheln, Hilfe, Zurücksetzen, Überspringen, Tastatur) | Erledigt | E2E `a round shows slots, shuffled tiles and the german hint`, `clicking tiles in the right order solves the word and moves on`, `a wrong word is marked and can be corrected after a reset`, `the reveal button fixes the next correct letter and counts a help`, `letters can be typed and removed with the keyboard` |
| 9 | UI | `src/buchstabensalat/main.js`: Auswertungsbildschirm | Erledigt | E2E `skipping moves to the next word and finishing shows the evaluation`, `a fully solved round reports the score and the used helps` |
| 10 | UI | `src/styles.css`: Kachel-/Slot-Styles | Erledigt | E2E `the board fits a phone screen without horizontal scrolling` |
| 11 | Integration | `index.html` Startseiten-Link, `vite.config.js` Build-Eintrag | Erledigt | E2E `the overview links to the letter scramble game`, `npm run build` |
| 12 | Tests | `test/buchstabensalat.test.js` (15 Szenarien laut Plan) | Erledigt | `npm test`: 130/130 bestanden, 22 neue Tests |
| 13 | E2E-Tests | `e2e/buchstabensalat.spec.js` (Pflichtszenarien laut Plan) | Erledigt | `npx playwright test`: 122/122 bestanden, 15 neue Tests |
| 14 | Smoke/CI | `smoke/pages.spec.js` + `pages.yml` curl-Check | Erledigt | Kein direkter Test (läuft im Deploy); `npx playwright test` bleibt grün |
| 15 | Dokumentation | `docs/help/buchstabensalat/index.md`, `docs/help/index.md` | Erledigt | Kein direkter Test |
| 16 | Dokumentation | `README.md`, `changes.log`, `docs/RELEASE_NOTES.md` | Erledigt | Kein direkter Test |

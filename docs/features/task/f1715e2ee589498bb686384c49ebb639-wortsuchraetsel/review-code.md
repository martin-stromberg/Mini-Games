# Code-Review

## Ergebnis

**Status:** Befunde vorhanden

Der Basisbranch ist `origin/staging` (Reflog: „branch: Created from origin/staging“). Die Implementierung ist noch nicht committed. `git diff --name-only --diff-filter=AM $(git merge-base HEAD origin/staging)` liefert daher nur Dokumentationsdateien, und alle untracked Quelldateien wurden zusätzlich geprüft. `package-lock.json` ist generiert und wurde nicht inhaltlich geprüft. Den Push-Trigger für den Feature-Branch in `.github/workflows/pages.yml` gibt der Plan vor, er ist daher kein Befund.

Anzahl Befunde: 5

Alle 4 Befunde aus `review-code.2.md` sind behoben:
- `storeSlot(index, cells, fullHint)` kapselt das Belegen eines Slots für `commitDraft()` und `handleDrag()`.
- Die Texte werden aus `WORDS_PER_ROUND` erzeugt.
- `MIN_WORD_LENGTH` und `WORD_PATTERN` sind eingeführt, und die meisten Tests verwenden jetzt `SIZE`, `DIFFICULTY` und `WORDS_PER_ROUND`.
- Die gemeinsamen Helfer liegen in `test/fixtures/rounds.js`. `findSeed` liefert einheitlich `{ seed, round }`.
- Die genannten Mehrfall-Tests sind aufgeteilt.

Die folgenden Befunde sind Reste davon oder neu.

## Befunde

### src/word-search/game.js und test/fixtures/rounds.js

- **Doppelter Code / Fehlende Kapselung** — Der Ausdruck `target.path.map(coordKey)` steht in `game.js` viermal inline:
  - `longestContiguousSegment`, Zeile 95;
  - `classifySlot`, Zeile 117;
  - `missingNeighbour`, Zeile 138;
  - `getHint`, Zeile 156.

  Zusätzlich definiert `test/fixtures/rounds.js` (Zeile 8) dieselbe Logik noch einmal als `pathKeys`.

  Empfehlung: In `game.js` `export const pathKeys = target => target.path.map(coordKey);` einführen und an den vier Stellen verwenden. `longestContiguousSegment` erhält dafür das Target statt des Pfads. `test/fixtures/rounds.js` importiert `pathKeys` aus `game.js` und exportiert es weiter, statt es selbst zu definieren.

### src/word-search/main.js, e2e/support.js und test/vocabulary.test.js (Konstanten)

- **Doppelter Code / Hardcodierte Werte** — Zwei Konstanten sind in den Tests dupliziert:
  - **Speicherschlüssel:** `'mini-games.word-search.levels'` ist in `main.js` (Zeile 4) und `e2e/support.js` (Zeile 7) jeweils eigenständig als `STORAGE_KEY` definiert. Ändert sich der Schlüssel in `main.js`, laufen die Speichertests weiter gegen den alten Schlüssel.
  - **Wortmuster:** `test/vocabulary.test.js` (Zeile 18) baut das Wortmuster `` new RegExp(`^[A-Z]{${MIN_WORD_LENGTH},${SIZE}}$`) `` nach, obwohl `game.js` dafür `WORD_PATTERN` besitzt. Diese Konstante wird nicht exportiert.

  Empfehlung: `STORAGE_KEY` nach `game.js` verschieben (oder in ein seiteneffektfreies Modul, z. B. `src/word-search/config.js`) und exportieren. `main.js` darf nicht direkt importiert werden, da es beim Import `initialise()` ausführt. `main.js` und `e2e/support.js` importieren den Schlüssel von dort. `WORD_PATTERN` exportieren und in `test/vocabulary.test.js` verwenden.

### smoke/pages.spec.js und e2e/hints.spec.js (Test-Literale)

- **Hardcodierte Werte** — Einige Tests verwenden noch Literale statt der vorhandenen Konstanten:
  - `smoke/pages.spec.js`, Zeile 16: `toHaveCount(6)` statt `LEVELS.length`;
  - `smoke/pages.spec.js`, Zeile 19: `toHaveCount(169)` statt `SIZE * SIZE`;
  - `smoke/pages.spec.js`, Zeile 20: `toHaveCount(10)` statt `WORDS_PER_ROUND`;
  - `e2e/hints.spec.js`, Zeile 62: `index < 10` statt `index < WORDS_PER_ROUND`.

  Empfehlung: `LEVELS`, `SIZE` und `WORDS_PER_ROUND` in `smoke/pages.spec.js` aus `../src/word-search/game.js` importieren. In `e2e/hints.spec.js` `WORDS_PER_ROUND` aus `./support.js` importieren und die Literale ersetzen.

### e2e/marking.spec.js (Test `a drag shows a live preview …`)

- **Doppelter Code** — Zeile 47–52 wiederholt fast wörtlich den Helfer `drag()` aus `e2e/support.js` (Zeile 43–50): Scrollen, `boundingBox`, `mouse.move`/`down`/`move` mit `steps: 6`. Nur das abschließende `mouse.up()` fehlt, weil die Vorschau bei gedrückter Taste geprüft wird.

  Empfehlung: `drag()` in `e2e/support.js` in `startDrag(page, fromKey, toKey)` (bis einschließlich der Bewegung) und `drag()` (`startDrag` plus `page.mouse.up()`) aufteilen. Der Vorschau-Test ruft dann `startDrag` auf.

### e2e/marking.spec.js und e2e/evaluation.spec.js (Testqualität)

- **Testqualität** — Zwei Tests prüfen weiterhin zwei fachliche Fälle nacheinander:
  - `e2e/marking.spec.js`, `two click words and two drag words are each solved separately with two hits` (Zeile 60–76): Erst prüft er zwei Klick-Markierungen mit Lösen. Nach dem Entfernen prüft er zwei Drag-Markierungen mit erneutem Lösen.
  - `e2e/evaluation.spec.js`, `a wrong marking with an embedded word gives no hit, a correction hides the result until the next solve` (Zeile 91–106): Er prüft den Fehlerfall (kein Treffer, `result-error`) und anschließend die Invalidierung des Ergebnisses durch eine Korrektur. Der Fehlerfall ist zudem bereits in `an exact word plus a neutral extra cell gives no hit …` (Zeile 36–44) abgedeckt.

  Empfehlung:
  - Den Marking-Test in `two click words are solved separately with two hits` und `two drag words are solved separately with two hits` aufteilen.
  - Den Evaluation-Test auf den Fall „eine Korrektur blendet das Ergebnis bis zum nächsten Lösen aus“ reduzieren. Der Aufbau (falsche Markierung, Lösen) gehört dann in den Arrange-Teil, ohne den Fehlerfall erneut zu prüfen.

## Geprüfte Dateien

- `.github/workflows/pages.yml`
- `.gitignore`
- `index.html`
- `games/word-search/index.html`
- `package.json`
- `playwright.config.js`
- `playwright.smoke.config.js`
- `vite.config.js`
- `scripts/playwright.mjs`
- `public/data/vocabulary.json`
- `src/styles.css`
- `src/word-search/game.js`
- `src/word-search/main.js`
- `smoke/pages.spec.js`
- `test/fixtures/rounds.js`
- `test/classification.test.js`
- `test/drag.test.js`
- `test/generator.test.js`
- `test/hint.test.js`
- `test/vocabulary.test.js`
- `e2e/support.js`
- `e2e/accessibility.spec.js`
- `e2e/drafts.spec.js`
- `e2e/evaluation.spec.js`
- `e2e/generator.spec.js`
- `e2e/hints.spec.js`
- `e2e/marking.spec.js`
- `e2e/setup.spec.js`

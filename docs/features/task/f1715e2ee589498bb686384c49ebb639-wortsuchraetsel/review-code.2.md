# Code-Review

## Ergebnis

**Status:** Befunde vorhanden

Basisbranch: `origin/staging` (laut Reflog: „branch: Created from origin/staging“). Die Implementierung ist noch nicht committed. `git diff --name-only --diff-filter=AM $(git merge-base HEAD origin/staging)` liefert daher nur Dokumentationsdateien, und ich habe zusätzlich alle untracked Quelldateien geprüft. `package-lock.json` ist generiert; ich habe sie nicht inhaltlich geprüft. Den Push-Trigger für den Feature-Branch in `.github/workflows/pages.yml` gibt der Plan vor (plan.md, Deployment), er ist daher kein Befund.

Anzahl Befunde: 4

Gegenüber `review-code.1.md` sind alle 14 früheren Befunde behoben:
- Workflow-Output `page_url` ist ergänzt.
- Render- und Handler-Funktionen sind aufgeteilt.
- `setupStatus()` ist eingeführt, ebenso das Zustandsobjekt mit `resetDraft()`.
- `escapeHtml()` ist ergänzt.
- `localStorage`-Zugriffe sind gekapselt.
- `elementFromPoint` und `pointercancel`/`pointerleave` sind umgesetzt.
- Tote Imports und Felder sind entfernt.
- Die Konstanten `WORDS_PER_ROUND`, `MAX_GENERATION_ATTEMPTS` und `DIFFICULTY` sind eingeführt.
- Die Umbenennungen sind erledigt: `toSortedCellKeys` und `equalSortedKeys`.
- Die Typprüfungen in `validateVocabulary` sind ergänzt.
- Das Stylesheet ist formatiert.
- Die Tests sind nach Themen aufgeteilt, und die Lücken in der Testabdeckung sind geschlossen.

Die folgenden Befunde sind neu oder Reste der früheren Befunde.

## Befunde

### src/word-search/main.js (UI-Modul)

- **Doppelter Code** — `commitDraft()` (Zeile 248–260) und `handleDrag()` (Zeile 275–296) enthalten dieselbe Sequenz zum Belegen eines Slots: Zielindex bestimmen (`editingIndex`/`dragReplaceIndex ?? firstFreeSlot()`), bei `index < 0` die Meldung „Alle zehn Markierungen sind belegt …“ setzen, dann `state.slots[index] = toSortedCellKeys(...)`, `resetDraft()`, `resetResult()` und `setMessage(\`${slotName(index)} gespeichert.\`)`. Nur der Text der Belegt-Meldung unterscheidet sich.

  Empfehlung: Eine Funktion `storeSlot(index, cells)` einführen, die die vier Zuweisungen und die Speichermeldung kapselt, und sie in beiden Funktionen aufrufen. Die Belegt-Prüfung kann als Parameter (Meldungstext) oder als eigene Funktion `slotFullMessage(context)` dazukommen.

- **Hardcodierte Werte** — Die Rundengröße steht trotz `WORDS_PER_ROUND` weiterhin als Wort im Text:
  - „Wähle die Niveaus für zehn gesuchte englische Wörter.“ (`renderSetup`, Zeile 88)
  - „Alle zehn Markierungen sind belegt …“ (`commitDraft`, Zeile 253; `handleDrag`, Zeile 289)

  Ändert sich die Konstante, sind diese Texte falsch.

  Empfehlung: Die Texte aus `WORDS_PER_ROUND` erzeugen (z. B. `` `Alle ${WORDS_PER_ROUND} Markierungen sind belegt …` ``) und die E2E-Erwartungen in `e2e/drafts.spec.js` (Zeile 91, 98) anpassen.

### src/word-search/game.js

- **Hardcodierte Werte** — `validateVocabulary` prüft die Wortlänge mit dem Literal `/^[A-Z]{2,13}$/` (Zeile 24), obwohl die Obergrenze fachlich `SIZE` ist (ein Wort muss in das 13×13-Gitter passen). Auch die Tests verwenden die Literale `13`/`169` und `'easy'`/`'hard'`, obwohl `SIZE` und `DIFFICULTY` verfügbar sind:
  - `test/generator.test.js`, Zeile 18 und 24;
  - `test/drag.test.js`;
  - `e2e/generator.spec.js`, Zeile 11, 18 und 19 (`row * 13`);
  - `e2e/support.js`, Zeile 103 (`von 10`).

  Empfehlung: In `game.js` eine Konstante `MIN_WORD_LENGTH = 2` einführen und die Prüfung als `new RegExp(\`^[A-Z]{${MIN_WORD_LENGTH},${SIZE}}$\`)` bilden. In den Tests `SIZE`, `SIZE * SIZE`, `WORDS_PER_ROUND` und `DIFFICULTY.EASY`/`DIFFICULTY.HARD` verwenden.

### test/support.js und e2e/support.js (Test-Helfer)

- **Doppelter Code / Inkonsistente Signatur** — Beide Dateien definieren nahezu identisch `rawVocabulary`, `vocabulary`, `roundFor`, `pathKeys`, `exactSlot`, `cellOwners`, `isolatedTargetIndex`, `freeCell` und `findCrossing`. `findSeed` hat in beiden Dateien denselben Namen, aber unterschiedliche Rückgabewerte: `{ seed, round }` in `test/support.js` (Zeile 32–38), nur `seed` in `e2e/support.js` (Zeile 37–40).

  Empfehlung: Die framework-unabhängigen Helfer in ein gemeinsames Modul verschieben (z. B. `test/fixtures/rounds.js`) und aus beiden Support-Dateien importieren. `e2e/support.js` behält nur die Playwright-spezifischen Helfer. `findSeed` erhält einen einheitlichen Rückgabewert (z. B. immer `{ seed, round }`).

- **Testqualität** — Mehrere Tests prüfen mehrere fachliche Fälle hintereinander:
  - `e2e/drafts.spec.js`, `dragging during an open selection or change is blocked without losing anything`: offene Auswahl und offene Änderung;
  - `e2e/drafts.spec.js`, `with ten full slots and a new selection, solve is blocked …`: Lösen blockiert, Drag bei offener Auswahl blockiert, Drag bei vollen Slots blockiert;
  - `e2e/marking.spec.js`, `changing and removing affect exactly the chosen slot and a new round clears everything`: Ändern, Entfernen, Neue Runde (die neue Runde ist zusätzlich in `evaluation.spec.js` abgedeckt);
  - `e2e/evaluation.spec.js`, `two complete words in one slot give no hit, then two separate slots give two hits`: Fehlerfall und Erfolgsfall;
  - `test/vocabulary.test.js`, `validation rejects words that are too short or too long`.

  Empfehlung: Jeden dieser Tests nach fachlichem Fall in einzelne Tests mit eigener Arrange-Act-Assert-Struktur aufteilen und die doppelte Prüfung von „Neue Runde“ in `marking.spec.js` entfernen.

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
- `test/support.js`
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

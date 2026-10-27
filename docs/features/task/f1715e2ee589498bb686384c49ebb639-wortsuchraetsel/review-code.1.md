# Code-Review

## Ergebnis

**Status:** Befunde vorhanden

Basisbranch: `origin/staging` (laut Reflog: „branch: Created from origin/staging“). Da die Implementierung noch nicht committed ist, liefert `git diff --name-only --diff-filter=AM $(git merge-base HEAD origin/staging)` nur Dokumentationsdateien. Deshalb wurden zusätzlich alle untracked Quelldateien (`git ls-files --others --exclude-standard`) geprüft. `package-lock.json` ist generiert und wurde nicht inhaltlich geprüft.

Anzahl Befunde: 14

## Befunde

### .github/workflows/pages.yml (Workflow)

- **Fehlerbehandlung / Fehlende Validierung** — Der Job `smoke` liest `needs.deploy.outputs.page_url` (Zeile 54). Der Job `deploy` deklariert aber kein `outputs:`-Mapping; `steps.deployment.outputs.page_url` ist nur in `environment.url` verwendet. `PAGE_URL` ist damit immer leer, und `test -n "$PAGE_URL"` (Zeile 56) lässt den Smoke-Test bei jedem Push fehlschlagen.

  Empfehlung: Im Job `deploy` `outputs: { page_url: ${{ steps.deployment.outputs.page_url }} }` ergänzen.

- **Hardcodierte Werte** — Der Feature-Branch `task/f1715e2ee589498bb686384c49ebb639-wortsuchraetsel` ist als Push-Trigger fest eingetragen (Zeile 8). Ein Push auf diesen Branch veröffentlicht über `upload-pages-artifact`/`deploy-pages` auf die produktive GitHub-Pages-Umgebung. Nach dem Merge bleibt der Eintrag als toter Konfigurationsrest übrig.

  Empfehlung: Den Branch-Eintrag entfernen und nur von `main` deployen. Für Feature-Branches den `pull_request`-Trigger (nur `verify`) nutzen.

### src/word-search/main.js (UI-Modul)

- **God-Methode / Fehlende Kapselung** — `renderGame()` (Zeile 57–62) baut die gesamte Spielseite in einem einzigen, über 1.500 Zeichen langen Template-String (Zeile 60): Header, Gitter, Entwurfsstatus, Aktionen, Übersetzungsliste, Slotliste und Ergebnis. `bindGameEvents()` (Zeile 79–92) enthält die komplette Fachlogik von Lösen, Tipp, Bearbeiten, Entfernen, Drag-Ersetzen und Zeiger-Handling als mehrzeilige Inline-Lambdas auf je einer Zeile. `renderSetup()` (Zeile 35) hat dasselbe Muster.

  Empfehlung: Teil-Renderfunktionen anlegen (`renderBoard`, `renderActions`, `renderTranslations`, `renderSlots`, `renderResult`). Die Handler als benannte Funktionen auslagern (`solveRound`, `showHint`, `startEditSlot`, `removeSlot`, `startDragReplace`, `handlePointerDown/Up`, `handleCellClick`) und in `bindGameEvents` nur noch registrieren.

- **Doppelter Code** — Die Berechnung von `count`/`blocked` und der dreistufige Statustext für die Niveauauswahl stehen identisch in `updateLevelsFromInputs()` (Zeile 24–27) und `renderSetup()` (Zeile 33–35).

  Empfehlung: Eine Funktion `setupStatus()` anlegen, die `{ count, blocked, text }` liefert, und sie an beiden Stellen nutzen.

- **Doppelter Code / Fehlende Wiederverwendung** — Die Zellschlüssel werden mehrfach von Hand geparst bzw. gebaut, obwohl `parseKey`/`coordKey` in `game.js` existieren: `button.dataset.cell.split(',').map(Number)` in Zeile 89 und 90, `` `${row},${col}` `` in `cellClass` (Zeile 47) und im Gitter-Template (Zeile 60). `coordKey` wird importiert, aber nicht verwendet.

  Empfehlung: `parseKey(button.dataset.cell)` bzw. `coordKey({ row, col })` verwenden.

- **Temporäre Felder / Globaler Zustand** — Der gesamte Spielzustand liegt in zehn modulweiten `let`-Variablen (Zeile 5). Das Zurücksetzen des Entwurfs (`draft = new Set(); editingIndex = null; dragReplaceIndex = null`) wiederholt sich in `startRound` (Zeile 43), `commitDraft` (Zeile 67) und `cancelDraft` (Zeile 69). `dragReplaceIndex` und `editingIndex` sind nur in bestimmten Modi gesetzt und sonst `null`.

  Empfehlung: Den Zustand in einem Objekt bündeln (z. B. `state = { round, slots, draft: { cells, editingIndex, dragReplaceIndex }, solved, hintCell, message }`) und eine Funktion `resetDraft()` für das wiederholte Zurücksetzen einführen.

- **Fehlerbehandlung (unescapte Ausgabe)** — Texte werden ungeschützt per `innerHTML` eingefügt: `error.message` (Zeile 100, enthält bei Validierungsfehlern Rohwerte aus der JSON-Datei wie `entry.english`), `message` (Zeile 60) und `target.german` (Zeile 60). Sonderzeichen wie `<`/`&` in Vokabeldaten zerstören das Markup und öffnen einen HTML-Injection-Pfad.

  Empfehlung: Eine Hilfsfunktion `escapeHtml()` für alle interpolierten Datenwerte nutzen oder Fehlermeldungen per `textContent` setzen.

- **Fehlerbehandlung** — `localStorage.setItem` in `loadLevels()` (Zeile 12) liegt außerhalb des `try` und wird beim Modulladen ausgeführt (Zeile 15). In `updateLevelsFromInputs()` (Zeile 23) ist der Aufruf ebenfalls ungeschützt. Ist der Speicher blockiert oder voll (z. B. Privatmodus, gesperrte Website-Daten), wirft der Aufruf, bevor `initialise()` läuft, und die Seite bleibt leer.

  Empfehlung: Lese- und Schreibzugriffe auf `localStorage` in eine Hilfsfunktion mit `try/catch` kapseln; bei einem Fehler im Speicher mit den Standardniveaus weiterarbeiten.

- **Robustheit der Zeiger-Logik** — `pointerup` ermittelt die Zielzelle über `event.target` (Zeile 90). Bei Touch-Eingaben fängt der Browser den Zeiger implizit am Startelement ein, daher ist `event.target` dort immer die Startzelle und ein Drag wird nie erkannt. Außerdem wird `pointerStart` bei `pointercancel` oder beim Verlassen des Gitters nicht zurückgesetzt.

  Empfehlung: Die Zielzelle per `document.elementFromPoint(event.clientX, event.clientY)` bestimmen (oder bei `pointerdown` `releasePointerCapture` aufrufen) und `pointerStart` in `pointercancel`/`pointerleave` auf `null` setzen.

- **Toter Code** — Der Import `SIZE` (Zeile 1) wird nicht verwendet, `coordKey` ebenfalls nicht (siehe oben). Der Platzhalter `classifications: Array(10).fill({ kind: 'empty' })` in `renderGame` (Zeile 58) wird nie gelesen, denn `slotText` greift direkt auf `solved` zu.

  Empfehlung: Die unbenutzten Imports entfernen und den Platzhalter auf `const found = solved?.found ?? new Set();` reduzieren.

### src/word-search/game.js und src/word-search/main.js (Konstanten)

- **Hardcodierte Werte / Primitive Obsession** — Die Rundengröße `10` steht verstreut als Literal: `game.js` Zeile 38, 39; `main.js` Zeile 5, 25, 34, 43, 58, 83 und in Texten. Die Schwierigkeitsgrade sind lose Strings `'easy'`/`'hard'` in beiden Dateien (`game.js` Zeile 33, 35, 133; `main.js` Zeile 35, 60, 73). Die Versuchsgrenze `120` (Zeile 41) ist eine Magic Number.

  Empfehlung: In `game.js` die Konstanten `WORDS_PER_ROUND = 10`, `MAX_GENERATION_ATTEMPTS = 120` und `DIFFICULTY = { EASY: 'easy', HARD: 'hard' }` exportieren und überall verwenden.

### src/word-search/game.js

- **Namenskonventionen / Toter Code** — `sameSet` (Zeile 65) vergleicht zwei bereits sortierte Arrays elementweise, nicht zwei Mengen; der Name täuscht über die Vorbedingung (beide Argumente müssen `canonical` sein). `canonical` (Zeile 6) beschreibt nicht, dass Zellschlüssel dedupliziert und sortiert werden. In `classifySlots` wird `targetIndex` im Objekt `best` gesetzt (Zeile 95, 98), aber nie gelesen.

  Empfehlung: `sameSet` in `equalSortedKeys` und `canonical` in `toSortedCellKeys` umbenennen; `targetIndex` aus `best` entfernen.

- **Fehlende Validierung** — `validateVocabulary` (Zeile 14–20) geht davon aus, dass jeder Eintrag ein Objekt und `german` ein String ist. Bei `null`-Einträgen oder einem nicht-String-`german` (z. B. Zahl) entsteht ein unspezifischer `TypeError` statt der vorgesehenen fachlichen Meldung.

  Empfehlung: Am Schleifenanfang `if (!entry || typeof entry !== 'object')` sowie `typeof entry.german !== 'string'` prüfen und eine aussagekräftige Meldung mit Index werfen.

### src/styles.css

- **Wartbarkeit** — Das gesamte Stylesheet steht minifiziert in einer einzigen Zeile. Es ist Quellcode (Vite minifiziert beim Build ohnehin), aber Reviews, Diffs und gezielte Änderungen sind so praktisch unmöglich.

  Empfehlung: Das Stylesheet formatiert speichern, eine Regel pro Block.

### test/game.test.js und e2e/word-search.spec.js (Tests)

- **Testqualität** — Mehrere Tests prüfen mehrere fachliche Fälle:
  - `classification finds exact independent slots and rejects an extra cell` prüft exakte Treffer und Fehlerfall.
  - `hints first identify ...` prüft Fehler- und Fehlend-Hinweis.
  - `drag paths allow diagonals only in hard mode` deckt drei Fälle ab.
  - Im E2E-Test 1 kommt die Prüfung des Zurücksetzens nach dem Reload hinzu.

  Der E2E-Test `starts a round and evaluates ten separate click selections` macht keine Klickauswahl und wertet nichts aus, sein Name stimmt also nicht. Es fehlt Abdeckung für:
  - die Klassifikation `partial`;
  - zwei Slots mit derselben Wortposition (nur einer darf zählen);
  - die Fehlerpfade von `validateVocabulary` (ungültiges Wort, Duplikat, fehlende Übersetzung);
  - den Fehler in `generateRound` bei weniger als 10 Wörtern;
  - `getHint` mit Ergebnis `none`;
  - im E2E-Bereich Lösen, Tipp, Ändern und Entfernen eines Slots.

  Zudem dupliziert der Test-Helfer `key` (Zeile 7) die Funktion `coordKey` aus `game.js`.

  Empfehlung: Je Fall einen Test mit klarer Arrange-Act-Assert-Struktur anlegen, den E2E-Test umbenennen oder um echte Klickauswahl mit Lösen ergänzen, die fehlenden Fälle ergänzen und `coordKey` importieren statt `key` neu zu definieren.

## Geprüfte Dateien

- `.github/workflows/pages.yml`
- `.gitignore`
- `e2e/word-search.spec.js`
- `games/word-search/index.html`
- `index.html`
- `package.json`
- `playwright.config.js`
- `public/data/vocabulary.json`
- `scripts/playwright.mjs`
- `src/styles.css`
- `src/word-search/game.js`
- `src/word-search/main.js`
- `test/game.test.js`
- `vite.config.js`

# Tests — Bestandsaufnahme

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt: 2026-10-29 (UTC+1)
- Branch: `task/issue-9-c8cee818ac08465fb1bc4829ea6135d7-neues-spiel-buchstabensalat`
- Commit-ID: `0a1c10e6ac3a6e97ae3539c32310ce494f057e12` („Staging (#14)")
- Uncommittete Änderungen im getesteten Stand: nur neu angelegte Lifecycle-Artefakte unter `docs/features/` (untracked); kein Produktivcode geändert
- Testumgebung: Node v24.15.0, npm 11.10.0, Windows, Playwright 1.58.x (Chromium-Revision 1248 aus globalem Cache `ms-playwright`)
- Ermittelte Testsuiten: `npm test` (Node-Testrunner, `test/`), `npm run test:e2e` (Playwright, `e2e/`, baut selbst und testet gegen Preview) — Quellen: `package.json`, `playwright.config.js`, `.github/workflows/pages.yml`, README

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Unit | `npm test` | Repo-Stamm | 0 | 108 | 0 | 0 | [Log](test-logs/npm-test-baseline.txt) |
| E2E | `npx playwright test` | Repo-Stamm | 0 | 107 | 0 | 0 | [Log](test-logs/playwright-baseline.txt) |

Hinweis zum E2E-Lauf: Der projekteigene Befehl `npm run test:e2e` setzt `PLAYWRIGHT_BROWSERS_PATH=0` und erwartet Browser unter `node_modules`; dort sind lokal keine installiert. Der Baseline-Lauf erfolgte daher über `npx playwright test` mit identischer `playwright.config.js` und dem globalen Browser-Cache (Revision 1248, passend zu playwright-core).

### Nachgewiesene bestehende Testfehler

Keine — beide Suiten liefen vollständig fehlerfrei.

### Testlücken und Ausführungsprobleme

Keine. Alle deklarierten Suiten wurden ausgeführt.

## Testklassen

### `test/` (Node-Testrunner)

- `vocabulary.test.js` — Vollständigkeit/Eindeutigkeit der Vokabeldaten, Bildverweise, Gitterwörter je Niveau
- `vocab-quiz.test.js` — Rundenbau, Distraktoren, Fragetyp-Verteilung, Antwortlogik, Auswertung
- `memory.test.js` — Paarbildung, Aufdecklogik, Rundenende
- `generator.test.js`, `assignment.test.js`, `classification.test.js`, `drag.test.js`, `hint.test.js` — Wortsuchrätsel-Logik

### `test/fixtures/rounds.js`

- `levelFiles`, `rawVocabulary`, `vocabulary` — lädt die echten Vokabeldateien einmalig über `validateVocabulary`
- `roundFor`, `findSeed`, `cellOwners` u. a. — Hilfen für seedbasierte Rundentests (word-search-spezifisch)

### `e2e/` (Playwright)

- `support.js` — wiederverwendbare Helfer (word-search-spezifisch: `openGame`, `cell`, `markTarget`, …)
- `setup.spec.js`, `generator.spec.js`, `accessibility.spec.js`, `marking.spec.js`, `drafts.spec.js`, `assignment.spec.js`, `evaluation.spec.js`, `hints.spec.js`, `slot-numbers.spec.js` — Wortsuchrätsel
- `memory.spec.js`, `vocab-quiz.spec.js` — Muster für neue E2E-Specs: Runde über `?seed=` + eigene `roundFor`-Hilfe aus `game.js` + `seededRandom` reproduzieren

### `smoke/pages.spec.js`

- Prüft veröffentlichte Seite: Übersicht, alle drei Spielrouten, `a1.json`; läuft nur im Deploy-Job (`PAGE_URL` erforderlich)

# Test-Ergebnisse

## Ergebnis

**Status:** Keine Fehler

Ausgeführt wurden `npm test` (Unit, Node-Testrunner) und `npm run test:e2e` (Playwright, gegen Produktionsbuild, Port 4183 über `E2E_PORT`-Default). Die Unit-Tests wurden zusätzlich mit `node --test --experimental-test-coverage` für die Abdeckung ausgeführt.

## Fehlgeschlagene Tests

Keine.

## E2E-Abdeckung

Geplante Szenarien laut `plan.md` (Abschnitt „Lokale und CI-E2E vor Veröffentlichung“):

| Szenario | Test / Testklasse | Ergebnis |
|----------|-------------------|----------|
| 1. Start, Level und Speicher | `e2e/setup.spec.js` › Levelauswahl und Speicher | Bestanden |
| 2. Einzel-Level-Daten und Runden | `e2e/setup.spec.js` › Einzel-Level-Runden | Bestanden |
| 3. Generatorinvarianten | `e2e/generator.spec.js` › Generatorinvarianten | Bestanden |
| 4. Schwierigkeit | `e2e/generator.spec.js` › Schwierigkeit | Bestanden |
| 5. Zehn Markierungen per Klick | `e2e/marking.spec.js` › Zehn Markierungen per Klick | Bestanden |
| 6. Zehn Markierungen per Drag | `e2e/marking.spec.js` › Zehn Markierungen per Drag | Bestanden |
| 7. Zwei Wörter, Pflege, Duplikate | `e2e/marking.spec.js` › Zwei Wörter, Pflege und Duplikate | Bestanden |
| 8. Kreuzungen und Teilmarkierung | `e2e/evaluation.spec.js` › Kreuzungen und Teilmarkierung | Bestanden |
| 9. Extrafelder und Tippfehlerpriorität | `e2e/evaluation.spec.js` › Extrafelder und Fehlerpriorität | Bestanden |
| 10. Entwurfsübergänge und gemischte Eingabe | `e2e/drafts.spec.js` › Entwurfsübergänge | Bestanden |
| 11. Lösen, Invalidierung, Neustart | `e2e/evaluation.spec.js` › Lösen, Invalidierung und Neustart | Bestanden |
| 12. Tipp ohne falschen Kreis | `e2e/hints.spec.js` › Tipp ohne falschen Kreis | Bestanden |

Zusätzlich vorhanden und bestanden: Projekt-Unterpfad und Direktaufruf/Reload (`e2e/setup.spec.js`), Tastatur und Fokus sowie Responsives Layout (`e2e/accessibility.spec.js`).

## Zusammenfassung

- Gesamt: 113 (Unit 54, E2E 59)
- Bestanden: 113
- Fehlgeschlagen: 0
- Übersprungen: 0

## Testabdeckung

**Abdeckung:** 99,40 % Zeilen (Unit-Tests; Branch 94,62 %, Funktionen 100,00 %)

| Datei | Abdeckung |
|-------|-----------|
| `src/word-search/game.js` | 99,40 % |

Alle erfassten Dateien liegen über 80 %, daher keine weitere Tabelle.

## Fehlende Tests

Keine Dateien mit 0 % Abdeckung oder ohne Testdatei gefunden. Nicht in den Unit-Coverage-Daten enthalten, da Einstiegspunkt: `src/word-search/main.js` (wird durch die E2E-Tests abgedeckt).

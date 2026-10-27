# Test-Ergebnisse

## Ergebnis

**Status:** Keine Fehler

## Fehlgeschlagene Tests

Keine.

## E2E-Abdeckung

Quelle: `docs/features/task/f1715e2ee589498bb686384c49ebb639-wortsuchraetsel/plan.md`, Abschnitt „Lokale und CI-E2E vor Veröffentlichung“ (Szenarien 1–12).

| Szenario | Test / Testklasse | Ergebnis |
|----------|-------------------|----------|
| 1. Start, Level und Speicher | `e2e/setup.spec.js` › Levelauswahl und Speicher (Mehrfachauswahl, beschädigtes JSON, unbekannte Werte, leere Auswahl, alle abgewählt, Pool unter zehn) | Bestanden |
| 2. Einzel-Level-Daten und Runden | `e2e/setup.spec.js` › Einzel-Level-Runden (A1, A2, B1, B2, C1, C2) | Bestanden |
| 3. Generatorinvarianten | `e2e/generator.spec.js` › Generatorinvarianten (Seeds 1 und 42, easy/hard, 2- und 13-Buchstaben-Wort, Seed-Variation, unmögliche Eingabe) | Bestanden |
| 4. Schwierigkeit | `e2e/generator.spec.js` › Schwierigkeit (easy horizontal/vertikal, diagonaler Drag auf easy abgewiesen, hard diagonal) | Bestanden |
| 5. Zehn Markierungen per Klick | `e2e/marking.spec.js` › Zehn Markierungen per Klick | Bestanden |
| 6. Zehn Markierungen per Drag | `e2e/marking.spec.js` › Zehn Markierungen per Drag | Bestanden |
| 7. Zwei Wörter, Pflege, Duplikate | `e2e/marking.spec.js` › Zwei Wörter, Pflege und Duplikate | Bestanden |
| 8. Kreuzungen und Teilmarkierung | `e2e/evaluation.spec.js` › Kreuzungen und Teilmarkierung | Bestanden |
| 9. Extrafelder und Tippfehlerpriorität | `e2e/evaluation.spec.js` › Extrafelder und Fehlerpriorität | Bestanden |
| 10. Entwurfsübergänge und gemischte Eingabe | `e2e/drafts.spec.js` › Entwurfsübergänge | Bestanden |
| 11. Lösen, Invalidierung, Neustart | `e2e/evaluation.spec.js` › Lösen, Invalidierung und Neustart | Bestanden |
| 12. Tipp ohne falschen Kreis | `e2e/hints.spec.js` › Tipp ohne falschen Kreis | Bestanden |

Zusätzlich ausgeführt: Projekt-Unterpfad (`e2e/setup.spec.js`), Tastatur/Fokus und responsives Layout (`e2e/accessibility.spec.js`). Alle 66 E2E-Tests bestanden.

## Zusammenfassung

- Unit-Tests (`npm test`): Gesamt 59, Bestanden 59, Fehlgeschlagen 0, Übersprungen 0
- E2E-Tests (`npm run test:e2e`, Playwright, Port Standard 4183): Gesamt 66, Bestanden 66, Fehlgeschlagen 0, Übersprungen 0

## Testabdeckung

**Abdeckung:** Nicht messbar

Das Projekt hat keinen Coverage-Befehl (`package.json` enthält nur `test`, `test:e2e`, `test:smoke`). Die Bewertung erfolgt daher über die Dateinamen-Konvention.

## Fehlende Tests

Quelle: `Dateinamen-Konvention`

- `src/word-search/game.js` — Keine Testdatei mit passendem Namen (z. B. `game.test.js`) gefunden. Die Datei wird aber durch die E2E-Tests ausgeführt (Markierung, Lösen, Tipp, Entwurf).
- `src/word-search/main.js` — Einstiegspunkt, ignoriert.

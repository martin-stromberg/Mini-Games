# Test-Ergebnisse

## Ergebnis

**Status:** Fehler vorhanden

Alle ausgeführten Tests bestanden (0 fehlgeschlagen). Der Status ist trotzdem „Fehler vorhanden", weil 9 der 12 im Plan (`plan.md`, Abschnitt „Lokale und CI-E2E vor Veröffentlichung“) geforderten E2E-Szenarien nicht im Testlauf enthalten sind.

## Fehlgeschlagene Tests

Keine.

## E2E-Abdeckung

| Szenario | Test / Testklasse | Ergebnis |
|----------|-------------------|----------|
| 1. Start, Level und Speicher | `e2e/word-search.spec.js` – „persists a changed level selection“ | Teilweise (Speicherung geprüft; Reparatur beschädigter Daten, Sperre bei leerer Auswahl und Pool-Hinweis fehlen) |
| 2. Einzel-Level-Daten und Runden | – | Fehlend |
| 3. Generatorinvarianten | – (nur Unit-Test „generated rounds keep word paths …“, kein E2E) | Fehlend |
| 4. Schwierigkeit (diagonal nur auf Schwer) | – | Fehlend |
| 5. Zehn Markierungen per Klick | `e2e/word-search.spec.js` – „starts a round and evaluates ten separate click selections“ | Bestanden |
| 6. Zehn Markierungen per Drag | `e2e/word-search.spec.js` – „stores a straight drag as one independent slot“ (nur ein Drag statt zehn) | Teilweise |
| 7. Zwei Wörter, Pflege, Duplikate | – | Fehlend |
| 8. Kreuzungen und Teilmarkierung | – | Fehlend |
| 9. Extrafelder und Tippfehlerpriorität | – | Fehlend |
| 10. Entwurfsübergänge und gemischte Eingabe | – | Fehlend |
| 11. Lösen, Invalidierung, Neustart | – | Fehlend |
| 12. Tipp ohne falschen Kreis | – | Fehlend |

Hinweis: Die Zuordnung erfolgt nach Testnamen. Ergebnis: 1 Szenario bestanden (5), 2 teilweise (1, 6), 9 fehlend (2, 3, 4, 7–12).

## Zusammenfassung

- Gesamt: 8 (Unit: 5, E2E: 3)
- Bestanden: 8
- Fehlgeschlagen: 0
- Übersprungen: 0

Unit-Tests (`npm test`): 5 von 5 bestanden.
E2E-Tests (`npm run test:e2e`, Playwright): 3 von 3 bestanden.

## Testabdeckung

**Abdeckung:** Nicht messbar (kein Coverage-Tool für `node --test` konfiguriert).

## Fehlende Tests

Quelle: `Dateinamen-Konvention`

- `src/word-search/main.js` — Keine Testdatei gefunden (Einstiegspunkt, daher nicht bewertet; die UI-Logik wird nur über E2E-Tests geprüft)

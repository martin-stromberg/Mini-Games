# Offene Aufgaben

Erstellt am: 2026-10-27
Abbruchgrund: Maximale Iterationsanzahl erreicht

Die folgenden Aufgaben konnten im automatisierten Zyklus nicht abgeschlossen werden
und müssen manuell oder in einem erneuten Lauf bearbeitet werden.

## Offene Planelemente

- [ ] Tipp-Priorität gegen plan.md prüfen: Laut Doku-Agent ist sie in `src/word-search/game.js` (`getHint`) vereinfacht (Fehlerzellen → Nachbarfelder von Teiltreffern → erstes unmarkiertes Zielfeld); die im Plan geforderte Berücksichtigung aller Kandidatenpfade und Sonderfälle ggf. nachziehen und `docs/help/spiele/business-rules.md` anpassen. (`review.md` meldete Vollständig umgesetzt.)

## Code-Review-Befunde

- [ ] `src/word-search/game.js` / `test/fixtures/rounds.js`: `target.path.map(coordKey)` steht viermal inline (Zeilen 95, 117, 138, 156) und ist in den Fixtures als `pathKeys` dupliziert → `pathKeys` in `game.js` exportieren und überall verwenden.
- [ ] Doppelte Konstanten: `STORAGE_KEY` in `main.js` und `e2e/support.js` → in seiteneffektfreies Modul verschieben und exportieren; `WORD_PATTERN` exportieren und in `test/vocabulary.test.js` verwenden.
- [ ] Test-Literale: `smoke/pages.spec.js` Zeilen 16/19/20 (`6`, `169`, `10`) und `e2e/hints.spec.js` Zeile 62 (`index < 10`) durch `LEVELS.length`, `SIZE * SIZE`, `WORDS_PER_ROUND` ersetzen.
- [ ] `e2e/marking.spec.js` Zeilen 47–52 dupliziert `drag()` aus `e2e/support.js` → `startDrag()` + `drag()` aufteilen.
- [ ] Testqualität: `e2e/marking.spec.js` „two click words and two drag words …“ aufteilen; `e2e/evaluation.spec.js` „a wrong marking … a correction hides the result …“ auf den Invalidierungsfall reduzieren.

## Fehlgeschlagene Tests

(keine – `test-results.md`: 59/59 Unit, 66/66 E2E bestanden)

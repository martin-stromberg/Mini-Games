# Bestandsaufnahme: Neues Spiel „Buchstabensalat"

Analyse des Mini-Games-Repository bezogen auf die Anforderung eines neuen Spiels, bei dem die Buchstaben englischer Vokabeln gemischt angezeigt und in die richtige Reihenfolge gebracht werden.

## Zusammenfassung

- Drei bestehende Spiele (`word-search`, `memory`, `vocab-quiz`) liefern ein einheitliches, direkt wiederverwendbares Muster: Einstiegsseite unter `games/<spiel>/index.html`, DOM-freie Spiellogik in `src/<spiel>/game.js`, Oberfläche in `src/<spiel>/main.js`, Einstellungen in `localStorage`, `?seed=<Zahl>` für reproduzierbare Runden.
- Gemeinsame Bausteine für Vokabelladen, Zufall und HTML-Escaping sind vorhanden (`src/shared/`).
- Die Vokabelaufbereitung für Spiele (Entfernen von „to", Filter auf A–Z) existiert bereits als Muster in `src/word-search/game.js` (`toGridWord`, `normalizeWord`, `WORD_PATTERN`) und kann analog für das neue Spiel umgesetzt werden.
- Nicht vorhanden: Ein Mechanismus zum „Zusammensetzen" von Buchstaben (Kachelpool + Zielslots) — ist neu zu bauen, kein bestehender Code deckt das ab.
- Test-Infrastruktur (Node-Testrunner, Playwright, Vokabel-Fixtures) ist vorhanden und einsatzbereit.

Test-Ausgangszustand: `npm test` → 108 bestanden, 0 fehlgeschlagen; E2E-Basislauf siehe [Tests](inventory/tests.md).

## Details

- [Datenmodell](inventory/models.md)
- [Logik und Konventionen](inventory/logic.md)
- [Tests](inventory/tests.md)

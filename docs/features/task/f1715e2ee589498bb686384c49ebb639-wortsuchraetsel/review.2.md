# Plan-Review

## Ergebnis

**Status:** Offene Aufgaben vorhanden

Anzahl offener Punkte: 1 (Retry-Limit-Test des Generators; betrifft Plan-Schritte 8 und 9, siehe `../f1715e2ee589498bb686384c49ebb639-wortsuchraetsel-tasks.md`).

## Umgesetzte Planelemente

- [x] Vite-Multipage-Build mit Basis-URL `VITE_BASE_PATH` (`vite.config.js`) — angelegt
- [x] Spieleübersicht (`index.html`) und Spielroute (`games/word-search/index.html`) — angelegt
- [x] Vokabeldatei `public/data/vocabulary.json` mit 61 Einträgen, je Level mind. 10 (A1: 11, A2–C2: je 10) — angelegt
- [x] Validator `validateVocabulary` in `src/word-search/game.js` (Zielform, Länge 2–13, A–Z, Level, Übersetzung, Eindeutigkeit) — angelegt
- [x] Levelauswahl mit localStorage-Speicherung und Reparatur (`loadLevels`, `storeLevels` in `src/word-search/main.js`) — vorhanden
- [x] Mindestpool-Sperre mit Anzahl und Mindestbedarf (`setupStatus`) — vorhanden
- [x] Generator `generateRound` mit injizierbarer Seed-RNG (`seededRandom`, URL-Parameter `seed`), 10 gleichverteilte Ziele, 13×13-Gitter, Pfad = Wortlänge — vorhanden
- [x] Richtungen: Einfach horizontal/vertikal, Schwierig zusätzlich diagonal in beiden Steigungen (`directionsFor`) — vorhanden
- [x] Begrenzte Versuche `MAX_GENERATION_ATTEMPTS = 120` mit verständlichem Fehler, keine Teilrunde — vorhanden
- [x] Zellpfad-Modell je Ziel (`targets[].path`) — vorhanden
- [x] Kanonische Slot-Mengen (`toSortedCellKeys`), zehn Slots, Kreuzungen je Slot unabhängig — vorhanden
- [x] Klickentwurf mit „Noch nicht übernommen“, Übernehmen, Ändern, Neu ziehen, Entfernen, Verwerfen (`commitDraft`, `startEditSlot`, `startDragReplace`, `removeSlot`, `cancelDraft`) — vorhanden
- [x] Drag über Pointer-Events, gerade Pfade, Live-Vorschau, kein Klick nach Pointer-Up (`handlePointerDown/Move/Up`, `straightPath`) — vorhanden
- [x] Drag-Sperren: offener Entwurf, zehn belegte Slots, Einfach-Diagonale (`handleDrag`) — vorhanden
- [x] Lösen: atomare Übernahme des Entwurfs, Bestandsprüfung, Blockade bei zehn Slots (`solveRound`) — vorhanden
- [x] Klassifikation exact / partial / error mit Duplikatregel und erstem offenen Ziel (`classifySlot`, `classifySlots`) — vorhanden
- [x] Tipp: Fehlerzelle vor fehlenden Feldern, Nachbarfeld ohne globale Doppelbelegung, Fallback auf erstes offenes Ziel, neutrale Hinweise, Blockade bei offenem Entwurf (`getHint`, `showHint`) — vorhanden
- [x] Ergebnisinvalidierung bei Eingaben nach Lösen (`resetResult`) und Neustart (`startRound`) — vorhanden
- [x] Zugängliche Buttons, Labels, Live-Status, Pfeiltasten und Leertaste im Gitter, sichtbarer Fokus (`handleBoardKeydown`, `FOCUS_ATTRIBUTES`) — vorhanden
- [x] Workflow `.github/workflows/pages.yml`: PR-/Feature-Branch-Gates ohne Veröffentlichung, `verify` mit `VITE_BASE_PATH` vor Build, Deploy nur bei Push nach `verify`, Pages-Berechtigungen und Environment `github-pages`, Smoke-Job nach Deploy — vorhanden
- [x] Smoke-Test `smoke/pages.spec.js` mit Browser-Prüfung von Übersicht, Spielpfad nach Reload, Assets/JSON, Levelauswahl und Runde mit 10 Übersetzungen — vorhanden
- [x] Unit-Tests: Klassifikation (10), Drag (4), Generator, Hinweise (8), Vokabular/Validator — vorhanden
- [x] E2E-Szenarien 1, 2, 4–12 des Plans durch `e2e/setup`, `marking`, `drafts`, `evaluation`, `hints`, `generator`, `accessibility` belegt — vorhanden

## Offene Aufgaben

- [ ] Plan-Schritte 8 und 9 / Szenario 3: „nicht platzierbare Eingabe endet am Retry-Limit“ bzw. „Unmögliche Eingabe endet kontrolliert“ — teilweise umgesetzt: Die Fehlerbehandlung in `generateRound` und `startRound` ist vorhanden, es gibt aber keinen Test, der den Abbruch nach `MAX_GENERATION_ATTEMPTS` auslöst. Mit den realen Daten (zehn 13-Buchstaben-Wörter lassen sich in Zeilen platzieren) ist der Fall nicht erzeugbar. Nötig ist entweder eine nachweislich unplatzierbare Testeingabe oder ein injizierbarer Platzierer, der den Fehlschlag erzwingt.

## Hinweise

- **Vergleich mit `review.1.md` (Iteration 1):** Die dort offenen Punkte sind größtenteils behoben. E2E-Umfang: jetzt 7 Spec-Dateien statt 3 Tests. Projekt-Unterpfad: Der Job `verify` setzt `VITE_BASE_PATH` auf Job-Ebene, daher baut auch der Playwright-WebServer unter `/<repo>/`; der Befund aus `review.1.md` trifft für den aktuellen Workflow nicht mehr zu. Smoke-Test: Der Workflow enthält jetzt zusätzlich `npm run test:smoke` mit Browser-Prüfung; der Befund „nur curl“ ist überholt. Responsive/Tastatur: `e2e/accessibility.spec.js` deckt die Punkte ab.
- **Veraltete Artefakte:** `test-results.1.md` und `review.1.md` beschreiben Iteration 1 und sind nicht mehr aktuell. Die Testzahlen in `todo.md` (54 Unit, 59 E2E) wurden in diesem Review nicht erneut ausgeführt; das Review stützt sich auf die Quellen und Testdateien.
- **Kleine Inkonsistenz (kein offener Punkt):** „Ändern“ setzt das Ergebnis nach „Lösen“ sofort zurück, „Neu ziehen“ (`startDragReplace`) dagegen nicht. Der Plan verlangt Invalidierung bei Eingabe, Übernahme, Änderung, Entfernung oder Drag; „Neu ziehen“ allein ist noch keine Änderung, der nachfolgende erfolgreiche Drag invalidiert aber.
- **Ausstehend nach Push durch Anwender (außerhalb der offenen Aufgaben):** GitHub-Pages-Nachweis mit Feature-Commit-SHA, Deploy-Run-ID, URL und Smoke-Ergebnis. Die Repository-Einstellung „Pages-Quelle: GitHub Actions“ ist nicht aus den Repository-Artefakten belegbar.
- **Keine Code-Änderungen** in diesem Review. Geändert wurden nur `review.md` und die neue Aufgabenliste `docs/features/task/f1715e2ee589498bb686384c49ebb639-wortsuchraetsel-tasks.md` (vorher nicht vorhanden).

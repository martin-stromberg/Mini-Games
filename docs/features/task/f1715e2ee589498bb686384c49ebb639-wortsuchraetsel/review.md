# Plan-Review

## Ergebnis

**Status:** Vollständig umgesetzt

Anzahl offener Punkte: 0. Der Retry-Limit-Nachweis aus `review.2.md` ist nun durch `test/generator.test.js` belegt (injizierbare Gittergröße 2 erzwingt den Fehlschlag; zweiter Test prüft die genaue Zahl der Platzierungsversuche). Die Unit-Tests wurden in diesem Review ausgeführt: 59 von 59 bestanden. E2E- und Smoke-Tests wurden nicht ausgeführt; ihre Abdeckung ist über Testnamen und Quelldateien belegt.

## Umgesetzte Planelemente

- [x] Vite-Multipage-Build mit `VITE_BASE_PATH` (`vite.config.js`) — angelegt
- [x] Spieleübersicht (`index.html`) und Spielroute (`games/word-search/index.html`) — angelegt
- [x] Vokabeldatei `public/data/vocabulary.json`: 61 Einträge, A1 11, A2–C2 je 10 — angelegt
- [x] Validator `validateVocabulary` (`src/word-search/game.js`): Zielform, Länge 2–13, A–Z, Level, Übersetzung, Eindeutigkeit — angelegt
- [x] Levelauswahl mit localStorage-Speicherung und Reparatur (`loadLevels`, `storeLevels` in `src/word-search/main.js`) — vorhanden
- [x] Mindestpool-Sperre mit Anzahl und Mindestbedarf (`setupStatus`) — vorhanden
- [x] Generator `generateRound` mit injizierbarer RNG (`seededRandom`, URL-Parameter `seed`), 10 gleichverteilte Ziele, 13×13, Pfad = Wortlänge — vorhanden
- [x] Richtungen: Einfach horizontal/vertikal, Schwierig zusätzlich diagonal in beiden Steigungen (`directionsFor`) — vorhanden
- [x] Begrenzte Versuche `MAX_GENERATION_ATTEMPTS = 120`, verständlicher Fehler, keine Teilrunde; Retry-Limit per Unit-Test belegt — vorhanden
- [x] Zellpfad-Modell je Ziel (`targets[].path`) — vorhanden
- [x] Kanonische Slot-Mengen (`toSortedCellKeys`), zehn Slots, Kreuzungen je Slot unabhängig — vorhanden
- [x] Klickentwurf mit „Noch nicht übernommen“, Übernehmen, Ändern, Neu ziehen, Entfernen, Verwerfen (`commitDraft`, `startEditSlot`, `startDragReplace`, `removeSlot`, `cancelDraft`) — vorhanden
- [x] Drag über Pointer-Events, gerade Pfade, Live-Vorschau, kein Klick nach Pointer-Up (`handlePointerDown/Move/Up`, `straightPath`) — vorhanden
- [x] Drag-Sperren: offener Entwurf, zehn belegte Slots, diagonal auf Einfach (`handleDrag`) — vorhanden
- [x] Lösen: atomare Übernahme des Entwurfs, Bestandsprüfung, Blockade bei zehn Slots (`solveRound`) — vorhanden
- [x] Klassifikation exact / partial / error mit Duplikatregel und erstem offenen Ziel (`classifySlots`) — vorhanden
- [x] Tipp: Fehlerzelle vor fehlenden Feldern, Nachbarfeld ohne globale Doppelbelegung, Fallback auf erstes offenes Ziel, neutrale Hinweise, Blockade bei offenem Entwurf (`getHint`, `showHint`) — vorhanden
- [x] Ergebnisinvalidierung bei Eingaben nach Lösen (`resetResult`) und Neustart (`startRound`) — vorhanden
- [x] Zugängliche Buttons, Labels, Live-Status, Pfeiltasten und Leertaste im Gitter, sichtbarer Fokus (`handleBoardKeydown`, `FOCUS_ATTRIBUTES`) — vorhanden
- [x] Workflow `.github/workflows/pages.yml`: PR-/Feature-Branch-Gates, `verify` mit `VITE_BASE_PATH`, Deploy nur bei Push nach `verify`, Pages-Berechtigungen und Environment `github-pages`, Smoke-Job nach Deploy — vorhanden
- [x] Smoke-Test `smoke/pages.spec.js`: Übersicht, Spielpfad nach Reload, Assets/JSON, Levelauswahl, Runde mit 10 Übersetzungen — vorhanden
- [x] Unit-Tests: Klassifikation, Drag, Generator inkl. Retry-Limit, Hinweise, Vokabular/Validator — vorhanden (59 bestanden)
- [x] E2E-Szenarien 1, 4–12 des Plans durch `e2e/setup`, `marking`, `drafts`, `evaluation`, `hints`, `generator`, `accessibility` belegt; Szenarien 2 und 3 auf Generatorebene durch `test/generator.test.js` — vorhanden

## Offene Aufgaben

Keine.

## Hinweise

- **Retry-Limit (Schritt 8, Szenario 3):** Der Unit-Nachweis erfüllt die Planabsicht auf Generatorebene: nicht platzierbare Eingabe endet nach dem Limit mit verständlichem Fehler, ohne Teilrunde, und die Versuchszahl ist exakt geprüft. Ein E2E-Test mit realen Daten ist mit 13×13 und Wortlänge ≤ 13 nicht erzeugbar. Nicht getestet ist nur der UI-Fehlerpfad in `startRound` (Meldung und Rückkehr zur Setup-Ansicht). Er ist kurz (`catch` mit `setMessage` und `renderSetup`); ein Test wäre nur über eine Injektionsstelle im UI-Code möglich.
- **Invalidierung bei „Neu ziehen“:** `startDragReplace` setzt das Ergebnis nicht zurück, `startEditSlot` dagegen schon. Die Änderung selbst invalidiert beim nächsten erfolgreichen Drag (`storeSlot`). Der Plan nennt Änderung und Drag, nicht den Startknopf; daher kein offener Punkt.
- **Ausstehend nach Push durch Anwender (außerhalb der offenen Aufgaben):** Workflow-Lauf, GitHub-Pages-Nachweis mit Feature-Commit-SHA, Deploy-Run-ID, URL und Smoke-Ergebnis sowie die Repository-Einstellung „Pages-Quelle: GitHub Actions“. Diese sind aus den Repository-Artefakten nicht belegbar.
- **Keine Code-Änderungen** in diesem Review. Geschrieben wurden nur `review.md` und `tasks.md` in diesem Verzeichnis.

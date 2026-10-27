# Review – Wortsuchrätsel

**Status: Offene Aufgaben vorhanden**

Prüfdatum: 2026-10-27  
Geprüft gegen: `plan.md`, `inventory.md` und den Implementierungsstand im Arbeitsverzeichnis.  
Änderungsumfang dieser Prüfung: ausschließlich diese Review-Datei.

## Erfüllte Bereiche

- Die in der Bestandsaufnahme fehlende Website-/Build-Struktur ist angelegt: Vite-Multipage-Einstieg, Übersicht und Spielroute sowie die lokale Vokabeldatei sind vorhanden (`vite.config.js`, `index.html`, `games/word-search/index.html`, `public/data/vocabulary.json`). Das deckt die Strukturentscheidung und einen wesentlichen Teil der Schritte 1–2 in `plan.md` ab.
- `src/word-search/game.js` enthält Validierung, Seed-RNG, Auswahl und Generator mit zehn Zielen, begrenzten Versuchen, 13×13-Gitter und Zellpfaden; Klassifikation, Tipp und Drag-Pfadlogik sind ebenfalls implementiert. `src/word-search/main.js` enthält Levelwahl/-speicherung, zehn Slots, Klickentwurf, Bearbeitung, Drag, Lösen und Neustart.
- Die vorhandenen automatisierten Prüfungen liefen erfolgreich: `npm test` ergab 5/5 bestandene Unit-Tests; `npm run test:e2e` ergab 3/3 bestandene Playwright-Tests. Diese Ergebnisse belegen nur die tatsächlich enthaltenen Fälle, nicht alle im Plan geforderten Szenarien.

## Offene Aufgaben und Belege

1. **Der geforderte E2E-Umfang ist nicht umgesetzt.** `plan.md` unter „Lokale und CI-E2E vor Veröffentlichung“ fordert unter anderem alle sechs Level einzeln, Reparatur beschädigter/unbekannter/leer gespeicherter Auswahl, Generator-Invarianten über feste Saaten einschließlich spezieller 2- und 13-Buchstaben-Wörter, zehn separate Klick- und Drag-Markierungen samt Lösen, Slotänderung/-entfernung, Tipp- und Fehlerprioritäten sowie Entwurfsübergänge und Ergebnisinvalidierung. Vorhanden sind lediglich drei E2E-Tests (`e2e/word-search.spec.js:3,14,21`): Runde starten/Reload, gespeicherte Levelwahl und ein einzelner Drag. Die fünf Unit-Tests in `test/game.test.js` prüfen ebenfalls nur Teilbereiche; insbesondere erzwingen sie keine Runden für jedes Level und keinen erfolgreichen Lösungsablauf mit den 2-/13-Buchstaben-Grenzfällen. Die Schritte 8–9 und die E2E-Abnahmekriterien sind deshalb offen.

2. **Der Projekt-Unterpfad wird in den Vorab-E2E nicht geprüft.** In `.github/workflows/pages.yml` wird `npm run test:e2e` vor dem Build mit `VITE_BASE_PATH` ausgeführt. Die Playwright-WebServer-Konfiguration baut selbst ohne diese Umgebungsvariable (`playwright.config.js`), während der spätere Build im Workflow erst danach `/<repository>/` als Basis erhält. Damit belegen die grünen E2E weder lokale noch CI-Funktion unter dem echten Pages-Projektpfad, Direktaufruf und Reload unter diesem Pfad, wie Schritt 1 und die Vorab-Szenarien verlangen.

3. **Der Pages-Smoke-Test deckt die geplante Funktion nicht ab und ein erfolgreicher Pages-Nachweis ist nicht dokumentiert.** Der Workflow hat zwar Push-Auslöser für Feature-Branch und `main`, einen Deploy-Job und einen nachgelagerten Smoke-Job. Der Smoke-Job ruft aber nur Übersichts- und Spiel-URL per `curl` ab (`.github/workflows/pages.yml:47-58`); er lädt weder Assets/JSON gezielt noch prüft er per Browser, dass Auswahl erscheint und eine Runde startbar ist, wie `plan.md` unter „Nachgelagerter GitHub-Pages-Nachweis“ verlangt. In den geprüften Dateien gibt es zudem keinen Nachweis mit Feature-Commit-SHA, erfolgreicher Run-ID, echter Pages-URL und Browser-Smoke-Ergebnis. Ein erfolgreicher Workflow-/Pages-Nachweis ist daher nicht abgenommen. Die externe Pages-Einstellung aus `inventory.md` ist ebenfalls nicht durch die vorliegenden Repository-Artefakte belegbar.

4. **Responsive und zugängliche Bedienung ist nicht ausreichend nachgewiesen.** Schritt 11 fordert responsives Layout, Tastaturbedienung, Fokuszustände und zugängliche Beschriftungen. Es gibt semantische Buttons, Labels und Live-Status in `src/word-search/main.js`; die vorhandenen E2E prüfen aber keine Tastaturbedienung oder Fokusführung, und die beschriebenen responsive-/Accessibility-Abnahmekriterien sind nicht vorhanden. Der Schritt kann daher anhand des vorliegenden Prüfstands nicht als abgeschlossen gelten.

## Abschluss

Die Kernanwendung und Basisprüfungen sind vorhanden, aber mehrere ausdrücklich vereinbarte Abnahmekriterien aus `plan.md` bleiben offen. Der Status ist deshalb **Offene Aufgaben vorhanden**.

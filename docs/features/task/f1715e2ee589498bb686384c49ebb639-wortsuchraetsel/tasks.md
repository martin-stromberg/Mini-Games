# Aufgabenliste – Wortsuchrätsel (Plan-Umsetzung)

Branch: `task/f1715e2ee589498bb686384c49ebb639-wortsuchraetsel`
Stand: Plan-Review (`review.md`), Prüfung der Implementierung unter `src/`, `test/`, `e2e/`, `smoke/`, `.github/workflows/pages.yml`.

| Status | Schritt | Beschreibung | Testnachweis |
|--------|---------|--------------|--------------|
| Erledigt | 1 | Vite-Grundgerüst, Spieleübersicht, Spielroute, Projekt-Unterpfad | `e2e/setup.spec.js` – „overview, assets and game route work under the project path“; „the game route survives direct access and reload“ |
| Erledigt | 2 | Vokabel-JSON (61 Einträge, mind. 10 je Level) und Validator | `test/vocabulary.test.js` – „real vocabulary offers at least ten words for level A1“ (bis C2); „validation rejects duplicates after normalisation“ |
| Erledigt | 3 | Levelauswahl, localStorage-Speicherung und -Reparatur, leere Auswahl, Mindestpool 10 | `e2e/setup.spec.js` – „a multiple level selection is stored and restored“; „deselecting every level blocks the start and names the required action“; „a pool with fewer than ten words blocks the start and names count and minimum“ |
| Erledigt | 4 | Seed-fähiger Generator: 10 Ziele, Pfadlänge = Wortlänge, Konfliktregeln, Richtungen, Füllung | `test/generator.test.js` – „generated rounds fill every grid cell and keep exact letter paths“; „hard rounds can use diagonal paths in both slopes“ |
| Erledigt | 5 | Oberflächen: Level, Start, Gitter, Übersetzungen, zehn Slots, Entwurf, Ändern/Entfernen/Neu ziehen, Lösen, Tipp, Neue Runde | `e2e/marking.spec.js` – „ten click selections stay separate and one solve finds ten targets“ |
| Erledigt | 6 | Klick-/Drag-Zustandsmaschine und Entwurfsübergänge | `e2e/drafts.spec.js` – „solve commits an open new click selection atomically into the next slot“; „dragging during an open selection or change is blocked without losing anything“ |
| Erledigt | 7 | Gemeinsame Klassifikation/Trefferfunktion und deterministischer Tipp | `test/classification.test.js` – „ten exact slots find ten distinct targets“; `test/hint.test.js` – „an extra cell is circled before anything else“ |
| Erledigt | 8 | Daten-/Generatorprüfungen inkl. Retry-Limit (nicht platzierbare Eingabe) | `test/generator.test.js` – „an unplaceable input ends with a clear error after the retry limit“ (injizierbare Gittergröße 2); „an unplaceable input uses exactly the configured number of placement attempts“ |
| Erledigt | 9 | Lokale Vorab-E2E gegen Produktionsbuild unter Unterpfad inkl. Szenario 3 („Unmögliche Eingabe endet kontrolliert“) | Szenarien 1, 4–12 durch `e2e/*.spec.js`; Szenarien 2 und 3 auf Generatorebene durch `test/generator.test.js` (Retry-Limit per injizierter Gittergröße). UI-Fehlerpfad in `startRound` nicht separat getestet (siehe Hinweis in `review.md`). |
| Erledigt | 10 | Workflow `.github/workflows/pages.yml`: PR-/Feature-Branch-Gates, Deploy nur nach verify, Pages-Berechtigungen/Environment, Smoke-Job | Kein direkter Test (Konfiguration). Workflow-Lauf und Pages-Nachweis ausstehend nach Push durch Anwender (außerhalb der offenen Aufgaben). |
| Erledigt | 10 (Smoke) | Nachgelagerter Smoke-Test der veröffentlichten URL: Übersicht, Spielpfad nach Reload, Assets/JSON, Levelauswahl, Runde mit 10 Übersetzungen | `smoke/pages.spec.js` – „published game loads assets and vocabulary, shows levels and starts a round after reload“ |
| Erledigt | 11 | Responsives Layout, Tastaturbedienung, Fokuszustände, zugängliche Beschriftungen | `e2e/accessibility.spec.js` – „arrow keys move the focus through the grid and space selects a cell“; „the game fits a phone screen without horizontal scrolling“ |

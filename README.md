# Mini-Games

[![Verify and deploy Pages](https://img.shields.io/github/actions/workflow/status/martin-stromberg/Mini-Games/pages.yml?label=Pages)](https://github.com/martin-stromberg/Mini-Games/actions/workflows/pages.yml)

Eine kleine, statische Sammlung von Lernspielen, veröffentlicht über GitHub Pages. Das erste Spiel ist ein **Wortsuchrätsel** zum Üben englischer Vokabeln mit deutschen Übersetzungen, sortiert nach GER-Niveau (A1 bis C2).

Die Seite ist so angelegt, dass weitere Spiele unter `games/<spielname>/` ergänzt werden können.

## Features

- **Wortsuchrätsel** mit 13 × 13 Feldern und zehn Wörtern pro Runde
- **Auswahl der GER-Niveaus** (A1 bis C2) vor dem Start, Mehrfachauswahl; die Auswahl bleibt im Browser (`localStorage`) gespeichert
- **Zwei Schwierigkeitsstufen:** Einfach (horizontal und vertikal) und Schwierig (zusätzlich diagonal)
- **Markieren per Klick oder Ziehen** (Drücken, Ziehen, Loslassen), bis zu zehn Markierungen gleichzeitig
- **Lösen-Button** prüft die Markierungen; nicht gefundene Übersetzungen werden danach hervorgehoben
- **Tipp-Button** kreist ein falsch markiertes Feld oder, falls keines falsch ist, ein noch nicht gefundenes Feld eines korrekten Wortes ein
- Zufällige Füllbuchstaben in allen nicht belegten Feldern

## Installation

Voraussetzungen: Node.js (die CI verwendet Node 24) und npm.

```bash
npm ci
```

Für die End-to-End-Tests wird zusätzlich Chromium für Playwright benötigt. Der Browser wird in `node_modules` abgelegt, wie es die Test-Skripte erwarten:

```bash
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium
```

In PowerShell entsprechend `$env:PLAYWRIGHT_BROWSERS_PATH = "0"` vor dem Befehl setzen.

## Verwendung

Entwicklungsserver starten (Vite, Standardport 5173):

```bash
npm run dev
```

Anschließend im Browser `http://localhost:5173/games/word-search/` öffnen. Die Übersicht liegt unter `http://localhost:5173/`.

Produktionsbuild erzeugen und lokal ausliefern:

```bash
npm run build
npm run preview
```

Der Build landet im Ordner `dist/`.

## Konfiguration

| Parameter | Verwendet in | Standardwert | Beschreibung |
|-----------|--------------|--------------|--------------|
| `VITE_BASE_PATH` | `vite.config.js`, `playwright.config.js` | `/` (Vite), `/Mini-Games/` (Playwright) | Basispfad der Seite. Für GitHub Pages unter einem Projekt-Unterpfad setzen, z. B. `VITE_BASE_PATH=/Mini-Games/ npm run build`. Die CI setzt ihn automatisch auf `/<Repository-Name>/`. |
| `E2E_PORT` | `playwright.config.js` | `4183` | Port, auf dem der Preview-Server für die E2E-Tests läuft. |
| `PAGE_URL` | `playwright.smoke.config.js` | – (Pflicht für Smoke-Test) | Veröffentlichte URL, gegen die der Smoke-Test läuft, z. B. `https://martin-stromberg.github.io/Mini-Games/`. |

Beispiel für einen Build unter dem Projekt-Unterpfad (Bash):

```bash
VITE_BASE_PATH=/Mini-Games/ npm run build
```

## Vokabeldaten

Die Vokabeln liegen je GER-Niveau in `public/data/vocabulary/a1.json` … `c2.json` als JSON-Array. Sie sind für alle Spiele gedacht und enthalten neben der Übersetzung auch Wortart, Thema, Synonyme und einen Beispielsatz auf Deutsch und Englisch:

```json
{ "english": "apple", "german": "Apfel", "partOfSpeech": "noun", "topic": "Essen", "synonyms": [],
  "exampleGerman": "Der Apfel schmeckt süß.", "exampleEnglish": "The apple tastes sweet.",
  "image": "images/vocabulary/apple.svg" }
```

- Das Niveau ergibt sich aus dem Dateinamen.
- Gegenstände und Lebewesen können ein Symbolbild haben (`image`, Pfad relativ zu `public/`). Aktuell haben 109 Substantive aus A1 und A2 eins. Die SVGs liegen in `public/images/vocabulary/` und werden als `<img>` eingebunden, nie als eingebetteter Code. Herkunft und Lizenzen (Noto Emoji, Apache 2.0, sowie eigene Zeichnungen) stehen in `public/images/vocabulary/LIZENZEN.md`.
- Der Bestand umfasst aktuell 2454 Einträge (A1 118, A2 105, B1 117, B2 743, C1 1262, C2 109). Verben stehen als Infinitiv mit „to“, Wortgruppen wie „train station“ sind enthalten.
- Das Wortsuchrätsel nutzt davon nur Begriffe, die als Wort ins Gitter passen: „to“ wird bei Verben weggelassen, übrig bleiben nur A–Z mit 2–13 Buchstaben. Pro Runde wählt es zehn Wörter mit unterschiedlichen deutschen Übersetzungen.
- Neue Vokabeln lassen sich mit `node scripts/import-vocabulary.mjs <ordner>` aus Dateien `a1.json` … `c2.json` (Felder `Question` = deutsch, `Answer` = englisch, `PartOfSpeech`, `Topic`, `Synonyms`, `ExampleSentence`, `ExampleSentenceTranslation`) übernehmen. Neue englische Begriffe werden ihrem Niveau angehängt; ist ein Begriff schon vorhanden („to improve“ und „improve“ gelten als gleich), bleibt er in seinem Niveau und fehlende Angaben werden ergänzt. Das Skript kann beliebig oft laufen und prüft den Bestand am Ende mit `validateVocabulary`.
- Die Tests in `test/vocabulary.test.js` prüfen, dass jeder Eintrag vollständig ist, englische Begriffe eindeutig sind, Symbolbilder existieren und keinen ausführbaren Inhalt haben und jedes Niveau mindestens zehn Gitterwörter mit unterschiedlichen Übersetzungen bietet.

## Projektstruktur

```
.
├── index.html                  # Übersicht der Spiele (Startseite)
├── games/
│   └── word-search/index.html  # Wortsuchrätsel (Einstiegsseite)
├── src/
│   ├── styles.css              # Gemeinsame Styles
│   └── word-search/
│       ├── game.js             # Generator, Klassifikation, Tipp (ohne DOM)
│       └── main.js             # Oberfläche des Wortsuchrätsels
├── public/data/vocabulary/    # Vokabeldaten je Niveau (a1.json … c2.json)
├── public/images/vocabulary/  # Symbolbilder der Vokabeln (SVG) mit LIZENZEN.md
├── test/                       # Unit-Tests (Node-Testrunner)
├── e2e/                        # End-to-End-Tests (Playwright, gegen den Produktionsbuild)
├── smoke/                      # Smoke-Test der veröffentlichten Seite (Playwright)
├── scripts/playwright.mjs      # Wrapper, setzt PLAYWRIGHT_BROWSERS_PATH=0
├── vite.config.js              # Build-Konfiguration mit mehreren Einstiegspunkten
└── .github/workflows/pages.yml # CI und Deployment
```

Technologien: Vanilla JavaScript (ES-Module), HTML und CSS, Build mit Vite 7, Tests mit dem Node-Testrunner und Playwright.

## Tests

| Befehl | Inhalt |
|--------|--------|
| `npm test` | Unit-Tests in `test/` (Node-Testrunner): Vokabeldaten, Generator, Klassifikation, Ziehen, Tipp |
| `npm run test:e2e` | Playwright-Tests in `e2e/` gegen den Produktionsbuild unter dem Projekt-Unterpfad |
| `npm run test:smoke` | Smoke-Test in `smoke/` gegen die veröffentlichte Seite; benötigt `PAGE_URL` |

Die E2E-Tests bauen und starten den Preview-Server selbst (siehe `playwright.config.js`). Vor `npm run test:e2e` muss Chromium installiert sein (siehe Installation).

## Deployment

Der Workflow `.github/workflows/pages.yml` läuft bei Pull Requests und bei Pushes auf `main`:

1. **verify** (bei jedem Lauf): `npm ci`, `npm test`, `npm run test:e2e`, `npm run build`. Bei Pushes wird `dist/` als Pages-Artefakt hochgeladen.
2. **deploy** (nur bei Push): veröffentlicht das Artefakt über `actions/deploy-pages`.
3. **smoke** (nur bei Push): prüft die veröffentlichte URL (Übersicht, Spielseite, `data/vocabulary/a1.json`) und führt `npm run test:smoke` aus.

Voraussetzung in den Repository-Einstellungen: Unter *Settings → Pages* muss als Quelle **GitHub Actions** gewählt sein. Pull Requests veröffentlichen nichts.

Die Seite ist nach erfolgreichem Deployment unter `https://martin-stromberg.github.io/Mini-Games/` erreichbar.

## Roadmap

- Weitere kleine Spiele in der Sammlung ergänzen (Ziel laut Anforderung).

← [Zurück zur Übersicht](index.md)

# Wortsuchrätsel — Installation und Konfiguration

## Voraussetzungen

- Node.js 24 (so konfiguriert in der CI) mit npm
- Für die End-to-End-Tests: Playwright-Chromium (wird über `npx playwright install --with-deps chromium` installiert)
- Für die Veröffentlichung: ein GitHub-Repository mit aktivierten GitHub Pages

## Installationsschritte

1. Abhängigkeiten installieren:
   ```
   npm ci
   ```
2. Entwicklungsserver starten (Vite):
   ```
   npm run dev
   ```
   Die Seite ist danach unter `/games/word-search/` erreichbar.
3. Produktionsbuild erzeugen (Ausgabe in `dist/`):
   ```
   npm run build
   ```
4. Build lokal ausliefern:
   ```
   npm run preview
   ```

## Konfiguration

| Parameter | Typ | Standardwert | Beschreibung |
|-----------|-----|--------------|--------------|
| `base` in `vite.config.js` | string | `process.env.VITE_BASE_PATH` oder `/` | Basis-URL für Assets und Vokabeldatei. |
| Vokabeldatei | JSON | `public/data/vocabulary.json` | Wortliste mit 2316 Einträgen; Format siehe [Datenmodell](datenmodell.md). |
| `WORDS_PER_ROUND` in `src/word-search/game.js` | Zahl | 10 | Anzahl der Wörter pro Runde. |
| `SIZE` in `src/word-search/game.js` | Zahl | 13 | Kantenlänge des Gitters. |
| `MAX_GENERATION_ATTEMPTS` in `src/word-search/game.js` | Zahl | 120 | Versuche des Generators, bevor ein Fehler gemeldet wird. |

## Umgebungsvariablen

| Variable | Pflicht | Beispielwert | Beschreibung |
|----------|---------|--------------|--------------|
| `VITE_BASE_PATH` | Nein | `/f1715e2e-e589-498b-b686-384c49ebb639/` | Basispfad für Projektseiten auf GitHub Pages. Ohne Wert gilt `/`. Die CI setzt den Wert aus dem Repository-Namen. |

## GitHub Pages und Workflow

Die Datei `.github/workflows/pages.yml` (Name „Verify and deploy Pages“) arbeitet so:

- **Pull Requests:** Job `verify` führt `npm test`, `npm run test:e2e` (gegen den Produktionsbuild mit Projektpfad) und `npm run build` aus. Es wird nichts veröffentlicht.
- **Push auf `main`:** Zusätzlich lädt der Workflow das Verzeichnis `dist` hoch (Job `verify`), veröffentlicht es über `actions/deploy-pages` (Job `deploy`, Environment `github-pages`) und prüft danach die veröffentlichte URL mit `npm run test:smoke` (Job `smoke`).
- Der Workflow benötigt die Berechtigungen `pages: write` und `id-token: write`.

**Einmalige Einrichtung im Repository:** Unter den Pages-Einstellungen muss als Quelle „GitHub Actions“ gewählt sein. Ohne diese Einstellung schlägt der Deploy-Job fehl.

## Tests

| Befehl | Inhalt |
|--------|--------|
| `npm test` | Node-Tests unter `test/` (Vokabelvalidierung, Generator, Klassifikation, Tipp, Ziehen). |
| `npm run test:e2e` | Playwright gegen den Produktionsbuild unter dem Projektpfad (Ordner `e2e/`). |
| `npm run test:smoke` | Playwright gegen die veröffentlichte URL (`PAGE_URL`, Ordner `smoke/`). |

## Überprüfung

1. `npm run dev` starten und `/games/word-search/` öffnen. Die Niveauauswahl muss erscheinen.
2. Nach „Runde starten“ müssen Gitter und zehn Übersetzungen sichtbar sein.
3. Nach dem Merge bzw. Push auf `main`: Im Actions-Tab sind die Jobs `verify`, `deploy` und `smoke` grün. Die Seite ist unter der Pages-URL erreichbar.

# Wortsuchrätsel — Fehlerbehebung

## Vokabeldatei wird abgelehnt

**Symptom:** Die Seite zeigt statt der Niveauauswahl eine Fehlermeldung, die einen Eintrag nennt (z. B. „Ungültiges GER-Niveau in Eintrag 12“).

**Ursache:** `validateVocabulary` (`src/word-search/game.js`) findet einen ungültigen Eintrag: fehlender englischer Begriff, leere Übersetzung oder doppelter englischer Begriff (auch über Niveaus hinweg).

**Lösung:**
1. Den genannten Eintrag in der Datei des Niveaus unter `public/data/vocabulary/` korrigieren.
2. `npm test` ausführen; `test/vocabulary.test.js` prüft die Datei.

## Vokabeldatei kann nicht geladen werden (404)

**Symptom:** „Die Vokabeldatei für A1 konnte nicht geladen werden.“ (mit dem betroffenen Niveau) Die Asset-Pfade funktionieren nur lokal.

**Ursache:** Der Basispfad stimmt nicht. Auf GitHub Pages liegt die Seite unter einem Projektpfad, der beim Build über `VITE_BASE_PATH` bekannt sein muss.

**Lösung:** Beim Build `VITE_BASE_PATH` auf `/<Repository-Name>/` setzen. Die CI tut dies automatisch. Lokal den Build mit demselben Wert prüfen.

## Deploy-Job schlägt fehl

**Symptom:** Der Job `deploy` in `pages.yml` bricht ab; die Seite wird nicht aktualisiert.

**Ursache:** Die Pages-Quelle des Repositorys ist nicht auf „GitHub Actions“ gestellt, oder die Berechtigungen fehlen.

**Lösung:** In den Repository-Einstellungen unter Pages die Quelle „GitHub Actions“ wählen. Prüfen, ob der Workflow die Berechtigungen `pages: write` und `id-token: write` hat.

## Smoke-Test schlägt fehl

**Symptom:** Der Job `smoke` bricht ab, obwohl `deploy` erfolgreich war.

**Ursache:** Die veröffentlichte URL ist nicht erreichbar, oder eine Datei unter dem Projektpfad fehlt. Die `curl`-Prüfungen im Workflow und `smoke/pages.spec.js` decken diese Fälle ab. Ist `PAGE_URL` leer, bricht der Job bereits am ersten Schritt ab.

**Lösung:** Die im Log genannte URL im Browser öffnen. Prüfen, ob `games/word-search/` und `data/vocabulary/a1.json` erreichbar sind. Ein Deploy-Fehler vorher hat Vorrang vor dem Smoke-Test.

## Generator meldet „nicht erzeugt“

**Symptom:** Im Spiel erscheint „Das Rätsel konnte nach mehreren Versuchen nicht erzeugt werden.“

**Ursache:** Die zehn gewählten Wörter ließen sich innerhalb von 120 Versuchen nicht platzieren. Das kommt bei langen Wörtern und wenigen Richtungen (Einfach) vor.

**Lösung:** Die Runde neu starten. Hilft das nicht, Niveauauswahl erweitern oder besonders lange Wörter in der Vokabeldatei prüfen. Der Test `test/generator.test.js` deckt die Generatorfälle ab.

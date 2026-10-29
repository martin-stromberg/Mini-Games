# Übersetzte Anforderung: Neues Spiel „Buchstabensalat"

## Fachliche Zusammenfassung

Der Mini-Games-Sammlung wird ein viertes Lernspiel „Buchstabensalat" hinzugefügt. Die Buchstaben einer englischen Vokabel aus dem gemeinsamen Vokabelbestand werden gemischt als Kacheln angezeigt; als Hinweis dient die deutsche Übersetzung (optional das Symbolbild). Der Spieler legt die Buchstaben in der richtigen Reihenfolge — per Klick/Touch auf die Kacheln oder per Tastatureingabe. Eine Runde umfasst eine wählbare Anzahl von Wörtern und endet mit einer Auswertung.

## Fachliche Anforderungen

1. **Wortanzeige:** Gemischte Buchstaben als Kacheln, deutsche Übersetzung als Hinweis, bei vorhandenem `image` optional das Symbolbild. Die gemischte Reihenfolge darf niemals dem Originalwort entsprechen.
2. **Eingabe:** Klick/Touch auf Kacheln in Reihenfolge oder Tastatureingabe. Gesetzte Buchstaben lassen sich wieder entfernen (Klick auf gesetzten Buchstaben bzw. Rücktaste).
3. **Auswertung pro Wort:** Bei vollständig gesetztem Wort automatische Prüfung — richtig → nächstes Wort; falsch → Markierung und erneuter Versuch.
4. **Hilfe:** Button „Buchstaben aufdecken" setzt den nächsten korrekten Buchstaben fest; jede Nutzung zählt als Hilfe für die Auswertung.
5. **Runde:** Wählbare Wortanzahl; Wörter können übersprungen werden; Abschlussauswertung zeigt gelöst / Hilfen genutzt / übersprungen.
6. **Wortauswahl:** Verben werden ohne vorangestelltes „to" verwendet. Wortgruppen mit Leerzeichen (z. B. „train station") — Entscheidung im Plan: ausschließen oder Leerzeichen fest vorgeben.
7. **Optionaler Filter:** Wortlänge kurz/mittel/lang.
8. **Bei doppelten Buchstaben** zählt jede gültige Reihenfolge, die das Wort ergibt.

## Betroffene Module und Artefakte

- `games/buchstabensalat/index.html` — neue Einstiegsseite (Muster: `games/vocab-quiz/index.html`)
- `src/buchstabensalat/game.js` — Spiellogik ohne DOM: Wortfilterung/-auswahl, Mischen (ungleich Original), Buchstaben setzen/entfernen/aufdecken, Prüfung, Rundenauswertung
- `src/buchstabensalat/main.js` — Oberfläche: Einstellungen, Kachel-Rendering, Eingabe (Maus/Touch/Tastatur), Feedback, Auswertung
- `index.html` — Link auf der Startseite ergänzen
- `src/styles.css` — ggf. spielspezifische Styles im bestehenden Stil
- `vite.config.js` — neuer Einstiegspunkt
- `test/buchstabensalat.test.js` — Unit-Tests der Spiellogik (Node-Testrunner)
- `e2e/buchstabensalat.spec.js` — Playwright-E2E für den Spielablauf
- `docs/help/buchstabensalat/index.md` — Hilfeseite
- `README.md`, `docs/RELEASE_NOTES.md`, `changes.log` — Dokumentation
- Wiederverwendung: `src/shared/vocabulary.js` (`loadVocabulary`, `LEVELS`), `src/shared/random.js` (`createRandomSource`, `shuffle`, `seededRandom`), `src/shared/html.js` (Escaping)

## Implementierungsansatz

- Bestehende Spielkonventionen übernehmen: Spiellogik DOM-frei und mit injiziertem Zufall testbar, `?seed=<Zahl>` für reproduzierbare Runden, Einstellungen (GER-Niveaus, Wortanzahl, Wortlängen-Filter) in `localStorage`, Rücklink „← Mini-Games".
- Buchstabenmodell: Kachelpool + Zielslots; aufgedeckte Buchstaben werden als fixiert markiert.
- Vokabelvorverarbeitung: „to "-Präfix bei Verben entfernen; nur A–Z-Buchstaben; Leerzeichen-Strategie im Plan festlegen.

## Konfiguration

Benutzerspezifisch im `localStorage` (Muster der bestehenden Spiele): GER-Niveaus (Mehrfachauswahl), Wortanzahl, Wortlängen-Filter, Bildhinweis an/aus.

## Akzeptanzkriterien

- [ ] Gemischtes Wort unterscheidet sich immer vom Original.
- [ ] Bei doppelten Buchstaben zählt jede gültige Reihenfolge, die das Wort ergibt.
- [ ] Eingabe per Klick und Tastatur.
- [ ] Auswertung am Rundenende.

## Offene Fragen

Keine — die Detailentscheidung zu Wortgruppen mit Leerzeichen wird im Plan getroffen (die Anforderung lässt beide Optionen zu und verlangt eine Entscheidung).

← [Zurück zur Übersicht](../index.md)

# Vokabel-Quiz

Multiple-Choice-Quiz zu englischen Vokabeln: Zu jeder Frage gibt es vier Antworten, genau eine ist richtig.

## Für Anwender

### Einstellungen

- **GER-Niveaus:** Beliebige Mehrfachauswahl von A1 bis C2; neben jedem Niveau steht seine Vokabelzahl.
- **Fragen pro Runde:** 10 (Standard), 20 oder 30 Fragen.
- **Fragetypen:** „Englisches Wort → deutsche Übersetzung“, „Deutsches Wort → englische Übersetzung“ und „Symbolbild → englisches Wort“. Mehrfachauswahl möglich, die Typen werden in der Runde gemischt. Bildfragen gibt es nur für Vokabeln mit Symbolbild; reicht der Bildbestand der gewählten Niveaus nicht, werden Bildfragen durch Textfragen ersetzt. Sind nur Bildfragen gewählt und zu wenig Bildvokabeln vorhanden, ist „Runde starten“ gesperrt und ein Hinweis nennt die Anzahl.

Die Einstellungen bleiben im Browser gespeichert.

### Spielen

1. Frage lesen — ein englisches oder deutsches Wort oder ein Symbolbild — und eine der vier Antworten wählen: per Klick, Tippen oder Taste 1–4.
2. Sofortige Rückmeldung: Die richtige Antwort wird grün, eine falsche Auswahl rot. Darunter erscheint der Beispielsatz der Vokabel auf Deutsch und Englisch.
3. „Weiter“ (auch Enter oder Pfeil rechts) führt zur nächsten Frage, nach der letzten Frage zum Ergebnis.
4. Das Ergebnis zeigt die Anzahl richtiger Antworten und die Liste der falsch beantworteten Vokabeln samt eigener Antwort.

„Neue Runde“ mischt neue Fragen mit denselben Einstellungen, „Einstellungen ändern“ führt zurück zur Auswahl.

## Technik

- Seite: `games/vocab-quiz/index.html`, Oberfläche `src/vocab-quiz/main.js`, Spiellogik ohne DOM in `src/vocab-quiz/game.js`.
- Die Vokabeln werden wie in den anderen Spielen aus `public/data/vocabulary/<niveau>.json` geladen (`src/shared/vocabulary.js`). Mit `?seed=<Zahl>` in der Adresse ist eine Runde reproduzierbar (für Tests).
- **Rundenbau (`createRound`):** Die gewählten Fragetypen werden gleichmäßig auf die Fragen verteilt. Jede Vokabel kommt in einer Runde höchstens einmal vor, auch über denselben deutschen Begriff hinweg. Bildfragen nutzen nur Vokabeln mit `image` und werden übersprungen, wenn der Bildbestand für Frage und drei falsche Antworten nicht reicht.
- **Falsche Antworten (`pickDistractors`):** Bevorzugt werden Einträge gleicher Wortart und gleichen Themas. Ausgeschlossen sind die Fragevokabel selbst, andere Fragen der Runde, sinnverwandte Einträge (gleiche deutsche Übersetzung oder Synonyme) und doppelte Antworttexte — so bleibt genau eine Antwort richtig.
- Einstellungen liegen in `localStorage` unter `mini-games.vocab-quiz.settings`.

## Fehlerbehebung

- **„Die Vokabeldatei für A1 konnte nicht geladen werden.“** – siehe [Fehlerbehebung des Wortsuchrätsels](../spiele/fehlerbehebung-anwender.md); alle Spiele nutzen dieselben Dateien.
- **„nur N Vokabeln mit Bild“:** Weitere Niveaus auswählen oder einen Text-Fragetyp dazunehmen.
- **Ein Bild fehlt oder wird nicht angezeigt:** Pfad im Feld `image` und die Datei unter `public/images/vocabulary/` prüfen. Der Unit-Test `test/vocabulary.test.js` meldet fehlende Dateien.

← [Zurück zur Übersicht](../index.md)

# Vokabel-Memory

Im Memory findest du Paare aus einem Symbolbild und dem passenden Wort, z. B. das Bild eines Hundes und „dog“. Es spielen nur Vokabeln mit, für die es ein Symbolbild gibt (aktuell 189 Gegenstände, Lebewesen und anschauliche Begriffe aus A1 bis C1).

## Für Anwender

### Einstellungen

- **GER-Niveaus:** Wählbar sind nur Niveaus, für die es Bilder gibt; die übrigen sind ausgegraut („noch keine Bilder“). Neben jedem Niveau steht, wie viele Vokabeln mit Bild es hat.
- **Anzahl Paare:** 6, 8 (Standard), 10 oder 12 Paare, also 12 bis 24 Karten.
- **Sprache der Wortkarten:** Englisch (Standard) oder Deutsch.

Die Einstellungen bleiben im Browser gespeichert. Gibt es für die gewählten Niveaus zu wenige Vokabeln mit Bild, ist „Runde starten“ gesperrt und ein Hinweis nennt die Anzahl.

### Spielen

1. Alle Karten liegen verdeckt. Klicke oder tippe eine Karte an, um sie aufzudecken.
2. Decke eine zweite Karte auf. Gehören Bild und Wort zur selben Vokabel, ist das Paar gefunden: Beide Karten bleiben offen und werden grün, die Wortkarte zeigt zusätzlich die Übersetzung.
3. Passen die Karten nicht zusammen, werden sie rot markiert und bleiben offen, bis du die nächste Karte aufdeckst. So hast du Zeit, sie dir zu merken.
4. Jedes Aufdecken von zwei Karten zählt als ein Zug. Sind alle Paare gefunden, zeigt das Spiel die Anzahl der Züge.

„Neue Runde“ mischt neue Vokabeln mit denselben Einstellungen, „Einstellungen ändern“ führt zurück zur Auswahl.

Mit der Tastatur wechselst du per Tab zwischen den Karten und deckst sie mit Enter oder Leertaste auf.

## Technik

- Seite: `games/memory/index.html`, Oberfläche `src/memory/main.js`, Spiellogik ohne DOM in `src/memory/game.js`.
- Die Vokabeln werden wie beim Wortsuchrätsel aus `public/data/vocabulary/<niveau>.json` geladen (`src/shared/vocabulary.js`). Verwendet werden nur Einträge mit dem Feld `image` (siehe [Datenmodell](../spiele/datenmodell.md)).
- **Rundenauswahl (`createRound`):** Die Vokabeln der gewählten Niveaus werden gemischt; übernommen werden nur Vokabeln, deren Bild, englischer und deutscher Text in der Runde noch nicht vorkommen, damit jede Karte genau ein Gegenstück hat. Je Vokabel entstehen eine Bild- und eine Textkarte, danach wird der Stapel gemischt.
- **Aufdecken (`flipCard`):** Ergebnis `first`, `match`, `mismatch` oder `ignored` (Karte schon offen oder gefunden). Nach `mismatch` bleiben beide Karten offen, bis die nächste Karte aufgedeckt wird; es gibt keine Zeitsteuerung.
- Bilder werden als `<img>` angezeigt und beim Rundenstart vorgeladen. Verdeckte Karten enthalten kein Bild.
- Einstellungen liegen in `localStorage` unter `mini-games.memory.settings`. Mit `?seed=<Zahl>` in der Adresse ist die Runde reproduzierbar (für Tests).

## Fehlerbehebung

- **„Die Vokabeldatei für A1 konnte nicht geladen werden.“** – siehe [Fehlerbehebung des Wortsuchrätsels](../spiele/fehlerbehebung-anwender.md); beide Spiele nutzen dieselben Dateien.
- **Ein Bild fehlt oder wird nicht angezeigt:** Pfad im Feld `image` und die Datei unter `public/images/vocabulary/` prüfen. Der Unit-Test `test/vocabulary.test.js` meldet fehlende Dateien.

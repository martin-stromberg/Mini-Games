← [Zurück zur Übersicht](../index.md)

# Buchstabensalat

Die Buchstaben eines englischen Wortes liegen durcheinander als Kacheln vor dir. Lege sie in der richtigen Reihenfolge — die deutsche Übersetzung (und manchmal ein Symbolbild) hilft dabei.

## Für Anwender

### Einstellungen

- **GER-Niveaus:** Beliebige Mehrfachauswahl von A1 bis C2; neben jedem Niveau steht die Zahl der spielbaren Wörter.
- **Wörter pro Runde:** 5, 10 (Standard) oder 15 Wörter.
- **Wortlänge:** „kurz" (2–5 Buchstaben), „mittel" (6–9 Buchstaben) und „lang" (ab 10 Buchstaben), frei kombinierbar.

Die Einstellungen bleiben im Browser gespeichert. Reicht der Wortvorrat der Auswahl nicht für die gewünschte Runde, ist „Runde starten" gesperrt und ein Hinweis nennt die verfügbare Anzahl.

### Spielen

1. Zur deutschen Übersetzung (und ggf. zum Symbolbild) erscheinen die gemischten Buchstaben als Kacheln und darüber leere Felder für die Lösung.
2. Buchstaben setzen: Kachel anklicken/antippen oder den Buchstaben auf der Tastatur tippen — er landet im ersten freien Feld.
3. Buchstaben zurücknehmen: gesetzten Buchstaben anklicken, Rücktaste drücken (entfernt den letzten) oder „Zurücksetzen" für alle nicht aufgedeckten.
4. Ist das Wort vollständig, wird es sofort geprüft: richtig → das nächste Wort erscheint mit der Bestätigung „Richtig!"; falsch → die falschen Positionen werden rot markiert und du versuchst es erneut.
5. „Buchstaben aufdecken" setzt den nächsten richtigen Buchstaben fest (grün, nicht mehr entfernbar) und zählt als genutzte Hilfe.
6. „Überspringen" geht ohne Wertung zum nächsten Wort.

Am Ende zeigt die Auswertung, wie viele Wörter richtig gelegt wurden, wie viele Hilfen genutzt wurden und welche Wörter übersprungen wurden — inklusive aller Lösungen.

## Technik

- Seite: `games/buchstabensalat/index.html`, Oberfläche `src/buchstabensalat/main.js`, Spiellogik ohne DOM in `src/buchstabensalat/game.js`.
- Die Vokabeln werden wie in den anderen Spielen aus `public/data/vocabulary/<niveau>.json` geladen (`src/shared/vocabulary.js`). Mit `?seed=<Zahl>` in der Adresse ist eine Runde reproduzierbar (für Tests).
- **Wortauswahl (`scrambleWords`):** Verben werden ohne das führende „to" verwendet. Spielbar sind nur Wörter aus a–z mit mindestens zwei Buchstaben und mindestens zwei verschiedenen Buchstaben; Wortgruppen mit Leerzeichen oder Bindestrich (z. B. „train station") kommen nicht in den Pool. Pro Runde nur Wörter mit paarweise verschiedenen deutschen Übersetzungen.
- **Mischung:** Die Kacheln werden per Zufall gemischt; entspräche die Mischung dem Original, werden zwei Positionen mit unterschiedlichen Buchstaben getauscht — die Anzeige weicht also garantiert von der Lösung ab.
- **Züge:** `placeLetter`/`typeLetter` belegen den ersten freien Slot; `revealLetter` fixiert den linksten offenen Slot mit dem korrekten Buchstaben (aus dem Pool oder verschoben aus einem späteren Slot); `skipWord` markiert das Wort als übersprungen. Die Prüfung vergleicht das Buchstabenmuster mit der Lösung — bei doppelten Buchstaben zählt jede gültige Reihenfolge.
- Einstellungen liegen in `localStorage` unter `mini-games.buchstabensalat.settings`.

## Fehlerbehebung

- **„Die Vokabeldatei für A1 konnte nicht geladen werden."** – siehe [Fehlerbehebung des Wortsuchrätsels](../spiele/fehlerbehebung-anwender.md); alle Spiele nutzen dieselben Dateien.
- **„Für die Auswahl gibt es nur N Wörter":** Weitere Niveaus oder Wortlängen auswählen oder die Wortanzahl verringern.
- **Ein Bild fehlt oder wird nicht angezeigt:** Pfad im Feld `image` und die Datei unter `public/images/vocabulary/` prüfen. Der Unit-Test `test/vocabulary.test.js` meldet fehlende Dateien.

← [Zurück zur Übersicht](../index.md)

# Wort raten

Ein englisches Wort wird Buchstabe für Buchstabe erraten — das Galgenmännchen-Prinzip in kindgerechter Form: Statt eines Galgens verliert eine Blume bei jedem Fehlversuch ein Blütenblatt. Sind alle Blätter gefallen, bevor das Wort gelöst ist, gilt das Wort als verloren.

## Für Anwender

### Einstellungen

- **GER-Niveaus:** Beliebige Mehrfachauswahl von A1 bis C2; neben jedem Niveau steht die Zahl der spielbaren Wörter.
- **Wortlänge:** „kurz" (2–5 Buchstaben), „mittel" (6–9 Buchstaben) und „lang" (ab 10 Buchstaben), frei kombinierbar; gezählt werden nur die ratbaren Buchstaben, nicht Leerzeichen und Bindestriche.
- **Schwierigkeit:** 6 (schwer), 8 (mittel, Standard) oder 10 (leicht) erlaubte Fehlversuche — so viele Blütenblätter hat die Blume.

Die Einstellungen bleiben im Browser gespeichert. Gibt es für die Auswahl keine Wörter, ist „Spiel starten" gesperrt und ein Hinweis nennt den Grund.

### Spielen

1. Für das gesuchte Wort erscheinen Platzhalter — ein Strich je Buchstabe. Leerzeichen und Bindestriche (z. B. in „train station" oder „mother-in-law") stehen von Anfang an offen.
2. Über „Hinweis anzeigen" lässt sich die deutsche Übersetzung zuschalten; hat das Wort ein Symbolbild, erscheint es ebenfalls als zusätzlicher Hinweis.
3. Buchstaben raten: Taste A–Z auf der Bildschirmtastatur anklicken/antippen oder den Buchstaben auf der physischen Tastatur drücken. Groß-/Kleinschreibung spielt keine Rolle; bereits versuchte Buchstaben sind deaktiviert und grün (im Wort) oder rot (nicht im Wort) markiert.
4. Ein richtiger Buchstabe wird an allen Positionen aufgedeckt — auch mehrfach. Ein Fehlversuch lässt ein Blütenblatt fallen und wird unter der Blume gezählt.
5. Gewonnen: Alle Buchstaben sind aufgedeckt, bevor das Blütenblatt-Limit erreicht ist. Das Spiel zeigt Wort, deutsche Übersetzung und Beispielsatz. Verloren: Die Blume hat alle Blätter verloren; die Lösung wird angezeigt.
6. „Nächstes Wort" startet das nächste Wort mit denselben Einstellungen; der Zähler „Gewonnen/Verloren" läuft über die ganze Sitzung. Bereits gespielte Wörter kommen nicht erneut, bevor nicht der ganze Pool durch ist.

## Technik

- Seite: `games/wort-raten/index.html`, Oberfläche `src/wort-raten/main.js`, Spiellogik ohne DOM in `src/wort-raten/game.js`.
- Die Vokabeln werden wie in den anderen Spielen aus `public/data/vocabulary/<niveau>.json` geladen (`src/shared/vocabulary.js`). Mit `?seed=<Zahl>` in der Adresse ist die Wortfolge reproduzierbar (für Tests).
- **Wortauswahl (`guessingWords`):** Verben werden ohne das führende „to" verwendet. Spielbar sind Wörter und Wortgruppen aus a–z mit Leerzeichen und Bindestrichen dazwischen, jeweils mindestens zwei Buchstaben; dedupliziert wird nach der normalisierten Lösung.
- **Züge:** `guess` normalisiert auf Kleinbuchstaben, ignoriert Nicht-Buchstaben und wiederholte Versuche (`repeat`) und liefert `hit`, `miss`, `won` oder `lost`. `revealed` blendet Leerzeichen und Bindestriche direkt ein.
- **Darstellung ohne Gewaltbezug:** Die Fehlversuchsanzeige ist eine SVG-Blume mit einem Blütenblatt je erlaubtem Fehlversuch; verlorene Blätter liegen abgeblüht am Boden.
- Einstellungen liegen in `localStorage` unter `mini-games.wort-raten.settings`.

## Fehlerbehebung

- **„Die Vokabeldatei für A1 konnte nicht geladen werden."** – siehe [Fehlerbehebung des Wortsuchrätsels](../spiele/fehlerbehebung-anwender.md); alle Spiele nutzen dieselben Dateien.
- **„Für die Auswahl gibt es keine Wörter":** Weitere Niveaus oder Wortlängen auswählen.
- **Ein Bild fehlt oder wird nicht angezeigt:** Pfad im Feld `image` und die Datei unter `public/images/vocabulary/` prüfen. Der Unit-Test `test/vocabulary.test.js` meldet fehlende Dateien.

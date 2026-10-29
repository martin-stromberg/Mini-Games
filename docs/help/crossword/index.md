← [Zurück zur Übersicht](../index.md)

# Kreuzworträtsel

Ein automatisch erzeugtes Kreuzworträtsel für englische Vokabeln. Die deutschen Übersetzungen stehen als nummerierte Hinweise in den Listen „Waagerecht“ und „Senkrecht“; ins Gitter werden die englischen Wörter eingetragen.

## Für Anwender

### Einstellungen

- **GER-Niveaus:** Beliebige Mehrfachauswahl von A1 bis C2; neben jedem Niveau steht die Zahl der geeigneten Einzelwörter.
- **Wörter pro Runde:** 8, 12 oder 15 Wörter; 12 ist voreingestellt.

Die Einstellungen bleiben im Browser gespeichert. Reicht der Wortvorrat der gewählten Niveaus nicht, ist „Runde starten“ gesperrt und ein Hinweis nennt die fehlende Anzahl.

### Spielen

1. Ein Hinweis in „Waagerecht“ oder „Senkrecht“ wählt das zugehörige Wort aus. Alternativ kann ein Feld direkt angeklickt oder angetippt werden.
2. Das aktive Wort ist violett, das aktive Feld deutlich umrandet. Ein erneuter Klick auf dasselbe Feld wechselt zwischen waagerechtem und senkrechtem Wort, falls beide dort beginnen oder es kreuzen.
3. Buchstaben werden per Tastatur eingetragen. Auf Touch-Geräten öffnet ein Feld die Bildschirmtastatur; das aktive Feld wird beim Fokussieren in den sichtbaren Bereich gerückt.
4. Die Pfeiltasten bewegen zum benachbarten Feld, Home/Ende springen an Wortanfang oder Wortende. Backspace löscht den aktuellen Buchstaben oder geht ein Feld zurück und löscht dort.
5. „Prüfen“ markiert falsch gefüllte Felder rot und nennt außerdem die Zahl noch leerer Felder. Bereits gefundene, vollständige Wörter sind in der Hinweisliste grün markiert.
6. „Wort aufdecken“ trägt das aktive Wort als Hilfe vollständig ein. Das Rätsel ist gelöst, sobald alle Buchstaben richtig stehen.

## Technik

- Seite: `games/crossword/index.html`, Oberfläche `src/crossword/main.js`, Spiellogik ohne DOM in `src/crossword/game.js`.
- Die Vokabeln werden wie in den anderen Spielen aus `public/data/vocabulary/<niveau>.json` geladen (`src/shared/vocabulary.js`). Mit `?seed=<Zahl>` ist eine Runde reproduzierbar (`src/shared/random.js`).
- Die Wortauswahl nutzt die Normalisierung des Wortsuchrätsels: Verben ohne „to“, nur durchgehende Einzelwörter aus A–Z, dedupliziert nach dem englischen Lösungswort. Hinweise werden außerdem nur mit eindeutigen deutschen Übersetzungen gewählt.
- Der Generator platziert zuerst ein langes Wort und danach jeweils eine der besten legalen Verkreuzungen. Überlagerungen sind nur mit gleichem Buchstaben in der Gegenrichtung erlaubt; Wortenden bleiben frei und nicht kreuzende Felder dürfen nicht seitlich aneinander liegen. Kandidaten mit vielen Kreuzungen und kleiner Bounding Box werden bevorzugt, Gitter sind höchstens 18×18 groß.
- `validatePuzzle` prüft für Unit-Tests, dass alle Wörter korrekt liegen, jede zusammenhängende Buchstabenfolge genau einem eingetragenen Wort entspricht, keine unerlaubten Berührungen existieren und alle Felder zusammenhängen.
- Einstellungen liegen in `localStorage` unter `mini-games.crossword.settings`.

## Fehlerbehebung

- **„Die Vokabeldatei für A1 konnte nicht geladen werden."** – siehe [Fehlerbehebung des Wortsuchrätsels](../spiele/fehlerbehebung-anwender.md); alle Spiele nutzen dieselben Dateien.
- **„Für die Auswahl gibt es nur … Wörter":** Weitere GER-Niveaus auswählen oder eine kleinere Wortzahl wählen.
- **Ein Feld lässt sich nicht beschreiben:** Das Rätsel ist bereits gelöst oder ein anderes Feld ist aktiv. Gewünschtes Feld erneut anklicken.

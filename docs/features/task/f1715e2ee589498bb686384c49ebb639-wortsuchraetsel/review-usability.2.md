# Usability-Review

## Ergebnis

**Status:** Befunde vorhanden

Hinweis zum Basisbranch: Der Branch wurde laut Reflog von `origin/staging` abgezweigt. Der Diff gegenüber dem Merge-Base enthält nur Dokumente. Die Umsetzung liegt noch nicht committet im Arbeitsverzeichnis. Geprüft wurden daher die unversionierten bzw. geänderten Dateien laut `git status`. Die Liste passt zur Anforderung; ein zu breiter Diff liegt nicht vor.

Stand gegenüber `review-usability.1.md`: Alle drei früheren Befunde sind behoben.
- Gespeicherte Markierungen sind jetzt dauerhaft im Gitter eingefärbt (`marked`, Überlappungen schraffiert). Nach „Lösen“ werden sie nach korrekt, unvollständig und fehlerhaft unterschiedlich eingefärbt.
- Beim Ziehen zeigt eine Live-Vorschau (`pointermove`, Klasse `preview`) den geraden Pfad. Ist der Pfad ungültig, wird nur das Startfeld hervorgehoben.
- Die Begriffe sind jetzt verständlich: „Markierung 1–10“, „Auswahl verwerfen“, „Neu ziehen“. Über dem Gitter steht eine Bedienungsanleitung.

Dass Ziehen bei offener Klick-Auswahl gesperrt ist und dass es den Button „Markierung übernehmen“ gibt, ist laut Auftrag eine Planvorgabe. Beides wird nicht als Befund gewertet. Die Sperre wird mit einer klaren Meldung erklärt.

## Befunde

### src/word-search/main.js (Spielseite, Kopfbereich „Neue Runde“)

- **Erreichbarkeit** — Nach der ersten Runde kommt man in der Oberfläche nicht mehr zur Auswahl der Niveaus und der Schwierigkeit zurück. „Neue Runde“ ruft `startRound(state.round.difficulty)` direkt auf. Die neue Runde startet also mit denselben Niveaus und derselben Stufe, ohne dass die Einstellungsseite noch einmal erscheint. Betroffen sind die Interaktionen „Vor Spielbeginn mehrere Niveaus auswählen“ und „Spielstufe Einfach/Schwierig wählen“: Die Anforderung verlangt diese Auswahl vor Rundenbeginn. Eine Spielerin, die nach einer Runde „Einfach“ jetzt „Schwierig“ spielen oder nur noch B2–C2 üben möchte, findet dafür keinen Button. Es bleibt nur, die Seite neu zu laden oder über „← Mini-Games“ zurückzugehen und das Spiel neu zu öffnen. Darauf kommt eine Laiin nicht ohne Weiteres.

  Empfehlung: Im Kopfbereich neben „Neue Runde“ einen Button „Einstellungen ändern“ (oder „Niveau & Schwierigkeit“) anbieten, der `renderSetup()` aufruft. Die Einstellungsseite soll dabei die aktuellen Niveaus (bereits über `state.selectedLevels` vorhanden) und die zuletzt gewählte Schwierigkeit vorausgewählt zeigen. Die zuletzt gewählte Schwierigkeit ist dazu im Zustand zu merken und beim Rendern des Radiobuttons als `checked` zu setzen. Alternativ kann „Neue Runde“ selbst zur Einstellungsseite führen.

## Geprüfte Interaktionen

- Startseite öffnen und Spiel aufrufen → unauffällig (klar beschrifteter Link „Englisches Wortsuchrätsel“, Rücklink „← Mini-Games“)
- Mehrere GER-Niveaus auswählen, anfangs alle ausgewählt → für die erste Runde unauffällig (Checkboxen A1–C2, Anzeige der verfügbaren Wortzahl, „Runde starten“ bei weniger als 10 Wörtern mit Begründung gesperrt). Für Folgerunden Befund vorhanden (Auswahl nicht mehr erreichbar)
- Levelauswahl beim erneuten Besuch wiederherstellen → unauffällig (geschieht ohne Benutzeraktion)
- Schwierigkeit Einfach/Schwierig wählen → für die erste Runde unauffällig (Radiobuttons mit Erklärung „waagerecht und senkrecht“ / „zusätzlich diagonal“). Für Folgerunden Befund vorhanden (siehe oben)
- Runde starten / neue Runde → unauffällig, abgesehen vom obigen Befund
- Deutsche Übersetzungen neben dem Gitter lesen → unauffällig
- Felder einzeln anklicken und speichern → unauffällig (Anleitung über dem Gitter, Anzeige „Noch nicht übernommen: n Felder“, Tastaturbedienung mit Pfeiltasten und Leertaste)
- Zusammenhängend markieren durch Drücken, Ziehen und Loslassen → unauffällig (Live-Vorschau, dauerhafte Einfärbung, verständliche Meldung bei nicht geraden Linien)
- Keine Rückmeldung zur Gültigkeit während des Markierens → unauffällig (Vorschau und Markierungsfarbe sind vor „Lösen“ neutral)
- Markierungen ändern, neu ziehen, entfernen → unauffällig
- „Lösen“ betätigen und Ergebnis erkennen → unauffällig (Einfärbung im Gitter, Status je Markierung, Zusammenfassung „x von 10“, nicht gefundene Übersetzungen hervorgehoben)
- „Tipp“ betätigen → unauffällig (Feld eingekreist und Meldung; das fehlerhafte Feld liegt jetzt sichtbar in einer markierten Zelle)

## Geprüfte Dateien

- `index.html`
- `games/word-search/index.html`
- `src/word-search/main.js`
- `src/styles.css`

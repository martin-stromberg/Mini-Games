# Usability-Review

## Ergebnis

**Status:** Keine Befunde

Hinweis zum Basisbranch: Die Umsetzung liegt noch nicht committet im Arbeitsverzeichnis. Der Diff gegenüber dem Merge-Base enthält daher nur Dokumente. Geprüft wurden die laut `git status` unversionierten bzw. geänderten UI-Dateien. Diese Liste passt zur Anforderung; ein zu breiter Diff liegt nicht vor.

Stand gegenüber `review-usability.2.md`: Der damalige Befund ist behoben. Im Kopfbereich der Spielseite steht jetzt neben „Neue Runde“ der Button „Einstellungen ändern“. Er führt zurück zur Einstellungsseite (`openSettings()` → `renderSetup()`). Dort sind die aktuellen Niveaus und die zuletzt gewählte Schwierigkeit (`state.difficulty`, Radiobutton `checked`) vorausgewählt. Damit lassen sich Niveaus und Stufe auch vor Folgerunden über die Oberfläche wählen.

Laut Auftrag sind zwei Punkte Planvorgaben und werden nicht als Befund gewertet: Ziehen ist bei offener Klick-Auswahl gesperrt, und es gibt den Button „Markierung übernehmen“. Die Sperre wird mit einer verständlichen Meldung erklärt („Übernimm oder verwirf zuerst deine offene Auswahl, bevor du ziehst.“).

## Befunde

Keine.

## Geprüfte Interaktionen

- Startseite öffnen und Spiel aufrufen → unauffällig (Link „Englisches Wortsuchrätsel“, Rücklink „← Mini-Games“)
- Mehrere GER-Niveaus vor Spielbeginn auswählen, anfangs alle ausgewählt → unauffällig (Checkboxen A1–C2, Anzeige der verfügbaren Wortzahl, Start bei weniger als 10 Wörtern mit Begründung gesperrt; über „Einstellungen ändern“ auch vor Folgerunden erreichbar)
- Levelauswahl beim erneuten Besuch wiederherstellen → unauffällig (läuft ohne Benutzeraktion)
- Schwierigkeit Einfach/Schwierig wählen → unauffällig (Radiobuttons mit Erklärung „waagerecht und senkrecht“ / „zusätzlich diagonal“; letzte Wahl bleibt vorausgewählt)
- Runde starten / neue Runde → unauffällig („Runde starten“, „Neue Runde“ mit gleichen Einstellungen, „Einstellungen ändern“)
- Deutsche Übersetzungen neben dem Gitter lesen → unauffällig („Gesuchte Übersetzungen“ mit Niveau-Angabe)
- Felder einzeln anklicken → unauffällig (Anleitung über dem Gitter, Anzeige „Noch nicht übernommen: n Felder“, Tastaturbedienung mit Pfeiltasten und Leertaste)
- Zusammenhängend markieren durch Drücken, Ziehen und Loslassen → unauffällig (Live-Vorschau, dauerhafte Einfärbung, `touch-action: none` für Touch, verständliche Meldung bei nicht geraden Linien)
- Keine Rückmeldung zur Gültigkeit während des Markierens → unauffällig (Vorschau und Markierungsfarbe bleiben bis „Lösen“ neutral)
- Markierungen ändern, neu ziehen, entfernen → unauffällig (klar beschriftete Buttons je „Markierung 1–10“)
- „Lösen“ betätigen und Ergebnis erkennen → unauffällig (Einfärbung im Gitter, Status je Markierung, Zusammenfassung „x von 10“, nicht gefundene Übersetzungen hervorgehoben)
- „Tipp“ betätigen → unauffällig (Feld eingekreist, erklärende Meldung, Fall „kein weiterer Feldhinweis“ wird benannt)

## Geprüfte Dateien

- `index.html`
- `games/word-search/index.html`
- `src/word-search/main.js`
- `src/styles.css`

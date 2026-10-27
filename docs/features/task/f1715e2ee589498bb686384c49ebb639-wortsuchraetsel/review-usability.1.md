# Usability-Review

## Ergebnis

**Status:** Befunde vorhanden

Hinweis zum Basisbranch: Der Branch wurde laut Reflog von `origin/staging` abgezweigt. Die Umsetzung liegt noch nicht committet im Arbeitsverzeichnis vor (alle Dateien unversioniert). Geprüft wurden daher die unversionierten bzw. geänderten Dateien laut `git status`. Die Liste passt zur Anforderung; ein zu breiter Diff liegt nicht vor.

## Befunde

### src/word-search/main.js (Spielseite, Gitter und Markierungen)

- **Erreichbarkeit** — Übernommene Markierungen sind im Gitter nicht zu sehen. `cellClass()` hebt nur Felder des offenen Klick-Entwurfs (`draft`) und das Tipp-Feld hervor, aber keine Felder in `slots`. Das betrifft die Interaktionen „Wort per Ziehen markieren“, „Klick-Markierung übernehmen“ und „Lösen“. Eine Spielerin zieht über ein Wort, lässt los, und das Gitter sieht danach genauso aus wie vorher. Rechts steht nur „Slot 1: 5 Felder markiert“. Sie kann nicht erkennen, welche Wörter sie schon markiert hat, kann versehentlich dasselbe Wort doppelt markieren und kann nach „Lösen“ im Gitter nicht sehen, welche Markierung als „korrekt“ oder „fehlerhaft“ gewertet wurde. Auch der Tipp „Ein falsch markiertes Feld ist eingekreist“ hilft wenig: Das eingekreiste Feld gehört zu keiner sichtbaren Markierung. Sie muss die Slots einzeln über „Ändern“ öffnen, um die betroffene Markierung zu finden. Für ein Wortsuchrätsel ist das nicht zumutbar, denn das sichtbare Markieren gefundener Wörter ist hier der Kern der Bedienung.

  Empfehlung: Alle Felder in belegten Slots dauerhaft im Gitter einfärben, z. B. mit einer eigenen Klasse `marked` und am besten einer eigenen Farbe oder Umrandung je Slot, damit sich überlappende Wörter unterscheiden lassen. Die Farbe dieser Markierung darf vor „Lösen“ nichts über richtig oder falsch verraten. Nach „Lösen“ können korrekte und fehlerhafte Slots im Gitter unterschiedlich dargestellt werden. Fährt man mit der Maus über einen Slot in der Liste rechts, könnten zusätzlich dessen Felder im Gitter hervorgehoben werden.

- **Erreichbarkeit** — Beim Ziehen gibt es keine sichtbare Rückmeldung. Es werden nur `pointerdown` und `pointerup` ausgewertet, `pointermove` nicht. Während die Maustaste gedrückt ist und die Spielerin über Felder fährt, wird kein Feld hervorgehoben. Sie sieht erst nach dem Loslassen (und wegen Befund 1 auch dann nicht) über welche Felder die Auswahl ging. Die Anforderung beschreibt ausdrücklich „auf einem Feld drücken, über weitere Felder ziehen und am Zielfeld loslassen“. Ohne Live-Anzeige ist nicht nachvollziehbar, ob Start- und Zielfeld richtig getroffen wurden, gerade im 13 × 13-Gitter mit kleinen Zellen.

  Empfehlung: Bei `pointermove` den aktuellen geraden Pfad (`straightPath(start, aktuellesFeld, difficulty)`) als vorläufige Auswahl einfärben. Ist der Pfad ungültig (z. B. diagonal in „Einfach“), soll das neutral erkennbar sein, etwa durch Hervorheben nur des Startfelds. Diese Anzeige darf nichts darüber verraten, ob die Auswahl ein gesuchtes Wort ist.

- **Abweichendes Muster** — Beim Markieren per Klick muss die Spielerin nach jedem Wort selbst „Markierung übernehmen“ drücken. Die Bedienung nutzt dabei technische Begriffe, die sie nicht kennen kann („Slot 1–10“, „Entwurf abbrechen“, „Per Drag ersetzen“, „Klick-Markierung“, „Drag-Markierung“). Das betrifft die Interaktion „Felder einzeln anklicken“. Wer per Klick das erste Wort markiert und gleich danach die Buchstaben des zweiten Wortes anklickt, landet mit beiden Wörtern in derselben Auswahl. Nach „Lösen“ ist diese dann „fehlerhaft“. Außerdem lehnt das Spiel ein Ziehen ab, solange noch ein Klick-Entwurf offen ist („Übernimm oder brich zuerst den offenen Klick-Entwurf ab“), und bei „Per Drag ersetzen“ werden Klicks ins Gitter nicht angenommen. Die Spielerin muss also ein internes Bedienmodell aus Entwurf und Slots verstehen, das in der Anforderung nicht vorkommt und von bekannten Wortsuchspielen abweicht.

  Empfehlung: Verständliche Begriffe verwenden, z. B. „Wort 1“ oder „Markierung 1“ statt „Slot 1“, „Auswahl als Wort speichern“ statt „Markierung übernehmen“, „Auswahl verwerfen“ statt „Entwurf abbrechen“ und „Neu ziehen“ statt „Per Drag ersetzen“. Über dem Gitter einen kurzen Hinweis anzeigen, z. B. „Klicke die Buchstaben eines Wortes an und speichere sie, oder ziehe mit der Maus über das Wort.“ Zu überlegen wäre auch, eine offene Klick-Auswahl automatisch zu speichern, sobald die Spielerin zu ziehen beginnt, statt das Ziehen abzulehnen.

## Geprüfte Interaktionen

- Startseite öffnen und Spiel aufrufen → unauffällig (klar beschrifteter Link „Englisches Wortsuchrätsel“, Rücklink „← Mini-Games“)
- Mehrere GER-Niveaus auswählen, anfangs alle ausgewählt → unauffällig (Checkboxen A1–C2 mit Klartext, Wortzahl wird angezeigt, Start wird bei weniger als 10 Wörtern mit Begründung gesperrt)
- Levelauswahl beim erneuten Besuch wiederherstellen → unauffällig (ohne Benutzeraktion)
- Schwierigkeit Einfach/Schwierig wählen → unauffällig (Radiobuttons mit erklärendem Text „waagerecht und senkrecht“ / „zusätzlich diagonal“)
- Runde starten / neue Runde → unauffällig
- Deutsche Übersetzungen neben dem Gitter lesen → unauffällig
- Felder einzeln anklicken → Befund vorhanden (Pflicht zum Übernehmen, Fachbegriffe)
- Zusammenhängend markieren durch Drücken, Ziehen und Loslassen → Befund vorhanden (keine Anzeige während des Ziehens, keine dauerhafte Anzeige danach)
- Keine Rückmeldung zur Gültigkeit während des Markierens → unauffällig
- „Lösen“ betätigen und Ergebnis erkennen → Befund vorhanden (Ergebnis nur als Text in der Slot-Liste, nicht im Gitter erkennbar; nicht gefundene Übersetzungen werden wie gefordert hervorgehoben)
- „Tipp“ betätigen → Befund vorhanden (das eingekreiste fehlerhafte Feld lässt sich keiner sichtbaren Markierung zuordnen, siehe Befund 1)

## Geprüfte Dateien

- `index.html`
- `games/word-search/index.html`
- `src/word-search/main.js`
- `src/styles.css`
- `public/data/vocabulary.json` (nur Aufbau, für die angezeigten Texte)

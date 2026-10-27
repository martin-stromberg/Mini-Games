# Anforderungsstruktur: Wortsuchrätsel

## Ziel

Im öffentlichen Repository soll eine GitHub-Pages-Seite entstehen, die schrittweise eine Sammlung kleiner Spiele aufnehmen kann. Das erste Spiel ist ein Wortsuchrätsel zum Üben englischer Vokabeln. GitHub Pages darf für die Veröffentlichung verwendet werden.

## Funktionsumfang

1. **Vokabeldaten und Level**
   - Englische Begriffe und ihre deutschen Übersetzungen werden in einer lokal im Repository gepflegten JSON-Datei bereitgestellt.
   - Jeder Vokabeleintrag ist einem GER-Sprachniveau von A1 bis C2 zugeordnet.
   - Vor Spielbeginn können Spielende mehrere Niveaus auswählen. Zu Beginn sind alle Niveaus ausgewählt.
   - Die Levelauswahl wird in `localStorage` gespeichert und bei späteren Besuchen wiederhergestellt.
   - Eine Spielrunde wählt zufällig zehn Wörter aus den Vokabeln der ausgewählten Niveaus aus.

2. **Rätselgitter und Schwierigkeitsstufen**
   - Das Spielfeld ist ein Quadrat mit 13 × 13 Feldern und genau einem Buchstaben je Feld.
   - Die ausgewählten englischen Wörter werden im Gitter versteckt.
   - Die Stufe **Einfach** platziert Wörter horizontal oder vertikal.
   - Die Stufe **Schwierig** erlaubt zusätzlich diagonale Platzierungen.
   - Nicht von Wörtern belegte Zellen werden mit zufälligen Buchstaben aufgefüllt.

3. **Übersetzungsliste**
   - Neben dem Gitter werden die deutschen Übersetzungen der zehn gesuchten englischen Wörter angezeigt.
   - Die Liste entspricht den Wörtern der aktuellen Runde.
   - Nach dem Lösen werden noch nicht gefundene Übersetzungen hervorgehoben.

4. **Markieren, Prüfen und Hinweise**
   - Spielende können Buchstabenfelder markieren, um ein englisches Wort auszuwählen.
   - Einzelnes Anklicken wird unterstützt. Außerdem kann eine zusammenhängende Auswahl per Maus erfolgen: auf einem Feld drücken, über weitere Felder ziehen und am Zielfeld loslassen.
   - Eine markierte Auswahl muss genau die Buchstaben eines gesuchten Wortes bilden. Zusätzliche oder falsche Felder sind Fehler.
   - Während der Auswahl wird nicht angezeigt, ob die markierten Buchstaben ein gültiges Wort bilden.
   - Erst nach Betätigung eines „Lösen“-Buttons wird geprüft, welche Wörter vollständig markiert sind.
   - Der Tipp-Button kennzeichnet entweder ein falsch markiertes Feld oder, wenn keines falsch markiert ist, ein noch nicht ausgewähltes Feld eines korrekten Wortes durch Einkreisen. Gibt es kein falsch markiertes Feld und kein noch nicht ausgewähltes korrektes Feld, gibt der Tipp keinen weiteren Feldhinweis.

## Akzeptanzkriterien

- [ ] Das öffentliche Repository stellt die Seite über GitHub Pages bereit und ermöglicht, die Sammlung später um weitere kleine Spiele zu ergänzen.
- [ ] Das Wortsuchrätsel zeigt ein quadratisches Gitter mit 13 × 13 Feldern und einem Buchstaben je Feld.
- [ ] Der lokale JSON-Startbestand enthält englische Begriffe, deutsche Übersetzungen und eine GER-Kategorie von A1 bis C2 je Eintrag.
- [ ] Vor dem Start ist eine Mehrfachauswahl der GER-Niveaus möglich; initial sind A1, A2, B1, B2, C1 und C2 ausgewählt.
- [ ] Die Levelauswahl wird lokal in `localStorage` gespeichert und beim erneuten Laden wieder angewandt.
- [ ] Eine Runde wählt zufällig zehn Wörter aus den aktivierten Niveaus und zeigt die zugehörigen deutschen Übersetzungen an.
- [ ] Die Spielstufe kann zwischen Einfach und Schwierig gewählt werden. Einfach platziert horizontal und vertikal; Schwierig erlaubt zusätzlich diagonale Wörter.
- [ ] Nicht belegte Gitterzellen enthalten zufällige Buchstaben.
- [ ] Zellen können einzeln sowie zusammenhängend per Drücken, Ziehen und Loslassen markiert werden.
- [ ] Während des Markierens wird kein Hinweis angezeigt, ob die Auswahl ein gesuchtes Wort trifft.
- [ ] Nach „Lösen“ wird eine Auswahl nur dann als korrekt gewertet, wenn sie genau ein gesuchtes Wort bildet; zusätzliche oder falsche markierte Felder gelten als Fehler.
- [ ] Nach dem Lösen werden noch nicht gefundene Übersetzungen hervorgehoben.
- [ ] Der Tipp-Button kreist zuerst ein falsch markiertes Feld ein. Gibt es kein solches Feld, kreist er ein noch nicht ausgewähltes Feld eines korrekten Wortes ein.

## Interpretation und Festlegungen

- In der ursprünglichen Anforderung wurde „kal“ als **vertikal**, „mfälligen Buchstaben“ als **zufälligen Buchstaben**, „err“ als **er** (der Anwender) und „sol noch nicht gezeigt“ als **soll noch nicht gezeigt werden** interpretiert.
- Die ursprüngliche Angabe 13 × 13 war als Beispiel formuliert; sie ist gemäß der anschließenden Bestätigung als feste Größe übernommen.
- Die zunächst offene Zahl der Wörter ist auf zehn pro Runde festgelegt.
- Die Spielstufen heißen Einfach und Schwierig; die Auswahl vor Rundenbeginn ist Teil des Umfangs.
- Die Vokabeln starten aus einer lokalen JSON-Datei. Die Levelkategorien sind A1, A2, B1, B2, C1 und C2.
- Der Tipp wählt deterministisch: zuerst ein falsch markiertes Feld, andernfalls ein noch nicht ausgewähltes Feld aus einem korrekten Wort. Bei mehreren passenden Feldern kann eine stabile Reihenfolge verwendet werden.
- Die genaue Feedbackdarstellung außer der Hervorhebung nicht gefundener Übersetzungen ist nicht festgelegt.

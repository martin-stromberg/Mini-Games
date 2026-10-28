← [Zurück zur Übersicht](index.md)

# Wortsuchrätsel — Business Rules

## Rundenauswahl

**Beschreibung:** Eine Runde verwendet genau zehn verschiedene Wörter aus den aktivierten Niveaus.

**Bedingungen:**
- Der Pool umfasst nur Gitterwörter (siehe [Datenmodell](datenmodell.md)), deren Niveau ausgewählt ist.
- Die zehn Wörter einer Runde haben unterschiedliche deutsche Übersetzungen (ohne Groß-/Kleinschreibung), damit jede Übersetzung eindeutig zugeordnet werden kann.

**Verhalten:**
- Der Pool wird per Fisher-Yates-Mischung gemischt; der Reihe nach werden Wörter übernommen, deren Übersetzung noch nicht gewählt ist, bis zehn erreicht sind.
- Kommen keine zehn Wörter zusammen: Fehler mit Anzahl und Mindestbedarf. Es wird nie aus deaktivierten Niveaus ergänzt.

**Umsetzung:** `generateRound`, `shuffle` in `src/word-search/game.js`.

## Platzierung und Gitter

**Beschreibung:** Die Wörter werden so ins 13 × 13 Gitter gelegt, dass alle Buchstaben stimmen und sich nur gleiche Buchstaben überschneiden.

**Bedingungen:**
- Einfach: Richtungen waagerecht `(0,1)` und senkrecht `(1,0)`.
- Schwierig: zusätzlich diagonal `(1,1)` und `(1,-1)`.
- Ein Wort wird nur dort platziert, wo jede Zelle leer ist oder den passenden Buchstaben hat.

**Verhalten:**
- Wörter werden nach Länge absteigend platziert; die Position wird zufällig aus den zulässigen Kandidaten gewählt.
- Scheitert eine Platzierung, beginnt der Versuch neu. Nach 120 Versuchen endet der Generator mit einer Fehlermeldung. Es entsteht nie eine teilweise Runde.
- Leere Zellen erhalten zufällige Buchstaben A–Z.

**Umsetzung:** `tryPlaceWords`, `placementCandidates`, `MAX_GENERATION_ATTEMPTS` in `src/word-search/game.js`.

## Markierungsgrenzen

**Beschreibung:** Es werden höchstens zehn Markierungen gespeichert.

**Verhalten:**
- Ist kein Slot frei, wird eine neue Markierung nicht übernommen. Die Meldung fordert zum Ändern, Entfernen oder Verwerfen auf.
- Eine Markierung wird nie stillschweigend verworfen.
- Eine Zelle darf in mehreren Slots vorkommen. Jeder Slot wird separat bewertet.

**Umsetzung:** `storeSlot`, `commitDraft` in `src/word-search/main.js`.

## Ziehen

**Beschreibung:** Eine Ziehbewegung erzeugt genau eine Markierung, wenn der Weg eine gerade Linie ist.

**Bedingungen:**
- Die Linie muss waagerecht, senkrecht oder (nur bei Schwierig) diagonal sein.
- Während eines offenen Entwurfs ist Ziehen gesperrt.

**Verhalten:**
- Ungültige Richtung auf Einfach: keine Speicherung, neutraler Hinweis auf waagerecht und senkrecht.
- Gültige Linie: Speicherung im nächsten freien Slot oder im ersetzten Slot bei „Neu ziehen“.
- Das Loslassen erzeugt keinen zusätzlichen Klick.

**Umsetzung:** `straightPath`, `handleDrag`, `handlePointerUp` (mit `suppressClick`).

## Zuordnung der Übersetzung

**Beschreibung:** Zu jeder Markierung wählt der Spieler die passende deutsche Übersetzung.

**Verhalten:**
- Nach jedem Speichern einer Markierung (Übernehmen, Ziehen, Ändern, Neu ziehen) wird ihre bisherige Zuordnung gelöscht, und das Spiel wartet auf die Wahl einer Übersetzung (`awaitingAssignment`).
- Solange die Wahl aussteht, sind Zellklick, Ziehen, „Markierung übernehmen“, „Ändern“, „Neu ziehen“, „Tipp“ und „Lösen“ gesperrt. „Entfernen“ bleibt erlaubt und hebt die ausstehende Wahl auf.
- Ein Klick auf eine freie Übersetzung ordnet sie der wartenden Markierung zu. Die Übersetzung wird fett dargestellt und trägt die Nummer der Markierung.
- Eine Übersetzung, die schon einer anderen Markierung zugeordnet ist, kann nicht gewählt werden. Sie wird erst frei, wenn diese Markierung entfernt oder geändert wird.

**Umsetzung:** `storeSlot`, `assignTranslation`, `blockedByAssignment` in `src/word-search/main.js`.

## Prüfen mit „Lösen“

**Beschreibung:** Nur „Lösen“ bewertet die Markierungen.

**Verhalten:**
- Ein nicht leerer Entwurf wird zuerst übernommen. Danach muss der Spieler seine Übersetzung wählen und erneut „Lösen“ klicken.
- Steht keine Zuordnung aus, werden alle Slots mit ihrer zugeordneten Übersetzung klassifiziert (siehe unten).
- Ergebnis: Anzahl der verschiedenen gefundenen Zielwörter. Bei zehn ist die Runde gelöst.

**Umsetzung:** `solveRound`, `classifySlots` in `src/word-search/main.js` bzw. `src/word-search/game.js`.

## Klassifikation eines Slots

Die Auswertung erfolgt über die Zellmengen. Die Klick- oder Ziehreihenfolge spielt keine Rolle. Hat ein Slot eine zugeordnete Übersetzung, wird er nur gegen deren Zielwort geprüft.

| Klasse | Bedingung | Wirkung |
|--------|-----------|---------|
| `exact` | Zellmenge entspricht dem vollständigen Pfad des zugeordneten Zielworts | Zählt als Treffer. |
| `mismatch` | Zellmenge entspricht exakt einem anderen Zielwort als dem zugeordneten | Kein Treffer. Anzeige „Wort gefunden, aber falsche Übersetzung“. |
| `partial` | Zellmenge ist eine zusammenhängende Teilstrecke des zugeordneten Zielpfads, aber kürzer als der Pfad | Kein Treffer. Wird bei „Tipp“ berücksichtigt. |
| `error` | Weder exakt noch Teilstrecke | Kein Treffer. Zusätzliche Zellen werden als Fehler angezeigt. |

Weitere Regeln:
- Bei mehreren passenden Zielen wird das erste noch nicht gefundene in Rundenreihenfolge zugeordnet.
- Bei `error` gilt als richtig der längste zusammenhängende Pfadabschnitt über alle Zielpfade. Alle übrigen ausgewählten Zellen sind Extras. Die erste davon wird für den Tipp verwendet.

**Umsetzung:** `classifySlot`, `longestContiguousSegment`, `classifySlots` in `src/word-search/game.js`.

## Tipp

**Beschreibung:** Der Tipp kreist genau ein Feld ein, in fester Priorität.

**Verhalten (in dieser Reihenfolge):**
Die Priorität ist stabil: Slots nach Slotnummer, Zielwörter in Rundenreihenfolge, Zellen in Reihenfolge Zeile, dann Spalte. Ein Feld gilt als markiert, wenn es in irgendeinem Slot ausgewählt ist.

1. Gibt es Slots der Klasse `error`, wird im Slot mit der niedrigsten Nummer die erste Extrazelle eingekreist. Extrazellen sind die ausgewählten Zellen außerhalb des längsten zusammenhängenden Pfadabschnitts; bei Gleichstand zählt das frühere Zielwort, dann der frühere Abschnitt.
2. Sonst werden die `partial`-Slots nach Slotnummer geprüft und darin die Kandidatenpfade in Rundenreihenfolge. Eingekreist wird das erste Pfadfeld direkt vor oder hinter der markierten Teilstrecke, das in keinem Slot markiert ist. Ist beim ersten Kandidaten kein solches Feld frei, folgen die weiteren Kandidaten und danach die weiteren `partial`-Slots. Bei einer einzelnen Kreuzungszelle entscheidet so das frühere Zielwort.
3. Sonst, wenn ein Slot der Klasse `mismatch` existiert, wird das erste Feld (Zeile, dann Spalte) des Slots mit der niedrigsten Nummer eingekreist: „Die Markierung, die am eingekreisten Feld beginnt, gehört zu einer anderen Übersetzung.“
4. Sonst wird das erste unmarkierte Feld des ersten nicht gefundenen Zielworts eingekreist. Hat dieses Wort kein unmarkiertes Feld, folgt das nächste nicht gefundene Wort.
5. Sonst (zum Beispiel wenn alle zehn Wörter durch exakte Slots abgedeckt sind): „Für den aktuellen Stand gibt es keinen weiteren Feldhinweis.“

Bei offenem Entwurf oder ausstehender Übersetzungswahl ist der Tipp gesperrt. Der Tipp verändert weder Slots noch Entwurf noch Ergebnis.

**Umsetzung:** `getHint`, `missingNeighbour` in `src/word-search/game.js`; `showHint` in `src/word-search/main.js`.

## Ergebnisinvalidierung

**Verhalten:** Jede Änderung an Entwurf oder Slots (Klick, Übernahme, Ändern, Entfernen, Ziehen) verwirft das Ergebnis und den Tippkreis. Gespeicherte Slots bleiben erhalten. Die nächste Prüfung wertet den aktuellen Stand neu aus.

**Umsetzung:** `resetResult` in `src/word-search/main.js`.

← [Zurück zur Übersicht](index.md)

# Wortsuchrätsel — Business Rules

## Rundenauswahl

**Beschreibung:** Eine Runde verwendet genau zehn verschiedene Wörter aus den aktivierten Niveaus.

**Bedingungen:**
- Der Pool umfasst nur Einträge, deren Niveau ausgewählt ist.
- Der Pool muss mindestens zehn Einträge haben.

**Verhalten:**
- Wenn der Pool kleiner als zehn ist: Fehler mit Anzahl und Mindestbedarf. Es wird nie aus deaktivierten Niveaus ergänzt.
- Sonst: zehn Einträge werden per Fisher-Yates-Mischung zufällig ausgewählt.

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

## Prüfen mit „Lösen“

**Beschreibung:** Nur „Lösen“ bewertet die Markierungen.

**Verhalten:**
- Ein nicht leerer Entwurf wird zuerst übernommen. Gelingt das nicht, passiert nichts.
- Danach werden alle Slots klassifiziert (siehe unten).
- Ergebnis: Anzahl der verschiedenen gefundenen Zielwörter. Bei zehn ist die Runde gelöst.

**Umsetzung:** `solveRound`, `classifySlots` in `src/word-search/main.js` bzw. `src/word-search/game.js`.

## Klassifikation eines Slots

Die Auswertung erfolgt über die Zellmengen. Die Klick- oder Ziehreihenfolge spielt keine Rolle.

| Klasse | Bedingung | Wirkung |
|--------|-----------|---------|
| `exact` | Zellmenge entspricht dem vollständigen Pfad eines Zielworts | Zählt als Treffer. Ist das Ziel bereits gefunden, gilt der Slot als „korrekt, doppelt“, zählt aber nicht erneut. |
| `partial` | Zellmenge ist eine zusammenhängende Teilstrecke eines Zielpfads, aber kürzer als der Pfad | Kein Treffer. Wird bei „Tipp“ berücksichtigt. |
| `error` | Weder exakt noch Teilstrecke | Kein Treffer. Zusätzliche Zellen werden als Fehler angezeigt. |

Weitere Regeln:
- Bei mehreren passenden Zielen wird das erste noch nicht gefundene in Rundenreihenfolge zugeordnet.
- Bei `error` gilt als richtig der längste zusammenhängende Pfadabschnitt über alle Zielpfade. Alle übrigen ausgewählten Zellen sind Extras. Die erste davon wird für den Tipp verwendet.

**Umsetzung:** `classifySlot`, `longestContiguousSegment`, `classifySlots` in `src/word-search/game.js`.

## Tipp

**Beschreibung:** Der Tipp kreist genau ein Feld ein, in fester Priorität.

**Verhalten (in dieser Reihenfolge):**
1. Gibt es einen Slot der Klasse `error`, wird dessen erste Extrazelle eingekreist.
2. Sonst wird für einen `partial`-Slot ein Nachbarfeld des Pfads eingekreist, das in keinem Slot markiert ist.
3. Sonst wird das erste global unmarkierte Feld des ersten nicht gefundenen Zielworts eingekreist.
4. Sonst: „Für den aktuellen Stand gibt es keinen weiteren Feldhinweis.“

Bei offenem Entwurf ist der Tipp gesperrt. Der Tipp verändert weder Slots noch Entwurf noch Ergebnis.

**Umsetzung:** `getHint`, `missingNeighbour` in `src/word-search/game.js`; `showHint` in `src/word-search/main.js`.

## Ergebnisinvalidierung

**Verhalten:** Jede Änderung an Entwurf oder Slots (Klick, Übernahme, Ändern, Entfernen, Ziehen) verwirft das Ergebnis und den Tippkreis. Gespeicherte Slots bleiben erhalten. Die nächste Prüfung wertet den aktuellen Stand neu aus.

**Umsetzung:** `resetResult` in `src/word-search/main.js`.

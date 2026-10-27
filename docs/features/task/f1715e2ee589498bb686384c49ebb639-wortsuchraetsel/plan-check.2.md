# Planprüfung – Wortsuchrätsel, zweite Prüfung

**Status: Plan lückenhaft**

Prüfdatum: 2026-10-27  
Geprüft: `requirement.md`, `inventory.md`, aktualisierte `plan.md` und die fünf Befunde aus `plan-check.1.md`. Aktueller Branch: `task/f1715e2ee589498bb686384c49ebb639-wortsuchraetsel`. Es wurden keine Implementierung oder Tests ausgeführt und keine anderen Dateien geändert.

## Ergebnis und Stand der bisherigen Befunde

Der überarbeitete Plan schließt einen erheblichen Teil der ersten Prüfbefunde. Insbesondere sind zehn separate Markierungen, ein expliziter Übernehmen-Schritt für Klickfolgen, eigene Drag-Markierungen, Ändern/Entfernen, Ergebnisinvalidierung, Mindestbestände für A1–C2 und Tests des echten Generators jetzt vorgesehen. Vier verbleibende Widersprüche beziehungsweise Übergangslücken verhindern die Freigabe.

| Bisheriger Befund | Stand |
| --- | --- |
| P1: mehrere separate Markierungen | Grundmodell und zentrale E2E-Flüsse ergänzt; Behandlung der temporären Bearbeitung und gemischter Eingaben noch offen, siehe R3 |
| P2: Extrafelder und Tipp | Wesentlich erweitert, aber Klassifikation und Fehlerzellauswahl weiterhin nicht vollständig widerspruchsfrei, siehe R2 |
| P3: zehn spielbare Wörter je Level | Mindestbestände, Schema und Einzelauswahltests ausreichend ergänzt; neuer Widerspruch der Wortpfadlänge, siehe R1 |
| P4: tatsächliche Rundenerzeugung prüfen | Ausreichend ergänzt: produktiver Generator, echte Daten, Seed-Varianten, Zellpfade und kontrollierter Abbruch |
| P5: Pages und Testreihenfolge | Nachgelagerter Smoke-Test beschrieben, aber universelle Vorab-Gates und Feature-Branch-Abnahme weiterhin widersprüchlich, siehe R4 |

## Verbindlich zu behebende Befunde

### R1 – Wortpfadlänge widerspricht den zugelassenen Vokabeln

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 11 und 15.

Die Datenvalidierung erlaubt Zielformen mit zwei bis 13 Buchstaben. Das Rundenmodell verlangt dagegen je Wort eine „geordnete Folge von zehn bis maximal 13 Zellkoordinaten“. Ein gültiges Wort wie `CAT` könnte damit keinen gültigen Pfad bekommen oder müsste künstliche Zusatzfelder enthalten. Zehn ist die Anzahl der Wörter pro Runde, nicht die Mindestzahl der Buchstaben je Wort.

**Korrektur:** Pro Wort genau eine Zellkoordinate je normalisiertem Buchstaben verlangen: `path.length === normalizedWord.length`, nach dem festgelegten Datenvertrag also zwei bis 13. Der Generator muss genau zehn solcher Wortdatensätze liefern.

**Abnahme:** Den Daten-/Generatortests explizit ein gültiges kurzes Wort und eine Zielform mit 13 Buchstaben hinzufügen. Für jedes Rundenwort Buchstabenfolge und identische Wort-/Pfadlänge prüfen; der E2E-Erfolgsfluss muss auch kurze Wörter markieren und lösen.

### R2 – Tippklassifikation hat widersprüchliche und undefinierte Fälle

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 17, 19 und 21–26; E2E 7–10.

Die Regel für ein korrektes Wort beim Lösen akzeptiert exakte Zielwortpfade und begrenzt nur die Trefferzahl. Die Tippklassifikation nennt dagegen nur ein „noch nicht anderweitig korrekt markiertes Zielwort“ korrekt. Eine zweite exakte Markierung desselben Wortes fällt deshalb in „fehlerhaft“, obwohl kein geometrisch oder inhaltlich falsches Feld existiert. Der Tipp müsste nun eine nicht definierte Fehlerzelle einkreisen.

Weitere Gegenbeispiele:

- Eine einzelne Zelle an einer erlaubten Kreuzung liegt auf zwei offenen Wortlinien. Die Forderung „auf genau einer offenen Zielwortlinie“ macht diese passende Teilmarkierung zu einem Fehler, obwohl zunächst nur das Zielwort mehrdeutig ist.
- „Echte Teilfolge“ erlaubt mathematisch auch ausgelassene Zwischenzellen. Zugleich werden nicht zusammenhängende Felder ausdrücklich als fehlerhaft eingestuft. Vorrang und genaue Bedeutung sind nicht festgelegt.
- Bei einem vollständigen Wort plus einer Zelle eines anderen Wortes ist die Auswahl insgesamt zu keiner exakten Wortlinie erweiterbar. Die Regel „erstes Feld, das keine Erweiterung ... zulässt“ bestimmt deshalb nicht zuverlässig das Extrafeld; je nach Lesart erfüllen auch alle korrekten Wortzellen die Bedingung. Für einen Slot aus zwei ganzen Wortlinien gibt es ebenfalls keine festgelegte Referenz zur Auswahl der Fehlerzelle.

**Korrektur:**

- Exakte Geometrie und Trefferzählung trennen: eine doppelte exakte Markierung zählt nicht zusätzlich, darf aber ohne wirklich falsche Zelle keinen beliebigen Fehlerhinweis erzwingen.
- Passende Teilmarkierungen über eine explizite Menge möglicher Zielpfade beurteilen. Mehrere passende Kandidaten allein sind kein Zellfehler; eine stabile Reihenfolge kann den fehlenden Hinweis bestimmen.
- Festlegen, ob nur zusammenhängende Teilstrecken als fehlerfreie Teilmarkierung gelten, und diese Entscheidung konsistent in Prüfung und Tipp übernehmen.
- Für jede fehlerhafte Markierung eine deterministische Referenz-/Abweichungsregel definieren, die tatsächlich eine ausgewählte Fehlerzelle liefert. Insbesondere vollständiges Wort plus Extra muss beim Tipp das Extra liefern, auch wenn dieses zu einem anderen Zielwort gehört. Für Gleichstände oder mehrere vollständige Teilwörter braucht die Regel eine ausdrückliche Priorität.
- Derselbe Klassifikationsvertrag muss für Lösen und Tipp gelten. Die Zuordnung zu bereits gezählten Treffern darf nicht allein bestimmen, ob eine physische Zelle falsch ist.

**Zusätzliche E2E-Abnahme:** Zwei exakte identische Slots und ein noch offenes Wort → nur ein Treffer für das doppelte Wort und kein falscher Fehlerkreis auf dessen korrekten Zellen. Einzelne Kreuzungszelle als Teilmarkierung → Hinweis auf ein noch nicht markiertes Zielfeld. Lückenhafte Teilmarkierung → der ausdrücklich festgelegte Zustand. Vollständiges Wort plus Zielwort-Extrafeld → exakt das Extra einkreisen. Diese Fälle ergänzen die vorhandenen Tests, die bislang vor allem Trefferzählung und neutrale Extrafelder prüfen.

### R3 – Temporäre Bearbeitung und gemischte Klick-/Drag-Bedienung sind nicht abgeschlossen

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 16–21, 26 und 36–38.

Der neue Zustand „temporäre Klickbearbeitung“ ist sinnvoll, aber Tipp und Lösen sind ausschließlich für gespeicherte Slots beschrieben. Ein Nutzer kann bereits sichtbare Felder angeklickt haben und dann „Tipp“ oder „Lösen“ betätigen. Der Plan legt nicht fest, ob die aktuelle Bearbeitung automatisch übernommen, direkt mitgeprüft oder vor diesen Aktionen abgeschlossen werden muss. Der Tipp könnte dadurch eine bereits sichtbar ausgewählte Zelle als „noch nicht ausgewählt“ einkreisen oder einen aktuellen Fehler ignorieren.

Außerdem bedeutet „Ändern“ ausdrücklich Bearbeitung eines existierenden Slots, während jeder Drag laut Zeile 16 in den nächsten freien Slot geschrieben wird. Bei einem Drag während „Ändern“ ist damit offen, ob die editierte Markierung ersetzt oder eine zusätzliche angelegt wird. Auch eine noch nicht übernommene Klickbearbeitung vor einem neuen Drag hat keinen definierten Übergang. Diese Situationen können Markierungen verlieren, doppelt speichern oder die falsche Slotnummer verändern.

**Korrektur:** Eine kurze Zustands-/Aktionsregel für diese Übergänge ergänzen:

- Tipp und Lösen bei nichtleerer neuer Klickbearbeitung;
- Tipp und Lösen während Slot-Änderung;
- Drag bei nichtleerer Klickbearbeitung sowie während Slot-Änderung;
- Übernehmen einer durch Wegklicken leer gewordenen Bearbeitung;
- Verhalten bei zehn belegten Slots und noch nicht abgeschlossener Bearbeitung.

Die Entscheidung kann Auto-Übernahme, Einbeziehung des Entwurfs oder eine klar sichtbare Aufforderung zum Abschluss vorsehen. Wesentlich sind ein eindeutiger Ablauf, kein stiller Verlust und die Einhaltung der sichtbaren Feld-/Tipp-Semantik. Außerdem festlegen, ob Klickkoordinaten geometrisch kanonisiert werden: Das Entfernen eines falschen Feldes und anschließende Ergänzen eines fehlenden Feldes darf eine nun exakte Zelllinie nicht allein wegen der historischen Klickreihenfolge fehlerhaft lassen.

**Zusätzliche E2E-Abnahme:** Noch nicht übernommene passende und fehlerhafte Klickbearbeitungen mit Tipp und Lösen prüfen; einen Slot öffnen und per Drag ändern; eine Klickbearbeitung durch Drag ergänzen beziehungsweise den festgelegten Abschluss verlangen; einen fehlerhaften Slot durch Entfernen/Ergänzen von Zellen korrigieren und erneut erfolgreich lösen. Bei jedem Ablauf müssen Slotbestand, sichtbare Bearbeitung und Ergebniszustand übereinstimmen.

### R4 – Pages-Abnahme ist vom Feature-Branch aus nicht ausführbar geplant

**Priorität: hoch.** Bezug: `inventory.md` zum aktuellen Feature-Branch und fehlendem Workflow; `plan.md`, Zeilen 28, 40–41, 59 und 65–66.

Die Pipeline veröffentlicht ausschließlich bei Push auf `main`. Der aktuelle Lifecycle arbeitet jedoch auf einem Feature-Branch, und das Repository hat bisher keinen Workflow. Es gibt keinen geplanten Schritt, der den geprüften Stand zur Veröffentlichung bringt: weder eine ausdrücklich vorgesehene Integration nach `main` noch einen alternativen Auslöser für den Feature-Stand. Deshalb können Implementierung und lokale E2E erfolgreich abgeschlossen sein, während das geforderte erfolgreiche Pages-Deployment aus dem beschriebenen Ablauf unerreichbar bleibt.

Der frühere Gate-Widerspruch ist zudem formal noch vorhanden: Umsetzungsschritt 9 und Abschlusskriterium Zeile 65 verlangen alle E2E vor Deploy beziehungsweise als PR-Gate. Szenario 12 enthält weiterhin den erst nach Deploy möglichen veröffentlichten Smoke-Test. Dass dessen Text „danach“ sagt, beseitigt den Widerspruch zum universellen Gate nicht.

**Korrektur:**

- Szenarien 1–11 als lokale und CI-Gates vor Veröffentlichung benennen. Szenario 12 als separaten nachgelagerten Veröffentlichungsnachweis führen und die pauschalen Aussagen „alle E2E ... vor Deployment“ entsprechend ersetzen. Lokale Tests müssen Übersicht, direkten Spielaufruf und Reload unter dem Projekt-Unterpfad unabhängig vom veröffentlichten Test nachweisen.
- Einen tatsächlich ausführbaren Veröffentlichungsweg vom aktuellen Feature-Branch aus festlegen, einschließlich notwendigem Commit/Push und Integration oder einem geeigneten expliziten Auslöser für den geprüften Stand. Ein nur erwähnter manueller Workflow ist im bisher workflowlosen Standardbranch noch kein nachgewiesener Bootstrap-Weg; seine Bereitstellung und Auslösbarkeit müssen mitgeplant sein.
- Den Veröffentlichungsweg in die Lifecycle-Reihenfolge einordnen: Lokale Prüfungen erfolgen vor dem Implementierungscommit; eine Veröffentlichung des neuen Codes kann erst erfolgen, wenn der betreffende Stand remote vorliegt. Hauptbranch-/Merge-Schritte dürfen nicht stillschweigend vorausgesetzt werden.
- Wenn Veröffentlichung oder Repository-Einstellung erst extern möglich sind, einen klar getrennten offenen Veröffentlichungsnachweis mit genauer Ursache und Fortsetzung festlegen. Weder eine Workflowdatei noch ein lokaler Test schließen dann das Pages-Akzeptanzkriterium. Der Plan darf einen solchen externen Schritt transparent vorsehen, aber keinen bereits erreichbaren Gesamterfolg vortäuschen.

**Abnahme:** Die Testdokumentation muss den veröffentlichten Commit, Workflowlauf, tatsächliche URL und Ergebnis des nachgelagerten Smoke-Tests zuordnen können. Vor der Veröffentlichung vorhandene Spiel-/Generator-Gates und das erst anschließend erzielte Pages-Ergebnis müssen getrennt erkennbar sein.

## Freigabebedingung

R1 bis R4 in `plan.md` auflösen und die genannten zusätzlichen Szenarien den bestehenden Tests zuordnen. Anschließend erneut prüfen. Die Architektur, die sechs GER-Einzelauswahlen, die vorgesehenen echten Generatortests und das Grundmodell mit zehn getrennten Slots müssen dafür nicht neu geplant werden.

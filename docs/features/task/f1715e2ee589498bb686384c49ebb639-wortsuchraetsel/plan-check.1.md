# Planprüfung – Wortsuchrätsel

**Status: Plan lückenhaft**

Prüfdatum: 2026-10-27  
Geprüfte Eingaben: `requirement.md`, `inventory.md` und `plan.md` im selben Verzeichnis. Die ursprüngliche Beschreibung in `issue.md` wurde zum Abgleich des Markierungsablaufs gelesen. Dies ist eine Planprüfung; Implementierung und Tests wurden nicht ausgeführt.

## Ergebnis

Die technische Grundrichtung ist mit dem leeren Repository vereinbar. Spieleübersicht, statischer Build, lokale Vokabeldaten, sechs GER-Level, 13 × 13 Gitter, Schwierigkeitsstufen und Pages-Veröffentlichung sind berücksichtigt. Für die Umsetzung fehlen jedoch verbindliche Zustands- und Bedienregeln sowie dazu passende Testschritte. Insbesondere ist der wichtigste Abnahmefall – mehrere Wörter getrennt markieren und anschließend gemeinsam lösen – mit dem beschriebenen Auswahlmodell noch nicht ausführbar.

Der Planungscommit und die Implementierung sollten erst nach Behebung der folgenden fünf Befunde erfolgen. Die Befunde verlangen eine Präzisierung des Plans; aus ihnen folgt keine neue fachliche Rückfrage an den Nutzer.

## Verbindlich zu behebende Befunde

### P1 – Mehrere separate Wortmarkierungen sind nicht definiert

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 14–15, Umsetzungsschritte 4–6 und E2E 6.

Der Plan definiert eine „einzelne Wortlinie“ und Klicks in der „aktuellen Auswahl“, spricht beim Lösen aber von „jeder Auswahl“. Es fehlt eine Sammlung mehrerer Markierungen einschließlich einer erkennbaren Grenze zwischen zwei per Klick markierten Wörtern. Ebenso bleibt offen, ob ein neuer Drag die bisherige Auswahl ersetzt oder eine weitere Markierung erzeugt. E2E 6 fordert zehn Wortlinien vor dem Lösen, ohne die dafür notwendigen Benutzeraktionen zu benennen. Eine globale Zellmenge würde die geforderte Ablehnung eines Wortes mit Extrafeld nicht zuverlässig von einer separaten zweiten Wortmarkierung unterscheiden.

**Erforderliche Planergänzung:**

- Aktuelle Bearbeitung und gespeicherte, voneinander getrennte Wortmarkierungen als Zustände definieren. Festlegen, wie eine Markierung abgeschlossen, eine nächste begonnen, eine vorhandene geändert oder entfernt wird. Die Bedienung darf dabei vor „Lösen“ keinen Treffer verraten.
- Den konkreten Ablauf sowohl für ausschließliches Klicken als auch für aufeinanderfolgende Drags beschreiben; zusätzliche UI-Aktionen gegebenenfalls in Umsetzungsschritt 4 aufnehmen.
- Festlegen, wie gemeinsame Kreuzungszellen mehrerer Wörter und wiederholte Markierungen behandelt werden und wie Änderungen nach „Lösen“ veraltete Prüfergebnisse zurücksetzen oder aktualisieren. Auch „Neue Runde“ muss Markierungen, Hinweise und Ergebniszustand zurücksetzen.

**Verbindliche E2E-Ergänzung:** Zwei verschiedene Wörter nacheinander ausschließlich per Klick markieren und als zwei Markierungen sichtbar behalten; dasselbe per zwei Drags. Erst danach einmal „Lösen“ betätigen und genau beide Treffer prüfen. Anschließend den vollständigen Ablauf mit zehn getrennten Markierungen und einem abschließenden „Lösen“ durchführen. Zusätzlich eine Markierung ändern oder löschen und sicherstellen, dass die andere erhalten bleibt; bei erlaubten Kreuzungen einen bekannten Kreuzungsfall verwenden. Doppelte Markierung darf keinen zusätzlichen Treffer erzeugen.

### P2 – Extrafelder und Tipp-Klassifikation bleiben mehrdeutig

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 14–16, E2E 4, 7 und 8.

„Falsch markiertes Feld“ ist für zusammengesetzte Markierungen nicht definiert. Eine unvollständige, ansonsten passende Wortmarkierung muss den Hinweis auf ein fehlendes Zielfeld ermöglichen. Ein vollständiges Wort mit einem Extrafeld muss dagegen fehlerhaft bleiben – auch wenn dieses Extrafeld zu einem anderen Zielwort gehört. Eine bloße Prüfung gegen die Vereinigung aller Zielwortzellen würde diesen Fehler übersehen. Der Plan legt außerdem keine nachvollziehbare Entscheidung für eine nicht zusammenhängende Markierung oder eine aus Zellen verschiedener Zielwörter zusammengesetzte Auswahl fest. E2E 4 enthält nur ein nicht näher bestimmtes Extrafeld; E2E 7 nur ein einzelnes falsches Feld.

**Erforderliche Planergänzung:**

- Eine deterministische, markierungsbezogene Regel für vollständig korrekt, noch unvollständig ohne Fehler und fehlerhaft festlegen. Exakte Worttreffer dürfen nicht aus beliebigen Teilmengen einer größeren fehlerhaften Markierung gewonnen werden.
- Definieren, welche Zelle bei einer fehlerhaften Markierung eingekreist wird, einschließlich zusätzlicher Zielwortzellen und nicht zusammenhängender Auswahl. Die Regel muss mit der separaten Markierungssammlung aus P1 vereinbar sein.
- Klären, wie ein ungültiger Drag sichtbar und bearbeitbar bleibt: „nur zulässige Linien“ und „unzulässige Auswahl als falsch behandeln“ beschreiben derzeit keinen eindeutigen Übergang. Pointer-Up darf keine automatische Erfolgsauswertung oder unbeabsichtigte zusätzliche Klickauswahl auslösen.
- Hinweise dürfen weder Felder auswählen noch Treffer verbuchen. Der Sonderfall ohne weiteres Hinweisfeld muss auch vor dem ersten „Lösen“ funktionieren, wenn alle zehn Wörter bereits korrekt markiert sind.

**Verbindliche E2E-Ergänzung:**

1. Ein exaktes Wort plus neutrales Extrafeld als eine Markierung: kein Treffer; Tipp kreist einen Fehler ein. Nach Entfernen des Extrafelds und erneutem Lösen entsteht genau ein Treffer.
2. Dasselbe mit einem Extrafeld, das zu einem anderen Zielwort gehört: weiterhin fehlerhaft. Danach beide Wörter getrennt exakt markieren: zwei Treffer.
3. Eine ausschließlich passende Teilmarkierung: Tipp kreist ein fehlendes Zielfeld ein, keine bereits korrekt markierte Teilzelle.
4. Nicht zusammenhängende Klickauswahl sowie verbotener diagonaler Drag auf „Einfach“: der festgelegte Fehler-/Abbruchzustand erscheint ohne vorzeitigen Treffer und kann korrigiert werden.
5. Zehn exakte Markierungen vor „Lösen“: Tipp erzeugt keinen weiteren Feldhinweis; weder Tipp noch Pointer-Up ändern den Trefferstatus.

### P3 – Jede GER-Auswahl muss zehn tatsächlich spielbare Wörter ermöglichen

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 11–13, Umsetzungsschritte 2–3 und E2E 2.

Alle sechs Level sind einzeln auswählbar, der Startbestand hat aber keine Mindestgröße pro Level. Deshalb kann beispielsweise C2 auswählbar sein und dennoch keine Runde mit zehn Wörtern ermöglichen. Die allgemeine Datenvalidierung stellt außerdem noch nicht sicher, dass Begriffe in eine gerade Linie mit höchstens 13 Zellen passen oder nach der gewählten Normalisierung eindeutig bleiben. Für das bewusste Abwählen sämtlicher Level nennt der Plan keine Startregel; die vorhandene Rückfallregel betrifft nur fehlerhafte Speicherung. E2E 2 prüft lediglich eine Kombination mehrerer Level und eine gelöschte Speicherung.

**Erforderliche Planergänzung:**

- Mindestens zehn verschiedene, platzierbare englische Begriffe für jedes Level A1, A2, B1, B2, C1 und C2 vorsehen. Normalisierung, erlaubte Buchstaben, Maximallänge 13 und Eindeutigkeit der englischen Zielformen festlegen; Übersetzungen müssen vorhanden sein.
- Den Zustand ohne aktiviertes Level sowie einen zu kleinen oder ungültigen Datenbestand mit einer verständlichen Startvalidierung behandeln. Keine stillschweigende Runde mit weniger als zehn Wörtern oder aus nicht ausgewählten Leveln.
- Verhalten bei beschädigtem JSON in localStorage und ungültigen gespeicherten Levelwerten festlegen; der vorhandene Rückfall auf alle Level muss ohne Seitenabbruch funktionieren.

**Verbindliche Abdeckung:** Einen parametrierten E2E-Start für jedes einzeln ausgewählte Level durchführen und jeweils zehn unterschiedliche Wörter beziehungsweise zugehörige Übersetzungen ausschließlich dieses Levels nachweisen. Mehrfachauswahl und Wiederherstellung aus E2E 2 beibehalten. Zusätzlich leere Auswahl, beschädigten gespeicherten Wert und Rückfall prüfen. Den realen JSON-Startbestand automatisiert gegen Mindestanzahl, Länge, Alphabet und Eindeutigkeit validieren; ein Testbestand allein genügt dafür nicht.

### P4 – Testdaten und Zufallssteuerung müssen die echte Rundenerzeugung prüfen

**Priorität: mittel.** Bezug: `plan.md`, Zeilen 11, 13 und 17 sowie E2E 1–3.

Der Plan verlangt zufällige Wortauswahl, zufällige Füllbuchstaben, vollständige Platzierung und kontrollierte Wiederholungsversuche. Die Tests nennen dagegen zugleich „Testdatensatz/Zufallsseed“ und statische Daten mit bekannten Wortpositionen. Es ist nicht festgelegt, ob der produktive Generator mit kontrollierter Zufallsquelle ausgeführt wird oder ein fertiges Gitter die Rundenerzeugung ersetzt. Im zweiten Fall würden die E2E-Tests den zentralen Erzeugungsweg umgehen. Zehn Übersetzungen und 169 Buchstaben beweisen noch nicht, dass alle zehn zugehörigen Wörter tatsächlich im Gitter liegen.

**Erforderliche Planergänzung und Abdeckung:**

- Festlegen, wie eine deterministische Runde entsteht und wie ihre erwarteten Positionen ermittelt werden. Mindestens die Start- und Generatortests müssen denselben Erzeugungspfad wie die Anwendung verwenden; spezielle Interaktionsfixtures dürfen diesen Nachweis ergänzen.
- Automatisiert prüfen, dass jede der zehn gewählten Zielformen vollständig, ohne Buchstabenkonflikt, innerhalb des Gitters und in einer zur Spielstufe passenden Richtung vorhanden ist. Unbelegte Zellen müssen gültige Füllbuchstaben enthalten.
- Den unveränderten produktiven Vokabelbestand mindestens einmal pro Level durch den Generator führen. Seed-basierte Prüfungen sollen nachvollziehbar belegen, dass nicht immer dieselben zehn Wörter beziehungsweise dasselbe Füllmuster verwendet werden, ohne probabilistisch flackernde Assertions zu erzeugen.
- Kontrolliertes Ende bei nicht platzierbaren Eingaben beziehungsweise ausgeschöpften Versuchen prüfen. Diese Invarianten können durch gezielte Logiktests ergänzt werden; die Benutzerabläufe bleiben weiterhin verpflichtende E2E-Tests.

### P5 – Tests vor der Veröffentlichung und Pages-Smoke-Test sind zyklisch beschrieben

**Priorität: hoch.** Bezug: `plan.md`, Zeilen 18, 29–30, 35, 45 und 50–53.

Laut Zeile 35 wird jedes Szenario lokal und im CI vor dem Deploy ausgeführt. Szenario 9 benötigt jedoch zuerst eine erfolgreiche Veröffentlichung und fordert selbst den Workflow nach erfolgreichem E2E an. Damit ist dieser Ablauf kein ausführbares Gate. Außerdem nennt der Plan weder den Veröffentlichungsbranch beziehungsweise manuellen Auslöser noch einen konkreten Umsetzungsschritt für das Aktivieren der Pages-Quelle. Nur das Dokumentieren einer Repository-Einstellung erfüllt das Akzeptanzkriterium einer veröffentlichten Seite noch nicht.

**Erforderliche Planergänzung:**

- Den Ablauf in Build → lokale/CI-Spiel-E2E → Pages-Artefakt/Deploy → Smoke-Test der vom Deployment gelieferten URL aufteilen. Szenario 9 ist ein nachgelagerter Veröffentlichungsnachweis und kein Vorab-Gate. Abschlusskriterien entsprechend formulieren.
- Festlegen, welche Ereignisse Build und Tests ausführen und welcher freigegebene Branch oder manuelle Auslöser veröffentlichen darf. Die erstmalige Einrichtung beziehungsweise Prüfung der Pages-Quelle als Umsetzungsschritt aufnehmen.
- Lokale E2E auf dem Produktionsbuild unter dem tatsächlichen Projekt-Unterpfad ausführen. Neben Navigation auch direkten Aufruf und Neuladen von `games/word-search/` prüfen, damit fehlerhafte Asset- oder JSON-Pfade auffallen.
- Den veröffentlichten Smoke-Test für Übersicht, direkten Spielaufruf, Asset-/Vokabelladen und Rundenstart konkret einplanen. Falls Repository-Rechte oder Veröffentlichung extern blockiert sind, bleibt dieser Nachweis ausdrücklich offen; eine Workflowdatei oder lokale Preview darf nicht als erfolgreicher Pages-Nachweis gelten.

## Abdeckungsübersicht

| Anforderungsbereich | Stand des Plans | Erforderliche Ergänzung |
| --- | --- | --- |
| Erweiterbare Spielesammlung, statischer Spielpfad | Ausreichend beschrieben | Keine zusätzliche Architekturentscheidung erforderlich |
| 13 × 13, zehn Wörter, Füllbuchstaben, Richtungen | Umsetzung vorgesehen, Erzeugungsnachweis unvollständig | P3, P4 |
| Lokale Vokabeldatei und A1–C2 | Schema und Levelauswahl vorgesehen | P3: reale Datenmenge und jede Einzelauswahl |
| Speicherung und Wiederherstellung | Normalfall vorhanden | P3: leere und beschädigte Zustände |
| Klick und Drag, mehrere Wörter vor dem Lösen | Zentrale Zustandsübergänge fehlen | P1, P2 |
| Exakte Wortmarkierung, Fehler bei Extrafeldern | Gewünschtes Ergebnis genannt, Abgrenzung unbestimmt | P1, P2 |
| Keine frühe Trefferanzeige | Grundsätzlich ausreichend verlangt | Auf neue Markierungsübergänge und Tipp anwenden |
| Hervorhebung offener Übersetzungen und Gesamterfolg | E2E-Ziel vorhanden, aktuell nicht ausführbarer Gesamtfluss | P1 |
| Tipp: Fehler vor fehlender Zelle, sonst kein Hinweis | Priorität vorhanden, Zellklassifikation fehlt | P2 |
| GitHub Pages tatsächlich bereitgestellt | Vorgesehen, Gate-Reihenfolge widersprüchlich | P5 |

## Freigabebedingung

`plan.md` muss P1 bis P5 durch konkrete Entscheidungen und zugeordnete Abnahmeszenarien auflösen. Danach ist eine erneute Planprüfung erforderlich. Die bestehende Aussage „Keine fachlichen offenen Punkte“ ersetzt diese fehlenden technischen und testbezogenen Festlegungen nicht.

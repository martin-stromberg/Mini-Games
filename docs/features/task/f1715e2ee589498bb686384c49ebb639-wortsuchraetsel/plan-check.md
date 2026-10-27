# Planprüfung – Wortsuchrätsel

**Status: Plan vollständig**

Prüfdatum: 2026-10-27  
Geprüft wurden `requirement.md`, `inventory.md`, die aktuelle `plan.md` sowie die vorherige dritte Prüfung in `plan-check.md`. Diese Prüfung betrifft ausschließlich die Planung; Implementierung, CI und Deployment wurden nicht ausgeführt.

## Ergebnis

Der Plan deckt alle fachlichen Akzeptanzkriterien ab und ist mit dem leeren, statischen Ausgangs-Repository vereinbar. Der vorgesehene Benutzerfluss – Level und Schwierigkeit wählen, Runde starten, mehrere Wortmarkierungen per Klick oder Drag verwalten, erst auf „Lösen“ auswerten und mit „Tipp“ gezielt unterstützen – ist vollständig beschrieben. Zu jedem risikoreichen Übergang sowie zum Pages-Nachweis sind konkrete Prüfungen eingeplant.

## Prüfung der zuletzt offenen Befunde

| Befund | Ergebnis |
| --- | --- |
| T1 – offener Klickentwurf und Tipp | Behoben. Ein nicht abgeschlossener Entwurf blockiert den Tipp sichtbar und neutral; Tipp verändert weder Entwurf noch Slots. „Lösen“ hat dagegen einen ausdrücklich separaten, atomaren Übernahmeweg. Die E2E-Prüfung zu Entwurfsübergängen verlangt dieses Verhalten und schließt stille Änderungen aus. Damit besteht keine widersprüchliche Behauptung mehr, der Tipp übernehme einerseits einen Entwurf und verändere andererseits nichts. |
| T2 – bereits in anderen Slots markiertes Hinweisfeld | Behoben. Der Plan definiert „global markiert“ als in irgendeinem Slot ausgewählt. Die Hint-Suche betrachtet bei Teilmarkierungen nur global freie Zielfelder, fällt andernfalls stabil auf weitere Kandidaten, Slots und schließlich andere offene Ziele zurück. Fehlt ein solches Feld, bleibt der Hinweis neutral. Die Szenarien zu Duplikaten, Kreuzungen, ergänzenden Teilmarkierungen und der allgemeinen Global-Invariante prüfen dies ausdrücklich. |

## Fachliche und technische Abdeckung

- Die lokale JSON-Quelle, die sechs GER-Stufen, ihre Validierung, mindestens zehn geeignete Einträge je Stufe, die Mehrfachauswahl und die robuste `localStorage`-Wiederherstellung sind festgelegt und testbar.
- Der produktive, seed-fähige Generator erzeugt genau zehn verschiedene Wörter samt nachvollziehbaren Pfaden in einem 13 × 13-Gitter. Richtungen, Überlappungen, Füllbuchstaben, Grenzlängen, Wiederholungsgrenze und Fehlermeldung sind definiert.
- Zehn getrennte Slots verhindern, dass mehrere Wortmarkierungen oder Kreuzungen ineinanderfallen. Klick-, Drag-, Bearbeitungs-, Lösch-, Vollbelegungs- und Ergebnis-Übergänge verwerfen keinen Inhalt stillschweigend und verraten vor „Lösen“ keine Trefferwertung.
- Klassifikation, Trefferzählung und Tipppriorität sind deterministisch. Teilmarkierungen, Extrafelder, Mehrwortmarkierungen, Duplikate und Kreuzungen erhalten jeweils eindeutige Regeln und zugeordnete E2E-Szenarien.
- Die E2E-Suite läuft gegen den Produktionsbuild unter dem tatsächlichen Projekt-Unterpfad und deckt die geforderten Benutzerabläufe einschließlich direktem Spielaufruf und Reload ab. Daten- und Generatorinvarianten ergänzen diese UI-Nachweise.
- Der Veröffentlichungsablauf trennt die lokalen/CI-Gates von dem nachgelagerten GitHub-Pages-Deploy und dessen Smoke-Test. Der geprüfte Feature-Branch ist ein konkret geplanter, ausführbarer Veröffentlichungsweg; Commit, Workflowlauf, URL und Smoke-Test werden als Nachweis dokumentiert. Die externe Pages-Einstellung wird dabei nicht als bereits erledigt behauptet, sondern vor dem tatsächlichen Deploy aktiviert und geprüft.

## Freigabe

Es bestehen keine offenen fachlichen, technischen oder testbezogenen Planlücken. Der Plan kann in die Implementierung übergehen.

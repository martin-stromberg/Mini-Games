# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Gemischtes Wort unterscheidet sich immer vom Original | `shuffleLetters`: `shuffle` + deterministischer Tausch zweier unterschiedlicher Positionen; Pool nur Wörter mit ≥ 2 verschiedenen Buchstaben | Unit 3, 14; E2E „Runde starten" | Abgedeckt |
| Bei doppelten Buchstaben zählt jede gültige Reihenfolge, die das Wort ergibt | Prüfung vergleicht Buchstabenmuster mit `answer`, nicht Kachel-Identitäten | Unit 8 | Abgedeckt |
| Eingabe per Klick und Tastatur | `placeLetter` (Klick), `typeLetter` (Tastatur), Entfernen per Slot-Klick/`removeLastLetter` (Rücktaste) | Unit 5, 9; E2E „Klick-Eingabe", „Tastatur" | Abgedeckt |
| Auswertung am Rundenende | `results` mit gelöst/Hilfen/übersprungen + Ergebnisbildschirm | Unit 13; E2E „Überspringen/Auswertung" | Abgedeckt |
| Hinweis: deutsche Übersetzung (+ optional Bild) | Spielbildschirm zeigt `german` und `image` falls vorhanden | E2E „Runde starten", optional „Bild" | Abgedeckt |
| Gesetzte Buchstaben lassen sich entfernen | `removeLetter`, `removeLastLetter`, `resetWord` | Unit 9, 11; E2E „Falsche Anordnung" | Abgedeckt |
| Richtig → nächstes Wort; falsch → markieren und erneut versuchen | `evaluate` nach jedem Zug: `'correct'` → `position++`; `'wrong'` → `wrong`-Markierung | Unit 6, 7; E2E „Klick-Eingabe", „Falsche Anordnung" | Abgedeckt |
| Hilfe „Buchstaben aufdecken" setzt nächsten richtigen Buchstaben, zählt als Hilfe | `revealLetter` fixiert linksten offenen Slot, `helps++` | Unit 10; E2E „Buchstaben aufdecken" | Abgedeckt |
| Wählbare Wortanzahl + überspringen | `WORD_COUNT_OPTIONS`, `skipWord` | Unit 12; E2E „Überspringen" | Abgedeckt |
| Verben ohne „to" | `normalizeEnglish` entfernt `to ` | Unit 1 | Abgedeckt |
| Wortgruppen: Entscheidung getroffen | Ausschluss über `WORD_PATTERN` | Unit 1 | Abgedeckt |
| Optionaler Filter Wortlänge | `matchesLength`/`LENGTH_FILTERS` | Unit 2, 3 | Abgedeckt |
| Rahmenbedingungen (Seite, Link, Rückweg, Vokabeln via shared, seed, localStorage, Touch/Tastatur, Smartphone, Tests, Hilfe, README) | Alle als Umsetzungsschritte und E2E-Szenarien im Plan | E2E-Tabelle + Umsetzungsreihenfolge 1–5 | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Navigation Startseite → Spiel | „Startseite verlinkt das Spiel" | Abgedeckt |
| Setup (Niveaus, Wortanzahl, Längen, Persistenz) | „Setup zeigt …", „Einstellungen überstehen Reload" | Abgedeckt |
| Spielzug per Klick (Happy Path) | „Klick-Eingabe in korrekter Reihenfolge" | Abgedeckt |
| Fehlerfall falsches Wort + Korrektur | „Falsche Anordnung → markieren + erneut versuchen" | Abgedeckt |
| Tastatureingabe | „Buchstabentasten setzen, Rücktaste entfernt" | Abgedeckt |
| Hilfe-Button | „Buchstaben aufdecken fixiert Buchstaben" | Abgedeckt |
| Überspringen + Rundenende-Auswertung | „Überspringen → nächstes Wort; Auswertung" | Abgedeckt |
| Smartphone ohne horizontales Scrollen | Viewport 375 px | Abgedeckt |
| Symbolbild-Hinweis | Optionaler Test mit `image`-Vokabel | Abgedeckt |

## Hinweise

- Selbstprüfung (Plan-Review) ergab zwei im Entwurf bereits berücksichtigte Feinheiten: `revealLetter` bevorzugt Pool-Kacheln vor dem Verschieben aus späteren Slots; fixierte Slots bilden immer ein Präfix. Beides ist in `game.js` so zu implementieren.
- Keine Autorisierungs-/Sichtbarkeitsanforderungen (öffentliches Lernspiel) — entsprechende Tests entfallen.

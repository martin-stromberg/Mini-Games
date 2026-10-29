# Release Notes

Nächster Release (unveröffentlicht)

## Important Notes Before Update

- There are no special notices.

## What's New

- New game "Buchstabensalat" (letter scramble): arrange the shuffled letters of an English word in the correct order; the German translation (and optionally a symbol image) is the hint.
- Rounds of 5, 10 or 15 words with an optional word-length filter (short/medium/long) and CEFR level selection, saved in `localStorage`.
- Letters are placed by click, touch or keyboard and can be removed again; the word is checked automatically once complete.
- "Buchstaben aufdecken" reveals the next correct letter and counts as a used hint; words can be skipped.
- End-of-round summary listing solved words, used hints and skipped words with their solutions.

## Wichtige Hinweise vor dem Update

- Es gibt keine besonderen Hinweise.

## Neuerungen

- Neues Spiel „Buchstabensalat": Die gemischten Buchstaben einer englischen Vokabel in die richtige Reihenfolge legen; Hinweis ist die deutsche Übersetzung (optional mit Symbolbild).
- Runden mit 5, 10 oder 15 Wörtern, optionalem Wortlängen-Filter (kurz/mittel/lang) und GER-Niveauauswahl, gespeichert in `localStorage`.
- Buchstaben werden per Klick, Touch oder Tastatur gesetzt und können wieder entfernt werden; das vollständige Wort wird automatisch geprüft.
- „Buchstaben aufdecken" setzt den nächsten richtigen Buchstaben fest und zählt als genutzte Hilfe; Wörter können übersprungen werden.
- Auswertung am Rundenende mit gelösten Wörtern, genutzten Hilfen und übersprungenen Wörtern samt Lösungen.

---

Version 1.0.0 (2026-10-27)

## Important Notes Before Update

- Set the repository's GitHub Pages source to "GitHub Actions" (Settings > Pages) before the first Pages deploy.

## What's New

- Word search game ("Wortsuchrätsel") for practicing English vocabulary, published via GitHub Pages.
- Collection of small games on the Pages site, extensible with further games.
- 13 × 13 letter grid with one letter per cell; unused cells are filled with random letters.
- Two difficulty levels: "Einfach" (horizontal and vertical words) and "Schwierig" (also diagonal words).
- Vocabulary from a local JSON file, each entry assigned a CEFR level (A1 to C2).
- Level selection before the round (multiple choice, all levels selected initially), saved in `localStorage` and restored on the next visit.
- Each round picks 10 random words from the selected levels and shows their German translations.
- Cells can be marked individually or by press, drag and release for a contiguous selection.
- No feedback while marking; the "Lösen" button checks the marked words.
- Unfound translations are highlighted after solving.
- Hint button circles a wrongly marked cell first, otherwise a not yet selected cell of a correct word.

## Wichtige Hinweise vor dem Update

- Vor dem ersten Pages-Deploy die GitHub-Pages-Quelle des Repositories auf „GitHub Actions" stellen (Settings > Pages).

## Neuerungen

- Wortsuchrätsel („Wortsuchrätsel") zum Üben englischer Vokabeln, veröffentlicht über GitHub Pages.
- Sammlung kleiner Spiele auf der Pages-Seite, die später um weitere Spiele erweitert werden kann.
- 13 × 13 Buchstabengitter mit je einem Buchstaben pro Feld; nicht belegte Felder werden mit zufälligen Buchstaben gefüllt.
- Zwei Schwierigkeitsstufen: „Einfach" (waagerechte und senkrechte Wörter) und „Schwierig" (zusätzlich diagonale Wörter).
- Vokabeln aus einer lokalen JSON-Datei, jeder Eintrag einem GER-Niveau (A1 bis C2) zugeordnet.
- Levelauswahl vor der Runde (Mehrfachauswahl, zu Beginn alle Niveaus ausgewählt), gespeichert in `localStorage` und beim nächsten Besuch wiederhergestellt.
- Jede Runde wählt zufällig zehn Wörter aus den ausgewählten Niveaus und zeigt die deutschen Übersetzungen an.
- Felder können einzeln oder per Drücken, Ziehen und Loslassen zusammenhängend markiert werden.
- Während des Markierens kein Trefferhinweis; die Prüfung erfolgt erst über den Button „Lösen".
- Nach dem Lösen werden noch nicht gefundene Übersetzungen hervorgehoben.
- Tipp-Button kreist zuerst ein falsch markiertes Feld ein, sonst ein noch nicht ausgewähltes Feld eines korrekten Wortes.

# Datenmodell

## Vokabeleintrag (`public/data/vocabulary/<niveau>.json`)

JSON-Array je GER-Niveau (A1–C2); `loadVocabulary` ergänzt das Feld `level`, `validateVocabulary` ergänzt `id` (`vocab-<index>`) und trimmt `english`/`german`.

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `english` | string | Englischer Begriff; Verben als Infinitiv mit „to " (z. B. `to improve`), Wortgruppen mit Leerzeichen enthalten (z. B. `train station`), Umlaute/Sonderzeichen möglich |
| `german` | string | Deutsche Übersetzung (Hinweis im Spiel) |
| `partOfSpeech` | string | Wortart (`noun`, `verb`, `adjective`, `preposition`, …) |
| `topic` | string | Themenfeld (z. B. `Essen`, `Tiere`) |
| `synonyms` | string[] | Deutsche Synonyme |
| `exampleGerman` / `exampleEnglish` | string | Beispielsatz in beiden Sprachen |
| `image` | string? | Pfad zum Symbolbild relativ zu `public/` (nur bei 189 Nomen vorhanden) |
| `level` | string | GER-Niveau aus Dateiname (durch `loadVocabulary` gesetzt) |
| `id` | string | `vocab-<index>` (durch `validateVocabulary` gesetzt) |

Bestand: 2454 Einträge (A1 118, A2 105, B1 117, B2 743, C1 1262, C2 109).

## Spielzustand (Muster aus `vocab-quiz`/`memory`)

Rundenobjekte sind unveränderliche Datenstrukturen; Logikfunktionen geben neue Objekte zurück (`{ round, result }`). Muster: `createRound(vocabulary, { levels, count, rng })`, `currentX`, `isFinished`, `results`.

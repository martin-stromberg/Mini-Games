# Logik und Konventionen

## `src/shared/vocabulary.js`

| Funktion | Zweck |
|----------|-------|
| `LEVELS` | `['A1','A2','B1','B2','C1','C2']` |
| `vocabularyFile(level)` | `data/vocabulary/<niveau>.json` |
| `germanKey(german)` | Normalisierter Schlüssel deutscher Begriffe (Kleinschreibung) |
| `validateVocabulary(vocabulary)` | Validierung + Vergabe von `id`, Trimmen |
| `loadVocabulary(baseUrl)` | Lädt alle sechs Niveaudateien parallel, ergänzt `level` |

## `src/shared/random.js`

| Funktion | Zweck |
|----------|-------|
| `seededRandom(seed)` | Deterministischer PRNG (LCG) |
| `shuffle(items, rng)` | Fisher-Yates auf Kopie |
| `createRandomSource(search)` | `?seed=<Zahl>` → `seededRandom`, sonst `Math.random` |

## `src/shared/html.js`

| Funktion | Zweck |
|----------|-------|
| `escapeHtml(value)` | Escaping für `&<>"'` — Pflicht für alle interpolierten Texte |

## `src/word-search/game.js` (relevante Vorlagen)

| Element | Zweck |
|---------|-------|
| `normalizeWord` | trim + Uppercase |
| `toGridWord` | Entfernt führendes `to ` bei Verben |
| `WORD_PATTERN` | `^[A-Z]{2,13}$` — Filterkriterium für spielbare Wörter |
| `STORAGE_KEY` | `mini-games.word-search.levels` — Namensmuster `mini-games.<spiel>.settings` |

## `src/vocab-quiz/game.js` / `src/memory/game.js` (Strukturmuster)

- Konstanten oben: Optionsarrays (`QUESTION_COUNT_OPTIONS`, `PAIR_OPTIONS`), Defaults, Enums als `Object.freeze`, `STORAGE_KEY`
- `countByLevel(words)` für die Anzeige der Vokabelzahlen im Setup
- `createRound(...)` wirft bei ungültigen Einstellungen/zu kleinem Pool deutsche `Error`-Meldungen, die im Setup als Hinweis erscheinen
- Rundenfunktionen geben `{ round, result }` zurück (`result`: `'ignored' | 'correct' | 'wrong' | 'match' | 'mismatch' | 'first'`)

## `src/vocab-quiz/main.js` (UI-Muster)

- `#app` als Mount-Punkt, `app.innerHTML` komplettes Re-Rendering je Zustand
- Drei Zustände: `renderSetup` → `renderQuestion` → `renderResult`
- `loadSettings`/`storeSettings` mit Defaults und robuster Validierung (try/catch, Array-/Enum-Prüfung)
- `setupStatus`/`updateSetupStatus`: blockierende Hinweise vor Rundenstart
- `imageUrl = word => import.meta.env.BASE_URL + word.image`
- Globaler `keydown`-Handler: ignoriert Eingabefelder, Zahlen/Enter/Pfeile
- Buttons über `data-action`, dynamische Elemente über `data-*`-Attribute; `role="status"`/`aria-live` für Rückmeldungen

## Einstiegsseiten und Build

- `games/<spiel>/index.html`: `<main id="app" class="game-page">`, Stylesheet `../../src/styles.css`, Modul `../../src/<spiel>/main.js`, Titel `<Spiel> · Mini-Games`
- `index.html` (Startseite): `nav.game-links` mit `a.primary-link` je Spiel
- `vite.config.js`: `rollupOptions.input` je Seite — neuer Eintrag erforderlich
- `playwright.config.js`: E2E gegen `vite build` + `vite preview`, `baseURL` mit `VITE_BASE_PATH` (Default `/Mini-Games/`)
- `.github/workflows/pages.yml`: PR-Checks = `npm ci`, `npm test`, `npm run test:e2e`, `npm run build`

## Styles (`src/styles.css`)

Wiederverwendbare Klassen: `.landing`, `.setup`, `.game-page`, `.eyebrow`, `.back`, `.primary`, `.primary-link`, `.notice`/`.warning`, `.result`, `.game-header`/`.header-actions`, `.actions`, `.levels` (Grid), `fieldset`, `.mistakes`, `.quiz-*`, `.example`, `.muted`; Smartphone-Umbruch über `@media (max-width: 760px)`.

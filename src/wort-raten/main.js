import { DEFAULT_MISSES, LENGTH_FILTERS, LETTERS, MISS_OPTIONS, STORAGE_KEY, WORD_LENGTH, countByLevel, createGame, guess, guessingWords, isOver, matchesLength, missesLeft, revealed } from './game.js';
import { escapeHtml } from '../shared/html.js';
import { createRandomSource } from '../shared/random.js';
import { LEVELS, loadVocabulary, validateVocabulary } from '../shared/vocabulary.js';

const app = document.querySelector('#app');
const LENGTH_LABELS = {
  [WORD_LENGTH.SHORT]: 'kurz (2–5 Buchstaben)',
  [WORD_LENGTH.MEDIUM]: 'mittel (6–9 Buchstaben)',
  [WORD_LENGTH.LONG]: 'lang (ab 10 Buchstaben)'
};
const MISS_LABELS = {
  6: '6 Fehlversuche (schwer)',
  8: '8 Fehlversuche (mittel)',
  10: '10 Fehlversuche (leicht)'
};

const state = {
  items: [],
  settings: { levels: new Set(LEVELS), lengths: new Set(LENGTH_FILTERS), misses: DEFAULT_MISSES },
  game: null,
  session: { won: 0, lost: 0 },
  played: new Set(),
  hint: false,
  message: '',
  notice: '',
  rng: createRandomSource()
};

function loadSettings() {
  const defaults = { levels: new Set(LEVELS), lengths: new Set(LENGTH_FILTERS), misses: DEFAULT_MISSES };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      levels: Array.isArray(stored?.levels) && stored.levels.length && stored.levels.every(level => LEVELS.includes(level)) ? new Set(stored.levels) : defaults.levels,
      lengths: Array.isArray(stored?.lengths) && stored.lengths.length && stored.lengths.every(length => LENGTH_FILTERS.includes(length)) ? new Set(stored.lengths) : defaults.lengths,
      misses: MISS_OPTIONS.includes(stored?.misses) ? stored.misses : defaults.misses
    };
  } catch {
    return defaults;
  }
}

function storeSettings() {
  const { levels, lengths, misses } = state.settings;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels: [...levels], lengths: [...lengths], misses })); } catch { /* Speicher nicht verfügbar: Einstellungen gelten nur für diesen Besuch. */ }
}

const imageUrl = word => `${import.meta.env.BASE_URL}${word.image}`;
const pool = () => state.items.filter(item => state.settings.levels.has(item.word.level) && [...state.settings.lengths].some(length => matchesLength(item.answer, length)));

function setupStatus() {
  const { levels, lengths } = state.settings;
  if (!levels.size) return { blocked: true, text: 'Wähle mindestens ein Niveau aus, um ein Wort zu starten.' };
  if (!lengths.size) return { blocked: true, text: 'Wähle mindestens eine Wortlänge aus.' };
  const words = pool();
  if (!words.length) return { blocked: true, text: 'Für die Auswahl gibt es keine Wörter; wähle weitere Niveaus oder Wortlängen.' };
  const images = words.filter(item => typeof item.word.image === 'string' && item.word.image.trim()).length;
  return { blocked: false, text: `${words.length} Wörter stehen zur Auswahl bereit, davon ${images} mit Bild.` };
}

function updateSetupStatus() {
  const { blocked, text } = setupStatus();
  const status = document.querySelector('[data-setup-status]');
  status.textContent = text;
  status.classList.toggle('warning', blocked);
  document.querySelector('[data-action=start]').disabled = blocked;
}

function readSetupInputs() {
  state.settings = {
    levels: new Set([...document.querySelectorAll('[data-level]:checked')].map(input => input.value)),
    lengths: new Set([...document.querySelectorAll('[data-length]:checked')].map(input => input.value)),
    misses: Number(document.querySelector('input[name=misses]:checked').value)
  };
  storeSettings();
  updateSetupStatus();
}

function renderSetup() {
  const { levels, lengths, misses } = state.settings;
  const counts = countByLevel(state.items);
  const { blocked, text } = setupStatus();
  const levelInputs = LEVELS.map(level => `<label><input data-level type="checkbox" value="${level}" ${levels.has(level) ? 'checked' : ''}> ${level} <small>(${counts[level]} Wörter)</small></label>`).join('');
  const lengthInputs = LENGTH_FILTERS.map(length => `<label><input data-length type="checkbox" value="${length}" ${lengths.has(length) ? 'checked' : ''}> ${LENGTH_LABELS[length]}</label>`).join('');
  const missInputs = MISS_OPTIONS.map(option => `<label><input type="radio" name="misses" value="${option}" ${option === misses ? 'checked' : ''}> ${MISS_LABELS[option]}</label>`).join('');
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Englische Vokabeln</p>
      <h1>Wort raten</h1>
      <p>Errate ein englisches Wort Buchstabe für Buchstabe — per Bildschirmtastatur oder Tastatur. Für jeden Fehlversuch verliert die Blume ein Blütenblatt. Die deutsche Übersetzung kannst du als Hinweis zuschalten.</p>
      ${state.message ? `<p class="notice warning" role="alert">${escapeHtml(state.message)}</p>` : ''}
      <fieldset><legend>GER-Niveaus</legend><div class="levels">${levelInputs}</div></fieldset>
      <fieldset><legend>Wortlänge</legend>${lengthInputs}</fieldset>
      <fieldset><legend>Schwierigkeit</legend>${missInputs}</fieldset>
      <p class="notice ${blocked ? 'warning' : ''}" data-setup-status role="status">${escapeHtml(text)}</p>
      <button class="primary" data-action="start" ${blocked ? 'disabled' : ''}>Spiel starten</button>
    </section>`;
  document.querySelectorAll('.setup input').forEach(input => input.addEventListener('change', readSetupInputs));
  document.querySelector('[data-action=start]').addEventListener('click', startGame);
}

function startGame() {
  try {
    const { levels, lengths, misses } = state.settings;
    state.game = createGame(state.items.map(item => item.word), { levels: [...levels], lengths: [...lengths], misses, rng: state.rng, exclude: [...state.played] });
    state.played.add(state.game.answer);
    state.hint = false;
    state.notice = '';
    if (state.game.word.image) new Image().src = imageUrl(state.game.word);
    renderGame();
  } catch (error) {
    state.message = error.message;
    renderSetup();
  }
}

// Blume statt Galgen: pro erlaubtem Fehlversuch ein Blütenblatt; verlorene Blätter liegen am Boden.
function flowerHtml(game) {
  const left = missesLeft(game);
  const petals = [];
  for (let index = game.wrong.length; index < game.maxMisses; index++) {
    petals.push(`<ellipse class="petal" cx="80" cy="44" rx="9" ry="20" transform="rotate(${Math.round(index * 360 / game.maxMisses)} 80 70)"/>`);
  }
  const fallen = game.wrong.map((letter, index) => `<ellipse class="petal lost" cx="${28 + index * 11}" cy="168" rx="7" ry="4.5" transform="rotate(${index * 53} ${28 + index * 11} 168)"/>`);
  return `
    <div class="guess-flower" data-flower role="img" aria-label="Blume: noch ${left} von ${game.maxMisses} Blütenblättern">
      <svg viewBox="0 0 160 180" aria-hidden="true">
        <line class="ground" x1="15" y1="174" x2="145" y2="174"/>
        <line class="stem" x1="80" y1="80" x2="80" y2="174"/>
        <path class="leaf" d="M80 140 q-24 -4 -32 -24 q26 -2 32 24"/>
        <path class="leaf" d="M80 152 q24 -4 32 -24 q-26 -2 -32 24"/>
        ${petals.join('')}
        <circle class="center" cx="80" cy="70" r="11"/>
        ${fallen.join('')}
      </svg>
    </div>`;
}

function slotHtml(char, index) {
  if (char === ' ') return '<li class="guess-slot gap" aria-hidden="true"></li>';
  if (char === '-') return '<li class="guess-slot hyphen"><span lang="en">-</span></li>';
  if (char === null) return `<li class="guess-slot" aria-label="Buchstabe ${index + 1} verborgen"></li>`;
  return `<li class="guess-slot open"><span lang="en">${escapeHtml(char.toUpperCase())}</span></li>`;
}

function keyHtml(game, letter) {
  const used = game.guessed.includes(letter);
  const mark = used ? (game.answer.includes(letter) ? 'hit' : 'miss') : '';
  const state = used ? (mark === 'hit' ? 'im Wort' : 'nicht im Wort') : 'noch nicht versucht';
  return `<button type="button" class="guess-key ${mark}" data-key="${letter}" aria-label="Buchstabe ${letter.toUpperCase()}, ${state}" ${used || isOver(game) ? 'disabled' : ''}><span lang="en">${letter.toUpperCase()}</span></button>`;
}

function hintHtml(game) {
  if (!state.hint) return '';
  const { word } = game;
  return `
    <div data-hint>
      <p class="guess-hint"><span lang="de">„${escapeHtml(word.german)}“</span></p>
      ${word.image ? `<p class="quiz-figure"><img src="${escapeHtml(imageUrl(word))}" alt=""></p>` : ''}
    </div>`;
}

function endHtml(game) {
  const { word, answer } = game;
  const won = game.status === 'won';
  return `
    <section class="guess-end" data-solution>
      <p class="result" data-end>${won ? `Richtig geraten!` : 'Alle Blütenblätter sind gefallen.'}</p>
      <p class="guess-answer"><strong lang="en">${escapeHtml(answer)}</strong> – <span lang="de">${escapeHtml(word.german)}</span></p>
      ${word.exampleEnglish ? `<p class="example"><span lang="en">${escapeHtml(word.exampleEnglish)}</span><span lang="de">${escapeHtml(word.exampleGerman)}</span></p>` : ''}
      ${word.image ? `<p class="quiz-figure"><img src="${escapeHtml(imageUrl(word))}" alt=""></p>` : ''}
      <div class="actions"><button class="primary" type="button" data-action="next">Nächstes Wort</button></div>
    </section>`;
}

function renderGame() {
  const { game } = state;
  const over = isOver(game);
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <header class="game-header">
      <div><p class="eyebrow">Wort ${state.played.size} dieser Sitzung</p><h1>Wort raten</h1></div>
      <div class="header-actions">
        <button type="button" data-action="settings">Einstellungen ändern</button>
      </div>
    </header>
    <p class="result" data-score>Gewonnen: ${state.session.won} · Verloren: ${state.session.lost}</p>
    ${flowerHtml(game)}
    <p class="result" data-misses>Fehlversuche: ${game.wrong.length} von ${game.maxMisses}</p>
    <ol class="guess-word" data-word aria-label="Zu erratendes Wort">${revealed(game).map((char, index) => slotHtml(char, index)).join('')}</ol>
    <div class="actions">
      <button type="button" data-action="hint" aria-expanded="${state.hint}">${state.hint ? 'Hinweis verbergen' : 'Hinweis anzeigen'}</button>
    </div>
    ${hintHtml(game)}
    <div class="guess-keyboard" data-keyboard aria-label="Bildschirmtastatur">${LETTERS.map(letter => keyHtml(game, letter)).join('')}</div>
    <p class="notice" data-feedback role="status" aria-live="polite">${escapeHtml(state.notice)}</p>
    ${over ? endHtml(game) : ''}`;
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
  document.querySelector('[data-action=hint]').addEventListener('click', () => { state.hint = !state.hint; renderGame(); });
  document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => move(guess(state.game, button.dataset.key))));
  const next = document.querySelector('[data-action=next]');
  if (next) next.addEventListener('click', startGame);
}

const NOTICES = {
  hit: 'Richtig!',
  repeat: letter => `„${letter.toUpperCase()}“ wurde schon versucht.`,
  miss: letter => `„${letter.toUpperCase()}“ kommt nicht im Wort vor.`
};

// Wendet einen Rateversuch an und rendert je nach Ergebnis neu.
function move(step) {
  if (step.result === 'ignored') return;
  if (step.result === 'won') state.session.won += 1;
  if (step.result === 'lost') state.session.lost += 1;
  state.game = step.game;
  if (step.result === 'hit') state.notice = NOTICES.hit;
  else if (step.result === 'miss') state.notice = NOTICES.miss(step.letter);
  else if (step.result === 'repeat') state.notice = NOTICES.repeat(step.letter);
  else if (step.result === 'won') state.notice = 'Gewonnen!';
  else if (step.result === 'lost') state.notice = 'Verloren — die Lösung steht unten.';
  renderGame();
}

// Buchstabentasten raten; Eingabefelder bleiben unberührt.
document.addEventListener('keydown', event => {
  if (!state.game || isOver(state.game)) return;
  if (event.target.closest('input, textarea, select')) return;
  if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    move(guess(state.game, event.key));
  }
});

async function initialise() {
  state.settings = loadSettings();
  try {
    state.items = guessingWords(validateVocabulary(await loadVocabulary(import.meta.env.BASE_URL)));
    renderSetup();
  } catch (error) {
    app.innerHTML = `<p class="notice warning" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

initialise();

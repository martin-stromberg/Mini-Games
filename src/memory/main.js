import { CARD_KIND, CARD_LANGUAGE, DEFAULT_PAIRS, PAIR_OPTIONS, STORAGE_KEY, countByLevel, createRound, flipCard, isFinished, memoryWords } from './game.js';
import { escapeHtml } from '../shared/html.js';
import { createRandomSource } from '../shared/random.js';
import { LEVELS, loadVocabulary, validateVocabulary } from '../shared/vocabulary.js';

const app = document.querySelector('#app');
const LANGUAGE_NAMES = { [CARD_LANGUAGE.ENGLISH]: 'Englisch', [CARD_LANGUAGE.GERMAN]: 'Deutsch' };

const state = {
  words: [],
  settings: { levels: new Set(LEVELS), pairs: DEFAULT_PAIRS, language: CARD_LANGUAGE.ENGLISH },
  round: null,
  message: '',
  rng: createRandomSource()
};

function loadSettings() {
  const defaults = { levels: new Set(LEVELS), pairs: DEFAULT_PAIRS, language: CARD_LANGUAGE.ENGLISH };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      levels: Array.isArray(stored?.levels) && stored.levels.length && stored.levels.every(level => LEVELS.includes(level)) ? new Set(stored.levels) : defaults.levels,
      pairs: PAIR_OPTIONS.includes(stored?.pairs) ? stored.pairs : defaults.pairs,
      language: Object.values(CARD_LANGUAGE).includes(stored?.language) ? stored.language : defaults.language
    };
  } catch {
    return defaults;
  }
}

function storeSettings() {
  const { levels, pairs, language } = state.settings;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels: [...levels], pairs, language })); } catch { /* Speicher nicht verfügbar: Einstellungen gelten nur für diesen Besuch. */ }
}

const imageUrl = word => `${import.meta.env.BASE_URL}${word.image}`;
const wordById = id => state.round.words.find(word => word.id === id);
const cardText = word => word[state.round.language];
const otherText = word => word[state.round.language === CARD_LANGUAGE.ENGLISH ? CARD_LANGUAGE.GERMAN : CARD_LANGUAGE.ENGLISH];

function setupStatus() {
  const { levels, pairs } = state.settings;
  const count = state.words.filter(word => levels.has(word.level)).length;
  if (!levels.size) return { blocked: true, text: 'Wähle mindestens ein Niveau aus, um eine Runde zu starten.' };
  if (count < pairs) return { blocked: true, text: `Für die gewählten Niveaus gibt es nur ${count} Vokabeln mit Bild; für ${pairs} Paare werden ${pairs} benötigt.` };
  return { blocked: false, text: `${count} Vokabeln mit Bild stehen zur Auswahl bereit.` };
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
    pairs: Number(document.querySelector('input[name=pairs]:checked').value),
    language: document.querySelector('input[name=language]:checked').value
  };
  storeSettings();
  updateSetupStatus();
}

function renderSetup() {
  const { levels, pairs, language } = state.settings;
  const counts = countByLevel(state.words);
  const { blocked, text } = setupStatus();
  const levelInputs = LEVELS.map(level => {
    const disabled = counts[level] === 0;
    return `<label class="${disabled ? 'muted' : ''}"><input data-level type="checkbox" value="${level}" ${levels.has(level) && !disabled ? 'checked' : ''} ${disabled ? 'disabled' : ''}> ${level} <small>(${counts[level] ? `${counts[level]} mit Bild` : 'noch keine Bilder'})</small></label>`;
  }).join('');
  const pairInputs = PAIR_OPTIONS.map(option => `<label><input type="radio" name="pairs" value="${option}" ${option === pairs ? 'checked' : ''}> ${option} Paare (${option * 2} Karten)</label>`).join('');
  const languageInputs = Object.values(CARD_LANGUAGE).map(option => `<label><input type="radio" name="language" value="${option}" ${option === language ? 'checked' : ''}> ${LANGUAGE_NAMES[option]}</label>`).join('');
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Englische Vokabeln</p>
      <h1>Memory</h1>
      <p>Finde die Paare aus Symbolbild und Wort. Es spielen nur Vokabeln mit, für die es ein Bild gibt.</p>
      ${state.message ? `<p class="notice warning" role="alert">${escapeHtml(state.message)}</p>` : ''}
      <fieldset><legend>GER-Niveaus</legend><div class="levels">${levelInputs}</div></fieldset>
      <fieldset><legend>Anzahl Paare</legend>${pairInputs}</fieldset>
      <fieldset><legend>Sprache der Wortkarten</legend>${languageInputs}</fieldset>
      <p class="notice ${blocked ? 'warning' : ''}" data-setup-status role="status">${escapeHtml(text)}</p>
      <button class="primary" data-action="start" ${blocked ? 'disabled' : ''}>Runde starten</button>
    </section>`;
  document.querySelectorAll('.setup input').forEach(input => input.addEventListener('change', readSetupInputs));
  document.querySelector('[data-action=start]').addEventListener('click', startRound);
}

// Lädt die Bilder der Runde vorab, damit sie beim Aufdecken sofort erscheinen.
function preloadImages(words) {
  for (const word of words) new Image().src = imageUrl(word);
}

function startRound() {
  try {
    const { levels, pairs, language } = state.settings;
    state.round = { ...createRound(state.words, { levels: [...levels], pairs, rng: state.rng }), language };
    preloadImages(state.round.words);
    state.message = 'Neue Runde gestartet. Decke zwei Karten auf und finde Bild und Wort, die zusammengehören.';
    renderGame();
  } catch (error) {
    state.message = error.message;
    renderSetup();
  }
}

function cardFace(card, word, matched) {
  if (card.kind === CARD_KIND.IMAGE) return `<img src="${escapeHtml(imageUrl(word))}" alt="" draggable="false">`;
  const translation = matched ? `<small>${escapeHtml(otherText(word))}</small>` : '';
  return `<span class="card-word" lang="${state.round.language === CARD_LANGUAGE.ENGLISH ? 'en' : 'de'}">${escapeHtml(cardText(word))}</span>${translation}`;
}

function cardLabel(card, word, index, open, matched) {
  const position = `Karte ${index + 1}`;
  if (!open) return `${position}, verdeckt`;
  const content = card.kind === CARD_KIND.IMAGE ? `Bild „${cardText(word)}“` : `Wort „${cardText(word)}“`;
  return `${position}: ${content}${matched ? ', gefunden' : ''}`;
}

function renderCard(card, index) {
  const word = wordById(card.pairId);
  const matched = state.round.matched.has(card.pairId);
  const open = matched || state.round.revealed.includes(index);
  // Zwei offene, nicht gefundene Karten sind ein Fehlversuch und bleiben bis zum nächsten Aufdecken sichtbar.
  const wrong = open && !matched && state.round.revealed.length === 2;
  const classes = ['card', `card-${card.kind}`, open ? 'open' : 'hidden', matched ? 'matched' : '', wrong ? 'wrong' : ''].filter(Boolean).join(' ');
  const face = open ? cardFace(card, word, matched) : '<span class="card-back" aria-hidden="true">?</span>';
  return `<li><button type="button" class="${classes}" data-card="${index}" aria-label="${escapeHtml(cardLabel(card, word, index, open, matched))}" ${matched ? 'aria-disabled="true"' : ''}>${face}</button></li>`;
}

function statusText() {
  const { matched, words, moves } = state.round;
  return `Gefundene Paare: ${matched.size} von ${words.length} · Züge: ${moves}`;
}

function renderGame(focusIndex = null) {
  const { cards, words, language } = state.round;
  const columns = cards.length <= 16 ? 4 : cards.length / 4;
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <header class="game-header">
      <div><p class="eyebrow">${words.length} Paare · Wörter auf ${LANGUAGE_NAMES[language]}</p><h1>Memory</h1></div>
      <div class="header-actions">
        <button type="button" data-action="settings">Einstellungen ändern</button>
        <button type="button" data-action="new-round">Neue Runde</button>
      </div>
    </header>
    <p class="notice" data-message role="status" aria-live="polite">${escapeHtml(state.message)}</p>
    <p class="result" data-progress>${statusText()}</p>
    <ul class="memory-board" data-memory-board style="--columns: ${columns}" aria-label="Spielfeld mit ${cards.length} Karten">${cards.map(renderCard).join('')}</ul>`;
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
  document.querySelector('[data-action=new-round]').addEventListener('click', startRound);
  document.querySelector('[data-memory-board]').addEventListener('click', event => {
    const button = event.target.closest('[data-card]');
    if (button) revealCard(Number(button.dataset.card));
  });
  if (focusIndex !== null) document.querySelector(`[data-card="${focusIndex}"]`)?.focus();
}

function revealCard(index) {
  const { round, result } = flipCard(state.round, index);
  if (result === 'ignored') return;
  state.round = round;
  const word = wordById(round.cards[index].pairId);
  if (result === 'first') state.message = 'Wähle eine zweite Karte.';
  if (result === 'mismatch') state.message = 'Kein Paar. Die beiden Karten werden beim nächsten Aufdecken wieder umgedreht.';
  if (result === 'match') {
    state.message = isFinished(round)
      ? `Geschafft! Alle ${round.words.length} Paare in ${round.moves} Zügen gefunden.`
      : `Paar gefunden: ${word.english} – ${word.german}.`;
  }
  renderGame(index);
}

async function initialise() {
  state.settings = loadSettings();
  try {
    state.words = memoryWords(validateVocabulary(await loadVocabulary(import.meta.env.BASE_URL)));
    renderSetup();
  } catch (error) {
    app.innerHTML = `<p class="notice warning" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

initialise();

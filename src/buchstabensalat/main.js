import { DEFAULT_WORD_COUNT, LENGTH_FILTERS, STORAGE_KEY, WORD_COUNT_OPTIONS, WORD_LENGTH, assembled, countByLevel, createRound, currentEntry, freeTiles, isFinished, matchesLength, placeLetter, removeLastLetter, removeLetter, resetWord, results, revealLetter, scrambleWords, skipWord, typeLetter } from './game.js';
import { escapeHtml } from '../shared/html.js';
import { createRandomSource } from '../shared/random.js';
import { LEVELS, loadVocabulary, validateVocabulary } from '../shared/vocabulary.js';

const app = document.querySelector('#app');
const LENGTH_LABELS = {
  [WORD_LENGTH.SHORT]: 'kurz (2–5 Buchstaben)',
  [WORD_LENGTH.MEDIUM]: 'mittel (6–9 Buchstaben)',
  [WORD_LENGTH.LONG]: 'lang (ab 10 Buchstaben)'
};

const state = {
  items: [],
  settings: { levels: new Set(LEVELS), count: DEFAULT_WORD_COUNT, lengths: new Set(LENGTH_FILTERS) },
  round: null,
  message: '',
  notice: '',
  rng: createRandomSource()
};

function loadSettings() {
  const defaults = { levels: new Set(LEVELS), count: DEFAULT_WORD_COUNT, lengths: new Set(LENGTH_FILTERS) };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      levels: Array.isArray(stored?.levels) && stored.levels.length && stored.levels.every(level => LEVELS.includes(level)) ? new Set(stored.levels) : defaults.levels,
      count: WORD_COUNT_OPTIONS.includes(stored?.count) ? stored.count : defaults.count,
      lengths: Array.isArray(stored?.lengths) && stored.lengths.length && stored.lengths.every(length => LENGTH_FILTERS.includes(length)) ? new Set(stored.lengths) : defaults.lengths
    };
  } catch {
    return defaults;
  }
}

function storeSettings() {
  const { levels, count, lengths } = state.settings;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels: [...levels], count, lengths: [...lengths] })); } catch { /* Speicher nicht verfügbar: Einstellungen gelten nur für diesen Besuch. */ }
}

const imageUrl = word => `${import.meta.env.BASE_URL}${word.image}`;
const pool = () => state.items.filter(item => state.settings.levels.has(item.word.level) && [...state.settings.lengths].some(length => matchesLength(item.answer, length)));

function setupStatus() {
  const { levels, count, lengths } = state.settings;
  if (!levels.size) return { blocked: true, text: 'Wähle mindestens ein Niveau aus, um eine Runde zu starten.' };
  if (!lengths.size) return { blocked: true, text: 'Wähle mindestens eine Wortlänge aus.' };
  const words = pool();
  if (words.length < count) return { blocked: true, text: `Für die Auswahl gibt es nur ${words.length} Wörter; für ${count} Wörter werden ${count} benötigt.` };
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
    count: Number(document.querySelector('input[name=count]:checked').value),
    lengths: new Set([...document.querySelectorAll('[data-length]:checked')].map(input => input.value))
  };
  storeSettings();
  updateSetupStatus();
}

function renderSetup() {
  const { levels, count, lengths } = state.settings;
  const counts = countByLevel(state.items);
  const { blocked, text } = setupStatus();
  const levelInputs = LEVELS.map(level => `<label><input data-level type="checkbox" value="${level}" ${levels.has(level) ? 'checked' : ''}> ${level} <small>(${counts[level]} Wörter)</small></label>`).join('');
  const countInputs = WORD_COUNT_OPTIONS.map(option => `<label><input type="radio" name="count" value="${option}" ${option === count ? 'checked' : ''}> ${option} Wörter</label>`).join('');
  const lengthInputs = LENGTH_FILTERS.map(length => `<label><input data-length type="checkbox" value="${length}" ${lengths.has(length) ? 'checked' : ''}> ${LENGTH_LABELS[length]}</label>`).join('');
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Englische Vokabeln</p>
      <h1>Buchstabensalat</h1>
      <p>Die Buchstaben eines englischen Wortes sind durcheinander. Lege sie in der richtigen Reihenfolge — per Klick, Tippen oder Tastatur. Die deutsche Übersetzung hilft dir.</p>
      ${state.message ? `<p class="notice warning" role="alert">${escapeHtml(state.message)}</p>` : ''}
      <fieldset><legend>GER-Niveaus</legend><div class="levels">${levelInputs}</div></fieldset>
      <fieldset><legend>Wörter pro Runde</legend>${countInputs}</fieldset>
      <fieldset><legend>Wortlänge</legend>${lengthInputs}</fieldset>
      <p class="notice ${blocked ? 'warning' : ''}" data-setup-status role="status">${escapeHtml(text)}</p>
      <button class="primary" data-action="start" ${blocked ? 'disabled' : ''}>Runde starten</button>
    </section>`;
  document.querySelectorAll('.setup input').forEach(input => input.addEventListener('change', readSetupInputs));
  document.querySelector('[data-action=start]').addEventListener('click', startRound);
}

// Lädt die Bilder der Runde vorab, damit sie beim Wort sofort erscheinen.
function preloadImages(round) {
  for (const entry of round.entries) if (entry.word.image) new Image().src = imageUrl(entry.word);
}

function startRound() {
  try {
    const { levels, count, lengths } = state.settings;
    state.round = createRound(state.items.map(item => item.word), { levels: [...levels], count, lengths: [...lengths], rng: state.rng });
    state.notice = '';
    preloadImages(state.round);
    renderWord();
  } catch (error) {
    state.message = error.message;
    renderSetup();
  }
}

const helpsUsed = round => round.entries.reduce((sum, entry) => sum + entry.helps, 0);

function slotHtml(entry, index) {
  const tileIndex = entry.slots[index];
  const fixed = entry.fixed[index];
  const letter = tileIndex === null ? '' : entry.tiles[tileIndex];
  const wrong = entry.wrong && tileIndex !== null && letter !== entry.answer[index];
  const classes = ['scramble-slot', tileIndex !== null ? 'filled' : '', fixed ? 'fixed' : '', wrong ? 'wrong' : ''].filter(Boolean).join(' ');
  const label = fixed ? `Position ${index + 1}: ${letter} (aufgedeckt)` : letter ? `Position ${index + 1}: ${letter} — zum Entfernen klicken` : `Position ${index + 1} leer`;
  return `<li><button type="button" class="${classes}" data-slot="${index}" aria-label="${escapeHtml(label)}" ${fixed || tileIndex === null ? 'disabled' : ''}><span lang="en">${escapeHtml(letter)}</span></button></li>`;
}

function tileHtml(entry, tileIndex) {
  const letter = entry.tiles[tileIndex];
  return `<li><button type="button" class="scramble-tile" data-tile="${tileIndex}" aria-label="Buchstabe ${escapeHtml(letter)}"><span lang="en">${escapeHtml(letter)}</span></button></li>`;
}

function renderWord() {
  const { round } = state;
  const entry = currentEntry(round);
  const { word } = entry;
  const helps = helpsUsed(round);
  const feedback = entry.wrong
    ? 'Das stimmt noch nicht — Buchstaben entfernen und erneut versuchen.'
    : state.notice;
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <header class="game-header">
      <div><p class="eyebrow">${round.entries.length} Wörter</p><h1>Buchstabensalat</h1></div>
      <div class="header-actions">
        <button type="button" data-action="settings">Einstellungen ändern</button>
        <button type="button" data-action="new-round">Neue Runde</button>
      </div>
    </header>
    <p class="result" data-progress>Wort ${round.position + 1} von ${round.entries.length} · Hilfen: ${helps}</p>
    <p class="scramble-hint" data-hint>Welches englische Wort steckt hinter <strong lang="de">„${escapeHtml(word.german)}“</strong>?</p>
    ${word.image ? `<p class="quiz-figure"><img src="${escapeHtml(imageUrl(word))}" alt=""></p>` : ''}
    <ol class="scramble-slots" data-slots aria-label="Gelegtes Wort">${entry.slots.map((tile, index) => slotHtml(entry, index)).join('')}</ol>
    <ol class="scramble-tiles" data-tiles aria-label="Buchstaben zum Legen">${freeTiles(entry).map(tileIndex => tileHtml(entry, tileIndex)).join('')}</ol>
    <p class="instructions">Klicke die Buchstaben in der richtigen Reihenfolge an oder tippe das Wort ein. Ein Klick auf einen gesetzten Buchstaben nimmt ihn zurück — die Rücktaste entfernt den letzten.</p>
    <div class="actions">
      <button type="button" data-action="reveal">Buchstaben aufdecken</button>
      <button type="button" data-action="reset">Zurücksetzen</button>
      <button type="button" data-action="skip">Überspringen</button>
    </div>
    <p class="notice ${entry.wrong ? 'warning' : ''}" data-feedback role="status" aria-live="polite">${escapeHtml(feedback)}</p>`;
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
  document.querySelector('[data-action=new-round]').addEventListener('click', startRound);
  document.querySelectorAll('[data-tile]').forEach(button => button.addEventListener('click', () => move(placeLetter(state.round, Number(button.dataset.tile)))));
  document.querySelectorAll('[data-slot]').forEach(button => button.addEventListener('click', () => move(removeLetter(state.round, Number(button.dataset.slot)))));
  document.querySelector('[data-action=reveal]').addEventListener('click', () => move(revealLetter(state.round)));
  document.querySelector('[data-action=reset]').addEventListener('click', () => move(resetWord(state.round)));
  document.querySelector('[data-action=skip]').addEventListener('click', skip);
}

// Wendet einen Zug an und rendert je nach Ergebnis neu.
function move(step) {
  if (step.result === 'ignored') return;
  const wasCorrect = step.result === 'correct';
  state.round = step.round;
  state.notice = '';
  if (isFinished(state.round)) {
    renderResult();
    return;
  }
  if (wasCorrect) {
    const solved = state.round.entries[state.round.position - 1];
    state.notice = `Richtig! „${solved.answer}" war die Lösung.`;
  }
  renderWord();
}

function skip() {
  const entry = currentEntry(state.round);
  const step = skipWord(state.round);
  if (step.result === 'ignored') return;
  state.round = step.round;
  state.notice = `Übersprungen — gesucht war „${entry.answer}".`;
  if (isFinished(state.round)) renderResult();
  else renderWord();
}

function entryResultHtml(entry) {
  const status = entry.state === 'skipped'
    ? 'übersprungen'
    : entry.helps > 0 ? `gelöst mit ${entry.helps} ${entry.helps === 1 ? 'Hilfe' : 'Hilfen'}` : 'gelöst';
  return `<li><strong lang="en">${escapeHtml(entry.answer)}</strong> – <span lang="de">${escapeHtml(entry.word.german)}</span><small>${status}</small></li>`;
}

function renderResult() {
  const { total, solved, helped, helps, skipped, entries } = results(state.round);
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Ergebnis</p>
      <h1>Buchstabensalat</h1>
      <p class="result" data-result>${solved} von ${total} Wörtern richtig gelegt · ${helps} ${helps === 1 ? 'Hilfe' : 'Hilfen'} genutzt · ${skipped} übersprungen</p>
      ${solved === total ? '<p>Alles richtig – starke Runde!</p>' : ''}
      ${helped === 0 && solved === total ? '<p>Ganz ohne Hilfe – perfekt!</p>' : ''}
      <h2>Wörter der Runde</h2>
      <ul class="mistakes" data-entries>${entries.map(entryResultHtml).join('')}</ul>
      <div class="actions">
        <button class="primary" data-action="new-round">Neue Runde</button>
        <button type="button" data-action="settings">Einstellungen ändern</button>
      </div>
    </section>`;
  document.querySelector('[data-action=new-round]').addEventListener('click', startRound);
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
}

// Buchstabentasten legen, Rücktaste entfernt den letzten freien Buchstaben; Eingabefelder bleiben unberührt.
document.addEventListener('keydown', event => {
  if (!state.round || isFinished(state.round)) return;
  if (event.target.closest('input, textarea, select')) return;
  if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    state.notice = '';
    move(typeLetter(state.round, event.key));
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    move(removeLastLetter(state.round));
  }
});

async function initialise() {
  state.settings = loadSettings();
  try {
    state.items = scrambleWords(validateVocabulary(await loadVocabulary(import.meta.env.BASE_URL)));
    renderSetup();
  } catch (error) {
    app.innerHTML = `<p class="notice warning" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

initialise();

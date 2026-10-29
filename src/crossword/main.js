import { DEFAULT_WORD_COUNT, DIRECTION, STORAGE_KEY, WORD_COUNT_OPTIONS, checkAnswers, completedWords, coordKey, countByLevel, createRound, crosswordWords, distinctGermanCount, firstEmptyIndex, initialAnswers, parseKey, revealWord, wordsAtCell } from './game.js';
import { escapeHtml } from '../shared/html.js';
import { createRandomSource } from '../shared/random.js';
import { LEVELS, loadVocabulary, validateVocabulary } from '../shared/vocabulary.js';

const app = document.querySelector('#app');
const DIRECTION_LABELS = { [DIRECTION.ACROSS]: 'Waagerecht', [DIRECTION.DOWN]: 'Senkrecht' };
const PART_LABELS = {
  noun: 'Substantiv',
  verb: 'Verb',
  adjective: 'Adjektiv',
  adverb: 'Adverb',
  preposition: 'Präposition',
  conjunction: 'Konjunktion',
  pronoun: 'Pronomen'
};
const ARROW_STEPS = { ArrowLeft: [0, -1, DIRECTION.ACROSS], ArrowRight: [0, 1, DIRECTION.ACROSS], ArrowUp: [-1, 0, DIRECTION.DOWN], ArrowDown: [1, 0, DIRECTION.DOWN] };

const state = {
  vocabulary: [],
  items: [],
  settings: { levels: new Set(LEVELS), count: DEFAULT_WORD_COUNT },
  round: null,
  answers: {},
  active: null,
  wrong: new Set(),
  revealed: new Set(),
  helps: 0,
  solved: false,
  message: '',
  rng: createRandomSource()
};

function loadSettings() {
  const defaults = { levels: new Set(LEVELS), count: DEFAULT_WORD_COUNT };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      levels: Array.isArray(stored?.levels) && stored.levels.length && stored.levels.every(level => LEVELS.includes(level)) ? new Set(stored.levels) : defaults.levels,
      count: WORD_COUNT_OPTIONS.includes(stored?.count) ? stored.count : defaults.count
    };
  } catch {
    return defaults;
  }
}

function storeSettings() {
  const { levels, count } = state.settings;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels: [...levels], count })); } catch { /* Speicher nicht verfügbar: Einstellungen gelten nur für diesen Besuch. */ }
}

const availableItems = () => state.items.filter(item => state.settings.levels.has(item.word.level));

function setupStatus() {
  const { levels, count } = state.settings;
  if (!levels.size) return { blocked: true, text: 'Wähle mindestens ein Niveau aus, um eine Runde zu starten.' };
  const available = distinctGermanCount(availableItems());
  if (available < count) return { blocked: true, text: `Für die Auswahl gibt es nur ${available} Wörter; für ${count} Wörter werden ${count} benötigt.` };
  return { blocked: false, text: `${available} Wörter stehen zur Auswahl bereit.` };
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
    count: Number(document.querySelector('input[name=count]:checked').value)
  };
  storeSettings();
  updateSetupStatus();
}

function renderSetup() {
  const { levels, count } = state.settings;
  const counts = countByLevel(state.items);
  const { blocked, text } = setupStatus();
  const levelInputs = LEVELS.map(level => `<label><input data-level type="checkbox" value="${level}" ${levels.has(level) ? 'checked' : ''}> ${level} <small>(${counts[level]} Wörter)</small></label>`).join('');
  const countInputs = WORD_COUNT_OPTIONS.map(option => `<label><input type="radio" name="count" value="${option}" ${option === count ? 'checked' : ''}> ${option} Wörter</label>`).join('');
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Englische Vokabeln</p>
      <h1>Kreuzworträtsel</h1>
      <p>Die deutschen Übersetzungen sind die Hinweise. Trage die englischen Wörter in das automatisch verkreuzte Gitter ein.</p>
      ${state.message ? `<p class="notice warning" role="alert">${escapeHtml(state.message)}</p>` : ''}
      <fieldset><legend>GER-Niveaus</legend><div class="levels">${levelInputs}</div></fieldset>
      <fieldset><legend>Wörter pro Runde</legend>${countInputs}</fieldset>
      <p class="notice ${blocked ? 'warning' : ''}" data-setup-status role="status">${escapeHtml(text)}</p>
      <button class="primary" data-action="start" ${blocked ? 'disabled' : ''}>Runde starten</button>
    </section>`;
  document.querySelectorAll('.setup input').forEach(input => input.addEventListener('change', readSetupInputs));
  document.querySelector('[data-action=start]').addEventListener('click', startRound);
}

const activeWord = () => state.round?.wordById[state.active?.wordId] ?? null;
const activeKey = () => activeWord()?.cells[state.active.index] ?? null;

function startRound() {
  try {
    state.round = createRound(state.vocabulary, { levels: [...state.settings.levels], count: state.settings.count, rng: state.rng });
    state.answers = initialAnswers(state.round);
    const first = state.round.words.find(word => word.direction === DIRECTION.ACROSS) ?? state.round.words[0];
    state.active = { wordId: first.id, index: firstEmptyIndex(state.round, state.answers, first) };
    state.wrong = new Set();
    state.revealed = new Set();
    state.helps = 0;
    state.solved = false;
    state.message = 'Neue Runde gestartet. Wähle ein Feld oder einen Hinweis und tippe das englische Wort.';
    renderGame(activeKey());
  } catch (error) {
    state.message = error.message;
    renderSetup();
  }
}

function updateSolved() {
  const result = checkAnswers(state.round, state.answers);
  if (result.solved && !state.solved) {
    state.solved = true;
    state.wrong.clear();
    state.message = 'Geschafft! Alle Wörter sind richtig eingetragen.';
  }
  return result;
}

function selectCell(key, { toggle = false, preferredDirection = null } = {}) {
  const options = wordsAtCell(state.round, key, preferredDirection ?? activeWord()?.direction);
  if (!options.length) return false;
  const current = state.active;
  let word = options[0];
  if (toggle && current && activeKey() === key) {
    word = options.find(option => option.id !== current.wordId) ?? word;
  } else if (current) {
    word = options.find(option => option.id === current.wordId) ?? options.find(option => option.direction === (preferredDirection ?? current.direction)) ?? word;
  }
  state.active = { wordId: word.id, index: word.cells.indexOf(key) };
  return true;
}

function selectWord(wordId) {
  const word = state.round.wordById[wordId];
  if (!word) return;
  state.active = { wordId, index: firstEmptyIndex(state.round, state.answers, word) };
  renderGame(word.cells[state.active.index]);
}

function toggleDirection() {
  const key = activeKey();
  if (!key) return;
  const options = wordsAtCell(state.round, key);
  const next = options.find(word => word.id !== state.active.wordId);
  if (!next) return;
  state.active = { wordId: next.id, index: next.cells.indexOf(key) };
  renderGame(key);
}

function cellLabel(key) {
  const cell = state.round.cells[key];
  const letter = state.answers[key] || 'leer';
  const words = cell.words.map(id => {
    const word = state.round.wordById[id];
    return `Wort ${word.number} ${DIRECTION_LABELS[word.direction]}`;
  }).join(' und ');
  return `Feld Zeile ${cell.row + 1}, Spalte ${cell.col + 1}, ${letter === 'leer' ? 'leer' : `Buchstabe ${letter}`}, ${words}`;
}

function squareClasses(key) {
  const classes = ['crossword-square'];
  const word = activeWord();
  if (word?.cells.includes(key)) classes.push('active');
  if (activeKey() === key) classes.push('current');
  if (state.wrong.has(key)) classes.push('wrong');
  if (state.revealed.has(word?.id) && word.cells.includes(key)) classes.push('revealed');
  if (state.solved) classes.push('solved');
  return classes.join(' ');
}

function renderBoard() {
  const cells = [];
  for (let row = 0; row < state.round.rows; row++) for (let col = 0; col < state.round.cols; col++) {
    const key = coordKey({ row, col });
    const cell = state.round.cells[key];
    if (!cell) {
      cells.push('<div class="crossword-square blocked" aria-hidden="true"></div>');
      continue;
    }
    const number = cell.number ? `<span class="clue-number" aria-hidden="true">${cell.number}</span>` : '';
    const value = state.answers[key] || '';
    cells.push(`
      <div class="${squareClasses(key)}" data-square="${key}">
        ${number}
        <input class="crossword-input" lang="en" data-cell="${key}" value="${escapeHtml(value)}" maxlength="1" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" tabindex="${key === activeKey() ? 0 : -1}" aria-label="${escapeHtml(cellLabel(key))}" ${state.wrong.has(key) ? 'aria-invalid="true"' : ''} ${state.solved ? 'disabled' : ''}>
      </div>`);
  }
  return `
    <p class="instructions" id="board-help">Klicke ein Feld oder einen Hinweis an und tippe die englischen Buchstaben. Erneutes Klicken wechselt die Richtung; Pfeiltasten bewegen, Rücktaste löscht.</p>
    <div class="crossword-board" data-board role="group" aria-label="Kreuzworträtsel, ${state.round.rows} Zeilen und ${state.round.cols} Spalten" aria-describedby="board-help" style="--cols:${state.round.cols};--rows:${state.round.rows}">${cells.join('')}</div>`;
}

function clueText(word) {
  const part = PART_LABELS[word.partOfSpeech] ?? word.partOfSpeech;
  return `${part ? `${part} · ` : ''}${word.level} · ${word.answer.length} Buchstaben`;
}

function renderClues(direction) {
  const ids = direction === DIRECTION.ACROSS ? state.round.across : state.round.down;
  const items = ids.map(id => {
    const word = state.round.wordById[id];
    const complete = word.cells.every(key => state.answers[key] === state.round.cells[key].letter);
    const active = state.active?.wordId === id;
    return `<li><button type="button" class="crossword-clue${active ? ' active' : ''}${complete ? ' complete' : ''}" data-clue="${id}" aria-current="${active}"><span class="clue-badge">${word.number}</span><span class="clue-text">${escapeHtml(word.clue)}</span><small>${escapeHtml(clueText(word))}</small></button></li>`;
  }).join('');
  return `<section class="clue-list"><h2>${DIRECTION_LABELS[direction]}</h2><ol class="crossword-clues">${items}</ol></section>`;
}

function renderActiveClue() {
  const word = activeWord();
  if (!word) return '';
  return `<p class="active-clue" data-active-clue><strong>${word.number} ${DIRECTION_LABELS[word.direction]}:</strong> ${escapeHtml(word.clue)}</p>`;
}

function renderResult() {
  const complete = completedWords(state.round, state.answers).length;
  const text = state.solved
    ? `Alle ${state.round.words.length} Wörter sind richtig. Hilfen: ${state.helps}`
    : `${complete} von ${state.round.words.length} Wörtern vollständig · Hilfen: ${state.helps}`;
  return `<p class="result" data-result>${text}</p>`;
}

function renderGame(focusKey = activeKey()) {
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <header class="game-header">
      <div><p class="eyebrow">${state.round.words.length} Wörter · ${state.round.rows}×${state.round.cols}</p><h1>Kreuzworträtsel</h1></div>
      <div class="header-actions">
        <button type="button" data-action="settings">Einstellungen ändern</button>
        <button type="button" data-action="new-round">Neue Runde</button>
      </div>
    </header>
    <p class="notice" data-message role="status" aria-live="polite">${escapeHtml(state.message)}</p>
    ${renderActiveClue()}
    <div class="game-layout crossword-layout">
      <section aria-label="Spielfeld">${renderBoard()}<div class="actions">
        <button type="button" data-action="check" ${state.solved ? 'disabled' : ''}>Prüfen</button>
        <button type="button" data-action="reveal" ${state.solved ? 'disabled' : ''}>Wort aufdecken</button>
      </div></section>
      <aside class="clue-columns" aria-label="Hinweise">${renderClues(DIRECTION.ACROSS)}${renderClues(DIRECTION.DOWN)}</aside>
    </div>
    ${renderResult()}`;
  bindGameEvents();
  if (focusKey) focusCell(focusKey);
}

function focusCell(key) {
  const input = document.querySelector(`[data-cell="${key}"]`);
  if (!input || input.disabled) return;
  input.focus({ preventScroll: true });
  input.select();
  requestAnimationFrame(() => input.scrollIntoView({ block: 'center', inline: 'nearest' }));
}

function moveActive(delta) {
  const word = activeWord();
  if (!word) return null;
  const index = Math.max(0, Math.min(word.cells.length - 1, state.active.index + delta));
  state.active = { wordId: word.id, index };
  return word.cells[index];
}

function moveSpatial(key, dr, dc, preferredDirection) {
  const { row, col } = parseKey(key);
  const next = coordKey({ row: row + dr, col: col + dc });
  if (!state.round.cells[next]) return null;
  selectCell(next, { preferredDirection });
  return next;
}

function handleInput(event) {
  if (state.solved) return;
  const input = event.target;
  const key = input.dataset.cell;
  if (!selectCell(key)) return;
  const letter = [...input.value.toUpperCase()].filter(char => /^[A-Z]$/.test(char)).at(-1);
  input.value = state.answers[key] || '';
  if (!letter) return;
  if (letter !== state.answers[key]) {
    state.answers[key] = letter;
    state.wrong.delete(key);
    state.message = '';
  }
  updateSolved();
  const focus = state.solved ? key : moveActive(1);
  renderGame(focus);
}

function handleBackspace(key) {
  if (state.answers[key]) {
    state.answers[key] = '';
    state.wrong.delete(key);
    return key;
  }
  const previous = moveActive(-1);
  if (previous && previous !== key) {
    state.answers[previous] = '';
    state.wrong.delete(previous);
    return previous;
  }
  return key;
}

function handleKeydown(event) {
  const key = event.target.dataset.cell;
  if (!key || state.solved) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'Backspace') {
    event.preventDefault();
    selectCell(key);
    renderGame(handleBackspace(key));
  } else if (event.key === 'Delete') {
    event.preventDefault();
    selectCell(key);
    state.answers[key] = '';
    state.wrong.delete(key);
    renderGame(key);
  } else if (ARROW_STEPS[event.key]) {
    event.preventDefault();
    selectCell(key);
    const [dr, dc, direction] = ARROW_STEPS[event.key];
    const next = moveSpatial(key, dr, dc, direction);
    if (next) renderGame(next);
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    const word = activeWord();
    state.active.index = event.key === 'Home' ? 0 : word.cells.length - 1;
    renderGame(word.cells[state.active.index]);
  } else if (event.key === ' ') {
    event.preventDefault();
    selectCell(key);
    toggleDirection();
  }
}

function checkRound() {
  const result = checkAnswers(state.round, state.answers);
  state.wrong = new Set(result.wrong);
  if (result.solved) {
    state.solved = true;
    state.message = 'Geschafft! Alle Wörter sind richtig eingetragen.';
  } else {
    const parts = [];
    if (result.wrong.length) parts.push(`${result.wrong.length} falsch ausgefüllte Feld${result.wrong.length === 1 ? '' : 'er'}`);
    if (result.empty) parts.push(`${result.empty} leere Feld${result.empty === 1 ? '' : 'er'}`);
    state.message = `Geprüft: ${parts.join(' und ')}.`;
  }
  renderGame(activeKey());
}

function revealActiveWord() {
  const word = activeWord();
  if (!word || state.solved) return;
  state.answers = revealWord(state.round, state.answers, word.id);
  state.revealed.add(word.id);
  state.helps += 1;
  for (const key of word.cells) state.wrong.delete(key);
  updateSolved();
  state.message = state.solved ? state.message : `Wort ${word.number} ${DIRECTION_LABELS[word.direction]} wurde aufgedeckt.`;
  renderGame(activeKey());
}

function bindGameEvents() {
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
  document.querySelector('[data-action=new-round]').addEventListener('click', startRound);
  document.querySelector('[data-action=check]').addEventListener('click', checkRound);
  document.querySelector('[data-action=reveal]').addEventListener('click', revealActiveWord);
  document.querySelectorAll('[data-clue]').forEach(button => button.addEventListener('click', () => selectWord(button.dataset.clue)));
  document.querySelectorAll('.crossword-input').forEach(input => {
    input.addEventListener('click', () => {
      selectCell(input.dataset.cell, { toggle: true });
      renderGame(activeKey());
    });
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeydown);
  });
}

async function initialise() {
  state.settings = loadSettings();
  try {
    state.vocabulary = validateVocabulary(await loadVocabulary(import.meta.env.BASE_URL));
    state.items = crosswordWords(state.vocabulary);
    renderSetup();
  } catch (error) {
    app.innerHTML = `<p class="notice warning" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

initialise();

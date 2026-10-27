import { DIFFICULTY, LEVELS, SIZE, WORDS_PER_ROUND, classifySlots, coordKey, generateRound, getHint, parseKey, seededRandom, straightPath, toSortedCellKeys, validateVocabulary } from './game.js';

const app = document.querySelector('#app');
const STORAGE_KEY = 'mini-games.word-search.levels';
const FOCUS_ATTRIBUTES = ['data-cell', 'data-action', 'data-edit', 'data-drag-replace', 'data-remove'];
const KIND_PRIORITY = { exact: 1, partial: 2, error: 3 };
const ARROW_STEPS = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };

const emptySlots = () => Array(WORDS_PER_ROUND).fill(null);
const emptyDraft = () => ({ cells: new Set(), editingIndex: null, dragReplaceIndex: null });

function createRandomSource() {
  const seed = new URLSearchParams(window.location.search).get('seed');
  return seed !== null && seed.trim() !== '' && Number.isFinite(Number(seed)) ? seededRandom(Number(seed)) : Math.random;
}

const state = {
  vocabulary: [],
  selectedLevels: new Set(LEVELS),
  difficulty: DIFFICULTY.EASY,
  round: null,
  slots: emptySlots(),
  draft: emptyDraft(),
  solved: null,
  hintCell: null,
  message: '',
  pointer: null,
  suppressClick: false,
  focusCell: '0,0',
  rng: createRandomSource()
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function readStoredLevels() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function storeLevels(levels) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...levels])); } catch { /* Speicher nicht verfügbar: Auswahl gilt nur für diesen Besuch. */ }
}

function loadLevels() {
  try {
    const parsed = JSON.parse(readStoredLevels());
    if (Array.isArray(parsed) && parsed.length && parsed.every(level => LEVELS.includes(level))) return new Set(parsed);
  } catch { /* Beschädigter Wert wird unten repariert. */ }
  storeLevels(LEVELS);
  return new Set(LEVELS);
}

const setMessage = text => { state.message = text; };
const hasOpenDraft = () => state.draft.cells.size > 0 || state.draft.editingIndex !== null;
const hasPendingAction = () => hasOpenDraft() || state.draft.dragReplaceIndex !== null;
const resetDraft = () => { state.draft = emptyDraft(); };
const resetResult = () => { state.solved = null; state.hintCell = null; };
const firstFreeSlot = () => state.slots.findIndex(slot => !slot);
const slotName = index => `Markierung ${index + 1}`;

function setupStatus() {
  const count = state.vocabulary.filter(item => state.selectedLevels.has(item.level)).length;
  const blocked = count < WORDS_PER_ROUND;
  let text = `${count} Wörter stehen zur Auswahl bereit.`;
  if (!state.selectedLevels.size) text = 'Wähle mindestens ein Niveau aus, um eine Runde zu starten.';
  else if (blocked) text = `Für die gewählten Niveaus gibt es nur ${count} Wörter; mindestens ${WORDS_PER_ROUND} werden benötigt. Wähle weitere Niveaus aus.`;
  return { count, blocked, text };
}

function updateLevelsFromInputs() {
  state.selectedLevels = new Set([...document.querySelectorAll('[data-level]:checked')].map(input => input.value));
  storeLevels(state.selectedLevels);
  const { blocked, text } = setupStatus();
  const status = document.querySelector('[data-setup-status]');
  status.textContent = text;
  status.classList.toggle('warning', blocked);
  document.querySelector('[data-action=start]').disabled = blocked;
}

function renderSetup() {
  const { blocked, text } = setupStatus();
  const levels = LEVELS.map(level => `<label><input data-level type="checkbox" value="${level}" ${state.selectedLevels.has(level) ? 'checked' : ''}> ${level}</label>`).join('');
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Englische Vokabeln</p>
      <h1>Wortsuchrätsel</h1>
      <p>Wähle die Niveaus für ${WORDS_PER_ROUND} gesuchte englische Wörter.</p>
      ${state.message ? `<p class="notice warning" role="alert">${escapeHtml(state.message)}</p>` : ''}
      <fieldset><legend>GER-Niveaus</legend><div class="levels">${levels}</div></fieldset>
      <fieldset>
        <legend>Schwierigkeit</legend>
        <label><input type="radio" name="difficulty" value="${DIFFICULTY.EASY}" ${state.difficulty === DIFFICULTY.EASY ? 'checked' : ''}> Einfach – waagerecht und senkrecht</label>
        <label><input type="radio" name="difficulty" value="${DIFFICULTY.HARD}" ${state.difficulty === DIFFICULTY.HARD ? 'checked' : ''}> Schwierig – zusätzlich diagonal</label>
      </fieldset>
      <p class="notice ${blocked ? 'warning' : ''}" data-setup-status role="status">${escapeHtml(text)}</p>
      <button class="primary" data-action="start" ${blocked ? 'disabled' : ''}>Runde starten</button>
    </section>`;
  document.querySelectorAll('[data-level]').forEach(input => input.addEventListener('change', updateLevelsFromInputs));
  document.querySelector('[data-action=start]').addEventListener('click', () => startRound(document.querySelector('input[name=difficulty]:checked').value));
}

function startRound(difficulty) {
  try {
    state.difficulty = difficulty;
    state.round = generateRound(state.vocabulary, [...state.selectedLevels], difficulty, state.rng);
    state.slots = emptySlots();
    resetDraft();
    resetResult();
    state.focusCell = '0,0';
    setMessage('Neue Runde gestartet. Markiere die gesuchten Wörter im Gitter.');
    renderGame();
  } catch (error) {
    setMessage(error.message);
    renderSetup();
  }
}

function slotKindsByCell() {
  const kinds = new Map();
  state.slots.forEach((slot, index) => {
    for (const key of slot || []) {
      const entry = kinds.get(key) || { count: 0, kind: null };
      entry.count += 1;
      const kind = state.solved?.classifications[index].kind;
      if (kind && (!entry.kind || KIND_PRIORITY[kind] > KIND_PRIORITY[entry.kind])) entry.kind = kind;
      kinds.set(key, entry);
    }
  });
  return kinds;
}

function cellClasses(key, marking) {
  const classes = ['cell'];
  if (marking) classes.push('marked');
  if (marking?.count > 1) classes.push('overlap');
  if (marking?.kind) classes.push(`result-${marking.kind}`);
  if (state.draft.cells.has(key)) classes.push('selected');
  if (state.hintCell === key) classes.push('hinted');
  return classes.join(' ');
}

function cellLabel(letter, row, col, key, marking) {
  const parts = [`Buchstabe ${letter}, Zeile ${row + 1}, Spalte ${col + 1}`];
  if (state.draft.cells.has(key)) parts.push('in der aktuellen Auswahl');
  if (marking) parts.push(marking.count > 1 ? `in ${marking.count} Markierungen` : 'markiert');
  if (state.hintCell === key) parts.push('Tipp-Feld');
  return parts.join(', ');
}

function renderBoard() {
  const markings = slotKindsByCell();
  const cells = state.round.grid.map((line, row) => line.map((letter, col) => {
    const key = coordKey({ row, col });
    const marking = markings.get(key);
    return `<button type="button" class="${cellClasses(key, marking)}" data-cell="${key}" tabindex="${key === state.focusCell ? 0 : -1}" aria-pressed="${state.draft.cells.has(key)}" aria-label="${cellLabel(letter, row, col, key, marking)}">${letter}</button>`;
  }).join('')).join('');
  return `
    <p class="instructions" id="board-help">Klicke die Buchstaben eines Wortes nacheinander an und wähle „Markierung übernehmen“ – oder ziehe mit gedrückter Maustaste bzw. dem Finger in einer geraden Linie über das Wort. Mit den Pfeiltasten bewegst du dich im Gitter, die Leertaste wählt ein Feld aus.</p>
    <div class="board" data-board role="group" aria-label="Buchstabengitter, ${SIZE} mal ${SIZE} Felder" aria-describedby="board-help">${cells}</div>`;
}

function draftStateText() {
  const { cells, editingIndex, dragReplaceIndex } = state.draft;
  if (dragReplaceIndex !== null) return `Ziehe über das Gitter, um ${slotName(dragReplaceIndex)} neu zu markieren.`;
  const count = `${cells.size} Feld${cells.size === 1 ? '' : 'er'}`;
  if (editingIndex !== null) return `${slotName(editingIndex)} wird geändert – noch nicht übernommen: ${count}.`;
  return cells.size ? `Noch nicht übernommen: ${count}.` : 'Keine offene Auswahl.';
}

function renderActions() {
  return `
    <p class="draft-state" data-draft-state>${escapeHtml(draftStateText())}</p>
    <div class="actions">
      <button type="button" data-action="commit" ${state.draft.cells.size ? '' : 'disabled'}>Markierung übernehmen</button>
      <button type="button" data-action="cancel" ${hasPendingAction() ? '' : 'disabled'}>Auswahl verwerfen</button>
      <button type="button" data-action="solve">Lösen</button>
      <button type="button" data-action="hint">Tipp</button>
    </div>`;
}

function renderTranslations() {
  const found = state.solved?.found ?? new Set();
  const items = state.round.targets.map(target => {
    const status = state.solved ? (found.has(target.id) ? 'found' : 'unfound') : '';
    return `<li class="${status}">${escapeHtml(target.german)} <small>${escapeHtml(target.level)}</small></li>`;
  }).join('');
  return `<h2>Gesuchte Übersetzungen</h2><ol class="translations">${items}</ol>`;
}

function slotText(index) {
  const slot = state.slots[index];
  if (!slot) return 'leer';
  if (!state.solved) return `${slot.length} Feld${slot.length === 1 ? '' : 'er'} markiert`;
  const classification = state.solved.classifications[index];
  if (classification.kind === 'exact') return classification.targetId ? 'korrekt' : 'korrekt, doppelt';
  return classification.kind === 'partial' ? 'unvollständig' : 'fehlerhaft';
}

function renderSlots() {
  const items = state.slots.map((slot, index) => {
    const name = slotName(index);
    const buttons = slot ? `
        <button type="button" data-edit="${index}" aria-label="${name} ändern">Ändern</button>
        <button type="button" data-drag-replace="${index}" aria-label="${name} neu ziehen">Neu ziehen</button>
        <button type="button" data-remove="${index}" aria-label="${name} entfernen">Entfernen</button>` : '';
    return `<li data-slot="${index}"><span>${name}: <strong>${slotText(index)}</strong></span>${buttons}</li>`;
  }).join('');
  return `<h2>Deine Markierungen</h2><ol class="slots">${items}</ol>`;
}

function renderResult() {
  const text = state.solved ? `${state.solved.found.size} von ${WORDS_PER_ROUND} Wörtern korrekt gefunden.` : 'Erst „Lösen“ prüft deine Markierungen.';
  return `<p class="result" data-result>${text}</p>`;
}

function focusedSelector() {
  const element = document.activeElement;
  if (!element || !app.contains(element)) return null;
  const attribute = FOCUS_ATTRIBUTES.find(name => element.hasAttribute(name));
  return attribute ? `[${attribute}="${element.getAttribute(attribute)}"]` : null;
}

function renderGame() {
  const selector = focusedSelector();
  const difficultyName = state.round.difficulty === DIFFICULTY.HARD ? 'Schwierig' : 'Einfach';
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <header class="game-header">
      <div><p class="eyebrow">${difficultyName}</p><h1>Wortsuchrätsel</h1></div>
      <div class="header-actions">
        <button type="button" data-action="settings">Einstellungen ändern</button>
        <button type="button" data-action="new-round">Neue Runde</button>
      </div>
    </header>
    <p class="notice" data-message role="status" aria-live="polite">${escapeHtml(state.message)}</p>
    <div class="game-layout">
      <section aria-label="Spielfeld">${renderBoard()}${renderActions()}</section>
      <aside>${renderTranslations()}${renderSlots()}${renderResult()}</aside>
    </div>`;
  bindGameEvents();
  restoreFocus(selector);
}

function restoreFocus(selector) {
  if (!selector) return;
  const target = document.querySelector(selector);
  if (target && !target.disabled) target.focus();
  else document.querySelector(`[data-cell="${state.focusCell}"]`)?.focus();
}

function storeSlot(index, cells, fullHint) {
  if (index < 0) {
    setMessage(`Alle ${WORDS_PER_ROUND} Markierungen sind belegt. ${fullHint}`);
    return false;
  }
  state.slots[index] = toSortedCellKeys(cells);
  resetDraft();
  resetResult();
  setMessage(`${slotName(index)} gespeichert.`);
  return true;
}

function commitDraft() {
  const { cells, editingIndex } = state.draft;
  if (!cells.size) return false;
  return storeSlot(editingIndex ?? firstFreeSlot(), cells, 'Ändere oder entferne eine Markierung oder verwirf die offene Auswahl.');
}

function cancelDraft() {
  resetDraft();
  state.hintCell = null;
  setMessage('Auswahl verworfen; deine gespeicherten Markierungen bleiben unverändert.');
}

function toggleCell(key) {
  const { cells } = state.draft;
  if (cells.has(key)) cells.delete(key); else cells.add(key);
  resetResult();
}

function handleDrag(start, end) {
  if (hasOpenDraft()) {
    setMessage('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du ziehst.');
    return;
  }
  const path = straightPath(start, end, state.round.difficulty);
  if (!path) {
    setMessage(state.round.difficulty === DIFFICULTY.EASY
      ? 'Im einfachen Modus kannst du nur waagerecht oder senkrecht ziehen.'
      : 'Ziehe in einer geraden Linie – waagerecht, senkrecht oder diagonal.');
    return;
  }
  storeSlot(state.draft.dragReplaceIndex ?? firstFreeSlot(), path, 'Entferne oder ändere zuerst eine Markierung.');
}

function solveRound() {
  if (state.draft.cells.size) {
    if (!commitDraft()) { renderGame(); return; }
  } else {
    resetDraft();
  }
  state.solved = classifySlots(state.slots, state.round.targets);
  state.hintCell = null;
  setMessage(state.solved.found.size === WORDS_PER_ROUND
    ? 'Geschafft! Alle Wörter sind korrekt markiert.'
    : 'Markierungen geprüft. Nicht gefundene Übersetzungen sind hervorgehoben.');
  renderGame();
}

function showHint() {
  if (hasOpenDraft()) {
    setMessage('Übernimm oder verwirf zuerst deine offene Auswahl, bevor du einen Tipp nutzt.');
    renderGame();
    return;
  }
  const hint = getHint(state.slots, state.round.targets);
  state.hintCell = hint.cell;
  const messages = {
    error: 'Tipp: Ein falsch markiertes Feld ist eingekreist.',
    missing: 'Tipp: Ein noch fehlendes Feld ist eingekreist.',
    none: 'Für den aktuellen Stand gibt es keinen weiteren Feldhinweis.'
  };
  setMessage(messages[hint.type]);
  renderGame();
}

function startEditSlot(index) {
  if (hasOpenDraft()) {
    setMessage('Übernimm oder verwirf zuerst deine offene Auswahl.');
  } else {
    state.draft = { cells: new Set(state.slots[index]), editingIndex: index, dragReplaceIndex: null };
    resetResult();
    setMessage(`${slotName(index)} wird geändert. Klicke Felder an oder ab und übernimm die Markierung.`);
  }
  renderGame();
}

function removeSlot(index) {
  state.slots[index] = null;
  if (state.draft.editingIndex === index || state.draft.dragReplaceIndex === index) resetDraft();
  resetResult();
  setMessage(`${slotName(index)} entfernt.`);
  renderGame();
}

function startDragReplace(index) {
  if (hasOpenDraft()) {
    setMessage('Übernimm oder verwirf zuerst deine offene Auswahl.');
  } else {
    state.draft = { ...emptyDraft(), dragReplaceIndex: index };
    state.hintCell = null;
    setMessage(`Ziehe jetzt über das Gitter: Die nächste gerade Linie ersetzt ${slotName(index)}.`);
  }
  renderGame();
}

function openSettings() {
  setMessage('');
  renderSetup();
}

function cellFromPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-cell]') ?? null;
}

function clearPreview() {
  document.querySelectorAll('.cell.preview').forEach(cell => cell.classList.remove('preview'));
}

function showPreview(start, end) {
  clearPreview();
  const path = straightPath(start, end, state.round.difficulty) ?? [start];
  for (const cell of path) document.querySelector(`[data-cell="${coordKey(cell)}"]`)?.classList.add('preview');
}

function handlePointerDown(event) {
  state.suppressClick = false;
  const button = event.target.closest('[data-cell]');
  if (!button || event.button > 0) return;
  try { button.releasePointerCapture?.(event.pointerId); } catch { /* Kein Capture aktiv. */ }
  state.pointer = { start: parseKey(button.dataset.cell) };
}

function handlePointerMove(event) {
  if (!state.pointer) return;
  const button = cellFromPoint(event);
  if (button) showPreview(state.pointer.start, parseKey(button.dataset.cell));
}

function handlePointerUp(event) {
  if (!state.pointer) return;
  const { start } = state.pointer;
  state.pointer = null;
  clearPreview();
  const button = cellFromPoint(event);
  if (!button || button.dataset.cell === coordKey(start)) return;
  state.suppressClick = true;
  handleDrag(start, parseKey(button.dataset.cell));
  renderGame();
}

function cancelPointer() {
  state.pointer = null;
  clearPreview();
}

function handleCellClick(event) {
  const button = event.target.closest('[data-cell]');
  if (!button) return;
  if (state.suppressClick && event.detail > 0) { state.suppressClick = false; return; }
  state.suppressClick = false;
  if (state.draft.dragReplaceIndex !== null) {
    setMessage(`Ziehe über das Gitter, um ${slotName(state.draft.dragReplaceIndex)} neu zu markieren, oder verwirf die Aktion.`);
  } else {
    toggleCell(button.dataset.cell);
    setMessage('Deine Auswahl wird erst beim Lösen geprüft.');
  }
  renderGame();
}

function handleBoardKeydown(event) {
  const step = ARROW_STEPS[event.key];
  const button = event.target.closest('[data-cell]');
  if (!step || !button) return;
  event.preventDefault();
  const { row, col } = parseKey(button.dataset.cell);
  const next = { row: Math.min(SIZE - 1, Math.max(0, row + step[0])), col: Math.min(SIZE - 1, Math.max(0, col + step[1])) };
  const target = document.querySelector(`[data-cell="${coordKey(next)}"]`);
  button.tabIndex = -1;
  target.tabIndex = 0;
  target.focus();
}

function handleBoardFocus(event) {
  const button = event.target.closest('[data-cell]');
  if (button) state.focusCell = button.dataset.cell;
}

function bindGameEvents() {
  document.querySelector('[data-action=settings]').addEventListener('click', openSettings);
  document.querySelector('[data-action=new-round]').addEventListener('click', () => startRound(state.round.difficulty));
  document.querySelector('[data-action=commit]').addEventListener('click', () => { commitDraft(); renderGame(); });
  document.querySelector('[data-action=cancel]').addEventListener('click', () => { cancelDraft(); renderGame(); });
  document.querySelector('[data-action=solve]').addEventListener('click', solveRound);
  document.querySelector('[data-action=hint]').addEventListener('click', showHint);
  document.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => startEditSlot(Number(button.dataset.edit))));
  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => removeSlot(Number(button.dataset.remove))));
  document.querySelectorAll('[data-drag-replace]').forEach(button => button.addEventListener('click', () => startDragReplace(Number(button.dataset.dragReplace))));
  const board = document.querySelector('[data-board]');
  board.addEventListener('pointerdown', handlePointerDown);
  board.addEventListener('pointermove', handlePointerMove);
  board.addEventListener('pointerup', handlePointerUp);
  board.addEventListener('pointercancel', cancelPointer);
  board.addEventListener('pointerleave', cancelPointer);
  board.addEventListener('click', handleCellClick);
  board.addEventListener('keydown', handleBoardKeydown);
  board.addEventListener('focusin', handleBoardFocus);
}

async function initialise() {
  state.selectedLevels = loadLevels();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/vocabulary.json`);
    if (!response.ok) throw new Error('Die Vokabeldatei konnte nicht geladen werden.');
    state.vocabulary = validateVocabulary(await response.json());
    renderSetup();
  } catch (error) {
    app.innerHTML = `<p class="notice warning" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

initialise();

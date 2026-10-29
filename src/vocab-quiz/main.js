import { DEFAULT_QUESTION_COUNT, OPTION_COUNT, QUESTION_COUNT_OPTIONS, QUESTION_TYPE, QUESTION_TYPES, STORAGE_KEY, advance, answerQuestion, answerLanguage, answerText, countByLevel, createRound, currentQuestion, hasImage, isAnswered, isFinished, results } from './game.js';
import { escapeHtml } from '../shared/html.js';
import { createRandomSource } from '../shared/random.js';
import { LEVELS, loadVocabulary, validateVocabulary } from '../shared/vocabulary.js';

const app = document.querySelector('#app');
const TYPE_LABELS = {
  [QUESTION_TYPE.EN_TO_DE]: 'Englisches Wort → deutsche Übersetzung',
  [QUESTION_TYPE.DE_TO_EN]: 'Deutsches Wort → englische Übersetzung',
  [QUESTION_TYPE.IMAGE_TO_EN]: 'Symbolbild → englisches Wort'
};

const state = {
  words: [],
  settings: { levels: new Set(LEVELS), count: DEFAULT_QUESTION_COUNT, types: new Set(QUESTION_TYPES) },
  round: null,
  message: '',
  rng: createRandomSource()
};

function loadSettings() {
  const defaults = { levels: new Set(LEVELS), count: DEFAULT_QUESTION_COUNT, types: new Set(QUESTION_TYPES) };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      levels: Array.isArray(stored?.levels) && stored.levels.length && stored.levels.every(level => LEVELS.includes(level)) ? new Set(stored.levels) : defaults.levels,
      count: QUESTION_COUNT_OPTIONS.includes(stored?.count) ? stored.count : defaults.count,
      types: Array.isArray(stored?.types) && stored.types.length && stored.types.every(type => QUESTION_TYPES.includes(type)) ? new Set(stored.types) : defaults.types
    };
  } catch {
    return defaults;
  }
}

function storeSettings() {
  const { levels, count, types } = state.settings;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels: [...levels], count, types: [...types] })); } catch { /* Speicher nicht verfügbar: Einstellungen gelten nur für diesen Besuch. */ }
}

const imageUrl = word => `${import.meta.env.BASE_URL}${word.image}`;
const selectedWords = () => state.words.filter(word => state.settings.levels.has(word.level));

function setupStatus() {
  const { levels, count, types } = state.settings;
  if (!levels.size) return { blocked: true, text: 'Wähle mindestens ein Niveau aus, um eine Runde zu starten.' };
  if (!types.size) return { blocked: true, text: 'Wähle mindestens einen Fragetyp aus.' };
  const pool = selectedWords();
  const images = pool.filter(hasImage);
  if (types.size === 1 && types.has(QUESTION_TYPE.IMAGE_TO_EN) && images.length < count) {
    return { blocked: true, text: `Für die gewählten Niveaus gibt es nur ${images.length} Vokabeln mit Bild; für ${count} Bildfragen werden ${count} benötigt.` };
  }
  if (pool.length < count) return { blocked: true, text: `Für die gewählten Niveaus gibt es nur ${pool.length} Vokabeln; für ${count} Fragen werden ${count} benötigt.` };
  const note = types.has(QUESTION_TYPE.IMAGE_TO_EN) && images.length < OPTION_COUNT ? ' Für Bildfragen fehlt der Bildbestand; sie werden durch Textfragen ersetzt.' : '';
  return { blocked: false, text: `${pool.length} Vokabeln stehen zur Auswahl bereit, davon ${images.length} mit Bild.${note}` };
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
    types: new Set([...document.querySelectorAll('[data-type]:checked')].map(input => input.value))
  };
  storeSettings();
  updateSetupStatus();
}

function renderSetup() {
  const { levels, count, types } = state.settings;
  const counts = countByLevel(state.words);
  const { blocked, text } = setupStatus();
  const levelInputs = LEVELS.map(level => `<label><input data-level type="checkbox" value="${level}" ${levels.has(level) ? 'checked' : ''}> ${level} <small>(${counts[level]} Vokabeln)</small></label>`).join('');
  const countInputs = QUESTION_COUNT_OPTIONS.map(option => `<label><input type="radio" name="count" value="${option}" ${option === count ? 'checked' : ''}> ${option} Fragen</label>`).join('');
  const typeInputs = QUESTION_TYPES.map(type => `<label><input data-type type="checkbox" value="${type}" ${types.has(type) ? 'checked' : ''}> ${TYPE_LABELS[type]}</label>`).join('');
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Englische Vokabeln</p>
      <h1>Vokabel-Quiz</h1>
      <p>Multiple Choice: Zu jeder Frage gibt es vier Antworten, genau eine ist richtig. Antworten per Klick, Tippen oder Taste 1–4.</p>
      ${state.message ? `<p class="notice warning" role="alert">${escapeHtml(state.message)}</p>` : ''}
      <fieldset><legend>GER-Niveaus</legend><div class="levels">${levelInputs}</div></fieldset>
      <fieldset><legend>Fragen pro Runde</legend>${countInputs}</fieldset>
      <fieldset><legend>Fragetypen</legend>${typeInputs}</fieldset>
      <p class="notice ${blocked ? 'warning' : ''}" data-setup-status role="status">${escapeHtml(text)}</p>
      <button class="primary" data-action="start" ${blocked ? 'disabled' : ''}>Runde starten</button>
    </section>`;
  document.querySelectorAll('.setup input').forEach(input => input.addEventListener('change', readSetupInputs));
  document.querySelector('[data-action=start]').addEventListener('click', startRound);
}

// Lädt die Bilder der Runde vorab, damit sie bei der Frage sofort erscheinen.
function preloadImages(round) {
  for (const question of round.questions) if (question.type === QUESTION_TYPE.IMAGE_TO_EN) new Image().src = imageUrl(question.word);
}

function startRound() {
  try {
    const { levels, count, types } = state.settings;
    state.round = createRound(state.words, { levels: [...levels], count, types: [...types], rng: state.rng });
    preloadImages(state.round);
    renderQuestion();
  } catch (error) {
    state.message = error.message;
    renderSetup();
  }
}

function promptHtml(question) {
  const { word } = question;
  if (question.type === QUESTION_TYPE.EN_TO_DE) return `<p class="quiz-prompt">Was heißt <strong lang="en">„${escapeHtml(word.english)}“</strong> auf Deutsch?</p>`;
  if (question.type === QUESTION_TYPE.DE_TO_EN) return `<p class="quiz-prompt">Was heißt <strong lang="de">„${escapeHtml(word.german)}“</strong> auf Englisch?</p>`;
  return `<p class="quiz-prompt">Welches englische Wort passt zum Bild?</p><p class="quiz-figure"><img src="${escapeHtml(imageUrl(word))}" alt=""></p>`;
}

function optionHtml(question, word, index, answered, chosen) {
  const isCorrect = index === question.correctIndex;
  const classes = ['quiz-option', answered && isCorrect ? 'correct' : '', answered && index === chosen && !isCorrect ? 'wrong' : ''].filter(Boolean).join(' ');
  const label = `Antwort ${index + 1}: ${answerText(question, word)}`;
  return `<li><button type="button" class="${classes}" data-option="${index}" aria-label="${escapeHtml(label)}" ${answered ? 'disabled' : ''}>
    <span class="option-number" aria-hidden="true">${index + 1}</span><span lang="${answerLanguage(question)}">${escapeHtml(answerText(question, word))}</span>
  </button></li>`;
}

function score(round) {
  return round.answers.filter((answer, index) => answer === round.questions[index].correctIndex).length;
}

function renderQuestion() {
  const { round } = state;
  const question = currentQuestion(round);
  const answered = isAnswered(round);
  const chosen = round.answers[round.position];
  const correct = question.options[question.correctIndex];
  const last = round.position + 1 === round.questions.length;
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <header class="game-header">
      <div><p class="eyebrow">${round.questions.length} Fragen</p><h1>Vokabel-Quiz</h1></div>
      <div class="header-actions">
        <button type="button" data-action="settings">Einstellungen ändern</button>
        <button type="button" data-action="new-round">Neue Runde</button>
      </div>
    </header>
    <p class="result" data-progress>Frage ${round.position + 1} von ${round.questions.length} · Richtig: ${score(round)}</p>
    ${promptHtml(question)}
    <ol class="quiz-options">${question.options.map((word, index) => optionHtml(question, word, index, answered, chosen)).join('')}</ol>
    <p class="notice" data-feedback role="status" aria-live="polite">${answered ? escapeHtml(feedbackText(chosen === question.correctIndex, question, correct)) : ''}</p>
    ${answered ? `<p class="example" data-example><span lang="de">${escapeHtml(question.word.exampleGerman)}</span><span lang="en">${escapeHtml(question.word.exampleEnglish)}</span></p>` : ''}
    ${answered ? `<button class="primary" data-action="next">${last ? 'Ergebnis anzeigen' : 'Weiter'}</button>` : ''}`;
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
  document.querySelector('[data-action=new-round]').addEventListener('click', startRound);
  document.querySelectorAll('[data-option]').forEach(button => button.addEventListener('click', () => chooseOption(Number(button.dataset.option))));
  document.querySelector('[data-action=next]')?.addEventListener('click', next);
  if (answered) document.querySelector('[data-action=next]')?.focus();
}

const feedbackText = (isCorrect, question, word) => isCorrect
  ? 'Richtig!'
  : `Falsch – richtig ist „${answerText(question, word)}“.`;

function chooseOption(index) {
  const step = answerQuestion(state.round, index);
  if (step.result === 'ignored') return;
  state.round = step.round;
  renderQuestion();
}

function next() {
  state.round = advance(state.round);
  if (isFinished(state.round)) renderResult();
  else renderQuestion();
}

function mistakeHtml({ question, chosen }) {
  const asked = question.type === QUESTION_TYPE.IMAGE_TO_EN ? 'Symbolbild' : question.type === QUESTION_TYPE.EN_TO_DE ? `„${escapeHtml(question.word.english)}“` : `„${escapeHtml(question.word.german)}“`;
  return `<li><strong lang="en">${escapeHtml(question.word.english)}</strong> – <span lang="de">${escapeHtml(question.word.german)}</span>
    <small>Gefragt: ${asked} · Deine Antwort: „${escapeHtml(answerText(question, chosen))}“</small></li>`;
}

function renderResult() {
  const { total, correct, mistakes } = results(state.round);
  app.innerHTML = `
    <a class="back" href="../../">← Mini-Games</a>
    <section class="setup">
      <p class="eyebrow">Ergebnis</p>
      <h1>Vokabel-Quiz</h1>
      <p class="result" data-result>${correct} von ${total} Fragen richtig beantwortet.</p>
      ${mistakes.length ? `<h2>Falsch beantwortet</h2><ul class="mistakes" data-mistakes>${mistakes.map(mistakeHtml).join('')}</ul>` : '<p>Alles richtig – starke Runde!</p>'}
      <div class="actions">
        <button class="primary" data-action="new-round">Neue Runde</button>
        <button type="button" data-action="settings">Einstellungen ändern</button>
      </div>
    </section>`;
  document.querySelector('[data-action=new-round]').addEventListener('click', startRound);
  document.querySelector('[data-action=settings]').addEventListener('click', () => { state.message = ''; renderSetup(); });
}

// Antworten per Taste 1–4, weiter per Enter oder Pfeil rechts; Eingabefelder bleiben unberührt.
document.addEventListener('keydown', event => {
  if (!state.round || isFinished(state.round)) return;
  if (event.target.closest('input, textarea, select')) return;
  const question = currentQuestion(state.round);
  if (!isAnswered(state.round) && /^[1-9]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    if (index < question.options.length) {
      event.preventDefault();
      chooseOption(index);
    }
  } else if (isAnswered(state.round) && (event.key === 'ArrowRight' || (event.key === 'Enter' && !event.target.closest('button')))) {
    event.preventDefault();
    next();
  }
});

async function initialise() {
  state.settings = loadSettings();
  try {
    state.words = validateVocabulary(await loadVocabulary(import.meta.env.BASE_URL));
    renderSetup();
  } catch (error) {
    app.innerHTML = `<p class="notice warning" role="alert">${escapeHtml(error.message)}</p>`;
  }
}

initialise();

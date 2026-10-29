import { LEVELS, germanKey } from '../shared/vocabulary.js';
import { shuffle } from '../shared/random.js';

export const QUESTION_COUNT_OPTIONS = [10, 20, 30];
export const DEFAULT_QUESTION_COUNT = 10;
export const OPTION_COUNT = 4;
export const QUESTION_TYPE = Object.freeze({ EN_TO_DE: 'en-to-de', DE_TO_EN: 'de-to-en', IMAGE_TO_EN: 'image-to-en' });
export const QUESTION_TYPES = Object.freeze(Object.values(QUESTION_TYPE));
export const STORAGE_KEY = 'mini-games.vocab-quiz.settings';

export const hasImage = entry => typeof entry?.image === 'string' && entry.image.trim().length > 0;
export const imageWords = vocabulary => vocabulary.filter(hasImage);

export function countByLevel(words) {
  const counts = Object.fromEntries(LEVELS.map(level => [level, 0]));
  for (const word of words) counts[word.level] += 1;
  return counts;
}

// Ein Eintrag ist eine Alternative zur Übersetzung eines anderen, wenn sich ihre deutschen
// Begriffe oder Synonyme überschneiden: Als falsche Antwort wäre er sonst ebenfalls richtig.
const meaningKeys = word => [word.german, ...(Array.isArray(word.synonyms) ? word.synonyms : [])].map(germanKey);
export const sameMeaning = (a, b) => {
  const keys = new Set(meaningKeys(a));
  return meaningKeys(b).some(key => keys.has(key));
};

export const answerText = (question, word) => question.type === QUESTION_TYPE.EN_TO_DE ? word.german : word.english;
export const answerLanguage = question => question.type === QUESTION_TYPE.EN_TO_DE ? 'de' : 'en';
const answerKey = (question, word) => question.type === QUESTION_TYPE.EN_TO_DE ? germanKey(word.german) : word.english.trim().toLowerCase();

// Kandidaten für falsche Antworten: nicht die richtige Vokabel, keine andere Frage der Runde
// und keine sinnverwandte Vokabel (gleiche Übersetzung oder Synonyme).
function distractorCandidates(question, pool, questionIds) {
  return pool.filter(candidate => candidate.id !== question.word.id
    && !questionIds.has(candidate.id)
    && !sameMeaning(question.word, candidate)
    && answerKey(question, candidate) !== answerKey(question, question.word));
}

// Bevorzugt Distraktoren gleicher Wortart und gleichen Themas, damit sie nicht offensichtlich falsch sind.
export function pickDistractors(question, pool, questionIds, rng, needed = OPTION_COUNT - 1) {
  const candidates = distractorCandidates(question, pool, questionIds);
  const partOfSpeech = question.word.partOfSpeech;
  const tiers = [
    candidates.filter(word => word.partOfSpeech === partOfSpeech && word.topic === question.word.topic),
    candidates.filter(word => word.partOfSpeech === partOfSpeech && word.topic !== question.word.topic),
    candidates.filter(word => word.partOfSpeech !== partOfSpeech)
  ];
  const picked = [];
  const taken = new Set([answerKey(question, question.word)]);
  for (const tier of tiers) for (const candidate of shuffle(tier, rng)) {
    if (picked.length === needed) return picked;
    const key = answerKey(question, candidate);
    if (taken.has(key)) continue;
    taken.add(key);
    picked.push(candidate);
  }
  throw new Error(`Nur ${picked.length} eindeutige falsche Antworten für „${question.word.english}“ verfügbar.`);
}

// Verteilt die Fragen gleichmäßig auf die gewählten Typen, sodass jeder Typ in der Runde vorkommt.
function questionSlots(count, types, rng) {
  const order = shuffle(types, rng);
  return shuffle(Array.from({ length: count }, (_, index) => order[index % order.length]), rng);
}

// Jede Vokabel kommt in einer Runde höchstens einmal vor, auch über deutsche Begriffe hinweg.
function uniqueWords(words) {
  const taken = new Set();
  return words.filter(word => {
    const keys = [word.english.trim().toLowerCase(), germanKey(word.german)];
    if (keys.some(key => taken.has(key))) return false;
    keys.forEach(key => taken.add(key));
    return true;
  });
}

export function createRound(vocabulary, { levels = LEVELS, count = DEFAULT_QUESTION_COUNT, types = QUESTION_TYPES, rng = Math.random } = {}) {
  if (!QUESTION_COUNT_OPTIONS.includes(count)) throw new Error(`Ungültige Anzahl Fragen: ${count}`);
  const chosenTypes = types.filter(type => QUESTION_TYPES.includes(type));
  if (!chosenTypes.length) throw new Error('Mindestens ein Fragetyp muss gewählt sein.');
  const pool = uniqueWords(shuffle(vocabulary.filter(word => levels.includes(word.level)), rng));
  const images = pool.filter(hasImage);
  const wantsImages = chosenTypes.includes(QUESTION_TYPE.IMAGE_TO_EN);
  if (wantsImages && chosenTypes.length === 1 && images.length < count) {
    throw new Error(`Für die gewählten Niveaus gibt es nur ${images.length} Vokabeln mit Bild; für ${count} Bildfragen werden ${count} benötigt.`);
  }
  if (pool.length < count) throw new Error(`Für die gewählten Niveaus gibt es nur ${pool.length} Vokabeln; für ${count} Fragen werden ${count} benötigt.`);

  // Bildfragen nur, wenn der Bildbestand für die Frage und drei falsche Antworten reicht;
  // überschüssige Bildplätze werden auf die übrigen Typen verteilt.
  const textTypes = chosenTypes.filter(type => type !== QUESTION_TYPE.IMAGE_TO_EN);
  let seen = 0;
  const slots = questionSlots(count, chosenTypes, rng).map((type, index) => {
    if (type !== QUESTION_TYPE.IMAGE_TO_EN) return type;
    seen += 1;
    return images.length >= OPTION_COUNT && seen <= images.length ? type : textTypes[index % textTypes.length];
  });

  // Jeder Fragetyp bekommt seinen Anteil an Wörtern ohne Überschneidung mit den anderen.
  const slotCounts = Object.fromEntries(chosenTypes.map(type => [type, 0]));
  slots.forEach(type => { slotCounts[type] += 1; });
  const imagePicks = images.slice(0, slotCounts[QUESTION_TYPE.IMAGE_TO_EN] ?? 0);
  const picked = new Set(imagePicks.map(word => word.id));
  const rest = pool.filter(word => !picked.has(word.id));
  const queues = { [QUESTION_TYPE.IMAGE_TO_EN]: imagePicks };
  let cursor = 0;
  for (const type of textTypes) {
    queues[type] = rest.slice(cursor, cursor + slotCounts[type]);
    cursor += slotCounts[type];
  }
  const questionIds = new Set([...imagePicks, ...rest.slice(0, cursor)].map(word => word.id));

  const questions = slots.map(type => {
    const word = queues[type].shift();
    const distractorPool = type === QUESTION_TYPE.IMAGE_TO_EN ? images : pool;
    const question = { word, type };
    const options = shuffle([word, ...pickDistractors(question, distractorPool, questionIds, rng)], rng);
    return { word, type, options, correctIndex: options.indexOf(word) };
  });
  return { questions, position: 0, answers: questions.map(() => null) };
}

export const currentQuestion = round => round.questions[round.position];
export const isAnswered = round => round.answers[round.position] !== null;
export const isFinished = round => round.position >= round.questions.length;

// Trägt die gewählte Antwort ein. Ergebnis: 'ignored' (schon beantwortet), 'correct' oder 'wrong'.
export function answerQuestion(round, optionIndex) {
  const question = currentQuestion(round);
  if (!question || isAnswered(round)) return { round, result: 'ignored' };
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) {
    throw new Error(`Keine Antwort an Position ${optionIndex}.`);
  }
  const answers = [...round.answers];
  answers[round.position] = optionIndex;
  return { round: { ...round, answers }, result: optionIndex === question.correctIndex ? 'correct' : 'wrong' };
}

export const advance = round => ({ ...round, position: Math.min(round.position + 1, round.questions.length) });

// Auswertung der Runde: Trefferzahl und die falsch beantworteten Vokabeln samt gewählter Antwort.
export function results(round) {
  const correct = round.questions.filter((question, index) => round.answers[index] === question.correctIndex).length;
  const mistakes = round.questions
    .map((question, index) => ({ question, chosen: question.options[round.answers[index]] }))
    .filter(({ question }, index) => round.answers[index] !== null && round.answers[index] !== question.correctIndex);
  return { total: round.questions.length, correct, mistakes };
}

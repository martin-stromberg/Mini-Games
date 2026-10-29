import { expect, test } from '@playwright/test';
import { DEFAULT_QUESTION_COUNT, OPTION_COUNT, QUESTION_TYPE, QUESTION_TYPES, STORAGE_KEY, answerText, createRound, imageWords } from '../src/vocab-quiz/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { levelFiles, vocabulary } from '../test/fixtures/rounds.js';

const QUIZ_PATH = 'games/vocab-quiz/';
const option = (page, index) => page.locator(`[data-option="${index}"]`);
const feedback = page => page.locator('[data-feedback]');
const progress = page => page.locator('[data-progress]');

// Erzeugt dieselbe Runde wie das Spiel mit ?seed=<seed> (Standardeinstellungen, erste Runde nach dem Laden).
const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });

async function openQuiz(page, { seed = 5, settings } = {}) {
  if (settings) {
    await page.goto(QUIZ_PATH);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(settings)]);
  }
  await page.goto(`${QUIZ_PATH}?seed=${seed}`);
  await page.getByRole('button', { name: 'Runde starten' }).click();
}

test.describe('Vokabel-Quiz: Einstellungen', () => {
  test('the overview links to the vocabulary quiz', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Vokabel-Quiz' }).click();
    await expect(page.getByRole('heading', { name: 'Vokabel-Quiz' })).toBeVisible();
    await expect(page).toHaveTitle('Vokabel-Quiz · Mini-Games');
  });

  test('the setup shows the vocabulary counts and all question types', async ({ page }) => {
    await page.goto(QUIZ_PATH);
    const images = imageWords(vocabulary).length;
    await expect(page.locator('[data-setup-status]')).toHaveText(`${vocabulary.length} Vokabeln stehen zur Auswahl bereit, davon ${images} mit Bild.`);
    await expect(page.locator('[data-level]')).toHaveCount(LEVELS.length);
    await expect(page.locator('[data-type]')).toHaveCount(QUESTION_TYPES.length);
  });

  test('question count and types are kept after a reload', async ({ page }) => {
    await page.goto(QUIZ_PATH);
    await page.getByLabel(/20 Fragen/).check();
    await page.getByLabel('Deutsches Wort → englische Übersetzung').uncheck();
    await page.reload();
    await expect(page.getByLabel(/20 Fragen/)).toBeChecked();
    await expect(page.getByLabel('Deutsches Wort → englische Übersetzung')).not.toBeChecked();
    await page.getByRole('button', { name: 'Runde starten' }).click();
    await expect(page.locator('[data-progress]')).toHaveText('Frage 1 von 20 · Richtig: 0');
  });

  test('the start is blocked when only image questions are chosen without enough images', async ({ page }) => {
    const fewImages = [...levelFiles.A1.filter(entry => entry.image).slice(0, 5), ...levelFiles.A1.filter(entry => !entry.image).slice(0, 10)];
    await page.route('**/data/vocabulary/a1.json', route => route.fulfill({ json: fewImages }));
    for (const level of LEVELS.slice(1)) await page.route(`**/data/vocabulary/${level.toLowerCase()}.json`, route => route.fulfill({ json: [] }));
    await page.goto(QUIZ_PATH);
    await page.getByLabel('Englisches Wort → deutsche Übersetzung').uncheck();
    await page.getByLabel('Deutsches Wort → englische Übersetzung').uncheck();
    await expect(page.locator('[data-setup-status]')).toHaveText('Für die gewählten Niveaus gibt es nur 5 Vokabeln mit Bild; für 10 Bildfragen werden 10 benötigt.');
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeDisabled();
    await page.getByLabel('Englisches Wort → deutsche Übersetzung').check();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeEnabled();
  });
});

test.describe('Vokabel-Quiz: Spielablauf', () => {
  test('a round starts with the first question and four options', async ({ page }) => {
    await openQuiz(page);
    await expect(page.locator('[data-option]')).toHaveCount(OPTION_COUNT);
    await expect(progress(page)).toHaveText(`Frage 1 von ${DEFAULT_QUESTION_COUNT} · Richtig: 0`);
    await expect(page.locator('.quiz-prompt')).toBeVisible();
  });

  test('the right answer is confirmed and shows the example sentence', async ({ page }) => {
    const round = roundFor(5);
    const question = round.questions[0];
    await openQuiz(page, { seed: 5 });
    await option(page, question.correctIndex).click();
    await expect(feedback(page)).toHaveText('Richtig!');
    await expect(option(page, question.correctIndex)).toHaveClass(/correct/);
    await expect(page.locator('[data-example]')).toContainText(question.word.exampleGerman);
    await expect(page.locator('[data-example]')).toContainText(question.word.exampleEnglish);
    await expect(page.getByRole('button', { name: 'Weiter' })).toBeFocused();
  });

  test('a wrong answer is marked and the correct one is revealed', async ({ page }) => {
    const round = roundFor(5);
    const question = round.questions[0];
    const wrongIndex = (question.correctIndex + 1) % OPTION_COUNT;
    const correct = question.options[question.correctIndex];
    await openQuiz(page, { seed: 5 });
    await option(page, wrongIndex).click();
    await expect(feedback(page)).toHaveText(`Falsch – richtig ist „${answerText(question, correct)}“.`);
    await expect(option(page, wrongIndex)).toHaveClass(/wrong/);
    await expect(option(page, question.correctIndex)).toHaveClass(/correct/);
  });

  test('answers can be chosen with keys 1-4 and Enter advances', async ({ page }) => {
    const round = roundFor(7);
    await openQuiz(page, { seed: 7 });
    await page.keyboard.press(String(round.questions[0].correctIndex + 1));
    await expect(feedback(page)).toHaveText('Richtig!');
    await page.keyboard.press('Enter');
    await expect(progress(page)).toHaveText(`Frage 2 von ${DEFAULT_QUESTION_COUNT} · Richtig: 1`);
  });

  test('finishing a round shows the score and the mistakes list', async ({ page }) => {
    const round = roundFor(9);
    const wrongIndexes = new Set([1, 3]);
    await openQuiz(page, { seed: 9 });
    for (const question of round.questions) {
      const index = round.questions.indexOf(question);
      const choice = wrongIndexes.has(index) ? (question.correctIndex + 1) % OPTION_COUNT : question.correctIndex;
      await option(page, choice).click();
      await page.getByRole('button', { name: index + 1 === round.questions.length ? 'Ergebnis anzeigen' : 'Weiter' }).click();
    }
    await expect(page.locator('[data-result]')).toHaveText(`${DEFAULT_QUESTION_COUNT - wrongIndexes.size} von ${DEFAULT_QUESTION_COUNT} Fragen richtig beantwortet.`);
    const mistakes = page.locator('[data-mistakes] li');
    await expect(mistakes).toHaveCount(wrongIndexes.size);
    for (const index of wrongIndexes) {
      const word = round.questions[index].word;
      await expect(page.locator('[data-mistakes]')).toContainText(`${word.english} – ${word.german}`);
    }
    await page.getByRole('button', { name: 'Neue Runde' }).click();
    await expect(progress(page)).toHaveText(`Frage 1 von ${DEFAULT_QUESTION_COUNT} · Richtig: 0`);
  });

  test('german words can be asked for their english translation', async ({ page }) => {
    const round = roundFor(6, { types: [QUESTION_TYPE.DE_TO_EN] });
    const question = round.questions[0];
    await openQuiz(page, { seed: 6, settings: { levels: LEVELS, count: DEFAULT_QUESTION_COUNT, types: [QUESTION_TYPE.DE_TO_EN] } });
    await expect(page.locator('.quiz-prompt')).toContainText(`„${question.word.german}“`);
    await expect(option(page, question.correctIndex)).toContainText(question.word.english);
  });

  test('image questions show a picture and english options', async ({ page }) => {
    const round = roundFor(8, { types: [QUESTION_TYPE.IMAGE_TO_EN] });
    const question = round.questions[0];
    await openQuiz(page, { seed: 8, settings: { levels: LEVELS, count: DEFAULT_QUESTION_COUNT, types: [QUESTION_TYPE.IMAGE_TO_EN] } });
    const image = page.locator('.quiz-figure img');
    await expect(image).toHaveAttribute('src', new RegExp(`${question.word.image}$`));
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    for (const [index, word] of question.options.entries()) await expect(option(page, index)).toContainText(word.english);
  });

  test('settings can be changed from a running round', async ({ page }) => {
    await openQuiz(page);
    await page.getByRole('button', { name: 'Einstellungen ändern' }).click();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeVisible();
  });
});

test.describe('Vokabel-Quiz: Smartphone', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('a question with four options fits a phone screen without horizontal scrolling', async ({ page }) => {
    await openQuiz(page);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const first = await option(page, 0).boundingBox();
    expect(first.width).toBeGreaterThanOrEqual(300);
  });
});

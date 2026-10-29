import { expect, test } from '@playwright/test';
import { DEFAULT_MISSES, LENGTH_FILTERS, LETTERS, MISS_OPTIONS, STORAGE_KEY, createGame } from '../src/wort-raten/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { vocabulary } from '../test/fixtures/rounds.js';

const GAME_PATH = 'games/wort-raten/';
const key = (page, letter) => page.locator(`[data-key="${letter}"]`);
const keys = page => page.locator('[data-key]');
const slots = page => page.locator('[data-word] .guess-slot');
const misses = page => page.locator('[data-misses]');
const petals = page => page.locator('[data-flower] .petal:not(.lost)');
const fallen = page => page.locator('[data-flower] .petal.lost');
const feedback = page => page.locator('[data-feedback]');
const score = page => page.locator('[data-score]');
const hint = page => page.locator('[data-hint]');

// Erzeugt dieselbe Wortfolge wie das Spiel mit ?seed=<seed> (erste Wörter nach dem Laden).
const gameFor = (seed, options = {}) => createGame(vocabulary, { rng: seededRandom(seed), ...options });

function gamesFor(seed, count, options = {}) {
  const rng = seededRandom(seed);
  const games = [];
  for (let index = 0; index < count; index++) games.push(createGame(vocabulary, { rng, ...options, exclude: games.map(game => game.answer) }));
  return games;
}

const lettersIn = answer => [...new Set(answer.replace(/[^a-z]/g, ''))];
const wrongLetters = answer => LETTERS.filter(letter => !answer.includes(letter));

async function openGame(page, { seed = 5, settings } = {}) {
  if (settings) {
    await page.goto(GAME_PATH);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(settings)]);
  }
  await page.goto(`${GAME_PATH}?seed=${seed}`);
  await page.getByRole('button', { name: 'Spiel starten' }).click();
}

test.describe('Wort raten: Einstellungen', () => {
  test('the overview links to the word guessing game', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Wort raten' }).click();
    await expect(page.getByRole('heading', { name: 'Wort raten' })).toBeVisible();
    await expect(page).toHaveTitle('Wort raten · Mini-Games');
  });

  test('the setup shows levels, length filters and miss options', async ({ page }) => {
    await page.goto(GAME_PATH);
    await expect(page.locator('[data-level]')).toHaveCount(LEVELS.length);
    await expect(page.locator('[data-length]')).toHaveCount(LENGTH_FILTERS.length);
    await expect(page.locator('input[name=misses]')).toHaveCount(MISS_OPTIONS.length);
    await expect(page.getByLabel(`${DEFAULT_MISSES} Fehlversuche (mittel)`)).toBeChecked();
    await expect(page.locator('[data-setup-status]')).toContainText('Wörter stehen zur Auswahl bereit');
  });

  test('settings are kept after a reload', async ({ page }) => {
    await page.goto(GAME_PATH);
    await page.getByLabel(/10 Fehlversuche/).check();
    await page.getByLabel('A2').uncheck();
    await page.getByLabel(/lang \(/).uncheck();
    await page.reload();
    await expect(page.getByLabel(/10 Fehlversuche/)).toBeChecked();
    await expect(page.getByLabel('A2')).not.toBeChecked();
    await expect(page.getByLabel(/lang \(/)).not.toBeChecked();
    await expect(page.locator('[data-setup-status]')).toContainText('Wörter stehen zur Auswahl bereit');
  });

  test('the start is blocked when no level is selected', async ({ page }) => {
    await page.goto(GAME_PATH);
    for (const level of LEVELS) await page.getByLabel(level).uncheck();
    await expect(page.locator('[data-setup-status]')).toContainText('mindestens ein Niveau');
    await expect(page.getByRole('button', { name: 'Spiel starten' })).toBeDisabled();
  });
});

test.describe('Wort raten: Spielablauf', () => {
  test('a game shows placeholders, the keyboard, the flower and the miss counter', async ({ page }) => {
    const game = gameFor(5);
    await openGame(page, { seed: 5 });
    await expect(score(page)).toHaveText('Gewonnen: 0 · Verloren: 0');
    await expect(slots(page)).toHaveCount(game.answer.length);
    await expect(keys(page)).toHaveCount(26);
    await expect(petals(page)).toHaveCount(DEFAULT_MISSES);
    await expect(fallen(page)).toHaveCount(0);
    await expect(misses(page)).toHaveText(`Fehlversuche: 0 von ${DEFAULT_MISSES}`);
    await expect(hint(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Hinweis anzeigen' }).click();
    await expect(hint(page)).toContainText(game.word.german);
    await page.getByRole('button', { name: 'Hinweis verbergen' }).click();
    await expect(hint(page)).toHaveCount(0);
  });

  test('a correct key press reveals the letter everywhere and disables the key', async ({ page }) => {
    const game = gameFor(7);
    const letter = lettersIn(game.answer)[0];
    await openGame(page, { seed: 7 });
    await key(page, letter).click();
    await expect(key(page, letter)).toBeDisabled();
    await expect(key(page, letter)).toHaveClass(/hit/);
    await expect(feedback(page)).toHaveText('Richtig!');
    const positions = [...game.answer].map((char, index) => (char === letter ? index : -1)).filter(index => index >= 0);
    for (const index of positions) await expect(slots(page).nth(index)).toHaveText(letter.toUpperCase());
  });

  test('a wrong guess costs a petal and counts the miss', async ({ page }) => {
    const game = gameFor(9);
    const letter = wrongLetters(game.answer)[0];
    await openGame(page, { seed: 9 });
    await key(page, letter).click();
    await expect(key(page, letter)).toHaveClass(/miss/);
    await expect(misses(page)).toHaveText(`Fehlversuche: 1 von ${DEFAULT_MISSES}`);
    await expect(petals(page)).toHaveCount(DEFAULT_MISSES - 1);
    await expect(fallen(page)).toHaveCount(1);
    await expect(feedback(page)).toHaveText(`„${letter.toUpperCase()}“ kommt nicht im Wort vor.`);
    await page.keyboard.press(letter);
    await expect(feedback(page)).toHaveText(`„${letter.toUpperCase()}“ wurde schon versucht.`);
    await expect(misses(page)).toHaveText(`Fehlversuche: 1 von ${DEFAULT_MISSES}`);
  });

  test('the physical keyboard guesses letters case-insensitively', async ({ page }) => {
    const game = gameFor(11);
    const letter = lettersIn(game.answer)[0];
    await openGame(page, { seed: 11 });
    await page.keyboard.press(letter.toUpperCase());
    await expect(key(page, letter)).toBeDisabled();
    await expect(feedback(page)).toHaveText('Richtig!');
  });

  test('spaces and hyphens of phrases are shown directly', async ({ page }) => {
    let seed = 1;
    while (!/[ -]/.test(gameFor(seed).answer) && seed < 500) seed++;
    const game = gameFor(seed);
    await openGame(page, { seed });
    for (const [index, char] of [...game.answer].entries()) {
      if (char === ' ') await expect(slots(page).nth(index)).toHaveClass(/gap/);
      if (char === '-') await expect(slots(page).nth(index)).toHaveText('-');
    }
  });

  test('guessing all letters wins and shows word, translation and example', async ({ page }) => {
    const game = gameFor(13);
    await openGame(page, { seed: 13 });
    for (const letter of lettersIn(game.answer)) await key(page, letter).click();
    await expect(page.locator('[data-end]')).toHaveText('Richtig geraten!');
    await expect(score(page)).toHaveText('Gewonnen: 1 · Verloren: 0');
    await expect(page.locator('[data-solution]')).toContainText(`${game.answer} – ${game.word.german}`);
    await expect(page.locator('[data-solution]')).toContainText(game.word.exampleEnglish);
    await expect(keys(page).first()).toBeDisabled();
  });

  test('reaching the miss limit loses and reveals the solution', async ({ page }) => {
    const settings = { levels: LEVELS, lengths: LENGTH_FILTERS, misses: 6 };
    const game = gameFor(15, { misses: 6 });
    await openGame(page, { seed: 15, settings });
    await expect(petals(page)).toHaveCount(6);
    for (const letter of wrongLetters(game.answer).slice(0, 6)) await page.keyboard.press(letter);
    await expect(page.locator('[data-end]')).toHaveText('Alle Blütenblätter sind gefallen.');
    await expect(score(page)).toHaveText('Gewonnen: 0 · Verloren: 1');
    await expect(page.locator('[data-solution]')).toContainText(`${game.answer} – ${game.word.german}`);
    await expect(petals(page)).toHaveCount(0);
    await expect(fallen(page)).toHaveCount(6);
  });

  test('the next word keeps the session score and avoids repeats', async ({ page }) => {
    const [first, second] = gamesFor(17, 2);
    await openGame(page, { seed: 17 });
    for (const letter of lettersIn(first.answer)) await key(page, letter).click();
    await page.getByRole('button', { name: 'Nächstes Wort' }).click();
    await expect(page.locator('.eyebrow')).toHaveText('Wort 2 dieser Sitzung');
    await expect(score(page)).toHaveText('Gewonnen: 1 · Verloren: 0');
    await expect(slots(page)).toHaveCount(second.answer.length);
    await expect(misses(page)).toHaveText(`Fehlversuche: 0 von ${DEFAULT_MISSES}`);
    await expect(keys(page).first()).toBeEnabled();
    expect(second.answer).not.toBe(first.answer);
  });

  test('a word with a symbol image shows the picture inside the hint', async ({ page }) => {
    let seed = 1;
    while (!gameFor(seed).word.image && seed < 500) seed++;
    const game = gameFor(seed);
    await openGame(page, { seed });
    await page.getByRole('button', { name: 'Hinweis anzeigen' }).click();
    const image = hint(page).locator('.quiz-figure img');
    await expect(image).toHaveAttribute('src', new RegExp(`${game.word.image}$`));
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  });

  test('settings can be changed from a running game', async ({ page }) => {
    await openGame(page);
    await page.getByRole('button', { name: 'Einstellungen ändern' }).click();
    await expect(page.getByRole('button', { name: 'Spiel starten' })).toBeVisible();
  });
});

test.describe('Wort raten: Smartphone', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('the game fits a phone screen without horizontal scrolling', async ({ page }) => {
    await openGame(page);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const box = await page.locator('[data-keyboard]').boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });
});

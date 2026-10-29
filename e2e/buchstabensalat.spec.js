import { expect, test } from '@playwright/test';
import { DEFAULT_WORD_COUNT, LENGTH_FILTERS, STORAGE_KEY, WORD_COUNT_OPTIONS, createRound, freeTiles } from '../src/buchstabensalat/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { vocabulary } from '../test/fixtures/rounds.js';

const GAME_PATH = 'games/buchstabensalat/';
const slot = (page, index) => page.locator(`[data-slot="${index}"]`);
const tile = (page, index) => page.locator(`[data-tile="${index}"]`);
const slots = page => page.locator('.scramble-slot');
const tiles = page => page.locator('.scramble-tile');
const progress = page => page.locator('[data-progress]');
const feedback = page => page.locator('[data-feedback]');
const hint = page => page.locator('[data-hint]');

// Erzeugt dieselbe Runde wie das Spiel mit ?seed=<seed> (Standardeinstellungen, erste Runde nach dem Laden).
const roundFor = (seed, options = {}) => createRound(vocabulary, { rng: seededRandom(seed), ...options });

// Kachelreihenfolge, die die Lösung ergibt: pro Lösungsbuchstabe die erste freie passende Kachel.
function correctOrder(entry) {
  const used = new Set();
  return [...entry.answer].map(letter => {
    const index = entry.tiles.findIndex((tile, i) => tile === letter && !used.has(i));
    used.add(index);
    return index;
  });
}

// Kachelreihenfolge, die ein falsches Wort legt (existiert immer bei ≥ 2 verschiedenen Buchstaben).
function wrongOrder(entry) {
  const order = correctOrder(entry);
  for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) {
    const swapped = [...order];
    [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
    if (swapped.map(index => entry.tiles[index]).join('') !== entry.answer) return swapped;
  }
  throw new Error(`Keine falsche Anordnung für „${entry.answer}“ gefunden.`);
}

async function openGame(page, { seed = 5, settings } = {}) {
  if (settings) {
    await page.goto(GAME_PATH);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(settings)]);
  }
  await page.goto(`${GAME_PATH}?seed=${seed}`);
  await page.getByRole('button', { name: 'Runde starten' }).click();
}

async function placeWord(page, order) {
  for (const index of order) await tile(page, index).click();
}

test.describe('Buchstabensalat: Einstellungen', () => {
  test('the overview links to the letter scramble game', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Buchstabensalat' }).click();
    await expect(page.getByRole('heading', { name: 'Buchstabensalat' })).toBeVisible();
    await expect(page).toHaveTitle('Buchstabensalat · Mini-Games');
  });

  test('the setup shows levels, word counts and length filters', async ({ page }) => {
    await page.goto(GAME_PATH);
    await expect(page.locator('[data-level]')).toHaveCount(LEVELS.length);
    await expect(page.locator('input[name=count]')).toHaveCount(WORD_COUNT_OPTIONS.length);
    await expect(page.locator('[data-length]')).toHaveCount(LENGTH_FILTERS.length);
    await expect(page.locator('[data-setup-status]')).toContainText('Wörter stehen zur Auswahl bereit');
  });

  test('settings are kept after a reload', async ({ page }) => {
    await page.goto(GAME_PATH);
    await page.getByLabel(/15 Wörter/).check();
    await page.getByLabel('A2').uncheck();
    await page.getByLabel(/lang \(/).uncheck();
    await page.reload();
    await expect(page.getByLabel(/15 Wörter/)).toBeChecked();
    await expect(page.getByLabel('A2')).not.toBeChecked();
    await expect(page.getByLabel(/lang \(/)).not.toBeChecked();
    await expect(page.locator('[data-setup-status]')).toContainText('Wörter stehen zur Auswahl bereit');
  });

  test('the start is blocked when no level is selected', async ({ page }) => {
    await page.goto(GAME_PATH);
    for (const level of LEVELS) await page.getByLabel(level).uncheck();
    await expect(page.locator('[data-setup-status]')).toContainText('mindestens ein Niveau');
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeDisabled();
  });
});

test.describe('Buchstabensalat: Spielablauf', () => {
  test('a round shows slots, shuffled tiles and the german hint', async ({ page }) => {
    const round = roundFor(5);
    const entry = round.entries[0];
    await openGame(page, { seed: 5 });
    await expect(progress(page)).toHaveText(`Wort 1 von ${DEFAULT_WORD_COUNT} · Hilfen: 0`);
    await expect(hint(page)).toContainText(entry.word.german);
    await expect(slots(page)).toHaveCount(entry.answer.length);
    await expect(tiles(page)).toHaveCount(entry.tiles.length);
    const shown = await tiles(page).allTextContents();
    expect(shown.join('')).not.toBe(entry.answer);
    expect([...shown.join('')].sort()).toEqual([...entry.answer].sort());
  });

  test('clicking tiles in the right order solves the word and moves on', async ({ page }) => {
    const round = roundFor(7);
    const entry = round.entries[0];
    await openGame(page, { seed: 7 });
    await placeWord(page, correctOrder(entry));
    await expect(progress(page)).toHaveText(`Wort 2 von ${DEFAULT_WORD_COUNT} · Hilfen: 0`);
    await expect(feedback(page)).toHaveText(`Richtig! „${entry.answer}" war die Lösung.`);
  });

  test('a wrong word is marked and can be corrected after a reset', async ({ page }) => {
    const round = roundFor(9);
    const entry = round.entries[0];
    await openGame(page, { seed: 9 });
    await placeWord(page, wrongOrder(entry));
    await expect(feedback(page)).toHaveText('Das stimmt noch nicht — Buchstaben entfernen und erneut versuchen.');
    await expect(page.locator('.scramble-slot.wrong').first()).toBeVisible();
    await page.getByRole('button', { name: 'Zurücksetzen' }).click();
    await expect(page.locator('.scramble-slot.wrong')).toHaveCount(0);
    await expect(tiles(page)).toHaveCount(entry.tiles.length);
    await placeWord(page, correctOrder(entry));
    await expect(progress(page)).toHaveText(`Wort 2 von ${DEFAULT_WORD_COUNT} · Hilfen: 0`);
  });

  test('placed letters can be removed by clicking their slot', async ({ page }) => {
    const round = roundFor(11);
    const entry = round.entries[0];
    await openGame(page, { seed: 11 });
    await tile(page, freeTiles(entry)[0]).click();
    await expect(slot(page, 0)).toContainText(entry.tiles[freeTiles(entry)[0]]);
    await slot(page, 0).click();
    await expect(slot(page, 0)).toContainText('');
    await expect(tiles(page)).toHaveCount(entry.tiles.length);
  });

  test('letters can be typed and removed with the keyboard', async ({ page }) => {
    const round = roundFor(13);
    const entry = round.entries[0];
    await openGame(page, { seed: 13 });
    for (const letter of entry.answer) await page.keyboard.press(letter);
    await expect(progress(page)).toHaveText(`Wort 2 von ${DEFAULT_WORD_COUNT} · Hilfen: 0`);
    // Nächstes Wort: ein Buchstabe tippen und wieder entfernen
    const next = round.entries[1];
    const letter = next.tiles[freeTiles(next)[0]];
    await page.keyboard.press(letter);
    await expect(slot(page, 0)).toContainText(letter);
    await page.keyboard.press('Backspace');
    await expect(slot(page, 0)).toContainText('');
  });

  test('the reveal button fixes the next correct letter and counts a help', async ({ page }) => {
    const round = roundFor(15);
    const entry = round.entries[0];
    await openGame(page, { seed: 15 });
    await page.getByRole('button', { name: 'Buchstaben aufdecken' }).click();
    await expect(slot(page, 0)).toHaveClass(/fixed/);
    await expect(slot(page, 0)).toContainText(entry.answer[0]);
    await expect(slot(page, 0)).toBeDisabled();
    await expect(progress(page)).toHaveText(`Wort 1 von ${DEFAULT_WORD_COUNT} · Hilfen: 1`);
    await page.getByRole('button', { name: 'Buchstaben aufdecken' }).click();
    await expect(progress(page)).toHaveText(`Wort 1 von ${DEFAULT_WORD_COUNT} · Hilfen: 2`);
  });

  test('skipping moves to the next word and finishing shows the evaluation', async ({ page }) => {
    const settings = { levels: LEVELS, count: 5, lengths: LENGTH_FILTERS };
    const round = roundFor(17, { count: 5 });
    await openGame(page, { seed: 17, settings });
    await page.getByRole('button', { name: 'Überspringen' }).click();
    await expect(progress(page)).toHaveText('Wort 2 von 5 · Hilfen: 0');
    await expect(feedback(page)).toHaveText(`Übersprungen — gesucht war „${round.entries[0].answer}".`);
    for (let index = 1; index < 5; index++) await page.getByRole('button', { name: 'Überspringen' }).click();
    await expect(page.locator('[data-result]')).toHaveText('0 von 5 Wörtern richtig gelegt · 0 Hilfen genutzt · 5 übersprungen');
    await expect(page.locator('[data-entries] li')).toHaveCount(5);
    for (const entry of round.entries) await expect(page.locator('[data-entries]')).toContainText(`${entry.answer} – ${entry.word.german}`);
    await page.getByRole('button', { name: 'Neue Runde' }).click();
    await expect(progress(page)).toHaveText('Wort 1 von 5 · Hilfen: 0');
  });

  test('a fully solved round reports the score and the used helps', async ({ page }) => {
    const settings = { levels: LEVELS, count: 5, lengths: LENGTH_FILTERS };
    const round = roundFor(19, { count: 5 });
    await openGame(page, { seed: 19, settings });
    for (const entry of round.entries) await placeWord(page, correctOrder(entry));
    await expect(page.locator('[data-result]')).toHaveText('5 von 5 Wörtern richtig gelegt · 0 Hilfen genutzt · 0 übersprungen');
  });

  test('a word with a symbol image shows the picture', async ({ page }) => {
    let seed = 1;
    while (!roundFor(seed).entries[0].word.image && seed < 500) seed++;
    const entry = roundFor(seed).entries[0];
    await openGame(page, { seed });
    const image = page.locator('.quiz-figure img');
    await expect(image).toHaveAttribute('src', new RegExp(`${entry.word.image}$`));
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  });

  test('settings can be changed from a running round', async ({ page }) => {
    await openGame(page);
    await page.getByRole('button', { name: 'Einstellungen ändern' }).click();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeVisible();
  });
});

test.describe('Buchstabensalat: Smartphone', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('the board fits a phone screen without horizontal scrolling', async ({ page }) => {
    await openGame(page);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const box = await page.locator('[data-slots]').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(300);
  });
});

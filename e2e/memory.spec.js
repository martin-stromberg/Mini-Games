import { expect, test } from '@playwright/test';
import { CARD_KIND, DEFAULT_PAIRS, STORAGE_KEY, createRound, memoryWords } from '../src/memory/game.js';
import { seededRandom } from '../src/shared/random.js';
import { LEVELS } from '../src/shared/vocabulary.js';
import { levelFiles, vocabulary } from '../test/fixtures/rounds.js';

const MEMORY_PATH = 'games/memory/';
const words = memoryWords(vocabulary);
const levelsWithImages = LEVELS.filter(level => words.some(word => word.level === level));

const card = (page, index) => page.locator(`[data-card="${index}"]`);
const message = page => page.locator('[data-message]');
const progress = page => page.locator('[data-progress]');

// Erzeugt dieselbe Runde wie das Spiel mit ?seed=<seed> (Standardeinstellungen, erste Runde nach dem Laden).
const roundFor = (seed, pairs = DEFAULT_PAIRS) => createRound(vocabulary, { rng: seededRandom(seed), pairs });
const positionsOf = (round, word) => round.cards.flatMap((item, index) => item.pairId === word.id ? [index] : []);

async function openMemory(page, { seed = 5, settings } = {}) {
  if (settings) {
    await page.goto(MEMORY_PATH);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(settings)]);
  }
  await page.goto(`${MEMORY_PATH}?seed=${seed}`);
  await page.getByRole('button', { name: 'Runde starten' }).click();
}

async function flipPair(page, round, word) {
  for (const index of positionsOf(round, word)) await card(page, index).click();
}

test.describe('Memory: Einstellungen', () => {
  test('the overview links to the memory game', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Vokabel-Memory' }).click();
    await expect(page.getByRole('heading', { name: 'Memory' })).toBeVisible();
    await expect(page).toHaveTitle('Memory · Mini-Games');
  });

  test('only levels with symbol images can be selected', async ({ page }) => {
    await page.goto(MEMORY_PATH);
    await expect(page.locator('[data-setup-status]')).toHaveText(`${words.length} Vokabeln mit Bild stehen zur Auswahl bereit.`);
    for (const level of LEVELS) {
      const input = page.locator(`[data-level][value="${level}"]`);
      if (levelsWithImages.includes(level)) await expect(input).toBeEnabled();
      else {
        await expect(input).toBeDisabled();
        await expect(input).not.toBeChecked();
      }
    }
  });

  test('the start is blocked when the selection has too few words with images', async ({ page }) => {
    const fewImages = levelFiles.A1.filter(entry => entry.image).slice(0, 5);
    await page.route('**/data/vocabulary/a1.json', route => route.fulfill({ json: fewImages }));
    for (const level of LEVELS.slice(1)) await page.route(`**/data/vocabulary/${level.toLowerCase()}.json`, route => route.fulfill({ json: [] }));
    await page.goto(MEMORY_PATH);
    await expect(page.locator('[data-setup-status]')).toHaveText('Für die gewählten Niveaus gibt es nur 5 Vokabeln mit Bild; für 8 Paare werden 8 benötigt.');
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeDisabled();
    await page.getByLabel(/6 Paare/).check();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeDisabled();
  });

  test('pair count and card language are kept after a reload', async ({ page }) => {
    await page.goto(MEMORY_PATH);
    await page.getByLabel(/12 Paare/).check();
    await page.getByLabel('Deutsch').check();
    await page.reload();
    await expect(page.getByLabel(/12 Paare/)).toBeChecked();
    await expect(page.getByLabel('Deutsch')).toBeChecked();
    await page.getByRole('button', { name: 'Runde starten' }).click();
    await expect(page.locator('[data-card]')).toHaveCount(24);
    await expect(page.locator('.game-header .eyebrow')).toHaveText('12 Paare · Wörter auf Deutsch');
  });
});

test.describe('Memory: Spielablauf', () => {
  test('a round starts with all cards face down', async ({ page }) => {
    await openMemory(page);
    await expect(page.locator('[data-card]')).toHaveCount(DEFAULT_PAIRS * 2);
    await expect(page.locator('.card.hidden')).toHaveCount(DEFAULT_PAIRS * 2);
    await expect(page.locator('.card img')).toHaveCount(0);
    await expect(progress(page)).toHaveText(`Gefundene Paare: 0 von ${DEFAULT_PAIRS} · Züge: 0`);
  });

  test('image and word of the same vocabulary form a pair', async ({ page }) => {
    const round = roundFor(5);
    const word = round.words[0];
    await openMemory(page, { seed: 5 });
    await flipPair(page, round, word);
    await expect(message(page)).toHaveText(`Paar gefunden: ${word.english} – ${word.german}.`);
    await expect(progress(page)).toHaveText(`Gefundene Paare: 1 von ${DEFAULT_PAIRS} · Züge: 1`);
    const [imageIndex, textIndex] = positionsOf(round, word).sort((a, b) => round.cards[a].kind === CARD_KIND.IMAGE ? -1 : 1);
    await expect(card(page, imageIndex)).toHaveClass(/matched/);
    await expect(card(page, textIndex)).toHaveClass(/matched/);
    await expect(card(page, textIndex)).toContainText(word.english);
    await expect(card(page, textIndex).locator('small')).toHaveText(word.german);
    await expect(card(page, imageIndex).locator('img')).toHaveAttribute('src', new RegExp(`${word.image}$`));
    await expect.poll(() => card(page, imageIndex).locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  });

  test('a mismatch stays visible until the next card is flipped', async ({ page }) => {
    const round = roundFor(5);
    const [a] = positionsOf(round, round.words[0]);
    const [b] = positionsOf(round, round.words[1]);
    const [c] = positionsOf(round, round.words[2]);
    await openMemory(page, { seed: 5 });
    await card(page, a).click();
    await expect(message(page)).toHaveText('Wähle eine zweite Karte.');
    await card(page, b).click();
    await expect(message(page)).toHaveText('Kein Paar. Die beiden Karten werden beim nächsten Aufdecken wieder umgedreht.');
    await expect(page.locator('.card.wrong')).toHaveCount(2);
    await expect(progress(page)).toHaveText(`Gefundene Paare: 0 von ${DEFAULT_PAIRS} · Züge: 1`);
    await card(page, c).click();
    await expect(card(page, a)).toHaveClass(/hidden/);
    await expect(card(page, b)).toHaveClass(/hidden/);
    await expect(card(page, c)).toHaveClass(/open/);
    await expect(page.locator('.card.wrong')).toHaveCount(0);
  });

  test('finding all pairs finishes the round', async ({ page }) => {
    const round = roundFor(8, 6);
    await openMemory(page, { seed: 8, settings: { levels: LEVELS, pairs: 6, language: 'english' } });
    for (const word of round.words) await flipPair(page, round, word);
    await expect(message(page)).toHaveText('Geschafft! Alle 6 Paare in 6 Zügen gefunden.');
    await expect(page.locator('.card.matched')).toHaveCount(12);
    await page.getByRole('button', { name: 'Neue Runde' }).click();
    await expect(page.locator('.card.hidden')).toHaveCount(12);
    await expect(progress(page)).toHaveText('Gefundene Paare: 0 von 6 · Züge: 0');
  });

  test('word cards can show the German word', async ({ page }) => {
    const round = roundFor(5);
    const word = round.words[0];
    await openMemory(page, { seed: 5, settings: { levels: LEVELS, pairs: DEFAULT_PAIRS, language: 'german' } });
    const textIndex = positionsOf(round, word).find(index => round.cards[index].kind === CARD_KIND.TEXT);
    await card(page, textIndex).click();
    await expect(card(page, textIndex).locator('.card-word')).toHaveText(word.german);
    await expect(card(page, textIndex).locator('.card-word')).toHaveAttribute('lang', 'de');
  });

  test('cards can be flipped with the keyboard and keep the focus', async ({ page }) => {
    const round = roundFor(5);
    const word = round.words[0];
    const textIndex = positionsOf(round, word).find(index => round.cards[index].kind === CARD_KIND.TEXT);
    await openMemory(page, { seed: 5 });
    await card(page, textIndex).focus();
    await page.keyboard.press('Enter');
    await expect(card(page, textIndex)).toBeFocused();
    await expect(card(page, textIndex)).toHaveAttribute('aria-label', `Karte ${textIndex + 1}: Wort „${word.english}“`);
    await expect(card(page, 0 === textIndex ? 1 : 0)).toHaveAttribute('aria-label', /verdeckt$/);
  });

  test('settings can be changed from a running round', async ({ page }) => {
    await openMemory(page);
    await page.getByRole('button', { name: 'Einstellungen ändern' }).click();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeVisible();
  });
});

test.describe('Memory: Smartphone', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('the largest board fits a phone screen without horizontal scrolling', async ({ page }) => {
    await openMemory(page, { settings: { levels: LEVELS, pairs: 12, language: 'english' } });
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const board = await page.locator('[data-memory-board]').boundingBox();
    expect(board.x + board.width).toBeLessThanOrEqual(375);
    const first = await card(page, 0).boundingBox();
    expect(first.width).toBeGreaterThanOrEqual(70);
  });
});

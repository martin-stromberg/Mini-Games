import { expect, test } from '@playwright/test';
import { WORD_PATTERN, toGridWord } from '../src/word-search/game.js';
import { DIFFICULTY, GAME_PATH, LEVELS, STORAGE_KEY, WORDS_PER_ROUND, levelFiles, openGame, puzzleWords, storeLevels } from './support.js';

const storedLevels = page => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);

test.describe('Projekt-Unterpfad', () => {
  test('overview, assets and game route work under the project path', async ({ page, baseURL }) => {
    expect(new URL(baseURL).pathname).not.toBe('/');
    await page.goto('./');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(246, 247, 251)');
    await page.getByRole('link', { name: 'Englisches Wortsuchrätsel' }).click();
    await expect(page).toHaveURL(`${baseURL}${GAME_PATH}`);
    await expect(page.locator('[data-setup-status]')).toHaveText(`${puzzleWords.length} Wörter stehen zur Auswahl bereit.`);
  });

  for (const path of ['./', GAME_PATH]) {
    test(`the icons of ${path} are linked and served under the project path`, async ({ page, request, baseURL }) => {
      await page.goto(path);
      for (const rel of ['icon', 'apple-touch-icon']) {
        const href = await page.locator(`link[rel="${rel}"]`).getAttribute('href');
        expect(href.startsWith(new URL(baseURL).pathname)).toBe(true);
        expect((await request.get(new URL(href, baseURL).href)).ok()).toBe(true);
      }
    });
  }

  test('the game route survives direct access and reload', async ({ page }) => {
    const vocabularyResponse = page.waitForResponse(response => response.url().endsWith('/data/vocabulary/a1.json'));
    await page.goto(GAME_PATH);
    expect((await vocabularyResponse).ok()).toBe(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Wortsuchrätsel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeEnabled();
  });

  test('the back link returns to the overview', async ({ page }) => {
    await page.goto(GAME_PATH);
    await page.getByRole('link', { name: '← Mini-Games' }).click();
    await expect(page.getByRole('heading', { name: 'Spiel, lerne, entdecke.' })).toBeVisible();
  });
});

test.describe('Levelauswahl und Speicher', () => {
  test('all six levels are active on the first visit', async ({ page }) => {
    await page.goto(GAME_PATH);
    await expect(page.locator('[data-level]:checked')).toHaveCount(LEVELS.length);
    expect(JSON.parse(await storedLevels(page))).toEqual(LEVELS);
  });

  test('a multiple level selection is stored and restored', async ({ page }) => {
    await page.goto(GAME_PATH);
    await page.getByLabel('A1').uncheck();
    await page.getByLabel('C2').uncheck();
    await page.reload();
    await expect(page.locator('[data-level]:checked')).toHaveCount(4);
    await expect(page.getByLabel('A1')).not.toBeChecked();
    await expect(page.getByLabel('C2')).not.toBeChecked();
    expect(JSON.parse(await storedLevels(page))).toEqual(['A2', 'B1', 'B2', 'C1']);
  });

  for (const [name, value] of [['corrupted JSON', '{kaputt'], ['unknown levels', '["A1","Z9"]'], ['a stored empty selection', '[]']]) {
    test(`${name} is repaired to all levels`, async ({ page }) => {
      await storeLevels(page, value);
      await page.reload();
      await expect(page.locator('[data-level]:checked')).toHaveCount(LEVELS.length);
      expect(JSON.parse(await storedLevels(page))).toEqual(LEVELS);
    });
  }

  test('deselecting every level blocks the start and names the required action', async ({ page }) => {
    await page.goto(GAME_PATH);
    for (const level of LEVELS) await page.getByLabel(level).uncheck();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeDisabled();
    await expect(page.locator('[data-setup-status]')).toHaveText('Wähle mindestens ein Niveau aus, um eine Runde zu starten.');
  });

  test('a pool with fewer than ten words blocks the start and names count and minimum', async ({ page }) => {
    const reduced = levelFiles.A1.filter(entry => WORD_PATTERN.test(toGridWord(entry.english))).slice(0, 5);
    await page.route('**/data/vocabulary/a1.json', route => route.fulfill({ json: reduced }));
    await storeLevels(page, '["A1"]');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeDisabled();
    await expect(page.locator('[data-setup-status]')).toContainText(`nur 5 Wörter; mindestens ${WORDS_PER_ROUND} werden benötigt`);
  });

  test('vocabulary texts are shown as plain text, not as markup', async ({ page }) => {
    const tagged = levelFiles.A1.map(entry => ({ ...entry, german: `<b>${entry.german}</b>` }));
    await page.route('**/data/vocabulary/a1.json', route => route.fulfill({ json: tagged }));
    await openGame(page, { seed: 3, levels: ['A1'] });
    await expect(page.locator('.translations b')).toHaveCount(0);
    await expect(page.locator('.translations li').first()).toContainText('<b>');
  });
});

test.describe('Einzel-Level-Runden', () => {
  for (const level of LEVELS) {
    test(`a round for level ${level} shows ten distinct translations of that level`, async ({ page }) => {
      const round = await openGame(page, { seed: 11, levels: [level] });
      const items = page.locator('.translations li');
      await expect(items).toHaveCount(WORDS_PER_ROUND);
      await expect(items.locator('small')).toHaveText(Array(WORDS_PER_ROUND).fill(level));
      // Nur die Textknoten des Übersetzungs-Buttons: ohne Nummer und ohne <small>-Niveau.
      const texts = await items.locator('[data-translation]').evaluateAll(buttons => buttons.map(button =>
        [...button.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim()));
      expect(new Set(texts).size).toBe(WORDS_PER_ROUND);
      expect(texts).toEqual(round.targets.map(target => target.german));
    });
  }
});

test.describe('Einstellungen ändern', () => {
  test('the settings button returns to the setup with the last levels and difficulty preselected', async ({ page }) => {
    await openGame(page, { seed: 5, difficulty: DIFFICULTY.HARD, levels: ['B2', 'C1', 'C2'] });
    await page.getByRole('button', { name: 'Einstellungen ändern' }).click();
    await expect(page.getByRole('button', { name: 'Runde starten' })).toBeEnabled();
    await expect(page.getByLabel(/Schwierig/)).toBeChecked();
    await expect(page.locator('[data-level]:checked')).toHaveCount(3);
    for (const level of ['B2', 'C1', 'C2']) await expect(page.getByLabel(level)).toBeChecked();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('changed settings apply to the next round', async ({ page }) => {
    await openGame(page, { seed: 5, difficulty: DIFFICULTY.HARD });
    await page.getByRole('button', { name: 'Einstellungen ändern' }).click();
    await page.getByLabel(/Einfach/).check();
    for (const level of LEVELS.filter(level => level !== 'A1')) await page.getByLabel(level).uncheck();
    await page.getByRole('button', { name: 'Runde starten' }).click();
    await expect(page.locator('.eyebrow')).toHaveText('Einfach');
    await expect(page.locator('.translations li small')).toHaveText(Array(WORDS_PER_ROUND).fill('A1'));
  });
});

import { expect, test } from '@playwright/test';
import { cell, draftState, openGame } from './support.js';

test.describe('Tastaturbedienung und Fokus', () => {
  test('arrow keys move the focus through the grid and space selects a cell', async ({ page }) => {
    await openGame(page, { seed: 5 });
    await cell(page, '0,0').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, '1,1')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(draftState(page)).toHaveText('Noch nicht übernommen: 1 Feld.');
    await expect(cell(page, '1,1')).toBeFocused();
    await expect(cell(page, '1,1')).toHaveAttribute('aria-pressed', 'true');
    await expect(cell(page, '1,1')).toHaveAttribute('aria-label', /Zeile 2, Spalte 2, in der aktuellen Auswahl/);
  });

  test('a selection can be committed by keyboard and the focus returns to the grid', async ({ page }) => {
    await openGame(page, { seed: 5 });
    await cell(page, '0,0').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Markierung übernehmen' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-slot="0"]')).toContainText('1 Feld markiert');
    await expect(cell(page, '0,0')).toBeFocused();
    await expect(cell(page, '0,0')).toHaveAttribute('aria-label', /markiert/);
  });

  test('the grid is a single tab stop with a visible focus outline', async ({ page }) => {
    await openGame(page, { seed: 5 });
    await expect(page.locator('.cell[tabindex="0"]')).toHaveCount(1);
    await cell(page, '0,0').focus();
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, '0,1')).toHaveCSS('outline-style', 'solid');
  });
});

test.describe('Responsives Layout', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('the game fits a phone screen without horizontal scrolling', async ({ page }) => {
    await openGame(page, { seed: 5 });
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const board = await page.locator('[data-board]').boundingBox();
    expect(board.x).toBeGreaterThanOrEqual(0);
    expect(board.x + board.width).toBeLessThanOrEqual(375);
    await expect(page.locator('.translations')).toBeVisible();
  });
});

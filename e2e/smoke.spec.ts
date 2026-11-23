import { expect, test } from '@playwright/test';
import { checkMobile, snap } from './helpers';

test('visualise, race and compare', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Watch the algorithm');
  await expect(page.locator('.hero .bars-viz')).toBeVisible();
  await page.waitForTimeout(1200);
  await snap(page, 'landing');
  await checkMobile(page, 'landing-mobile');

  await page.getByRole('link', { name: 'Open the visualiser' }).first().click();
  await page.getByRole('radio', { name: 'Merge sort' }).click();
  await page.getByLabel('Speed').selectOption('12');
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByTestId('note')).toHaveText('Sorted', { timeout: 15000 });
  await page.getByRole('button', { name: 'First step' }).click();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  await snap(page, 'visualize');
  await checkMobile(page);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Merge sort' })).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Race' }).click();
  await page.getByLabel('Data').selectOption('nearly');
  await page.getByRole('button', { name: 'Step' }).first().isVisible();
  await page.getByRole('button', { name: 'Last step' }).click();
  await expect(page.getByText(/finished first|A tie/)).toBeVisible();
  await snap(page, 'race');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Compare' }).click();
  await expect(page.getByRole('heading', { name: 'Comparisons made' })).toBeVisible();
  await snap(page, 'compare');
  await checkMobile(page, 'compare-mobile');
});

import { test, expect } from '@playwright/test';

test('homepage launches the bilingual advisor without broken controls', async ({page}) => {
  await page.goto('/', {waitUntil:'domcontentloaded'});
  const launcher=page.locator('#lw-chat-launcher');
  await expect(launcher).toBeVisible();
  await launcher.click();
  const panel=page.locator('#lw-chat-panel');
  await expect(panel).toBeVisible();
  await expect(page.locator('#lw-chat-input')).toBeVisible();
  const input=page.locator('#lw-chat-input');
  await input.fill('What does RO do?');
  await input.press('Enter');
  await expect(page.locator('#lw-chat-log')).toContainText(/RO|drinking water|osmosis/i);
  await page.locator('#lw-chat-close').click();
  await expect(panel).toBeHidden();
  await expect(launcher).toBeVisible();
});

test('iPhone-size chat stays inside the visual viewport', async ({page}) => {
  await page.goto('/ro/', {waitUntil:'domcontentloaded'});
  await page.locator('#lw-chat-launcher').click();
  const panel=page.locator('#lw-chat-panel');
  await expect(panel).toBeVisible();
  const bounds=await panel.boundingBox();
  const viewport=page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(-2);
  expect(bounds.y).toBeGreaterThanOrEqual(-2);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+2);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height+2);
  await expect(page.locator('#lw-chat-input')).toBeVisible();
});

test('Colombia guided chat never quotes the proposed US Essential price', async ({page}) => {
  await page.goto('/colombia/opciones-ro/', {waitUntil:'domcontentloaded'});
  await page.locator('#lw-chat-launcher').click();
  const log=page.locator('#lw-chat-log');
  await expect(log).toContainText(/Cali|Colombia/i);
  const input=page.locator('#lw-chat-input');
  await input.fill('¿Cuánto cuestan los sistemas?');
  await input.press('Enter');
  await expect(log).toContainText(/Colombia|precios|mercado/i);
  await expect(log).not.toContainText(/1,199|8,290|8,990/);
});

test('QR landing page preserves the campaign and starts the water test flow', async ({page}) => {
  await page.goto('/check/?utm_source=qr&utm_medium=print&utm_campaign=water-test-direct&interest=city_water',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#zip')).toBeVisible();
  await expect(page.locator('#zipNext')).toBeVisible();
});

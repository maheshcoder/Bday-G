import { test, expect } from '@playwright/test';

test('character is part of the welcome page and responds to keyboard play', async ({
  page,
}) => {
  await page.goto(
    '/welcome.html?name=' +
      encodeURIComponent("O'Connor 100% 🎂 <img src=x onerror=alert(1)>"),
  );
  const companion = page.locator('main #birthdayMascot');
  const character = page.getByRole('button', {
    name: 'Say hello to your birthday companion',
  });
  await expect(character).toBeEnabled();
  await expect(companion).toHaveAttribute('data-layout', 'hero');
  expect(
    await companion.evaluate((node) => getComputedStyle(node).position),
  ).toBe('relative');
  expect((await character.boundingBox()).width).toBeGreaterThanOrEqual(240);
  await character.focus();
  await character.press('Enter');
  await expect(companion).toHaveAttribute('data-expression', 'blushing');
  await expect(page.locator('#mascotMessage')).toContainText(
    "O'Connor 100% 🎂",
  );
  await expect(page.locator('#mascotMessage img')).toHaveCount(0);
  await character.press('Space');
  await expect(companion).toHaveAttribute('data-expression', 'pouting');
  await page.getByRole('button', { name: 'High five', exact: true }).click();
  await expect(companion).toHaveAttribute('data-expression', 'laughing');
  await expect(page.locator('#mascotMessage')).toContainText('High five!');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await character.press('Enter');
  await expect(companion).toHaveAttribute('data-expression', 'shy');
  await expect(companion).toHaveAttribute('data-motion', 'paused');
  expect(
    await companion
      .locator('.companion-sparkles')
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('none');
});

for (const width of [360, 390]) {
  test.describe('touch companion at ' + width + 'px', () => {
    test.use({
      viewport: { width, height: 780 },
      isMobile: true,
      hasTouch: true,
    });
    test('guides each field, avoids short-screen overlays, and celebrates after saving', async ({
      page,
    }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/js/firebase.js', (route) =>
        route.fulfill({
          contentType: 'text/javascript',
          body: "export const newWishId=()=> 'touch-test';export async function saveWish(){window.saves=(window.saves||0)+1;await new Promise(resolve=>setTimeout(resolve,800));}",
        }),
      );
      await page.goto(
        '/welcome.html?name=' + encodeURIComponent('Maya 100% 🎂'),
      );
      const character = page.getByRole('button', {
        name: 'Say hello to your birthday companion',
      });
      await expect(character).toBeEnabled();
      await character.tap();
      await expect(page.locator('#birthdayMascot')).toHaveAttribute(
        'data-expression',
        'blushing',
      );
      await page.getByRole('button', { name: 'High five', exact: true }).tap();
      await expect(page.locator('#birthdayMascot')).toHaveAttribute(
        'data-expression',
        'laughing',
      );
      await character.focus();
      await character.press('Tab');
      await expect(
        page.getByRole('button', { name: 'High five', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('#companionHelp')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('.mascot-motion')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('#enterParty')).toBeFocused();
      const order = await page.evaluate(() => ({
        heading: document
          .querySelector('.welcome-copy h1')
          .getBoundingClientRect().bottom,
        characterTop: document
          .querySelector('.welcome-visual')
          .getBoundingClientRect().top,
        characterBottom: document
          .querySelector('.welcome-visual')
          .getBoundingClientRect().bottom,
        action: document.querySelector('#enterParty').getBoundingClientRect()
          .top,
      }));
      expect(order.characterTop).toBeGreaterThanOrEqual(order.heading);
      expect(order.action).toBeGreaterThanOrEqual(order.characterBottom);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: 'artifacts/interactive-welcome-' + width + '.png',
        fullPage: true,
      });
      await page.getByRole('button', { name: 'Make a wish together' }).tap();
      await expect(page).toHaveURL(/wish.html/);
      expect(new URL(page.url()).searchParams.get('name')).toBe('Maya 100% 🎂');
      const companion = page.locator('#birthdayMascot');
      const help = page.locator('#companionHelp');
      await expect(companion).toHaveAttribute('data-layout', 'form');
      await expect(help).toHaveText("Let's start");
      await help.tap();
      await expect(page.locator('#wishText')).toBeFocused();
      await page.locator('#wishText').fill('A year full of lovely adventures');
      await expect(help).toHaveText('Choose a gift');
      await help.tap();
      await expect(page.locator('#giftText')).toBeFocused();
      await page.getByRole('button', { name: 'Books', exact: true }).tap();
      await expect(help).toHaveText('Add my location');
      await page.setViewportSize({ width, height: 420 });
      await help.tap();
      await expect(page.locator('#addressText')).toBeFocused();
      const bounds = await page.locator('#addressText').boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(420);
      expect(
        await page
          .locator('[data-companion-slot]')
          .evaluate((node) => getComputedStyle(node).position),
      ).toBe('relative');
      await page.locator('#addressText').fill('   ');
      await expect(help).toHaveText('Add my location');
      await page.locator('#addressText').fill('Bengaluru');
      await expect(help).toHaveText('Review my wish');
      await expect(companion.locator('[data-complete="true"]')).toHaveCount(3);
      await page.setViewportSize({ width, height: 780 });
      await help.tap();
      await expect(page.locator('#submitButton')).toBeFocused();
      expect(await page.evaluate(() => window.saves || 0)).toBe(0);
      await expect(page.locator('#mascotMessage')).toContainText(
        'Everything is ready',
      );
      const targetSizes = await companion
        .locator('button')
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().height),
        );
      expect(targetSizes.every((height) => height >= 44)).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: 'artifacts/interactive-wish-' + width + '.png',
        fullPage: true,
      });
      await page
        .getByRole('button', { name: 'Send my wish', exact: true })
        .tap();
      await expect(companion).toHaveAttribute('data-expression', 'thinking');
      await expect(help).toBeDisabled();
      await expect(character).toBeDisabled();
      await expect(
        page.locator('#thanksMessage #birthdayMascot'),
      ).toBeVisible();
      await expect(companion).toHaveAttribute('data-layout', 'celebration');
      await expect(help).toBeEnabled();
      await expect(help).toHaveText("Let's celebrate");
      expect(await page.evaluate(() => window.saves)).toBe(1);
      await help.tap();
      await expect(companion).toHaveAttribute('data-expression', 'laughing');
      await expect(page.locator('#mascotMessage')).toContainText(
        'celebrate you',
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: 'artifacts/interactive-success-' + width + '.png',
        fullPage: true,
      });
      await expect(companion).toHaveAttribute('data-mood', 'success', {
        timeout: 5000,
      });
      await expect(page.locator('#mascotMessage')).toContainText(
        'Enjoy your birthday',
      );
      expect(errors).toEqual([]);
    });
  });
}

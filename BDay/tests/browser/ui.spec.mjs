import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const emulator = '?emulator=1';
async function signIn(page, next = 'creator', email = 'owner@example.com') {
  await page.goto('/login.html' + emulator + '&next=' + next);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('birthday-test-only');
  await page.getByRole('button', { name: 'Sign in to my studio' }).click();
}
test.beforeEach(async ({ page }) => {
  await page.route(
    'https://www.gstatic.com/firebasejs/13.0.0/**',
    async (route) => {
      const filename = new URL(route.request().url()).pathname.split('/').pop();
      await route.fulfill({
        contentType: 'text/javascript',
        body: await readFile('artifacts/vendor/' + filename, 'utf8'),
      });
    },
  );
});
test('owner creates, previews and copies a safe link; guests and other users are denied', async ({
  page,
}) => {
  await page.goto('/index.html' + emulator);
  await expect(page).toHaveURL(/login.html/);
  await page.waitForLoadState('load');
  await signIn(page);
  await expect(page.locator('#protectedContent')).toBeVisible();
  const name = "O'Connor 100% 🎂 <img src=x onerror=alert(1)>";
  await page.getByLabel('Who’s the birthday star?').fill(name);
  await expect(page.locator('#previewName')).toHaveText(name);
  await page.getByRole('button', { name: 'Create birthday link' }).click();
  const link = await page.locator('#shareLink').inputValue();
  expect(new URL(link).searchParams.get('name')).toBe(name);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Link copied');
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(link);
  await expect(page.locator('#previewName img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/login.html/);
  await page.waitForLoadState('load');
  await signIn(page, 'creator', 'other@example.com');
  await expect(page.locator('#loginError')).toContainText(
    'does not have owner access',
  );
  await expect(page.locator('#loginButton')).toBeEnabled();
});
test('wish persists once, validates and renders success', async ({ page }) => {
  await page.goto('/wish.html' + emulator + '&name=Maya');
  await page.getByRole('button', { name: 'Send my wish' }).click();
  await expect(page.locator('#thanksMessage')).toBeHidden();
  await page
    .getByRole('textbox', { name: 'Your birthday wish', exact: true })
    .fill('A year full of little adventures');
  await page.getByRole('button', { name: 'Experiences', exact: true }).click();
  await expect(page.locator('#giftText')).toHaveValue(
    'A lovely day out together',
  );
  await page.getByLabel('Your location').fill('Bengaluru');
  await page.getByRole('button', { name: 'Send my wish' }).click();
  await expect(page.locator('#thanksMessage')).toBeVisible();
  await expect(page.locator('#successTitle')).toBeFocused();
  await expect(page.locator('#wishForm')).toBeHidden();
  await signIn(page, 'admin');
  await expect(page.locator('#wishList')).toContainText(
    'A year full of little adventures',
  );
  await expect(
    page
      .locator('.wish-card')
      .filter({ hasText: 'A year full of little adventures' }),
  ).toHaveCount(1);
});
test('failed wish save preserves input, blocks rapid submission and allows retry', async ({
  page,
}) => {
  await page.route('**/js/firebase.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: "export const newWishId=()=> 'same-id'; export async function saveWish(){window.attempts=(window.attempts||0)+1; await new Promise(resolve=>setTimeout(resolve,250));if(window.attempts===1)throw Error('offline');}",
    }),
  );
  await page.goto('/wish.html?name=Lina');
  await page
    .getByRole('textbox', { name: 'Your birthday wish', exact: true })
    .fill('A beautiful year');
  await page.getByLabel('A gift that would make you smile').fill('A book');
  await page.getByLabel('Your location').fill('Bengaluru');
  await page.locator('#wishForm').evaluate((form) => {
    form.requestSubmit();
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.locator('#submitButton')).toBeDisabled();
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-mood',
    'loading',
  );
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-expression',
    'thinking',
  );
  await expect(page.locator('#wishError')).toBeVisible();
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-mood',
    'error',
  );
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-expression',
    'teary',
  );
  expect(await page.evaluate(() => window.attempts)).toBe(1);
  await expect(page.locator('#wishText')).toHaveValue('A beautiful year');
  await expect(page.locator('#thanksMessage')).toBeHidden();
  await page.getByRole('button', { name: 'Send my wish' }).click();
  await expect(page.locator('#thanksMessage')).toBeVisible();
  expect(await page.evaluate(() => window.attempts)).toBe(2);
});
test('dashboard handles search, status updates, legacy dates and accessible deletion', async ({
  page,
}) => {
  await signIn(page, 'admin');
  await expect(page.locator('#protectedContent')).toBeVisible();
  await expect(page.locator('#wishList')).toContainText('A legacy wish');
  await expect(page.locator('#wishList')).not.toContainText('Invalid Date');
  await page.getByLabel('Search recipient, wish or gift').fill('weekend');
  await expect(page.locator('.wish-card')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Mark as completed', exact: true })
    .click();
  await expect(page.locator('.status-badge')).toHaveText('Completed');
  await page.getByRole('button', { name: 'Pending', exact: true }).click();
  await expect(page.locator('.wish-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.locator('.wish-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Delete wish from Maya' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep wish' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Delete wish from Maya' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Delete wish from Maya' }).click();
  await page.getByRole('button', { name: 'Delete wish', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.wish-card')).toHaveCount(0);
});
test('failed dashboard actions and failed loading offer recovery', async ({
  page,
}) => {
  await page.route('**/js/firebase.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export const auth={}; export const isOwner=()=>true; export function onAuthStateChanged(a,next){setTimeout(()=>next({uid:'test-owner'}));return ()=>{};}let loads=0;export function watchWishes(next,error){setTimeout(()=>{if(!loads++){error({code:'unavailable'});return;}next({docs:[{id:'one',data:()=>({from:'Maya',text:'A lovely wish',gift:'A book',createdAt:new Date(),completed:false})}]});});return ()=>{};}export async function setCompleted(){throw Error('offline');}export async function removeWish(){throw Error('offline');}export async function signOut(){}`,
    }),
  );
  await page.goto('/admin.html' + emulator);
  await expect(page.locator('#dashboardError')).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.wish-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Mark as completed' }).click();
  await expect(page.locator('#dashboardError')).toContainText(
    'couldn’t update',
  );
  await expect(
    page.getByRole('button', { name: 'Mark as completed' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Delete wish from Maya' }).click();
  await page.getByRole('button', { name: 'Delete wish', exact: true }).click();
  await expect(page.locator('#deleteError')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep wish' }).click();
  await expect(page.locator('.wish-card')).toHaveCount(1);
});
for (const width of [360, 768, 1440]) {
  test(
    'all pages fit ' + width + 'px, including long names and reduced motion',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await signIn(page);
      await expect(page.locator('#protectedContent')).toBeVisible();
      for (const file of [
        'index.html',
        'welcome.html',
        'wish.html',
        'login.html',
        'admin.html',
      ]) {
        await page.goto(
          '/' +
            file +
            emulator +
            '&name=' +
            encodeURIComponent('Alexandria '.repeat(12)),
        );
        if (['index.html', 'admin.html'].includes(file))
          await expect(page.locator('#protectedContent')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('main #birthdayMascot')).toHaveCount(1);
        expect(
          await page
            .locator('#birthdayMascot')
            .evaluate((node) => getComputedStyle(node).position),
        ).not.toBe('fixed');
        await expect
          .poll(() =>
            page.evaluate(() =>
              Array.from(document.images).every(
                (image) => image.complete && image.naturalWidth > 0,
              ),
            ),
          )
          .toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          file,
        ).toBe(true);
        await page.screenshot({
          path: 'artifacts/' + file.replace('.html', '') + '-' + width + '.png',
          fullPage: true,
        });
      }
      await page.goto(
        '/wish.html' +
          emulator +
          '&name=' +
          encodeURIComponent('<img src=x onerror=alert(1)> 100% 🎂'),
      );
      await expect(page.locator('#recipientName')).toHaveText(
        '<img src=x onerror=alert(1)> 100% 🎂',
      );
      await expect(page.locator('#recipientName img')).toHaveCount(0);
      expect(
        await page
          .locator('main')
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe('none');
      await page.keyboard.press('Tab');
    },
  );
}

test('password reset sends a link without requiring the password', async ({
  page,
  request,
}) => {
  await page.goto('/login.html' + emulator);
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.locator('#loginError')).toContainText(
    'Enter your account email',
  );
  await expect(page.getByLabel('Email address')).toBeFocused();
  await page.getByLabel('Email address').fill('owner@example.com');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.locator('#resetNotice')).toContainText(
    'Check your inbox and spam folder',
  );
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Sign in to my studio' }),
  ).toBeEnabled();
  const response = await request.get(
    'http://127.0.0.1:9099/emulator/v1/projects/demo-birthday-studio/oobCodes',
  );
  expect(response.ok()).toBe(true);
  const { oobCodes } = await response.json();
  expect(
    oobCodes.filter(
      (code) =>
        code.email === 'owner@example.com' &&
        code.requestType === 'PASSWORD_RESET',
    ),
  ).toHaveLength(1);
});
test('password reset preserves fields and recovers after a failed request', async ({
  page,
}) => {
  await page.route('**/js/firebase.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: "export const auth={};export async function sendPasswordResetEmail(){window.resetAttempts=(window.resetAttempts||0)+1;await new Promise(resolve=>setTimeout(resolve,200));if(window.resetAttempts===1)throw {code:'auth/network-request-failed'};}",
    }),
  );
  await page.goto('/login.html');
  await page.getByLabel('Email address').fill('owner@example.com');
  await page.getByLabel('Password', { exact: true }).fill('unchanged');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.locator('#forgotPassword')).toBeDisabled();
  await expect(page.locator('#loginError')).toContainText(
    'Check your connection',
  );
  await expect(page.locator('#forgotPassword')).toBeEnabled();
  await expect(page.locator('#resetNotice')).toBeHidden();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue(
    'unchanged',
  );
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.locator('#resetNotice')).toBeVisible();
  expect(await page.evaluate(() => window.resetAttempts)).toBe(2);
});

test('3D character reacts to navigation and lets visitors pause motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/welcome.html' + emulator + '&name=Maya');
  const mascot = page.locator('#birthdayMascot');
  await expect(mascot).toHaveAttribute('data-render-mode', 'webgl');
  await expect(mascot.locator('canvas')).toBeVisible();
  await expect(mascot).toHaveAttribute('data-expression', 'waving');
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(mascot).toHaveAttribute('data-motion', 'paused');
  await page.screenshot({
    path: 'artifacts/character-welcome-1440.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await expect(mascot).toHaveAttribute('data-motion', 'running');
  const state = await page.evaluate(() => {
    document.querySelector('#enterParty').click();
    const { mood, expression } =
      document.querySelector('#birthdayMascot').dataset;
    return { mood, expression };
  });
  expect(state).toEqual({ mood: 'navigating', expression: 'excited' });
  await expect(page).toHaveURL(/wish.html/);
  await page.getByLabel('Your location').focus();
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-mood',
    'curious',
  );
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-expression',
    'surprised',
  );
});
test('required location blocks blank and whitespace-only submissions', async ({
  page,
}) => {
  await page.route('**/js/firebase.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: "export const newWishId=()=> 'location-test';export async function saveWish(){window.saves=(window.saves||0)+1;}",
    }),
  );
  await page.goto('/wish.html?name=Maya');
  await page
    .getByRole('textbox', { name: 'Your birthday wish', exact: true })
    .fill('A lovely year');
  await page.getByLabel('A gift that would make you smile').fill('A book');
  await page.getByRole('button', { name: 'Send my wish' }).click();
  await expect(page.getByLabel('Your location')).toBeFocused();
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-mood',
    'error',
  );
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-expression',
    'teary',
  );
  expect(await page.evaluate(() => window.saves || 0)).toBe(0);
  await page.getByLabel('Your location').fill('   ');
  await page.getByRole('button', { name: 'Send my wish' }).click();
  await expect(page.locator('#wishError')).toContainText('location');
  expect(await page.evaluate(() => window.saves || 0)).toBe(0);
  await page.getByLabel('Your location').fill('Bengaluru');
  await page.getByRole('button', { name: 'Send my wish' }).click();
  await expect(page.locator('#thanksMessage')).toBeVisible();
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-mood',
    'success',
  );
  await expect(page.locator('#birthdayMascot')).toHaveAttribute(
    'data-expression',
    'laughing',
  );
  expect(await page.evaluate(() => window.saves)).toBe(1);
});
test('character works without WebGL and stays still with reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'visualViewport', {
      value: undefined,
      configurable: true,
    });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/wish.html?name=Maya');
  const mascot = page.locator('#birthdayMascot');
  await expect(mascot).toHaveAttribute('data-render-mode', 'fallback');
  await expect(mascot).toHaveAttribute('data-motion', 'paused');
  await expect(
    page.getByRole('button', { name: 'Reduced motion on' }),
  ).toBeDisabled();
  await page.getByLabel('Your location').focus();
  await expect(mascot).toHaveAttribute('data-mood', 'curious');
  await expect(mascot).toHaveAttribute('data-expression', 'surprised');
  await expect(mascot.locator('.chibi-sprite')).toBeVisible();
  await expect(mascot.locator('.chibi-sprite')).toHaveCSS(
    'background-image',
    /chibi\/expressions\.webp/,
  );
  await page.screenshot({
    path: 'artifacts/chibi-fallback-360.png',
    fullPage: true,
  });
  expect(
    await mascot
      .locator('.chibi-sprite')
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('none');
  await expect(
    page.getByRole('button', { name: 'Send my wish' }),
  ).toBeEnabled();
});

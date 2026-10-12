import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-unsafe-swiftshader'],
  headless: true,
});
const page = await browser.newPage();
for (const width of [360, 1440]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const file of ['welcome', 'wish', 'login']) {
    await page.goto('http://127.0.0.1:4177/' + file + '.html?name=Mahesh');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (img) => img.complete && img.naturalWidth,
      ),
    );
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect.getComputedTiming().iterations !== Infinity,
          )
          .map((animation) => animation.finished),
      ),
    );
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error(file + ' overflows at ' + width);
    await page.screenshot({
      path: 'artifacts/preview-' + file + '-' + width + '.png',
      fullPage: true,
    });
    console.log(file + ' at ' + width + ': fits, artwork loaded');
  }
}
await browser.close();

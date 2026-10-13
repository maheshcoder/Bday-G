import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45000,
  globalSetup: './tests/browser/setup.mjs',
  use: {
    baseURL: 'http://127.0.0.1:4178',
    channel: 'chrome',
    headless: true,
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4178/login.html',
    env: { PORT: '4178', BIRTHDAY_TEST: '1' },
    reuseExistingServer: false,
  },
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 20_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'],['html',{open:'never'}]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name:'desktop-chromium', use:{...devices['Desktop Chrome']} },
    { name:'mobile-safari', use:{...devices['iPhone 13']} },
  ],
  webServer: {
    command:'python3 -m http.server 4173 --directory dist --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/',
    reuseExistingServer:!process.env.CI,
    timeout:20_000,
  }
});

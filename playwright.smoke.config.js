import { defineConfig } from '@playwright/test';

const pageUrl = process.env.PAGE_URL;
if (!pageUrl) throw new Error('PAGE_URL muss auf die veröffentlichte GitHub-Pages-URL zeigen.');

export default defineConfig({
  testDir: './smoke',
  retries: 2,
  use: { baseURL: pageUrl.endsWith('/') ? pageUrl : `${pageUrl}/`, headless: true }
});

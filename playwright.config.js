import { defineConfig } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH || '/Mini-Games/';
const port = Number(process.env.E2E_PORT || 4183);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: `${origin}${basePath}`, headless: true, viewport: { width: 1280, height: 900 } },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${origin}${basePath}`,
    env: { VITE_BASE_PATH: basePath },
    reuseExistingServer: false
  }
});

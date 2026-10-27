import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['./node_modules/playwright/cli.js', ...process.argv.slice(2)], {
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0' },
  stdio: 'inherit'
});
process.exit(result.status ?? 1);

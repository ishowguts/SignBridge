// Captures report screenshots of every screen. Needs `npm run build && npx vite preview --port 4173` running.
// Usage: node scripts/screenshots.cjs <fake-camera.y4m> <outDir>
const { chromium } = require('playwright');
(async () => {
  const [video, out] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${video}`] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1.5, permissions: ['camera'], reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const U = 'http://localhost:4173';
  const shot = async (name, full = false) => { await p.waitForTimeout(400); await p.screenshot({ path: `${out}/${name}.png`, fullPage: full }); };

  // Live recognition: recognising state, result, saved + undo toast
  await p.goto(`${U}/recognition`);
  await p.waitForSelector('text=Model ready', { timeout: 60000 });
  await shot('S2_live_idle');
  await p.keyboard.press(' ');
  await p.waitForSelector('text=Current guess', { timeout: 20000 });
  await p.waitForTimeout(150);
  await shot('S3_live_recognising');
  await p.waitForSelector('#result-confirm-btn', { timeout: 30000 });
  await shot('S4_result');
  await p.click('#result-incorrect-btn');
  await shot('S5_correction');
  await p.selectOption('#correction-select', 'S');
  await p.click('#correction-submit-btn');
  await shot('S6_saved_toast_undo');
  await p.keyboard.press(' ');
  await p.waitForSelector('#result-confirm-btn', { timeout: 30000 });
  await p.keyboard.press('c');
  await p.keyboard.press('?');
  await shot('S7_shortcuts_dialog');
  await p.keyboard.press('Escape');

  for (const [path, name] of [['/', 'S1_dashboard'], ['/signs', 'S8_supported_signs'], ['/history', 'S10_history'], ['/how-it-works', 'S11_how_it_works'], ['/settings', 'S12_settings']]) {
    await p.goto(U + path);
    await shot(name, path === '/how-it-works' || path === '/settings');
  }
  await p.goto(`${U}/signs`);
  await p.click('#try-sign-w-btn');
  await shot('S9_sign_detail');

  // Demo-mode uncertain state
  await p.goto(`${U}/recognition`);
  await p.click('text=Demo (no camera)');
  await p.click('#simulate-uncertain-btn');
  await p.waitForSelector('#uncertain-retry-btn', { timeout: 10000 });
  await shot('S13_uncertain_demo');

  // Dark mode + mobile
  await p.evaluate(() => localStorage.setItem('signbridge_preferences', JSON.stringify({ theme: 'dark' })));
  await p.goto(`${U}/recognition`);
  await p.waitForSelector('text=Model ready', { timeout: 60000 });
  await shot('S14_dark_mode');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => localStorage.setItem('signbridge_preferences', JSON.stringify({ theme: 'light' })));
  await p.goto(`${U}/`);
  await shot('S15_mobile_dashboard');
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });

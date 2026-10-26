// Usage: preview on :4173, then: node scripts/e2e-camera.cjs <dir containing test.y4m> (a y4m video of one held-out sign image)
const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2];
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${S}/test.y4m`] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, permissions: ['camera'] });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  await p.goto('http://localhost:4173/recognition');
  await p.waitForSelector('text=Model ready', { timeout: 60000 });
  console.log('badge:', await p.locator('text=Model ready').innerText());
  await p.keyboard.press(' ');
  await p.waitForSelector('#result-confirm-btn, #uncertain-retry-btn', { timeout: 30000 });
  await p.screenshot({ path: `${S}/e2e_result.png` });
  console.log('result:', (await p.locator('[aria-label^="Predicted sign"]').allInnerTexts()).join(','));
  await p.keyboard.press('c');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${S}/e2e_toast.png` });
  console.log('toast:', await p.locator('[role=status]').last().innerText());
  await p.keyboard.press('u');
  await p.waitForTimeout(300);
  console.log('after undo history:', await p.evaluate(() => localStorage.getItem('signbridge_history')));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });

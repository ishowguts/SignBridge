// Usage: npm run build && npx vite preview --port 4173, then: node scripts/ui-tests.cjs
const { chromium } = require('playwright');
(async () => {
  const U = 'http://localhost:4173';
  // 5: permission denied
  let b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--deny-permission-prompts'] });
  let p = await (await b.newContext()).newPage();
  await p.goto(U + '/recognition'); await p.click('#cam-start-btn');
  await p.waitForTimeout(1500);
  console.log('5 denied:', await p.locator('text=Camera access denied').count() > 0 || await p.locator('text=Camera error').count() > 0, await p.locator('#retry-camera-btn, #retry-camera-error-btn').count());
  await b.close();
  b = await chromium.launch(); p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  // 6: shortcut while typing
  await p.goto(U + '/history');
  await p.evaluate(() => localStorage.setItem('signbridge_history', JSON.stringify([{id:'a',label:'A',timestamp:new Date().toISOString(),mode:'ml',status:'recognized',confidence:0.9,userFeedback:'correct',isSimulated:false},{id:'b',label:'B',timestamp:new Date().toISOString(),mode:'ml',status:'recognized',confidence:0.8,userFeedback:'incorrect',isSimulated:false}])));
  await p.reload(); await p.waitForSelector('[aria-label="Delete entry A"]');
  await p.keyboard.press('/');
  const focused = await p.evaluate(() => document.activeElement.id);
  await p.keyboard.type('?u');
  console.log('6 slash focuses search:', focused, '| dialog opened while typing:', await p.locator('#shortcuts-title').count());
  await p.fill('#history-search', '');
  // 7: delete + undo
  await p.click('[aria-label="Delete entry A"]');
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem('signbridge_history')).length);
  await p.keyboard.press('u'); await p.waitForTimeout(200);
  const undone = await p.evaluate(() => JSON.parse(localStorage.getItem('signbridge_history')).length);
  console.log('7 delete->', after, 'undo->', undone);
  // clear + undo
  await p.click('#clear-history-btn'); await p.click('text=Clear History >> nth=-1');
  const c1 = await p.evaluate(() => localStorage.getItem('signbridge_history'));
  await p.click('[aria-label^="Undo last action"]');
  console.log('clear->', c1, 'undo->', await p.evaluate(() => JSON.parse(localStorage.getItem('signbridge_history')).length));
  // 8: mobile width no horizontal scroll
  await p.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/recognition', '/signs', '/history', '/how-it-works', '/settings']) { await p.goto(U + path); console.log('8', path, 'overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.querySelector('main').scrollWidth > document.querySelector('main').clientWidth)); }
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });

import { chromium } from 'playwright-core';
import fs from 'node:fs';
const OUT = '/workspace/hackyard/rec';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const FAST2 = Number(process.env.FAST2 || 20);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: OUT, size: { width: 1280, height: 720 } }, acceptDownloads: true });
await ctx.addInitScript(() => {
  if (location.port !== '4173') return;
  window.__sfx = [];
  const C = window.AudioContext;
  if (C) {
    const orig = C.prototype.createOscillator;
    C.prototype.createOscillator = function () {
      const osc = orig.call(this); const ac = this;
      const sv = osc.frequency.setValueAtTime.bind(osc.frequency);
      osc.frequency.setValueAtTime = (v, t) => { osc.__freq = v; return sv(v, t); };
      const st = osc.start.bind(osc);
      osc.start = (when) => { osc.__start = when; return st(when); };
      const sp = osc.stop.bind(osc);
      osc.stop = (when) => {
        const delay = Math.max(0, (osc.__start ?? ac.currentTime) - ac.currentTime);
        window.__sfx.push({ wall: Date.now() + delay * 1000, dur: when - 0.02 - (osc.__start ?? 0), freq: osc.__freq || 440, type: osc.type });
        return sp(when);
      };
      return osc;
    };
  }
  const style = () => {
    const s = document.createElement('style');
    s.textContent = `.__tap{position:fixed;z-index:99999;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:4px solid rgba(255,255,255,.9);background:rgba(255,255,255,.25);pointer-events:none;animation:__tap .5s ease-out forwards}@keyframes __tap{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}`;
    document.head.appendChild(s);
  };
  document.addEventListener('DOMContentLoaded', style);
  window.addEventListener('pointerdown', (e) => {
    const d = document.createElement('div'); d.className = '__tap';
    d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 600);
  }, true);
});
const page = await ctx.newPage();
const t0 = Date.now();
const marks = {};
const mark = (k) => { marks[k] = (Date.now() - t0) / 1000; console.log('mark', k, marks[k]); };
const wait = (ms) => page.waitForTimeout(ms);
const cap = (a, b, c) => page.evaluate(([a, b, c]) => window.caption(a, b, c), [a, b, c]);
const speed = (s) => page.evaluate((s) => window.speed(s), s);

page.setDefaultTimeout(120000); ctx.setDefaultTimeout(120000); ctx.setDefaultNavigationTimeout(120000);
// clear app storage first in a throwaway page on the same origin
const prep = await ctx.newPage();
await prep.goto('http://127.0.0.1:4173/');
await prep.evaluate(async () => { localStorage.clear(); for (const r of (await navigator.serviceWorker?.getRegistrations?.()) || []) await r.unregister(); });
await prep.close();
await page.goto('http://127.0.0.1:4180/stage.html');
await page.evaluate(() => { document.getElementById('app').src = 'http://127.0.0.1:4173/'; });
let app = null;
while (!app) { app = page.frames().find((f) => f.url().startsWith('http://127.0.0.1:4173')); if (!app) await page.waitForTimeout(100); }
await app.waitForSelector('#chore-laundry');
await page.evaluate(() => document.fonts.ready);
await wait(400);
mark('start');
await cap('The chore', 'Turn the chore into a boss fight.', 'Pick a chore, start the raid, put the phone down nearby, and get to work.');
await wait(4200);

await cap('Step 1', 'Pick the chore. Pick the time.', 'The clock is the boss’s HP. 5 minutes = 300 HP.');
await wait(700);
await app.click('#chore-laundry'); await wait(1100);
await app.click('#dur-5'); await wait(1200);
await app.getByRole('button', { name: /Start raid/ }).click();
mark('raidStart');
await cap('Step 2', 'Start the raid when you start the chore.', 'Laundry Drake only goes down if you stay with it for the full clock.');
await wait(3800);
mark('fast1');
await speed('12×');
await cap('A real 5:00 raid', 'Boss HP drains while you work.', 'No fake tasks. The game runs alongside the real one.');

async function kind() {
  return app.evaluate(() => {
    const c = document.querySelector('.challenge'); if (!c) return null;
    if (c.querySelector('.mark')) return 'tap';
    if (c.querySelector('.hold')) return 'hold';
    const s = c.querySelector('.swipe'); if (s) return 'swipe-' + [...s.classList].find((x) => x.startsWith('dir-')).slice(4);
    return 'unknown';
  });
}
async function solve(k, human) {
  await wait(human ? 1300 : 700);
  if (k === 'tap') {
    const b = await (await app.$('.challenge .mark')).boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); return;
  }
  if (k === 'hold') {
    const b = await (await app.$('.challenge .hold')).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await wait(1050); await page.mouse.up(); return;
  }
  if (k.startsWith('swipe')) {
    const dir = k.slice(6);
    const el = await app.$('.challenge .knob') || await app.$('.challenge .swipe');
    const b = await el.boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    const dx = dir === 'left' ? -120 : dir === 'right' ? 120 : 0, dy = dir === 'up' ? -120 : 0;
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(x + dx * i / 12, y + dy * i / 12); await wait(25); }
    await page.mouse.up(); return;
  }
  console.log('unknown challenge');
}
const solved = [];
// first check at 1x
while (!(await kind())) await wait(100);
mark('check1');
await speed('');
await cap('Every 40–50 seconds', 'Still going?', 'Tap, hold, or swipe to prove you’re still there. Miss two in a row and the raid wipes.');
let k = await kind(); solved.push(k);
try { await solve(k, true); } catch (e) { console.log('solve fail', e.message); }
await wait(2200);
mark('fast2');
await speed(`${FAST2}×`);
await cap('Stay with it', 'Answer the checks. Keep the combo.', 'Wander off for 12 seconds or ignore two checks and the boss wins.');
while (true) {
  const done = await app.evaluate(() => !!document.querySelector('.result'));
  if (done) break;
  const t = await app.evaluate(() => document.querySelector('.timer')?.textContent || '');
  if (t && /^0:0[0-5]$/.test(t.trim()) && !marks.final) {
    mark('final'); await speed('');
    await cap('Final stretch', 'Last the clock…', '');
  }
  k = await kind();
  if (k) { solved.push(k); console.log('check', k, t, (Date.now() - t0) / 1000); try { await solve(k, false); } catch (e) { console.log('solve fail', e.message); } await wait(300); }
  if ((Date.now() - t0) / 1000 > marks.raidStart + 360) { console.log('TIMEOUT', t); break; }
  await wait(150);
}
mark('clear');
await speed('');
const cleared = await app.evaluate(() => !!document.querySelector('.result.is-clear'));
console.log('cleared', cleared, 'solved', solved);
await cap('Boss down', 'Because the laundry is done.', 'XP, a daily streak, and a clear card you can save as a PNG.');
await wait(3600);
await app.evaluate(() => document.querySelector('.card-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
await app.waitForSelector('.card-slot img', { timeout: 8000 });
await wait(2600);
await app.evaluate(() => document.querySelector('.result-actions')?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
await wait(900);
const [dl] = await Promise.all([page.waitForEvent('download'), app.getByRole('button', { name: 'Save card' }).click()]);
await dl.saveAs(`${OUT}/clear-card.png`);
await cap('Share it', 'Save or share the clear card.', 'Progress lives on your phone. No account, no backend.');
await wait(2600);
await app.getByRole('button', { name: 'Home' }).click();
await wait(300);
await app.evaluate(() => window.scrollTo({ top: 0 }));
await cap('Come back tomorrow', 'One clear a day keeps the streak.', 'Wipes are soft: no guilt copy, just run it back.');
await wait(3400);
mark('endcard');
await page.evaluate(() => window.endCard(true));
await wait(4200);
mark('end');
const sfx = await app.evaluate(() => window.__sfx || []);
fs.writeFileSync(`${OUT}/timeline.json`, JSON.stringify({ t0, marks, fast1: 12, fast2: FAST2, sfx: sfx.map((s) => ({ ...s, t: (s.wall - t0) / 1000 })), solved }, null, 2));
await page.close();
const vpath = await page.video().path();
await ctx.close(); await browser.close();
fs.renameSync(vpath, `${OUT}/raw.webm`);
console.log('done', vpath);

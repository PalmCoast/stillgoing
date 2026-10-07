import { chromium } from 'playwright-core';
const D = '/workspace/hackyard/stillgoing/docs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
// mobile raid + check (real mode)
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await m.newPage(); p.setDefaultTimeout(120000);
await p.goto('http://127.0.0.1:4173/');
await p.evaluate(async () => { localStorage.clear(); for (const r of (await navigator.serviceWorker?.getRegistrations?.()) || []) await r.unregister(); });
await p.reload(); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${D}/home.png` });
await p.click('#chore-laundry'); await p.click('#dur-10');
await p.getByRole('button', { name: /Start raid/ }).click();
await p.waitForTimeout(2500);
await p.screenshot({ path: `${D}/raid.png` });
await p.waitForSelector('.challenge', { timeout: 70000 });
await p.waitForTimeout(1200);
await p.screenshot({ path: `${D}/check.png` });
await m.close();
// hero: stage with phone mid-raid
const s = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const sp = await s.newPage(); sp.setDefaultTimeout(120000);
await sp.goto('http://127.0.0.1:4180/stage.html');
await sp.evaluate(() => { document.getElementById('app').src = 'http://127.0.0.1:4173/'; });
let app = null;
while (!app) { app = sp.frames().find((f) => f.url().startsWith('http://127.0.0.1:4173')); if (!app) await sp.waitForTimeout(100); }
await app.waitForSelector('#chore-dishes');
await app.click('#chore-dishes'); await app.click('#dur-10');
await app.getByRole('button', { name: /Start raid/ }).click();
await sp.evaluate(() => { window.caption('The pitch', 'A boss fight that only dies if you actually finish the chore.', 'Pick a chore. The timer is the boss’s HP. Every 40–50 seconds: “Still going?”'); document.querySelector('.foot').style.display = ''; });
await sp.waitForTimeout(48000);
await app.waitForSelector('.challenge', { timeout: 30000 }).catch(() => {});
await sp.waitForTimeout(1200);
await sp.screenshot({ path: `${D}/hero.png` });
await browser.close();
console.log('shots done');

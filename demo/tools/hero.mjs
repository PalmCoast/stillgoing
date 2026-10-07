import { chromium } from 'playwright-core';
const D = '/workspace/hackyard/stillgoing/docs';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
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
await app.waitForSelector('.challenge', { timeout: 70000 });
await sp.waitForTimeout(1200);
await sp.screenshot({ path: `${D}/hero.png` });
await browser.close();
console.log('shots done');

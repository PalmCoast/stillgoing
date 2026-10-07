# Demo tooling

These are the scripts that produced `demo/still-going-demo.mp4` and the stills in `docs/`. None of them are part of the app bundle.

- `stage.html`: the 1280×720 stage, with the app in an iframe phone frame and side captions. It expects `syne.woff2`, `outfit.woff2`, and `oxanium.woff2` next to it. Copy them from `node_modules/@fontsource-variable/*/files/`.
- `record.mjs`: plays a real 5:00 Laundry raid with Playwright (`playwright-core` and system Chrome), answers every check, saves the clear card, and records the raw video and a timeline. The app is served on `:4173` (`npm run preview`) and the stage on `:4180`.
- `edit.py`: speeds up the long stretches (12× and 20×), re-synthesizes the app's sound cues from the logged events, and encodes the H.264/AAC mp4 with ffmpeg.
- `shots.mjs` and `hero.mjs` take the stills in `docs/`. `og.html` renders `public/og.png` from a headless Chrome screenshot at 1200×630.

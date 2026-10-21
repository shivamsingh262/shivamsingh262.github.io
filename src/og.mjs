// Renders dist/og.png, the 1200x630 preview image shown when the site is
// shared on LinkedIn, Slack, WhatsApp and so on, dist/apple-touch-icon.png,
// and dist/notes/<slug>/og.png for each published note, with the note's title
// on it. Run after `npm run build`.
//
// Puppeteer is borrowed from a resume-pdf-builder checkout instead of being a
// dependency of this site: PUPPETEER_FROM points at it (default ../resume).

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { esc } from './templates.mjs';
import { loadNotes } from './notes.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const builder = path.resolve(ROOT, process.env.PUPPETEER_FROM || '../resume');
const puppeteer = createRequire(path.join(builder, 'package.json'))('puppeteer');

const config = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
const resume = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'resume.json'), 'utf8'));
const dataUri = async (file, type) => `data:${type};base64,${(await fs.readFile(file)).toString('base64')}`;

const inter = await dataUri(path.join(ROOT, 'static/fonts/inter-latin.woff2'), 'font/woff2');
const serif = await dataUri(path.join(ROOT, 'static/fonts/source-serif-latin.woff2'), 'font/woff2');
const photo = await dataUri(path.join(ROOT, 'data', resume.photo), `image/${path.extname(resume.photo).slice(1).replace('jpg', 'jpeg')}`);

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family:Inter; font-weight:400 700; src:url(${inter}) format('woff2'); }
@font-face { font-family:'Source Serif 4'; font-weight:400 700; src:url(${serif}) format('woff2'); }
* { margin:0; box-sizing:border-box; }
body { width:1200px; height:630px; background:#1a2b4c; color:#fff; font-family:Inter; display:flex; align-items:center; gap:64px; padding:0 88px; }
img { width:280px; height:280px; border-radius:50%; object-fit:cover; border:6px solid rgba(255,255,255,0.14); flex-shrink:0; }
h1 { font:700 76px/1.05 'Source Serif 4'; }
.role { font-size:34px; font-weight:500; color:#b9c8e8; margin-top:14px; }
.tagline { font-size:27px; line-height:1.4; color:#e3e9f6; margin-top:26px; max-width:680px; }
.url { font-size:22px; color:#8fa6d6; margin-top:34px; letter-spacing:0.02em; }
</style></head><body>
<img src="${photo}" alt="">
<div>
  <h1>${esc(resume.name)}</h1>
  <div class="role">${esc(resume.title)}</div>
  <div class="tagline">${esc(config.tagline)}</div>
  <div class="url">${esc(config.url.replace(/^https:\/\//, ''))}</div>
</div>
</body></html>`;

// A note's preview: its title, sized down as it gets longer so it fits in
// four lines, above a byline with the photo, name and site address.
const noteHtml = (note) => {
  const size = note.title.length > 90 ? 50 : note.title.length > 60 ? 58 : note.title.length > 36 ? 68 : 80;
  const date = new Date(`${note.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family:Inter; font-weight:400 700; src:url(${inter}) format('woff2'); }
@font-face { font-family:'Source Serif 4'; font-weight:400 700; src:url(${serif}) format('woff2'); }
* { margin:0; box-sizing:border-box; }
body { width:1200px; height:630px; background:#1a2b4c; color:#fff; font-family:Inter; display:flex; flex-direction:column; padding:72px 88px 64px; }
.label { font-size:24px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#8fa6d6; }
h1 { font:700 ${size}px/1.12 'Source Serif 4'; margin-top:28px; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
.by { margin-top:auto; display:flex; align-items:center; gap:22px; }
img { width:76px; height:76px; border-radius:50%; object-fit:cover; border:3px solid rgba(255,255,255,0.14); }
.name { font-size:28px; font-weight:600; }
.url { font-size:22px; color:#8fa6d6; margin-top:4px; letter-spacing:0.02em; }
</style></head><body>
<div class="label">Notes · ${esc(date)}</div>
<h1>${esc(note.title)}</h1>
<div class="by">
  <img src="${photo}" alt="">
  <div><div class="name">${esc(resume.name)}</div><div class="url">${esc(config.url.replace(/^https:\/\//, ''))}</div></div>
</div>
</body></html>`;
};

const notes = await loadNotes();
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'og.png') });
  console.log('Wrote dist/og.png');

  for (const note of notes) {
    const dir = path.join(ROOT, 'dist', 'notes', note.slug);
    await fs.mkdir(dir, { recursive: true });
    await page.setContent(noteHtml(note));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, 'og.png') });
    console.log(`Wrote dist/notes/${note.slug}/og.png`);
  }

  // iOS home-screen icon: the SVG favicon at 180x180 PNG.
  const favicon = await dataUri(path.join(ROOT, 'static/favicon.svg'), 'image/svg+xml');
  await page.setViewport({ width: 180, height: 180 });
  await page.setContent(`<!DOCTYPE html><style>*{margin:0}img{display:block;width:180px;height:180px}</style><img src="${favicon}" alt="">`);
  await page.screenshot({ path: path.join(ROOT, 'dist', 'apple-touch-icon.png') });
  console.log('Wrote dist/apple-touch-icon.png');
} finally {
  await browser.close();
}

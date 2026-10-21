// Loads notes/<slug>.md, shared by the site build and the preview image
// renderer. Each note starts with a small front matter block:
//   ---
//   title: Post title
//   date: 2026-10-18
//   updated: 2026-11-02          (optional, when the note was last revised)
//   description: One sentence for search results and the feed.
//   draft: true                  (optional, keeps the note off the site)
//   ---

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Returns published notes, newest first, as { slug, title, date, updated?,
// description, body } where body is the raw Markdown after the front matter.
export async function loadNotes() {
  const dir = path.join(ROOT, 'notes');
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md') && f !== 'README.md');
  const notes = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(dir, file), 'utf8');
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`notes/${file}: missing front matter`);
    const meta = Object.fromEntries(
      match[1].split('\n').filter(Boolean).map((line) => {
        const i = line.indexOf(':');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      })
    );
    for (const key of ['title', 'date', 'description']) {
      if (!meta[key]) throw new Error(`notes/${file}: front matter needs "${key}"`);
    }
    if (!DATE.test(meta.date)) throw new Error(`notes/${file}: date must be YYYY-MM-DD`);
    if (meta.updated && !DATE.test(meta.updated)) throw new Error(`notes/${file}: updated must be YYYY-MM-DD`);
    if (meta.updated && meta.updated < meta.date) throw new Error(`notes/${file}: updated is before date`);
    if (meta.draft === 'true') continue;
    notes.push({ ...meta, slug: file.replace(/\.md$/, ''), body: match[2] });
  }
  return notes.sort((a, b) => (a.date < b.date ? 1 : -1));
}

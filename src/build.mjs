// Builds the static site into dist/ from data/resume.json, site.config.json,
// notes/*.md and live GitHub repository data. Run with: npm run build
//
// Project data is fetched from the GitHub API (set GITHUB_TOKEN to avoid the
// anonymous rate limit). A successful fetch is saved to
// data/projects.cache.json, which is used when the API is unreachable.

import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import { renderPage, renderHome, renderNotesIndex, renderNote, render404 } from './templates.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CACHE = path.join(ROOT, 'data', 'projects.cache.json');

const readJson = async (file) => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'));

async function fetchRepo(owner, repo) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': `${owner}-site-build` };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${owner}/${repo}`);
  const r = await res.json();
  return {
    name: r.name,
    url: r.html_url,
    homepage: r.homepage || null,
    description: r.description || '',
    language: r.language || null,
    stars: r.stargazers_count,
    topics: r.topics || [],
    pushedAt: r.pushed_at,
  };
}

async function loadProjects(config) {
  try {
    const repos = await Promise.all(config.projects.map((p) => fetchRepo(config.githubUser, p.repo)));
    await fs.writeFile(CACHE, `${JSON.stringify(repos, null, 2)}\n`);
    return merge(repos);
  } catch (err) {
    console.warn(`Using cached project data (${err.message})`);
    return merge(JSON.parse(await fs.readFile(CACHE, 'utf8')));
  }

  function merge(repos) {
    return config.projects.map((p) => ({ ...repos.find((r) => r.name === p.repo), install: p.install || null }));
  }
}

// Notes are notes/<slug>.md with a small front matter block:
//   ---
//   title: Post title
//   date: 2026-10-18
//   description: One sentence for search results and the feed.
//   ---
async function loadNotes() {
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`notes/${file}: date must be YYYY-MM-DD`);
    if (meta.draft === 'true') continue;
    notes.push({ ...meta, slug: file.replace(/\.md$/, ''), html: marked.parse(match[2]) });
  }
  return notes.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const xmlEsc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

function feed(config, resume, notes) {
  const items = notes
    .map(
      (n) => `  <item>
    <title>${xmlEsc(n.title)}</title>
    <link>${config.url}/notes/${n.slug}/</link>
    <guid>${config.url}/notes/${n.slug}/</guid>
    <pubDate>${new Date(`${n.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${xmlEsc(n.description)}</description>
  </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xmlEsc(`${resume.name}: Notes`)}</title>
  <link>${config.url}/notes/</link>
  <atom:link href="${config.url}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>${xmlEsc(`Notes by ${resume.name} on AI agents, data infrastructure and developer tools.`)}</description>
  <language>en</language>
${items}
</channel>
</rss>
`;
}

function sitemap(config, notes, today) {
  const urls = [
    { loc: `${config.url}/`, lastmod: today },
    { loc: `${config.url}/notes/`, lastmod: notes[0]?.date || today },
    ...notes.map((n) => ({ loc: `${config.url}/notes/${n.slug}/`, lastmod: n.date })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

async function main() {
  const config = await readJson('site.config.json');
  const resume = await readJson('data/resume.json');
  const [projects, notes] = await Promise.all([loadProjects(config), loadNotes()]);
  const today = new Date().toISOString().slice(0, 10);
  const ctx = { config, resume, projects, notes };

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.cp(path.join(ROOT, 'static'), DIST, { recursive: true });
  await fs.copyFile(path.join(ROOT, 'data', resume.photo), path.join(DIST, path.basename(resume.photo)));
  // Self-host anime.js next to static/js/motion.js, which imports it.
  await fs.copyFile(path.join(ROOT, 'node_modules', 'animejs', 'dist', 'bundles', 'anime.esm.min.js'), path.join(DIST, 'js', 'anime.esm.min.js'));

  await write('index.html', renderPage(ctx, { path: '/', body: renderHome(ctx), home: true, motion: true }));
  await write(
    'notes/index.html',
    renderPage(ctx, {
      path: '/notes/',
      title: `Notes · ${resume.name}`,
      description: `Notes by ${resume.name} on AI agents, data infrastructure and developer tools.`,
      body: renderNotesIndex(ctx),
    })
  );
  for (const note of notes) {
    await write(
      `notes/${note.slug}/index.html`,
      renderPage(ctx, {
        path: `/notes/${note.slug}/`,
        title: `${note.title} · ${resume.name}`,
        description: note.description,
        type: 'article',
        body: renderNote(ctx, note),
        note,
      })
    );
  }
  await write('404.html', renderPage(ctx, { path: '/404.html', title: `Not found · ${resume.name}`, body: render404(), noindex: true, motion: true }));
  await write('feed.xml', feed(config, resume, notes));
  await write('sitemap.xml', sitemap(config, notes, today));
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);

  console.log(`Built dist/ with ${projects.length} projects and ${notes.length} notes`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});

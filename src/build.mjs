// Builds the static site into dist/ from data/resume.json, site.config.json,
// notes/*.md and live GitHub repository data. Run with: npm run build
//
// Project data is fetched from the GitHub API (set GITHUB_TOKEN to avoid the
// anonymous rate limit). A successful fetch is saved to
// data/projects.cache.json, which is used when the API is unreachable.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Marked } from 'marked';
import { renderPage, renderHome, renderNotesIndex, renderNote, render404, esc } from './templates.mjs';
import { loadNotes } from './notes.mjs';
import { imageSize } from './image-size.mjs';

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

// Renders a note's Markdown. Headings get an id and a "#" link so sections can
// be linked to (and shown as jump links in search results). Images need alt
// text, and local ones get their width and height so the page doesn't shift
// as they load.
async function renderMarkdown(note) {
  const file = `notes/${note.slug}.md`;
  const ids = new Set();
  const md = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const base = inner.replace(/<[^>]+>|&[^;]+;/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        let id = base;
        for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
        ids.add(id);
        return `<h${depth} id="${id}">${inner} <a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${depth}>\n`;
      },
      image({ href, title, text, size }) {
        const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
        return `<img src="${esc(href)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''}${dims} loading="lazy" decoding="async">`;
      },
    },
  });
  const tokens = md.lexer(note.body);
  const images = [];
  md.walkTokens(tokens, (t) => {
    // The page already shows the title as its h1.
    if (t.type === 'heading' && t.depth === 1) throw new Error(`${file}: use ## for headings, the title is already the page's h1 ("# ${t.text}")`);
    if (t.type === 'image') images.push(t);
  });
  for (const img of images) {
    if (!img.text.trim()) throw new Error(`${file}: image ${img.href} needs alt text, e.g. ![What it shows](${img.href})`);
    // Local images live in static/ and are referenced from the site root.
    if (!img.href.startsWith('/') || img.href.startsWith('//')) continue;
    const local = path.join(ROOT, 'static', decodeURI(img.href.split(/[?#]/)[0]));
    const buf = await fs.readFile(local).catch(() => {
      throw new Error(`${file}: image ${img.href} not found at static${img.href}`);
    });
    img.size = imageSize(buf);
    if (!img.size) console.warn(`${file}: couldn't read the size of ${img.href}`);
  }
  return md.parser(tokens);
}

// Feed readers show the HTML outside the site, so links must be absolute.
function absolute(html, config, note) {
  return html
    .replace(/(href|src)="\/(?!\/)/g, `$1="${config.url}/`)
    .replace(/href="#/g, `href="${config.url}/notes/${note.slug}/#`);
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
    <content:encoded><![CDATA[${absolute(n.html, config, n).replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>
  </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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

// A Markdown copy of each note at /notes/<slug>.md, for AI tools and anyone
// who wants the source. Site-relative links are made absolute so the file
// still works when it's read on its own.
function noteMarkdown(config, resume, note) {
  const body = note.body.trim().replace(/\]\(\/(?!\/)/g, `](${config.url}/`).replace(/(href|src)="\/(?!\/)/g, `$1="${config.url}/`);
  const dates = `Published ${note.date}${note.updated ? `, updated ${note.updated}` : ''}`;
  return `# ${note.title}\n\n> ${note.description}\n\nBy ${resume.name}. ${dates}. Canonical page: ${config.url}/notes/${note.slug}/\n\n${body}\n`;
}

// /llms.txt (https://llmstxt.org): a short Markdown guide to the site for
// language models, linking to the Markdown copy of each note.
function llmsTxt(config, resume, projects, notes) {
  const list = (items) => items.map(([title, url, desc]) => `- [${title}](${url})${desc ? `: ${desc}` : ''}`).join('\n');
  const sections = [
    `# ${resume.name}`,
    `> ${config.description}`,
    resume.summary,
    `## Profile\n\n${list([
      ['Home page', `${config.url}/`, 'experience, open source projects, skills and education'],
      ['Resume (PDF)', `${config.url}/resume.pdf`],
      ['GitHub', `https://github.com/${config.githubUser}`],
      ...(resume.linkedin?.url ? [['LinkedIn', resume.linkedin.url]] : []),
    ])}`,
    notes.length && `## Notes\n\n${list(notes.map((n) => [n.title, `${config.url}/notes/${n.slug}.md`, n.description]))}`,
    `## Open source projects\n\n${list(projects.map((p) => [p.name, p.url, p.description]))}`,
    `## Optional\n\n${list([['RSS feed', `${config.url}/feed.xml`, 'full text of every note']])}`,
  ];
  return `${sections.filter(Boolean).join('\n\n')}\n`;
}

// The home page's lastmod is the date of the latest commit, not the build
// date, so the weekly rebuild doesn't claim a change that didn't happen.
function lastCommitDate(fallback) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

const modified = (note) => note.updated || note.date;

function sitemap(config, notes, today) {
  const urls = [
    { loc: `${config.url}/`, lastmod: lastCommitDate(today) },
    // The notes index is left out (and noindexed) until there's a note on it.
    ...(notes.length ? [{ loc: `${config.url}/notes/`, lastmod: notes.map(modified).sort().at(-1) }] : []),
    ...notes.map((n) => ({ loc: `${config.url}/notes/${n.slug}/`, lastmod: modified(n) })),
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
  for (const note of notes) note.html = await renderMarkdown(note);
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
      noindex: !notes.length,
      notesIndex: true,
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
        image: `${config.url}/notes/${note.slug}/og.png`,
        imageAlt: note.title,
        body: renderNote(ctx, note),
        note,
      })
    );
    await write(`notes/${note.slug}.md`, noteMarkdown(config, resume, note));
  }
  await write('404.html', renderPage(ctx, { path: '/404.html', title: `Not found · ${resume.name}`, body: render404(), noindex: true, motion: true }));
  await write('feed.xml', feed(config, resume, notes));
  await write('sitemap.xml', sitemap(config, notes, today));
  await write('llms.txt', llmsTxt(config, resume, projects, notes));
  await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);

  console.log(`Built dist/ with ${projects.length} projects and ${notes.length} notes`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});

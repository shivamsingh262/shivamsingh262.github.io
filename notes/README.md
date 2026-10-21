# Writing a note

Add a Markdown file here, e.g. `notes/agent-memory.md`. The file name becomes
the URL (`/notes/agent-memory/`). Start it with front matter:

```markdown
---
title: What I learned building memory for AI agents
date: 2026-10-20
description: One sentence shown in search results, the notes list and the RSS feed.
---

Your post in Markdown...
```

Add `draft: true` to the front matter to keep a note out of the site until it's
ready. When you revise a published note, add `updated: YYYY-MM-DD` so search
engines and the sitemap know it changed; the page shows it too.

- Start sections at `##`: the title is already the page's heading, and a `#`
  heading fails the build. Every section gets an id and a `#` link, so you can
  link to `/notes/agent-memory/#some-heading`.
- Put images in `static/`, e.g. `static/notes/agent-memory/diagram.png`, and
  reference them as `![What the diagram shows](/notes/agent-memory/diagram.png)`.
  Alt text is required, and the build fills in each local image's size.
- `npm run og` makes each note its own share image with the title on it. Push to `main` and the site rebuilds; the note appears on the home page,
on `/notes/`, in `feed.xml` and in `sitemap.xml`.

This README itself is never published.

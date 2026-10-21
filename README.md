# shivamsingh262.github.io

Source for [shivamsingh262.com](https://shivamsingh262.com), my
portfolio site. It's generated from the same JSON that builds my resume PDF,
plus live data about my GitHub projects.

## How it works

- `data/resume.json` holds the resume content, in
  [resume-pdf-builder](https://github.com/shivamsingh262/resume-pdf-builder)'s
  format. Editing it updates both the site and the PDF.
- `site.config.json` holds the site URL, tagline, SEO description, the
  featured projects and the optional GoatCounter code.
- `notes/*.md` are posts for the Notes section and RSS feed; see
  [`notes/README.md`](notes/README.md).
- `src/build.mjs` renders `dist/`: the home page, notes, `feed.xml`,
  `sitemap.xml`, `robots.txt` and schema.org `Person` data. Project details
  (description, language, stars, topics) come from the GitHub API, with
  `data/projects.cache.json` as a fallback.
- The [Deploy workflow](.github/workflows/deploy.yml) runs on every push to
  `main` and weekly. It builds the site, builds `/resume.pdf` with
  resume-pdf-builder, renders the `/og.png` social preview, and publishes to
  GitHub Pages.

## Local development

Needs Node 22.13+ and a resume-pdf-builder checkout at `../resume` (or set
`BUILDER` and `PUPPETEER_FROM` to its path) for the PDF and preview image.

```sh
npm install
npm run build        # site only
npm run build:all    # site, resume PDF and social preview image
npm run serve        # http://localhost:8000
```

## Analytics

Set `goatcounter` in `site.config.json` to your GoatCounter site code (the
`CODE` in `CODE.goatcounter.com`) to turn on cookieless visit counts. Leave it
empty to load no analytics at all.

## License

The code in `src/` is available under the MIT License. The resume content,
photo and notes are my own and not licensed for reuse. The bundled Inter and
Source Serif 4 fonts are under the SIL Open Font License 1.1 (see
`static/fonts/`).

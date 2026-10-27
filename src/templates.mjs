// HTML templates for the site. Every piece of data is escaped with esc()
// except note bodies, which are rendered from the site's own Markdown files.

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ICONS = {
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  linkedin:
    '<svg viewBox="10 10 52 52" fill="currentColor" aria-hidden="true"><path d="M62,62 L51.315625,62 L51.315625,43.8021149 C51.315625,38.8127542 49.4197917,36.0245323 45.4707031,36.0245323 C41.1746094,36.0245323 38.9300781,38.9261103 38.9300781,43.8021149 L38.9300781,62 L28.6333333,62 L28.6333333,27.3333333 L38.9300781,27.3333333 L38.9300781,32.0029283 C38.9300781,32.0029283 42.0260417,26.2742151 49.3825521,26.2742151 C56.7356771,26.2742151 62,30.7644705 62,40.051212 L62,62 Z M16.349349,22.7940133 C12.8420573,22.7940133 10,19.9296567 10,16.3970067 C10,12.8643566 12.8420573,10 16.349349,10 C19.8566406,10 22.6970052,12.8643566 22.6970052,16.3970067 C22.6970052,19.9296567 19.8566406,22.7940133 16.349349,22.7940133 Z M11.0325521,62 L21.769401,62 L21.769401,27.3333333 L11.0325521,27.3333333 L11.0325521,62 Z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 9 6 9-6"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  star:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  ai:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 10h4v4h-4z"/></svg>',
  code:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/></svg>',
  database:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  cloud:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/></svg>',
  chart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  people:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/></svg>',
  rss:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>',
};

// GitHub's colors for the languages used in the featured projects.
const LANGUAGE_COLORS = {
  Go: '#00ADD8', JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Shell: '#89e051',
  'C++': '#f34b7d', C: '#555555', Ruby: '#701516', HTML: '#e34c26', CSS: '#563d7c',
};

const linkedinOf = (r) => (typeof r.linkedin === 'string' ? { url: r.linkedin } : r.linkedin);
// Other profiles (like PyPI) are listed under sameAs in site.config.json.
export const sameAs = (config, resume) => [`https://github.com/${config.githubUser}`, linkedinOf(resume)?.url, ...(config.sameAs || [])].filter(Boolean);
const monthYear = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const longDate = (ymd) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const CSS = `
@font-face { font-family:'Inter'; font-style:normal; font-weight:400 700; font-display:swap; src:url('/fonts/inter-latin.woff2') format('woff2'); }
@font-face { font-family:'Source Serif 4'; font-style:normal; font-weight:400 700; font-display:swap; src:url('/fonts/source-serif-latin.woff2') format('woff2'); }
:root {
  color-scheme: light dark;
  --bg:#ffffff; --surface:#f5f7fb; --fg:#1f2430; --soft:#3c4354; --muted:#596175; --accent:#1a2b4c; --accent-2:#3a5694;
  --rule:#e2e6ee; --chip:#e9eef7; --focus:#3a5694; --dot:#c6cfdd; --dot-hot:#3a5694; --hl:rgba(58,86,148,.16); --live:#1f8a5b;
  --c-ai:#3a5694; --c-code:#7a4fb0; --c-database:#1f7a6d; --c-cloud:#b06a1f; --c-chart:#b0436a; --c-people:#3a5694;
}
@media (prefers-color-scheme: dark) {
  :root { --bg:#0e131d; --surface:#151c2a; --fg:#e4e8f0; --soft:#c3cad8; --muted:#9ba4b6; --accent:#d3def5; --accent-2:#94acdf; --rule:#253044; --chip:#1d2638; --focus:#94acdf; --dot:#33405c; --dot-hot:#94acdf; --hl:rgba(148,172,223,.2); --live:#5fd39a;
    --c-ai:#94acdf; --c-code:#b9a0e6; --c-database:#7fcbbd; --c-cloud:#e3ad6e; --c-chart:#e594b2; --c-people:#94acdf; }
}
* { box-sizing:border-box; margin:0; padding:0; }
html { -webkit-text-size-adjust:100%; scroll-behavior:smooth; scroll-padding-top:72px; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } }
body { background:var(--bg); color:var(--fg); font:400 16px/1.6 Inter, system-ui, sans-serif; overflow-wrap:break-word; }
a { color:var(--accent-2); text-underline-offset:3px; }
a:focus-visible, .button:focus-visible, .copy:focus-visible { outline:2px solid var(--focus); outline-offset:3px; border-radius:4px; }
.wrap { max-width:820px; margin:0 auto; padding:0 20px; }
.skip { position:absolute; left:-999px; top:8px; background:var(--accent); color:var(--bg); padding:8px 12px; border-radius:6px; z-index:10; }
.skip:focus { left:12px; }
.visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }

.site-header { position:sticky; top:0; z-index:5; background:color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border-bottom:1px solid var(--rule); }
.site-header .wrap { display:flex; align-items:center; justify-content:space-between; gap:16px; height:56px; }
.brand { font:700 17px 'Source Serif 4', Georgia, serif; color:var(--fg); text-decoration:none; white-space:nowrap; }
/* Home page: the header shows the local time until the hero name scrolls away,
   then static/js/motion.js swaps in the name. Without JS it shows the location. */
.brand.swap { display:grid; align-items:center; }
.brand.swap > * { grid-area:1 / 1; }
.brand-name { color:inherit; text-decoration:none; }
.swap .brand-name { opacity:0; transform:translateY(8px); pointer-events:none; }
.swap .brand-name:focus-visible { opacity:1 !important; transform:none !important; }
.brand-alt { display:inline-flex; align-items:center; gap:8px; font:400 13px/1 Inter, system-ui, sans-serif; color:var(--muted); font-variant-numeric:tabular-nums; }
.brand-alt::before { content:""; width:7px; height:7px; border-radius:50%; background:var(--accent-2); }
.brand-alt b { font-weight:600; color:var(--soft); }
.site-header nav { min-width:0; }
.nav { display:flex; gap:18px; list-style:none; font-size:14px; overflow-x:auto; scrollbar-width:none; }
.nav::-webkit-scrollbar { display:none; }
.nav a { color:var(--muted); text-decoration:none; white-space:nowrap; }
.nav a:hover { color:var(--fg); }

/* Hero: the dot field spans the whole hero and fades out behind the text; the
   status card floats on it, slightly see-through so ripples show behind it. */
.hero { position:relative; display:grid; grid-template-columns:228px minmax(0, 1fr); gap:64px; align-items:center; padding:44px 0 40px; }
/* The field is centered on the card and stops short of the text (its 40px
   margin is less than the 64px gap). Keeping it small also keeps the dot
   count, and the work to animate it, down. */
.hero-stage { position:relative; perspective:900px; }
.hero-stage > .field { inset:-40px; cursor:auto; -webkit-mask-image:radial-gradient(closest-side, #000 75%, transparent); mask-image:radial-gradient(closest-side, #000 75%, transparent); }
.hero-card { position:relative; display:grid; justify-items:center; gap:14px; padding:22px 14px 16px; border:1px solid var(--rule); border-radius:18px; background:color-mix(in srgb, var(--surface) 86%, transparent); }
.hero-card img { width:116px; height:116px; border-radius:50%; object-fit:cover; background:var(--surface); box-shadow:0 0 0 6px var(--bg); }
.status { display:flex; align-items:center; gap:7px; padding:7px 10px; border-radius:999px; background:var(--bg); border:1px solid var(--rule); font-size:12px; line-height:1.3; color:var(--soft); }
.ping { position:relative; width:8px; height:8px; flex-shrink:0; }
.ping::before, .ping i { content:""; position:absolute; inset:0; border-radius:50%; background:var(--live); }
.facts { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); width:100%; padding-top:12px; border-top:1px solid var(--rule); text-align:center; }
.facts div { display:grid; gap:2px; }
.facts div + div { border-left:1px solid var(--rule); }
.facts b { font-size:19px; font-weight:700; line-height:1.1; color:var(--accent); font-variant-numeric:tabular-nums; }
.facts span { font-size:11.5px; line-height:1.25; color:var(--muted); }
.motion .facts b { opacity:0; }
.hero-text { position:relative; }
.hero h1 { font:700 clamp(34px, 6vw, 50px)/1.05 'Source Serif 4', Georgia, serif; color:var(--accent); letter-spacing:-0.015em; }
.hero .role { font-size:18px; font-weight:500; color:var(--muted); margin-top:8px; }
.hero .tagline { position:relative; z-index:0; margin-top:10px; font-size:17px; max-width:46ch; }
/* Highlighter under the tagline's key phrases. A plain gradient without JS;
   with motion, static/js/motion.js draws it in as a sweep. */
.hl { white-space:nowrap; background:linear-gradient(var(--hl), var(--hl)) 0 88% / 100% .42em no-repeat; }
.motion .hl { position:relative; background:none; }
.hl i { position:absolute; left:-2px; right:-2px; bottom:.06em; height:.42em; border-radius:3px; background:var(--hl); transform-origin:left center; z-index:-1; }
.links { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
.button { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid var(--rule); background:var(--surface); color:var(--fg); text-decoration:none; font-size:14px; font-weight:500; }
.button:hover { border-color:var(--accent-2); }
.button.primary { background:var(--accent); border-color:var(--accent); color:var(--bg); }
.button svg { width:16px; height:16px; flex-shrink:0; }
button.button { font-family:inherit; cursor:pointer; }

/* Dot field: a static dot pattern in CSS; static/js/motion.js swaps in live dots
   that ripple on load and on tap. Purely decorative. */
.field { position:absolute; inset:0; background:radial-gradient(circle, var(--dot) 1.6px, transparent 2.2px) center / 20px 20px; -webkit-mask-image:radial-gradient(closest-side, #000 55%, transparent); mask-image:radial-gradient(closest-side, #000 55%, transparent); cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.motion .field { background:none; }
.field-grid { position:absolute; inset:0; display:grid; place-content:center; grid-template-columns:repeat(var(--cols), 20px); grid-auto-rows:20px; pointer-events:none; }
/* Live dots use the bright color at 30% opacity, which matches --dot, so a
   ripple only has to tween opacity. */
.field-grid i { width:4px; height:4px; border-radius:50%; background:var(--dot-hot); opacity:.3; place-self:center; }

.field-404 { position:relative; height:200px; margin-bottom:8px; }
@media (prefers-reduced-motion: no-preference) {
  .hero-text > :not(.links) { animation:rise .8s cubic-bezier(.2,.8,.2,1) both; }
  .hero-text > :nth-child(2) { animation-delay:.05s; }
  .hero-text > :nth-child(3) { animation-delay:.1s; }
  /* Buttons spring up in turn: an overshooting curve, no JS needed. */
  .links .button { animation:pop .7s cubic-bezier(.34,1.56,.64,1) both; }
  .links .button:nth-child(1) { animation-delay:.15s; }
  .links .button:nth-child(2) { animation-delay:.21s; }
  .links .button:nth-child(3) { animation-delay:.27s; }
  .links .button:nth-child(4) { animation-delay:.33s; }
}
@keyframes rise { from { transform:translateY(14px); } }
@keyframes pop { from { transform:translateY(10px); } }

section { padding:28px 0; border-top:1px solid var(--rule); }
h2 { font:700 13px Inter, sans-serif; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); margin-bottom:18px; }
.summary { font-size:17px; max-width:68ch; }
/* About: the summary's first sentence as a lead, the rest as labelled rows. */
.about-grid { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.25fr); gap:16px 32px; align-items:start; }
.about-grid .summary { font:600 clamp(19px, 2.6vw, 23px)/1.4 'Source Serif 4', Georgia, serif; color:var(--accent); }
.about-rows { display:grid; gap:12px; }
.about-rows div { display:grid; grid-template-columns:96px minmax(0, 1fr); gap:4px 14px; }
.about-rows dt { padding-top:2px; font-size:11.5px; font-weight:600; line-height:1.6; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
.about-rows dd { font-size:15.5px; color:var(--soft); }

.timeline { position:relative; padding-left:28px; }
.rail { position:absolute; left:5px; top:10px; bottom:10px; width:2px; border-radius:2px; background:var(--rule); }
.rail-fill { position:absolute; inset:0; border-radius:inherit; background:var(--accent-2); transform-origin:top; }
.marker { position:absolute; left:-28px; top:8px; width:12px; height:12px; border-radius:50%; border:2px solid var(--accent-2); background:var(--accent-2); transition:background-color .3s; }
.timeline.is-live .marker:not(.is-on) { background:var(--bg); }
.job { position:relative; }
.job + .job { margin-top:34px; }
.job-head { display:flex; justify-content:space-between; align-items:baseline; gap:4px 16px; flex-wrap:wrap; }
.job h3, .edu h3 { font-size:18px; font-weight:650; color:var(--accent); line-height:1.35; text-wrap:balance; }
.org { color:var(--accent-2); font-weight:600; font-size:15px; }
.dates { font-size:14px; color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
.job-meta { display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 8px; margin-top:2px; }
.job-meta .sep { color:var(--rule); }
.when { display:inline-flex; align-items:baseline; gap:8px; white-space:nowrap; }
.tenure { font-size:13px; color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
.tenure::before { content:"·"; margin-right:6px; }
.now { align-self:center; font-size:11px; font-weight:600; line-height:1; letter-spacing:.06em; text-transform:uppercase; padding:4px 7px; border-radius:999px; background:var(--chip); color:var(--accent-2); }
.stats { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
.stat { display:inline-flex; align-items:baseline; gap:6px; padding:6px 10px; border-radius:8px; background:var(--surface); border:1px solid var(--rule); font-size:13px; color:var(--muted); white-space:nowrap; }
.stat b { font-size:15px; font-weight:700; line-height:1; color:var(--accent); font-variant-numeric:tabular-nums; }
.groups { display:grid; gap:16px; margin-top:16px; }
.group { display:grid; grid-template-columns:96px minmax(0, 1fr); gap:6px 16px; align-items:start; }
.group-label { padding-top:3px; font-size:11.5px; font-weight:600; line-height:1.4; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
.points { list-style:none; padding:0; margin-top:14px; display:grid; gap:10px; max-width:64ch; }
.group .points { margin-top:0; }
.points li { position:relative; padding-left:16px; font-size:15.5px; color:var(--soft); }
.points li::before { content:""; position:absolute; left:0; top:.75em; width:6px; height:2px; border-radius:2px; background:var(--accent-2); }
.points strong { color:var(--fg); font-weight:600; }

.projects { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap:16px; }
.card { display:flex; flex-direction:column; gap:10px; padding:18px; border:1px solid var(--rule); border-radius:12px; background:var(--surface); }
.card h3 { font-size:17px; font-weight:650; }
.card h3 a { color:var(--accent); text-decoration:none; }
.card h3 a:hover { text-decoration:underline; }
.card p { font-size:15px; color:var(--fg); }
.card pre { position:relative; font:13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; background:var(--chip); border-radius:6px; padding:8px 10px; overflow-x:auto; }
.install { position:relative; }
.install pre { padding-right:44px; }
.copy { position:absolute; top:50%; right:4px; margin-top:-15px; width:30px; height:30px; display:grid; place-items:center; border:0; border-radius:6px; background:var(--chip); color:var(--muted); cursor:pointer; }
.copy:hover { color:var(--fg); background:var(--surface); }
.copy svg { grid-area:1 / 1; width:16px; height:16px; }

/* Swipe deck for the project cards on phones, set up by static/js/motion.js. */
.projects.is-deck { display:block; position:relative; height:var(--deck-h); }
.is-deck .card { position:absolute; top:0; left:0; right:0; height:var(--card-h); transform-origin:50% 100%; touch-action:pan-y; user-select:none; -webkit-user-select:none; cursor:grab; box-shadow:0 14px 28px -22px rgb(20 30 60 / .55); }
.is-deck .card.is-dragging { cursor:grabbing; }
.deck-bar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; margin-top:14px; font-size:14px; color:var(--muted); font-variant-numeric:tabular-nums; }
.deck-buttons { display:flex; gap:8px; }
.meta { display:flex; flex-wrap:wrap; align-items:center; gap:6px 14px; font-size:13px; color:var(--muted); margin-top:auto; }
.meta span { display:inline-flex; align-items:center; gap:5px; }
.meta svg { width:13px; height:13px; }
.dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
.topics { display:flex; flex-wrap:wrap; gap:6px; list-style:none; }
.topics li { font-size:12px; padding:2px 8px; border-radius:999px; background:var(--chip); color:var(--accent-2); }
.more { margin-top:16px; font-size:15px; }

.skills { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px; }
.skill-group { display:grid; gap:12px; align-content:start; min-width:0; padding:16px 16px 18px; border:1px solid var(--rule); border-radius:12px; background:var(--surface); }
.skill-group.wide { grid-column:1 / -1; }
.skill-head { display:grid; grid-template-columns:auto 1fr auto; gap:0 10px; align-items:center; }
.skill-head svg { width:20px; height:20px; color:var(--k, var(--accent-2)); grid-row:span 2; }
.skill-head h3 { font-size:16px; font-weight:650; color:var(--accent); line-height:1.3; }
.skill-head p { grid-column:2; font:12px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--muted); }
.skill-head .count { grid-column:3; grid-row:1 / span 2; font:500 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--muted); font-variant-numeric:tabular-nums; }
.skill-chips { display:flex; flex-wrap:wrap; gap:6px; list-style:none; }
.skill-chips li { font-size:13.5px; line-height:1; padding:7px 10px; border-radius:999px; border:1px solid var(--rule); background:var(--bg); }
.skill-list { list-style:none; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:6px 24px; }
.skill-list li { position:relative; padding-left:14px; font-size:15px; }
.skill-list li::before { content:""; position:absolute; left:0; top:.6em; width:5px; height:5px; border-radius:50%; background:var(--accent-2); }
.edu .org { display:block; margin-top:2px; }

.notes-list { list-style:none; }
.notes-list li + li { margin-top:18px; }
.notes-list a { font-size:18px; font-weight:600; color:var(--accent); text-decoration:none; }
.notes-list a:hover { text-decoration:underline; }
.notes-list p { color:var(--muted); font-size:15px; }
.empty { color:var(--muted); }
.related { margin-top:48px; padding-top:28px; border-top:1px solid var(--rule); max-width:70ch; }

.page { padding:48px 0 24px; }
.page h1 { font:700 clamp(28px, 5vw, 38px)/1.15 'Source Serif 4', Georgia, serif; color:var(--accent); }
.page .lede { color:var(--muted); margin-top:8px; }
.prose { margin-top:28px; font-size:17px; max-width:70ch; }
.prose > * + * { margin-top:1em; }
.prose h2 { font:700 24px 'Source Serif 4', Georgia, serif; letter-spacing:0; text-transform:none; color:var(--accent); margin:1.6em 0 0.4em; }
.prose h3 { font-size:19px; margin-top:1.4em; }
.prose ul, .prose ol { padding-left:22px; }
.prose code { font:0.9em ui-monospace, SFMono-Regular, Menlo, monospace; background:var(--chip); padding:1px 5px; border-radius:4px; }
.prose pre { background:var(--surface); border:1px solid var(--rule); border-radius:8px; padding:14px; overflow-x:auto; }
.prose pre code { background:none; padding:0; }
.prose blockquote { border-left:3px solid var(--rule); padding-left:14px; color:var(--muted); }
.prose img { max-width:100%; height:auto; border-radius:8px; }
.prose iframe { display:block; width:100%; aspect-ratio:16 / 9; border:1px solid var(--rule); border-radius:8px; background:#000; }
.prose :is(h2, h3, h4) { scroll-margin-top:80px; }
.prose .anchor { color:var(--muted); text-decoration:none; font-weight:400; opacity:0; }
.prose :is(h2, h3, h4):hover .anchor, .prose .anchor:focus { opacity:1; }
@media (hover: none) { .prose .anchor { opacity:0.5; } }

.site-footer { border-top:1px solid var(--rule); margin-top:24px; padding:24px 0 40px; font-size:14px; color:var(--muted); }
.site-footer .wrap { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px 20px; }
.site-footer a { color:var(--muted); }

@media (max-width: 600px) {
  .hero { grid-template-columns:minmax(0, 1fr); gap:24px; padding-top:24px; }
  .hero-stage { order:2; margin-inline:12px; }
  .hero-stage > .field { inset:-28px -32px; -webkit-mask-image:radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 85%); mask-image:radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 85%); }
  .about-grid { grid-template-columns:minmax(0, 1fr); }
  .about-rows div { grid-template-columns:minmax(0, 1fr); }
  .nav { gap:14px; }
  .skills { grid-template-columns:minmax(0, 1fr); }
  .skill-list { grid-template-columns:minmax(0, 1fr); }
  .group { grid-template-columns:minmax(0, 1fr); }
  .job-meta { flex-direction:column; align-items:flex-start; }
  .job-meta .sep { display:none; }
}
@media (max-width: 420px) {
  .brand-city { display:none; }
}
@media print {
  .site-header, .links, .site-footer, .skip, .field, .copy, .deck-bar, .rail, .ping { display:none; }
  .motion .facts b { opacity:1; }
  section { break-inside:auto; }
  .card, .job-head, .group { break-inside:avoid; }
}
`;

// [2025, 0] -> "2025-01"
const ym = ([y, m]) => `${y}-${String(m + 1).padStart(2, '0')}`;
const orgId = (config, name) => `${config.url}/#org-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

// Jobs from resume.json as EmployeeRoles, either the ones that have ended or the current ones.
function roles(config, resume, property, ended) {
  return resume.experience.flatMap((job) => {
    const span = parseDates(job.dates);
    if (!span || Boolean(span.end) !== ended) return [];
    return [{
      '@type': 'EmployeeRole',
      roleName: job.title,
      startDate: ym(span.start),
      endDate: span.end ? ym(span.end) : undefined,
      [property]: { '@type': 'Organization', '@id': orgId(config, job.company), name: job.company },
    }];
  });
}

// Structured data for the home page: the profile page, the person it's about
// and the site, linked by @id so search engines treat them as one entity.
// alternateName, the company URL and the city help tell this Shivam Singh
// apart from others with the same name.
function jsonLd({ config, resume }) {
  const person = `${config.url}/#person`;
  const company = resume.experience[0]?.company;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${config.url}/`,
        url: `${config.url}/`,
        name: `${resume.name} · ${config.title || resume.title}`,
        isPartOf: { '@id': `${config.url}/#website` },
        mainEntity: { '@id': person },
        primaryImageOfPage: { '@id': `${config.url}/#photo` },
      },
      {
        '@type': 'WebSite',
        '@id': `${config.url}/#website`,
        url: `${config.url}/`,
        name: resume.name,
        inLanguage: 'en',
        publisher: { '@id': person },
      },
      {
      '@type': 'Person',
      '@id': person,
      name: resume.name,
      alternateName: config.githubUser,
      jobTitle: resume.title,
      description: config.description,
      url: `${config.url}/`,
      // static/photo-1200.webp is the full-size export for search engines; the page shows the small one.
      image: { '@type': 'ImageObject', '@id': `${config.url}/#photo`, url: `${config.url}/photo-1200.webp`, contentUrl: `${config.url}/photo-1200.webp`, width: 1200, height: 1200, caption: `Portrait of ${resume.name}` },
      email: resume.email ? `mailto:${resume.email}` : undefined,
      address: resume.location ? { '@type': 'PostalAddress', addressLocality: resume.location.split(',')[0].trim(), addressCountry: 'IN' } : undefined,
      // Each job is a dated schema.org Role wrapping its employer: current jobs
      // under worksFor (after the plain Organization, for parsers that don't
      // read roles), past ones under alumniOf next to the school.
      worksFor: company
        ? [{ '@type': 'Organization', '@id': orgId(config, company), name: company, alternateName: config.companyAlternateName, url: config.companyUrl }, ...roles(config, resume, 'worksFor', false)]
        : undefined,
      alumniOf: [...resume.education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })), ...roles(config, resume, 'alumniOf', true)],
      knowsAbout: [...new Set(resume.skills.flatMap((g) => g.items.join(', ').split(',').map((s) => s.trim()).filter(Boolean)))],
      sameAs: sameAs(config, resume),
      },
    ],
  };
  // Escape "<" so a value can never close the script element.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// Structured data for a note page: the post itself and its breadcrumb trail.
function noteLd({ config, resume }, note, url, image) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: note.title,
        description: note.description,
        datePublished: note.date,
        dateModified: note.updated || note.date,
        inLanguage: 'en',
        keywords: note.keywords || undefined,
        wordCount: wordCount(note.body),
        url,
        mainEntityOfPage: url,
        isPartOf: { '@id': `${config.url}/#website` },
        image,
        encoding: { '@type': 'MediaObject', contentUrl: `${config.url}/notes/${note.slug}.md`, encodingFormat: 'text/markdown' },
        author: { '@type': 'Person', '@id': `${config.url}/#person`, name: resume.name, url: `${config.url}/`, sameAs: sameAs(config, resume) },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          ['Home', `${config.url}/`],
          ['Notes', `${config.url}/notes/`],
          [note.title, url],
        ].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// Structured data for the notes index: the page and the notes on it, in order.
function notesIndexLd({ config, resume, notes }, url) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': url,
    url,
    name: `Notes · ${resume.name}`,
    inLanguage: 'en',
    isPartOf: { '@id': `${config.url}/#website` },
    author: { '@id': `${config.url}/#person` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: notes.map((n, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'BlogPosting', headline: n.title, description: n.description, datePublished: n.date, url: `${config.url}/notes/${n.slug}/` },
      })),
    },
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// Words of prose, leaving out code blocks and inline HTML.
const wordCount = (md) => md.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}]\S*/gu)?.length || 0;

export function renderPage(ctx, page) {
  const { config, resume, notes } = ctx;
  const title = page.title || `${resume.name} · ${config.title || resume.title}`;
  const description = page.description || config.description;
  const url = `${config.url}${page.path}`;
  const image = page.image || `${config.url}/og.png`;
  const imageAlt = page.imageAlt || `${resume.name}, ${resume.title}`;
  const ogType = page.type || (page.home ? 'profile' : 'website');
  const base = page.home ? '' : '/';
  const nav = [['#about', 'About'], ['#experience', 'Experience'], ['#projects', 'Projects'], ['#skills', 'Skills']].map(([h, l]) => [base + h, l]);
  // Notes stay out of the nav, home page, feed link and sitemap until the first one exists.
  if (notes.length) nav.push(['/notes/', 'Notes']);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(resume.name)}">
${page.home && config.bingVerification ? `<meta name="msvalidate.01" content="${esc(config.bingVerification)}">` : ''}
${page.noindex ? '<meta name="robots" content="noindex">' : `<meta name="robots" content="max-image-preview:large">\n<link rel="canonical" href="${esc(url)}">`}
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(resume.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
${ogType === 'profile' ? `<meta property="profile:first_name" content="${esc(resume.name.split(' ')[0])}">\n<meta property="profile:last_name" content="${esc(resume.name.split(' ').slice(1).join(' '))}">` : ''}
${page.note ? `<meta property="article:published_time" content="${page.note.date}">\n<meta property="article:modified_time" content="${page.note.updated || page.note.date}">\n<meta property="article:author" content="${esc(config.url)}/">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e131d" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${page.note ? `<link rel="alternate" type="text/markdown" href="/notes/${esc(page.note.slug)}.md">` : ''}
${notes.length ? `<link rel="alternate" type="application/rss+xml" title="${esc(`${resume.name}: Notes`)}" href="/feed.xml">` : ''}
<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
${page.motion ? `<script>if (matchMedia('(prefers-reduced-motion: no-preference)').matches) document.documentElement.classList.add('motion');</script>` : ''}
${page.home ? `<script type="application/ld+json">${jsonLd(ctx)}</script>` : ''}
${page.note ? `<script type="application/ld+json">${noteLd(ctx, page.note, url, image)}</script>` : ''}
${page.notesIndex && notes.length ? `<script type="application/ld+json">${notesIndexLd(ctx, url)}</script>` : ''}
${config.goatcounter ? `<script data-goatcounter="https://${esc(config.goatcounter)}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    ${page.home && config.timezone
      ? `<div class="brand swap"><span class="brand-alt" data-tz="${esc(config.timezone)}" data-city="${esc(resume.location.split(',')[0])}">${esc(resume.location)}</span><a class="brand-name" href="/">${esc(resume.name)}</a></div>`
      : `<a class="brand" href="/">${esc(resume.name)}</a>`}
    <nav aria-label="Main"><ul class="nav">${nav.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></nav>
  </div>
</header>
<main id="main" class="wrap">
${page.body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <span>© ${new Date().getFullYear()} ${esc(resume.name)}</span>
    <span>${notes.length ? '<a href="/feed.xml">RSS</a> · ' : ''}<a href="https://github.com/${esc(config.githubUser)}/${esc(config.githubUser)}.github.io">Site source</a> · Resume PDF built with <a href="https://github.com/${esc(config.githubUser)}/resume-pdf-builder">resume-pdf-builder</a></span>
  </div>
</footer>
${page.motion ? `<script>addEventListener('load', () => import('/js/motion.js'));</script>` : ''}
</body>
</html>
`;
}

function renderProject(p) {
  const color = LANGUAGE_COLORS[p.language] || 'var(--muted)';
  return `
    <article class="card">
      <h3><a href="${esc(p.url)}">${esc(p.name)}</a></h3>
      <p>${esc(p.description)}</p>
      ${p.install ? `<pre><code>${esc(p.install)}</code></pre>` : ''}
      ${p.topics.length ? `<ul class="topics" aria-label="Topics">${p.topics.slice(0, 4).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <div class="meta">
        ${p.language ? `<span><i class="dot" style="background:${color}"></i>${esc(p.language)}</span>` : ''}
        ${p.stars ? `<span>${ICONS.star}${p.stars}<span class="visually-hidden"> stars</span></span>` : ''}
        <span>Updated ${monthYear(p.pushedAt)}</span>
        ${p.homepage ? `<a href="${esc(p.homepage)}">Website</a>` : ''}
      </div>
    </article>`;
}

// A skill group from resume.json, styled by its entry in site.config.json's
// "skills": a short note, an icon, "wide" to span both columns and "list" for
// phrases that read better as a list than as chips.
function renderSkillGroup(group, opts) {
  const items = group.items.join(', ').split(',').map((s) => s.trim()).filter(Boolean);
  const icon = ICONS[opts.icon] || '';
  const body = opts.list
    ? `<ul class="skill-list">${items.map((i) => `<li>${esc(i[0].toUpperCase() + i.slice(1))}</li>`).join('')}</ul>`
    : `<ul class="skill-chips">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  return `
    <article class="skill-group${opts.wide ? ' wide' : ''}"${opts.icon ? ` style="--k:var(--c-${esc(opts.icon)})"` : ''}>
      <div class="skill-head">${icon}<h3>${esc(group.category)}</h3>${opts.note ? `<p>${esc(opts.note)}</p>` : ''}<span class="count">${items.length}</span></div>
      ${body}
    </article>`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Jan 2025 – Present" -> { start: [2025, 0], end: null }; null if it doesn't parse.
function parseDates(dates = '') {
  const [from, to] = dates.split(/\s+[–-]\s+/);
  const ym = (s) => {
    const m = /^(\w{3})\w*\s+(\d{4})$/.exec(s?.trim() || '');
    return m && MONTHS.includes(m[1]) ? [Number(m[2]), MONTHS.indexOf(m[1])] : null;
  };
  const start = ym(from);
  if (!start) return null;
  const end = ym(to);
  return end || /present/i.test(to || '') ? { start, end } : null;
}

// Counts both the first and last month, so Jan 2025 to Oct 2026 is "1 yr 10 mo".
// static/js/motion.js has the same sum, to keep the current role up to date
// between rebuilds.
function tenure(start, end, now = new Date()) {
  const [ey, em] = end || [now.getUTCFullYear(), now.getUTCMonth()];
  const months = (ey - start[0]) * 12 + (em - start[1]) + 1;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(' ');
}

// One role on the timeline. site.config.json can bold the opening words of each
// bullet (`leads`), add number tiles (`stats`) and sort bullets into labelled
// groups (`groups`). The bullet text itself always comes from resume.json unchanged.
function renderJob(job, opts) {
  const span = parseDates(job.dates);
  const current = span && !span.end;
  const point = (b, i) => {
    const lead = opts.leads?.[i];
    return lead && b.startsWith(lead) ? `<li><strong>${esc(lead)}</strong>${esc(b.slice(lead.length))}</li>` : `<li>${esc(b)}</li>`;
  };
  const points = (idx) => `<ul class="points">${idx.map((i) => point(job.bullets[i], i)).join('')}</ul>`;
  const all = job.bullets.map((_, i) => i);
  const grouped = opts.groups?.flatMap(([, idx]) => idx).sort((a, b) => a - b).join() === all.join();
  const body = !job.bullets.length
    ? ''
    : grouped
      ? `<div class="groups">${opts.groups
          .map(([name, idx]) => `<div class="group"><div class="group-label">${esc(name)}</div>${points(idx)}</div>`)
          .join('')}</div>`
      : points(all);
  const stats = opts.stats?.length
    ? `<div class="stats" aria-hidden="true">${opts.stats.map(([n, label]) => `<span class="stat"><b>${esc(n)}</b>${esc(label)}</span>`).join('')}</div>`
    : '';
  return `
    <article class="job">
      <span class="marker" aria-hidden="true"></span>
      <h3>${esc(job.title)}</h3>
      <div class="job-meta">
        <span class="org">${esc(job.company)}</span>
        ${job.dates ? `<span class="sep" aria-hidden="true">/</span><span class="when"><span class="dates">${esc(job.dates)}</span>${span ? `<span class="tenure"${current ? ` data-start="${span.start[0]}-${span.start[1] + 1}"` : ''}>${tenure(span.start, span.end)}</span>` : ''}${current ? '<span class="now">Now</span>' : ''}</span>` : ''}
      </div>
      ${stats}${body}
    </article>`;
}

// About: the summary's first sentence as a lead, then the other sentences as
// labelled rows (site.config.json "about.rows": [label, sentence index]). Falls
// back to one paragraph unless every sentence is used exactly once, so no text
// is ever dropped.
function renderAbout(summary, opts) {
  const sentences = summary.split(/(?<=\.)\s+(?=[A-Z0-9])/);
  const rows = opts?.rows || [];
  const used = [0, ...rows.map(([, i]) => i)].sort((a, b) => a - b);
  if (!rows.length || used.join() !== sentences.map((_, i) => i).join()) return `<p class="summary">${esc(summary)}</p>`;
  return `<div class="about-grid">
    <p class="summary">${esc(sentences[0])}</p>
    <dl class="about-rows">${rows.map(([label, i]) => `<div><dt>${esc(label)}</dt><dd>${esc(sentences[i])}</dd></div>`).join('')}</dl>
  </div>`;
}

export function renderHome({ config, resume, projects, notes }) {
  const li = linkedinOf(resume);
  const links = [
    `<a class="button primary" href="/resume.pdf" download>${ICONS.download}Download resume</a>`,
    `<a class="button" href="https://github.com/${esc(config.githubUser)}" rel="me">${ICONS.github}GitHub</a>`,
    li ? `<a class="button" href="${esc(li.url)}" rel="me">${ICONS.linkedin}LinkedIn</a>` : '',
    resume.email ? `<a class="button" href="mailto:${esc(resume.email)}">${ICONS.email}Email</a>` : '',
  ].filter(Boolean);

  // Facts repeat numbers from the summary, so screen readers skip them.
  const facts = config.facts?.length
    ? `<div class="facts" aria-hidden="true">${config.facts
        .map((f) => `<div><b>${esc(f.projects ? String(projects.length) : f.n)}</b><span>${esc(f.label)}</span></div>`)
        .join('')}</div>`
    : '';
  const tagline = (config.highlights || []).reduce((t, h) => t.replace(esc(h), `<span class="hl">${esc(h)}</span>`), esc(config.tagline));
  const about = renderAbout(resume.summary, config.about);

  const experience = resume.experience.map((job) => renderJob(job, config.experience?.[job.title] || {})).join('');

  const education = resume.education
    .map(
      (ed) => `
    <article class="edu">
      <div class="job-head"><h3>${esc(ed.degree)}</h3>${ed.dates ? `<span class="dates">${esc(ed.dates)}</span>` : ''}</div>
      <span class="org">${esc(ed.school)}</span>
    </article>`
    )
    .join('');

  return `
<div class="hero">
  <div class="hero-stage">
    <div class="field" aria-hidden="true"></div>
    <div class="hero-card">
      <img src="/${esc(resume.photo)}" srcset="/${esc(resume.photo)} 400w, /photo-1200.webp 1200w" sizes="116px" alt="Portrait of ${esc(resume.name)}" width="116" height="116">
      ${config.status ? `<p class="status"><span class="ping" aria-hidden="true"><i></i></span><span>Now: ${esc(config.status)}</span></p>` : ''}
      ${facts}
    </div>
  </div>
  <div class="hero-text">
    <h1>${esc(resume.name)}</h1>
    <p class="role">${esc(resume.title)}${resume.location ? ` · ${esc(resume.location)}` : ''}</p>
    <p class="tagline">${tagline}</p>
    <div class="links">${links.join('\n      ')}</div>
  </div>
</div>

<section id="about" aria-labelledby="about-h">
  <h2 id="about-h">About</h2>
  ${about}
</section>

<section id="experience" aria-labelledby="experience-h">
  <h2 id="experience-h">Experience</h2>
  <div class="timeline">
    <span class="rail" aria-hidden="true"><span class="rail-fill"></span></span>
    ${experience}
  </div>
</section>

<section id="projects" aria-labelledby="projects-h">
  <h2 id="projects-h">Open source projects</h2>
  <div class="projects">${projects.map(renderProject).join('')}
  </div>
  <p class="more"><a href="https://github.com/${esc(config.githubUser)}?tab=repositories">All repositories on GitHub →</a></p>
</section>

<section id="skills" aria-labelledby="skills-h">
  <h2 id="skills-h">Skills</h2>
  <div class="skills">
    ${resume.skills.map((g) => renderSkillGroup(g, config.skills?.[g.category] || {})).join('')}
  </div>
</section>

<section id="education" aria-labelledby="education-h">
  <h2 id="education-h">Education</h2>
  ${education}
</section>

${notes.length ? `<section id="notes" aria-labelledby="notes-h">
  <h2 id="notes-h">Notes</h2>
  ${notesList(notes.slice(0, 3))}
  <p class="more"><a href="/notes/">All notes</a> · <a href="/feed.xml">RSS feed</a></p>
</section>` : ''}`;
}

function notesList(notes) {
  if (!notes.length) return '<p class="empty">Writing on AI agents, data infrastructure and developer tools is coming soon. Subscribe to the RSS feed to get the first post.</p>';
  return `<ul class="notes-list">${notes
    .map((n) => `<li><a href="/notes/${esc(n.slug)}/">${esc(n.title)}</a><p><time datetime="${n.date}">${longDate(n.date)}</time> · ${esc(n.description)}</p></li>`)
    .join('')}</ul>`;
}

export function renderNotesIndex({ notes }) {
  return `
<div class="page">
  <h1>Notes</h1>
  <p class="lede">On AI agents, data infrastructure and developer tools. <a href="/feed.xml">RSS feed</a></p>
  <div class="prose">${notesList(notes)}</div>
</div>`;
}

// Up to three other notes, newest first, shown after a note so readers (and
// crawlers) can move between them. Kept out of note.html, so the feed and the
// Markdown copies don't get it.
function relatedNotes(notes, note) {
  const others = notes.filter((n) => n.slug !== note.slug).slice(0, 3);
  if (!others.length) return '';
  return `<section class="related" aria-labelledby="more-notes"><h2 id="more-notes">More notes</h2>${notesList(others)}</section>`;
}

export function renderNote({ resume, notes }, note) {
  return `
<article class="page">
  <h1>${esc(note.title)}</h1>
  <p class="lede"><time datetime="${note.date}">${longDate(note.date)}</time>${note.updated ? ` · Updated <time datetime="${note.updated}">${longDate(note.updated)}</time>` : ''} · ${esc(resume.name)}</p>
  <div class="prose">${note.html}</div>
  ${relatedNotes(notes, note)}
  <p class="more"><a href="/notes/">← All notes</a></p>
</article>`;
}

export function render404() {
  return `
<div class="page">
  <div class="field-404"><div class="field" aria-hidden="true"></div></div>
  <h1>Page not found</h1>
  <p class="lede">That page doesn't exist. <a href="/">Go to the home page</a>.</p>
</div>`;
}

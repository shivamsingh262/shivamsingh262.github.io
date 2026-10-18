// Motion for the home and 404 pages, built on anime.js. Loaded after the page
// has finished loading, so it never competes with first paint. The HTML is complete
// without this file: it only adds animation on top, so crawlers and visitors
// without JavaScript get the same content. Everything except the copy button,
// the time in role and the header's local time is skipped when the visitor
// prefers reduced motion.

import { animate, createTimeline, stagger, onScroll, splitText, spring, utils, svg } from './anime.esm.min.js';

const motionOK = document.documentElement.classList.contains('motion');
const belowFold = (el) => el.getBoundingClientRect().top > innerHeight;

// Dot field: a grid of dots that ripples out from the photo on load, from
// wherever the visitor taps, and now and then on its own while idle. In the
// hero, dots near the pointer (or a dragged finger) also swell like a lens.
const SPACING = 20;
const LENS = 90;
const DIM = 0.3;

function initField(field) {
  const grid = document.createElement('div');
  grid.className = 'field-grid';
  field.append(grid);
  // In the hero the field sits behind the text, so listen on the whole hero.
  const host = field.closest('.hero') || field;
  const photo = host.querySelector('img');
  let dots = [];
  let cols = 0;
  let rows = 0;
  let lastTap = 0;
  let lastLens = 0;
  let rippling = 0;
  let visible = true;

  const odd = (n) => Math.max(1, n % 2 ? n : n - 1);
  // Top-left corner of the centered grid, relative to the field.
  const offset = () => {
    const r = field.getBoundingClientRect();
    return { r, ox: (r.width - cols * SPACING) / 2, oy: (r.height - rows * SPACING) / 2 };
  };
  const indexAt = (clientX, clientY) => {
    const { r, ox, oy } = offset();
    const x = Math.floor((clientX - r.left - ox) / SPACING);
    const y = Math.floor((clientY - r.top - oy) / SPACING);
    return utils.clamp(y, 0, rows - 1) * cols + utils.clamp(x, 0, cols - 1);
  };
  const origin = () => {
    if (!photo) return Math.floor(rows / 2) * cols + Math.floor(cols / 2);
    const p = photo.getBoundingClientRect();
    return indexAt(p.left + p.width / 2, p.top + p.height / 2);
  };

  function build() {
    const { width, height } = field.getBoundingClientRect();
    const c = odd(Math.floor(width / SPACING));
    const r = odd(Math.floor(height / SPACING));
    if (c === cols && r === rows) return false;
    utils.remove(dots);
    cols = c;
    rows = r;
    grid.style.setProperty('--cols', cols);
    grid.replaceChildren(...Array.from({ length: cols * rows }, () => document.createElement('i')));
    dots = [...grid.children];
    return true;
  }

  // Dots are drawn in the bright color at 30% opacity (which matches --dot in
  // both themes), so the flash is an opacity tween. Tweening backgroundColor on
  // hundreds of dots made starting a ripple a long task on phones.
  function ripple(from) {
    rippling++;
    animate(dots, {
      scale: [{ to: 2.2, duration: 260, ease: 'outQuad' }, { to: 1, duration: 800, ease: 'outElastic(1, .6)' }],
      opacity: [{ to: 1, duration: 200 }, { to: DIM, duration: 900 }],
      delay: stagger(40, { grid: [cols, rows], from }),
      onComplete: () => rippling--,
    });
  }

  // Lens: scale dots by distance from the pointer. Skipped while a ripple is
  // running so the two never fight over the same dots.
  let px = null;
  let py = null;
  let frame = 0;
  function lens() {
    frame = 0;
    if (rippling) return;
    const { r, ox, oy } = offset();
    for (let i = 0; i < dots.length; i++) {
      const k = px === null ? 0 : Math.max(0, 1 - Math.hypot(ox + (i % cols + 0.5) * SPACING - (px - r.left), oy + (Math.floor(i / cols) + 0.5) * SPACING - (py - r.top)) / LENS);
      utils.set(dots[i], { scale: 1 + k * 1.8, opacity: DIM + (1 - DIM) * Math.min(1, k * 2.5) });
    }
  }
  const queueLens = () => { if (!frame) frame = requestAnimationFrame(lens); };

  build();
  utils.set(dots, { scale: 0 });
  // Start on the next frame so building the grid and starting the ripple
  // don't land in one long task.
  requestAnimationFrame(() => ripple(origin()));

  host.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, .hero-card')) return;
    lastTap = Date.now();
    ripple(indexAt(e.clientX, e.clientY));
  });
  if (host !== field) {
    host.addEventListener('pointermove', (e) => {
      px = e.clientX;
      py = e.clientY;
      lastLens = Date.now();
      queueLens();
    });
    const clear = () => { px = py = null; queueLens(); };
    host.addEventListener('pointerleave', clear);
    host.addEventListener('pointercancel', clear);
    addEventListener('scroll', () => { if (px !== null) clear(); }, { passive: true });
  }

  new ResizeObserver(() => build()).observe(field);
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(field);
  setInterval(() => {
    const idle = Date.now() - Math.max(lastTap, lastLens) > 12000;
    if (visible && idle && !rippling && !document.hidden) ripple(utils.random(0, cols * rows - 1));
  }, 4500);
}

// Hero card and text: the status dot pings, the facts count up, the tagline's
// highlighter sweeps in, and on pointer devices the card tilts and the buttons
// lean toward the pointer.
function initHero(hero) {
  animate(hero.querySelectorAll('.ping i'), { scale: [1, 2.6], opacity: [0.6, 0], duration: 1600, ease: 'outQuad', loop: true });

  hero.querySelectorAll('.facts b').forEach((b, i) => {
    const [, n, rest] = /^(\d+)(.*)$/.exec(b.textContent) || [];
    utils.set(b, { opacity: 1 });
    if (!n) return;
    const count = { v: 0 };
    animate(count, { v: Number(n), duration: 1000, delay: 200 + i * 120, ease: 'outExpo', modifier: Math.round, onUpdate: () => { b.textContent = count.v + rest; } });
  });

  const marks = [...hero.querySelectorAll('.hl')].map((hl) => hl.appendChild(document.createElement('i')));
  animate(marks, { scaleX: [0, 1], duration: 600, ease: 'inOutQuart', delay: stagger(380, { start: 500 }) });

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const card = hero.querySelector('.hero-card');
  if (card) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      animate(card, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 8, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 8, duration: 300, ease: 'outQuad' });
    });
    card.addEventListener('pointerleave', () => animate(card, { rotateX: 0, rotateY: 0, ease: spring({ stiffness: 180, damping: 14 }) }));
  }
  for (const b of hero.querySelectorAll('.links .button')) {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 250, ease: 'outQuad' });
    });
    b.addEventListener('pointerleave', () => animate(b, { x: 0, y: 0, ease: spring({ stiffness: 260, damping: 12 }) }));
  }
}

// Header on the home page: local time where Shivam is, then the name once the
// hero name has scrolled under the header. Runs with reduced motion too, but
// then the swap is instant instead of following the scroll.
function initBrand(brand) {
  const alt = brand.querySelector('.brand-alt');
  const name = brand.querySelector('.brand-name');
  const h1 = document.querySelector('.hero h1');
  const time = new Intl.DateTimeFormat('en-US', { timeZone: alt.dataset.tz, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const tick = () => {
    const parts = time.formatToParts(new Date());
    const zone = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    const clock = parts.filter((p) => p.type !== 'timeZoneName').map((p) => p.value).join('').trim().toLowerCase();
    alt.innerHTML = `<span><span class="brand-city">${alt.dataset.city} · </span><b>${clock}</b> ${zone === 'GMT+5:30' ? 'IST' : zone}</span>`;
  };
  tick();
  setInterval(tick, 30000);

  if (!h1) return;
  const header = brand.closest('.site-header');
  const swap = () => {
    const h = h1.getBoundingClientRect();
    const passed = header.getBoundingClientRect().bottom - (h.top + h.height * 0.6);
    const k = motionOK ? utils.clamp(passed / 50, 0, 1) : passed > 0 ? 1 : 0;
    utils.set(name, { opacity: k, y: (1 - k) * 8 });
    utils.set(alt, { opacity: 1 - k, y: -k * 8 });
    name.style.pointerEvents = k > 0.5 ? 'auto' : 'none';
  };
  addEventListener('scroll', swap, { passive: true });
  addEventListener('resize', swap);
  swap();
}

// About rows slide in one after another as they scroll into view.
function initAboutRows(rows) {
  if (!belowFold(rows)) return;
  animate(rows.children, { x: [-12, 0], opacity: [0, 1], duration: 600, ease: 'outQuart', delay: stagger(120), autoplay: onScroll({ target: rows, enter: 'bottom-=60 top' }) });
}

// Experience timeline: the rail fills in step with scrolling and each job's
// marker lights up as the fill reaches it.
function initTimeline(timeline) {
  // Leave it static when it's already in view, so nothing jumps after load.
  if (timeline.getBoundingClientRect().top < innerHeight * 0.6) return;
  const rail = timeline.querySelector('.rail');
  const fill = timeline.querySelector('.rail-fill');
  const markers = [...timeline.querySelectorAll('.marker')];
  timeline.classList.add('is-live');
  animate(fill, {
    scaleY: [0, 1],
    ease: 'linear',
    autoplay: onScroll({ target: timeline, enter: 'center start', leave: 'center end', sync: true }),
    onUpdate: (anim) => {
      const reached = rail.offsetTop + rail.offsetHeight * anim.progress;
      for (const m of markers) {
        const on = m.parentElement.offsetTop + m.offsetTop + m.offsetHeight / 2 <= reached + 1;
        if (on && !m.classList.contains('is-on')) animate(m, { scale: [1, 1.5, 1], duration: 450, ease: 'outQuad' });
        m.classList.toggle('is-on', on);
      }
    },
  });
}

// Experience roles: number tiles count up and bullet groups slide in as each
// role scrolls into view. Only for roles below the fold.
function initJobs(timeline) {
  for (const job of timeline.querySelectorAll('.job')) {
    if (!belowFold(job)) continue;
    const tl = createTimeline({ autoplay: onScroll({ target: job, enter: 'bottom-=60 top' }) })
      .add(job.querySelectorAll('.stat'), { y: [10, 0], opacity: [0, 1], duration: 450, ease: 'outBack(1.6)' }, stagger(60))
      .add(job.querySelectorAll('.group, :scope > .points'), { x: [-12, 0], opacity: [0.2, 1], duration: 550, ease: 'outQuart' }, stagger(110, { start: 150 }));
    for (const b of job.querySelectorAll('.stat b')) {
      const [, n, rest] = /^(\d+)(.*)$/.exec(b.textContent) || [];
      if (!n) continue;
      const count = { v: 0 };
      tl.add(count, { v: Number(n), duration: 900, ease: 'outExpo', modifier: Math.round, onUpdate: () => { b.textContent = count.v + rest; } }, 50);
    }
  }
}

// The current role's time in role is written at build time (the site rebuilds
// weekly); this keeps it exact between rebuilds. Same sum as tenure() in
// src/templates.mjs.
function updateTenure(el) {
  const [y, m] = el.dataset.start.split('-').map(Number);
  const now = new Date();
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) + 1;
  const parts = [Math.floor(months / 12) && `${Math.floor(months / 12)} yr`, months % 12 && `${months % 12} mo`];
  el.textContent = parts.filter(Boolean).join(' ');
}

// About: words go from faint to full ink as the paragraph scrolls into view.
function initSummary(summary) {
  if (!belowFold(summary)) return;
  const { words } = splitText(summary, { words: true });
  animate(words, {
    opacity: [0.25, 1],
    delay: stagger(30),
    duration: 200,
    ease: 'linear',
    autoplay: onScroll({ target: summary, enter: 'end start', leave: 'center end', sync: true }),
  });
}

// Skills: cards rise in turn as the section scrolls into view, then their
// chips pop in.
function initSkills(skills) {
  if (!belowFold(skills)) return;
  createTimeline({ autoplay: onScroll({ target: skills, enter: 'bottom-=80 top' }) })
    .add(skills.querySelectorAll('.skill-group'), { y: [24, 0], opacity: [0, 1], duration: 600, ease: 'outQuart' }, stagger(70))
    .add(skills.querySelectorAll('.skill-chips li, .skill-list li'), { scale: [0.6, 1], opacity: [0, 1], duration: 400, ease: 'outBack(1.8)' }, stagger(12, { start: 200 }));
}

// Projects: on phones the card grid becomes a swipeable deck, with buttons
// for keyboard and mouse. On wider screens it stays a grid.
const STEP = 8;

function initDeck(list) {
  const cards = [...list.querySelectorAll('.card')];
  if (cards.length < 2) return;
  const mq = matchMedia('(max-width: 600px)');
  let order = [];
  let bar = null;
  let status = null;
  let resize = null;
  let drag = null;
  let busy = false;
  let suppressClick = false;

  function size() {
    list.classList.remove('is-deck');
    const h = Math.max(...cards.map((c) => c.offsetHeight));
    list.style.setProperty('--card-h', `${h}px`);
    list.style.setProperty('--deck-h', `${h + 2 * STEP}px`);
    list.classList.add('is-deck');
  }

  function layout(animated) {
    order.forEach((card, i) => {
      const depth = Math.min(i, 2);
      card.style.zIndex = order.length - i;
      card.inert = i > 0;
      const to = { x: 0, rotate: 0, y: depth * STEP, scale: 1 - depth * 0.04, opacity: i > 2 ? 0 : 1 };
      if (animated) animate(card, { ...to, ease: spring({ stiffness: 170, damping: 17 }) });
      else utils.set(card, to);
    });
    status.textContent = `${cards.indexOf(order[0]) + 1} of ${cards.length}`;
  }

  function next(dir) {
    if (busy) return;
    busy = true;
    const top = order[0];
    animate(top, {
      x: dir * (list.offsetWidth + 40),
      rotate: dir * 14,
      opacity: 0,
      duration: 320,
      ease: 'inQuad',
      onComplete: () => {
        order.push(order.shift());
        utils.set(top, { x: 0, rotate: 0 });
        layout(true);
        busy = false;
      },
    });
  }

  function prev() {
    if (busy) return;
    order.unshift(order.pop());
    utils.set(order[0], { x: -(list.offsetWidth + 40), y: 0, rotate: -14, scale: 1, opacity: 0 });
    layout(true);
  }

  list.addEventListener('pointerdown', (e) => {
    suppressClick = false;
    const card = e.target.closest('.card');
    if (!list.classList.contains('is-deck') || card !== order[0] || e.button > 0 || busy) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, active: false, card };
  });
  list.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    if (!drag.active) {
      if (Math.abs(drag.dx) < 8) return;
      // A mostly vertical move is the page scrolling, not a swipe.
      if (Math.abs(e.clientY - drag.y0) > Math.abs(drag.dx)) { drag = null; return; }
      drag.active = true;
      drag.card.setPointerCapture(e.pointerId);
      drag.card.classList.add('is-dragging');
    }
    utils.set(drag.card, { x: drag.dx, rotate: drag.dx / 18 });
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { active, dx, card } = drag;
    drag = null;
    if (!active) return;
    card.classList.remove('is-dragging');
    suppressClick = true;
    if (Math.abs(dx) > list.offsetWidth * 0.25) next(Math.sign(dx));
    else animate(card, { x: 0, rotate: 0, ease: spring({ stiffness: 260, damping: 15 }) });
  };
  list.addEventListener('pointerup', endDrag);
  list.addEventListener('pointercancel', endDrag);
  // A swipe that ends over a link shouldn't follow it.
  list.addEventListener('click', (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
  }, true);

  function enable() {
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'deck-bar';
    bar.innerHTML = '<span aria-live="polite"></span><span class="deck-buttons"><button type="button" class="button" data-dir="-1">Previous</button><button type="button" class="button" data-dir="1">Next project</button></span>';
    status = bar.firstElementChild;
    bar.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button) button.dataset.dir === '1' ? next(1) : prev();
    });
    list.after(bar);
    order = cards.slice();
    size();
    layout(false);
    let width = list.offsetWidth;
    resize = new ResizeObserver(() => {
      if (list.offsetWidth === width) return;
      width = list.offsetWidth;
      size();
      layout(false);
    });
    resize.observe(list);
  }

  function disable() {
    if (!bar) return;
    utils.remove(cards);
    for (const card of cards) {
      card.inert = false;
      card.style.removeProperty('transform');
      card.style.removeProperty('opacity');
      card.style.removeProperty('z-index');
    }
    list.classList.remove('is-deck');
    list.style.removeProperty('--card-h');
    list.style.removeProperty('--deck-h');
    bar.remove();
    bar = null;
    resize.disconnect();
    busy = false;
  }

  mq.addEventListener('change', () => (mq.matches ? enable() : disable()));
  if (mq.matches) enable();
}

// Copy button for install commands, with a check mark that draws itself.
const COPY_SVG =
  '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
  '<svg class="copy-done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';

function initCopy(pre) {
  const code = pre.querySelector('code') || pre;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.setAttribute('aria-label', 'Copy install command');
  button.innerHTML = COPY_SVG;
  // Wrap the command so the button stays put while a long command scrolls.
  const wrap = document.createElement('div');
  wrap.className = 'install';
  pre.before(wrap);
  wrap.append(pre, button);
  const icon = button.querySelector('.copy-icon');
  const done = button.querySelector('.copy-done');
  utils.set(done, { opacity: 0 });
  let timer;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
    } catch {
      // No clipboard access: select the command so it can be copied by hand.
      getSelection().selectAllChildren(code);
      return;
    }
    clearTimeout(timer);
    button.setAttribute('aria-label', 'Copied');
    utils.set(done, { opacity: 1 });
    if (motionOK) {
      animate(icon, { opacity: 0, scale: 0.6, duration: 150 });
      animate(svg.createDrawable(done.firstElementChild), { draw: ['0 0', '0 1'], duration: 350, ease: 'outQuad' });
    } else {
      utils.set(icon, { opacity: 0 });
    }
    timer = setTimeout(() => {
      button.setAttribute('aria-label', 'Copy install command');
      animate(done, { opacity: 0, duration: motionOK ? 200 : 0 });
      animate(icon, { opacity: 1, scale: 1, duration: motionOK ? 250 : 0 });
    }, 1600);
  });
}

// Each setup runs as its own task, in order of what's on screen first, so the
// page never stalls in one long task. The header clock goes last: creating a
// time-zone formatter is slow, and the location shows until it's ready.
const each = (selector, init) => () => document.querySelectorAll(selector).forEach(init);
// The copy buttons and the phone deck both change the project cards' layout,
// so they share a task: one layout change instead of two.
const projectCards = () => {
  each('.card pre', initCopy)();
  if (motionOK) each('.projects', initDeck)();
};
const tasks = [projectCards, each('.tenure[data-start]', updateTenure)];
if (motionOK) {
  tasks.push(
    each('.field', initField),
    each('.hero', initHero),
    each('.about-rows', initAboutRows),
    each('.timeline', initTimeline),
    each('.timeline', initJobs),
    each('.summary', initSummary),
    each('.skills', initSkills),
  );
}
tasks.push(each('.brand.swap', initBrand));
(function run() {
  tasks.shift()();
  if (tasks.length) setTimeout(run);
})();

// Motion for the home and 404 pages, built on anime.js. Loaded after the page
// has finished loading, so it never competes with first paint. The HTML is complete
// without this file: it only adds animation on top, so crawlers and visitors
// without JavaScript get the same content. Everything except the copy button
// is skipped when the visitor prefers reduced motion.

import { animate, stagger, onScroll, splitText, spring, utils, svg } from './anime.esm.min.js';

const motionOK = document.documentElement.classList.contains('motion');
const belowFold = (el) => el.getBoundingClientRect().top > innerHeight;

// Dot field: a grid of dots that ripples out from the photo on load, from
// wherever the visitor taps, and now and then on its own while idle.
const SPACING = 20;

function initField(field) {
  const grid = document.createElement('div');
  grid.className = 'field-grid';
  field.append(grid);
  let dots = [];
  let cols = 0;
  let rows = 0;
  let lastTap = 0;
  let visible = true;

  const color = (name) => getComputedStyle(field).getPropertyValue(name).trim();
  const odd = (n) => Math.max(1, n % 2 ? n : n - 1);
  const push = (d) => Math.max(-3, Math.min(3, d * 0.8));
  const center = () => Math.floor(rows / 2) * cols + Math.floor(cols / 2);

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

  function ripple(from) {
    const fx = from % cols;
    const fy = Math.floor(from / cols);
    const settle = { duration: 800, ease: 'outElastic(1, .6)' };
    animate(dots, {
      scale: [{ to: 2.2, duration: 260, ease: 'outQuad' }, { to: 1, ...settle }],
      x: [{ to: (_, i) => push((i % cols) - fx), duration: 260 }, { to: 0, ...settle }],
      y: [{ to: (_, i) => push(Math.floor(i / cols) - fy), duration: 260 }, { to: 0, ...settle }],
      backgroundColor: [{ to: color('--dot-hot'), duration: 200 }, { to: color('--dot'), duration: 900 }],
      delay: stagger(40, { grid: [cols, rows], from }),
      // Hand the color back to CSS so a theme switch still applies.
      onComplete: () => dots.forEach((d) => d.style.removeProperty('background-color')),
    });
  }

  build();
  utils.set(dots, { scale: 0 });
  ripple(center());

  field.addEventListener('pointerdown', (e) => {
    const r = field.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left - (r.width - cols * SPACING) / 2) / SPACING);
    const y = Math.floor((e.clientY - r.top - (r.height - rows * SPACING) / 2) / SPACING);
    lastTap = Date.now();
    ripple(utils.clamp(y, 0, rows - 1) * cols + utils.clamp(x, 0, cols - 1));
  });

  new ResizeObserver(() => build()).observe(field);
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(field);
  setInterval(() => {
    if (visible && !document.hidden && Date.now() - lastTap > 12000) ripple(utils.random(0, cols * rows - 1));
  }, 4500);
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

document.querySelectorAll('.card pre').forEach(initCopy);

if (motionOK) {
  document.querySelectorAll('.field').forEach(initField);
  document.querySelectorAll('.timeline').forEach(initTimeline);
  const summary = document.querySelector('.summary');
  if (summary) initSummary(summary);
  const projects = document.querySelector('.projects');
  if (projects) initDeck(projects);
}

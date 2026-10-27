---
title: Falling sand game in C++: how the simulation works (play it here)
date: 2026-10-21
description: Grainfall is a small falling sand game in C++. Here's how sand, water, smoke and fire come out of a grid of cells and a few local rules, and you can play it right here.
keywords: falling sand game, falling sand simulation, cellular automata, C++, WebAssembly, raylib
---

[Grainfall](https://github.com/shivamsingh262/grainfall) is a falling sand
game I wrote in C++20 with [raylib](https://www.raylib.com/). You pour sand,
flood it with water, build stone walls and set wooden forests on fire. This page
runs the same code, compiled to WebAssembly:

<iframe src="/notes/grainfall/grainfall.html" title="Grainfall falling sand game" loading="lazy"></iframe>

*Click the game first so it receives key presses. Left mouse paints, right mouse
erases, `1`–`7` picks an element, the mouse wheel sets the brush size, `Space`
pauses and `C` clears. It's built for a mouse. [Open it full
screen](/notes/grainfall/grainfall.html) if the frame is too small.*

Try this: paint a block of wood, then paint a little fire just under it.

None of what you see is scripted. There's no physics engine, no fluid solver
and no fire effect. Each cell follows a few rules about its immediate neighbors,
and the sloped dunes, levelling lakes and spreading fires all come from
those rules.

## The world is a grid of bytes

The world is a fixed 320×180 grid, scaled up 4× on screen. Each cell is five
bytes:

```cpp
struct Cell {
    ElementId type;         // sand, water, stone, ...
    uint8_t shade;          // random color variation, rolled when the particle spawns
    uint8_t life;           // remaining frames, for fire and smoke
    uint8_t lastUpdate;     // frame stamp: already moved this frame?
    uint8_t lastDisplaced;  // frame stamp: already pushed aside this frame?
};
```

The grid holds 57,600 cells, about 280 KB. Every frame updates the whole grid in
place, cell by cell. There's no second buffer and nothing runs in parallel.

## One pass per frame, bottom to top

Each frame scans the rows from the **bottom up**. This matters for anything that
falls. If you scanned top-down, a grain moved from row 10 to row 11 would be
visited again on row 11 and fall a second time, then a third, reaching the floor
in one frame. Going bottom-up, the grain lands in a row that has already been
scanned.

Gases rise, though, so for them bottom-up is the wrong order. That's what
`lastUpdate` is for. Before a particle moves, it's stamped with the current
frame number, and the stamp moves with it. Any cell already stamped with this
frame is skipped. So every particle moves at most once per frame, whichever way
it's going.

Within a row, the scan direction is **picked at random every frame**. With a
fixed left-to-right scan, particles on the left would always move first and
take the free cells. Sand piles would lean and water would drift to one side.
A random direction removes that bias.

## Four movement rules

Every element belongs to one of four movement classes, and the simulation has
exactly one rule for each:

- **None** (stone, wood): never moves.
- **Powder** (sand): move down if possible; otherwise try down-left or
  down-right, in random order. That's all it takes to make sloped piles: a grain
  landing on a peak rolls off to one side until it finds a gap, so piles settle
  at a natural angle.
- **Liquid** (water): the powder rule, and if all three cells below are blocked,
  flow sideways up to `dispersion` cells along the row (5 for water). This
  sideways flow levels a pile of water into a flat surface. Without it, water
  would just be wet sand.
- **Gas** (fire, smoke): the liquid rule flipped upside down, plus a random
  wobble of one cell left or right on each step up. The wobble is why smoke
  billows and flames flicker instead of rising in straight columns.

## Density, and a bug that teleported water

A particle can move into an empty cell, or **swap places with a lighter liquid
or gas**. Each element has a density (sand 150, water 100, smoke 2, fire 1), so
sand sinks through water, and water and sand both fall through smoke. Solids
never get pushed, and gases only rise into empty space.

The simple version of this rule has a bug. Pour a steady stream of sand into a
lake and water gets pulled up through the stream to the top **in a single
frame**. The grain
at the bottom swapped with the water below it. Then the grain above it swapped
with that same water cell, now one row higher. Then the next grain did the same,
all the way up. The water never got updated; it was carried along by swaps.

The fix is the second frame stamp, `lastDisplaced`. A particle that gets pushed
aside is stamped, and a stamped particle can't be pushed again until the next
frame. Now the water moves up one cell per frame, as you'd expect.

## Fire is three elements

Fire is the most interesting behavior here. It's built from three generic
properties that any element can use:

- **Lifetime.** Fire and smoke are given a random lifespan when they spawn
  (15–45 frames for fire). When it runs out, they turn into their decay product:
  fire becomes smoke, and smoke becomes empty space.
- **Burning.** Each frame, a burning cell checks its 8 neighbors. Each flammable
  neighbor has a small chance of catching fire (wood: 8 out of 256 per frame).
  If any neighbor puts out fire (water does), the burning cell decays
  immediately.
- **Emission.** Some cells randomly spawn another element in the cell just
  above them.

Wood doesn't turn into fire when it catches. It turns into **ember**: an
element that stays in place, sets its neighbors alight, gives off flames
upward, and after 60–160 frames turns into smoke. So a burning tree glows,
throws flames and collapses into smoke, and the fire moves slowly through the
wood. Wood's low flammability is what keeps the spread slow. Raise it and a
forest goes up in a few frames.

## Elements are data

Because those behaviors are generic, an element is a row in a table, not code:

```cpp
{.name = "Wood",
 .color = {115, 74, 42, 255},
 .colorJitter = 16,
 .density = 255,
 .flammability = 8,
 .burnsInto = ElementId::Ember},
```

To add oil, you add one enum value and one table row: a liquid with density 80
(so it floats on water) and some flammability. The palette, number keys and
simulation all pick it up automatically, and a `static_assert` fails the build
if the table and the enum get out of sync.

## Drawing it

Rendering is the cheapest part. Each frame fills a 320×180 pixel buffer with one
color per cell, uploads it as a single texture, and draws that texture scaled up
with nearest-neighbor filtering. That's one texture upload and one draw call.

The color comes from the element's base color, brightened or darkened by the
cell's `shade` byte. Shade is rolled once when a particle spawns, so a sand pile
looks grainy and the grains keep their colors as they slide. Fire and embers
instead get a new shade every frame, which makes them flicker without any
animation code.

## Running it in a browser

The web build is the same C++ code, compiled to WebAssembly with
[Emscripten](https://emscripten.org/). Only one change was needed: browsers
don't allow a blocking `while` loop, so the loop body moved into a function the
browser calls once per frame. The download is about 380 KB, and the code and
build instructions are on [GitHub](https://github.com/shivamsingh262/grainfall).

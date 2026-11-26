# Roadmap

Working plan for the countertop drawing and quoting tool. Tick items as they are done.

**Rule:** do Steps 1–3 well before starting Step 4. A few things done well beat everything done roughly.

## Step 1 — Shape model and pricing engine (no UI)

The foundation. Pure TypeScript, fully unit-tested, so the maths can be trusted before any screen exists.

- [x] Shape model: a counter is an outline polygon in inches, built from presets (Straight, L, U)
- [x] Each edge has a type: `wall`, `finished` (exposed, gets the edge profile) or `backsplash`
- [x] Each corner can be `square` or `radius`
- [x] Area from the outline (shoelace formula), so the corner of an L or U is counted once
- [x] Default price list in one config file (researched ballpark prices, editable)
- [x] `quote(counter, options, priceList)` returns itemized lines and a total
  - [x] Material: sq ft × price for material and level
  - [x] Edge profile: linear feet of finished edges only (eased is free)
  - [x] Cutouts: undermount sink, drop-in sink, cooktop, faucet hole
  - [x] Radius corners: per corner
  - [x] Backsplash: linear feet of backsplash edges
  - [x] Minimum job charge
- [x] Vitest unit tests with hand-checked answers

## Step 2 — Drawing screen

- [x] Shape buttons: Straight / L / U
- [x] Inputs for each leg's length and depth (inches), live update
- [x] SVG drawing, scaled to fit, dimension labels on every edge
- [x] Click an edge to cycle finished → wall → backsplash (distinct styles + legend)
- [x] Click an outside corner to toggle square / radius
- [x] Feet-and-inches display (`10' 0"`, `25½"`) and input (`25 1/2`, `10' 6"`)
- [x] Keyboard and screen-reader access for edges and corners

## Step 3 — Quote panel and saving

- [x] Options: material, level, edge profile, cutouts
- [x] Itemized quote panel, live total
- [x] Save drawing + options + total to the job (JSON column, EF migration)
- [x] Jobs list shows shape and total
- [x] Unsaved-changes indicator and warning (in-app links and closing the tab), Ctrl+S to save
- [x] End-to-end check in a real browser (save, reload, list)

**After Step 3 the submission is complete.**

## Step 4 — Stand-out features

- [x] Slab estimate: "needs 2 slabs, 1 seam" (stone is bought by the whole slab)
  - [x] Tries every way of cutting the corners, keeps fewest slabs then fewest seams
  - [x] Seams and numbered pieces on the drawing; slabs drawn to scale with the pieces on them
  - [x] Stone yield %, with a warning when more than half the stone is left over
- [ ] Waste % shown and editable
- [ ] Editable price list (settings page)
- [ ] Printable customer quote
- [ ] Input checks (depth under 12", leg shorter than depth, etc.)

## Step 4b — Easier to understand, closer to real

- [x] Stone colours per material (speckled granite, veined marble, plain quartz); picking a colour sets its price level
- [x] Stone pattern drawn on the plan, the slab layout and the colour swatches
- [x] 3D view (three.js): stone top on cabinets, walls, backsplash, seams, edge profile and radius corners; updates as you type
- [x] "What does this mean?" box: every trade word on screen explained in plain words, with pictures for edge profiles, sinks, corners, backsplash and seams

## Step 4c — Polish

- [x] Jobs list: shape thumbnail in its stone, stone name, created date, whole row clickable, "Not quoted yet" badge, empty state
- [x] New job: cursor in the name field, says what happens next, material buttons like the job page
- [x] Switching shape keeps the depth, and asks first if lengths, edges or corners would be lost

## Step 5 — Optional

- [ ] Angled legs and bumpouts
- [ ] Islands as a second piece
- [ ] Undo / redo
- [ ] Drag sinks to a position on the drawing

## Final — Submission

- [ ] Fill in `ANSWERS.md` (research links, pricing decisions, AI use, expert questions)
- [ ] 2–3 screenshots
- [ ] Zip as `firstname-lastname.zip` without `node_modules`, `bin`, `obj`; test a fresh unzip
- [ ] Upload before Saturday, December 12, 11:59 PM ET (earlier is better: rolling hiring)

## Decisions log

| Decision | Why |
|---|---|
| Counter stored as an outline polygon, built from presets | One model for Straight, L, U and later angled or freehand shapes. Area and edge lengths come straight from the geometry |
| Area by shoelace formula, not by adding legs | Counts the shared corner of an L or U exactly once, the most common manual mistake |
| Cutouts are not subtracted from area | The shop still buys that stone, and cutting it is extra work |
| Edge profile charged only on finished edges | Edges against a wall are never polished |
| Prices are installed price per sq ft, by material level | How most shops quote retail customers; levels (groups) are how slabs are tiered |
| Each line rounded to cents; quantities to 2 decimals | What the customer sees on the quote adds up exactly |
| Pricing runs in the frontend | Live price as you draw; the saved job stores the total |
| Drawing in plain SVG, no library | Sharp at any size, every edge is a clickable element, nothing extra to install |
| Sizes typed as text, not number fields | Shops write `25 1/2` and `10' 6"`; a number field rejects both |
| Leg length measured along the wall, into the corner | How a tape measure is used on site; inner front lengths are worked out and labelled |
| Only outside corners between two finished edges can be rounded | A corner against a wall, or an inside corner, is never radiused |
| Walls drawn as hatched bands | Reads like an architect's plan; you see at a glance which sides are exposed |
| Labels and sizes in inches; feet-and-inches shown as a hint | Fabrication drawings are in inches; customers think in feet |
| Drawing and options saved as one JSON column, with a version number | The shape can grow (angles, islands) without a migration each time; the version lets old records be upgraded |
| A damaged or unknown saved drawing falls back to the default | One bad record must not break the page |
| Total saved in its own column | The jobs list shows prices without knowing the pricing rules |
| The saved total comes from the browser | Fine for an internal shop tool; a customer-facing version should re-price on the server |
| One edge profile for the whole job | How most kitchens are ordered; mixing profiles per edge is a later step |
| Changing material on the quote updates the job's material | One source of truth; the list and the quote never disagree |
| Quote panel stays visible while scrolling | The price is what the user is watching while they draw |
| Slab estimate tries both ways of cutting each corner | For the default L it is the difference between 1 and 2 slabs: 94½" + 96" pieces fit two rows of one slab, 120" + 70½" do not |
| Pieces laid out in rows along the slab | How counter strips are nested in practice; simple to explain and test |
| 1" trimmed off each slab edge, ½" saw kerf between pieces | Slab edges are rough; the blade removes material. Both are constants to confirm with a fabricator |
| Slab estimate does not change the price | Shops differ: most price per sq ft with waste averaged in. The yield warning flags jobs where that loses money; pricing by slab is a later option |
| Stone colour sets the level; the Level dropdown is gone | In shops the stone you pick decides its price group; "level" alone meant nothing to a customer |
| Stone patterns are generated, not photos | No image licensing, any colour can be added from a few hex values, and the same pattern is used in plan, slabs, swatches and 3D |
| 3D view in plain three.js, loaded only when opened | The plan view stays light; the 3D code (135 KB gzipped) downloads on first use |
| The 3D camera re-aims only when the shape changes | Typing a size shouldn't make the view jump |
| Help box explains words on hover, focus or tap | Shop staff and customers don't know trade terms; it works by mouse, keyboard and touch |
| Typical slab sizes per material (granite 114×66, quartz 120×56, marble 108×64) | Sources give 9–10' × 5–6' for natural stone; quartz standard slabs are narrower. Real sizes vary by slab, so this is an estimate |

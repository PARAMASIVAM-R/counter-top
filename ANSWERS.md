# Answers

- **Name:** TODO
- **Email** (the one you applied with): TODO
- **Phone** (optional): TODO

## 1. What did you need to research, and how did you do it?

I knew nothing about countertops, so I first learned how a job is measured and how shops charge, mostly from consumer cost guides, stone brand guides and fabricator articles:

- **Measuring.** Counters are measured in inches and split into rectangles. In an L or U the corner square must be counted once, the most common mistake. Standard depth is 25½" (24" cabinet + 1½" overhang). Cutouts are not subtracted, and backsplash is measured separately in linear feet. ([Caesarstone: how to measure](https://www.caesarstone.com/?p=42379), [Caesarstone: counter depth](https://www.caesarstone.com/?p=42400), [EngineerFix](https://engineerfix.com/how-to-figure-out-countertop-square-footage/))
- **Pricing.** Retail quotes are usually an installed price per square foot by material and level, plus edge profiles per linear foot (eased is normally free), cutouts per item, and extras. ([HomeGuide: granite](https://homeguide.com/costs/granite-countertops-cost), [HomeGuide: quartz](https://homeguide.com/costs/quartz-countertops-cost), [Slabwise: edge pricing](https://slabwise.com/guides/how-to-price-decorative-ogee-edges-on-stone-countertops))
- **Slabs.** Stone is bought by the whole slab (natural stone is about 9–10' × 5–6'), so seams and leftover stone matter as much as square footage. ([Hunker: slab sizes](https://www.hunker.com/13402826/what-are-the-dimensions-of-a-granite-slab/), [Floform: why you may need more than one slab](https://floform.com/why-your-project-could-need-more-than-one-slab/))
- **Existing software.** I looked at what shops already use (Moraware CounterGo for drawing and quoting, Slabsmith for slab layout, StoneApp for quotes and invoicing) to see what a shop expects from a tool like this.

Most fabricators don't publish price lists, so the sources give ranges, not rates. I treated every price as an editable default.

## 2. How did you decide what to charge for, and how?

I charge for what a shop pays for in stone and labour, using the unit each charge is usually quoted in:

| Charge | Unit | Default | Why |
|---|---|---|---|
| Stone, by material and level | sq ft, installed | Granite $55 / $75 / $95, Quartz $70 / $90 / $120, Marble $90 / $120 / $150 | Mid-range of the published ranges |
| Edge profile | linear ft of **finished** edges only | Eased free, bevel $5, half bullnose $8, full bullnose $12, ogee $20 | Edges against a wall are never polished, so you click each edge to mark it wall, finished or backsplash |
| Cutouts | each | Undermount sink $250, drop-in $150, cooktop $150, faucet hole $25 | An undermount cutout costs more because its edge is polished |
| Radius corner | each, outside corners only | $50 | Only a corner between two finished edges can be rounded |
| Backsplash | linear ft | $25 | 4" splash in the same stone |
| Minimum job | top-up line | $750 | Shops have a minimum, so small jobs show a visible top-up line |

Area comes from the counter's outline (shoelace formula), so shared corners can't be double-counted. Quantities are rounded to 2 decimals and each line to cents, so the lines always add up to the total. The quote is itemized, with the working shown (`33.73 sq ft × $90.00`).

I also estimate **how many slabs** a job needs. The tool cuts the counter at its corners, trying each way of cutting each corner, and keeps the plan with the fewest slabs, then the fewest seams. For the default L this is the difference between 1 and 2 slabs. I show this next to the price with the share of stone used, but **don't add it to the price**: most shops average waste into the per-sq-ft rate. Instead I warn when more than half the stone would be left over.

## 3. How did you use AI? Where did it help, and how did you lead it?

TODO: check this section and rewrite it in your own words.

I used Claude Code throughout: for the research, for planning and for writing most of the code.

- **How I led it:** I had it research the domain first and write a roadmap (`ROADMAP.md`) before any code, with required work separated from stand-out features. Then I had it build one step at a time (pricing engine, drawing, quote and saving, slab estimate), reviewing each step in the browser before moving on. Every step was committed separately so the history shows how it was built.
- **Where it helped:** turning cost-guide ranges into a pricing model, the geometry (outline, area, outside corners), and the testing. There are 62 unit tests whose expected answers are worked out by hand in comments, 4 backend tests, and a scripted browser check that saves, reloads and compares with the API.
- **What I checked or changed:** The decisions log in `ROADMAP.md` records each choice and why. Browser screenshots caught issues the tests didn't, such as size labels reading the wrong way. I kept the slab estimate out of the price on purpose, and kept every guessed price marked as an assumption.

## 4. What would you ask an industry expert to check or improve this?

- Do you price per square foot with waste averaged in, or by the slabs a job actually uses? When would you switch?
- Are an eased edge and one sink cutout always included? How do you charge for seams?
- What do you charge for a radius corner, a 4" backsplash, and what is your minimum job? (I found no published figures, so these are guesses.)
- Are my slab sizes right, and how much do you lose to rough slab edges and the saw? I assumed 1" per edge and ½" per cut.
- Where do you put seams? I cut at corners and split long runs evenly. I don't yet keep seams away from sinks or cooktops, or match veining.
- Is a 25½" default depth right for your area? Which runs usually end against a wall or an appliance?

## 5. What did you leave out, and what would you work on next?

Left out on purpose, to do a few things well:

- Angled legs, bumpouts, islands and freehand shapes. The model is an outline polygon, so these are additions, not rewrites.
- An editable price list. Prices live in one file (`frontend/src/counter/priceList.ts`), and a settings page is the next step.
- Sink positions on the drawing, and seams kept away from them.
- A different edge profile per edge. Today one profile applies to all finished edges.
- A printable customer quote.

Next I would: make the price list editable per shop; re-price on the server when saving (today the saved total comes from the browser, fine for an internal tool but not for a customer-facing one); add an option to price by the slab; and draw sinks so seams can avoid them.

## How to run it

**With Docker** (recommended): install Docker Desktop, then from the project folder:

```
docker compose up --build
```

Open http://localhost:5173. The first build takes a few minutes.

**Without Docker** (.NET SDK 8+, Node 20.19+ or 22.12+), in two terminals from the project folder:

```
cd backend/CounterQuote.Api
dotnet run
```

```
cd frontend
npm install
npm run dev
```

**Tests:** `npm test` in `frontend` (pricing, geometry, sizes, slabs, saved drawings), and `dotnet test` in `backend`. With Docker: `docker compose run --rm --no-deps web npm test` and `docker compose run --rm api dotnet test ..`.

The database migrates itself on start (one new migration adds the drawing and quote total to a job).

## What we should know to evaluate it

**Try first:** open *Sample: Kitchen*.
1. Switch between Straight, L and U. Type sizes the way shops write them: `120`, `25 1/2`, `10' 6"`.
2. Click edges on the drawing to switch between finished, wall and backsplash, and watch the edge and backsplash lines in the quote change. Click a corner dot to round it.
3. Add a sink and pick a material, level and edge profile.
4. Look at the **Slab layout**: change the material (slab sizes differ) or lengthen a run, and watch the seams and slab count change.
5. Save, reload, and check the jobs list.

**Easy to miss:**
- Only real outside corners get a dot; inside and wall corners can't be rounded.
- Inner sizes (94½", 70½") are worked out from the wall lengths you type.
- Impossible shapes show why, hide the price and can't be saved.
- Ctrl+S saves; leaving with unsaved changes asks first.
- Edges and corners work by keyboard (Tab, then Enter).
- Numbers on the drawing match the pieces on the slabs.

**Known problems and limits:**
- Prices are ballpark defaults, not one shop's rates.
- The slab estimate lays pieces out in rows; a person nesting pieces by hand can sometimes do better.
- On a phone the page works, but the drawing gets small.

## Screenshots

- `screenshots/1-l-shape-quote.png`: L-shaped kitchen with backsplash, radius corner, sink and the itemized quote
- `screenshots/2-u-shape-slabs.png`: U-shape needing 2 slabs, with seams and the slab layout
- `screenshots/3-jobs-list.png`: jobs list with shapes and quoted totals

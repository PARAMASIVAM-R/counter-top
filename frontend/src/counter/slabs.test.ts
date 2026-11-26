import { describe, expect, it } from 'vitest';
import { areaSqIn, type Counter, createCounter, outline } from './shapes';
import { planSlabs, SLAB_TRIM, type SlabPlan } from './slabs';

// Granite 114" × 66" → usable 112" × 64" after trimming 1" off each edge. Two 25½" rows fit across it.
const GRANITE = { length: 114, width: 66 };
// Quartz 120" × 56" → usable 118" × 54".
const QUARTZ = { length: 120, width: 56 };

function straight(length: number, depth = 25.5): Counter {
  const c = createCounter('straight');
  c.legs[0] = { length, depth };
  return c;
}

describe('straight counters', () => {
  it('a run shorter than the slab: one slab, no seam', () => {
    const plan = planSlabs(straight(100), GRANITE);
    expect(plan).toMatchObject({ slabs: 1, seams: [] });
    expect(plan.yieldPercent).toBe(34); // 2550 / 7524 sq in
  });

  it('a 10\' run is longer than a granite slab: split in two, one seam, both halves on one slab', () => {
    const plan = planSlabs(straight(120), GRANITE);
    expect(plan.slabs).toBe(1);
    expect(plan.seams).toEqual([{ a: { x: 60, y: 0 }, b: { x: 60, y: 25.5 } }]);
    expect(plan.pieces.map((p) => p.length)).toEqual([60, 60]);
  });

  it('a 118" run fits a quartz slab whole', () => {
    expect(planSlabs(straight(118), QUARTZ)).toMatchObject({ slabs: 1, seams: [] });
  });

  it('a piece deeper than the slab is reported', () => {
    expect(planSlabs(straight(100, 70), GRANITE).problems).toEqual(['A piece is deeper than a 66" slab is wide.']);
  });
});

describe('L-shapes', () => {
  it('picks the corner cut that saves a slab', () => {
    // Corner with the back run: pieces 120 (→ 2 × 60) and 70½ → 3 pieces, 2 slabs.
    // Corner with the left run: pieces 94½ and 96 → one per row, 1 slab, 1 seam.
    const plan = planSlabs(createCounter('L'), GRANITE);
    expect(plan.slabs).toBe(1);
    expect(plan.seams).toEqual([{ a: { x: 25.5, y: 0 }, b: { x: 25.5, y: 25.5 } }]);
    expect(plan.pieces.map((p) => [p.name, p.length])).toEqual([
      ['Back run', 94.5],
      ['Left run', 96],
    ]);
    expect(plan.yieldPercent).toBe(65); // 4857.75 / 7524
  });

  it('a small L is cut from one piece, with no seam', () => {
    const c = createCounter('L');
    c.legs = [{ length: 50, depth: 25.5 }, { length: 60, depth: 25.5 }];
    const plan = planSlabs(c, GRANITE);
    expect(plan).toMatchObject({ slabs: 1, seams: [] });
    expect(plan.pieces[0].name).toBe('L-shaped piece');
  });
});

describe('U-shapes', () => {
  it('default U needs two slabs; corners go with the side runs to save a seam', () => {
    // 96 + 96 + 93 = 285" of 25½" strip; one slab holds two 112" rows, so two slabs whatever we do.
    // Corners with the back run would make it 144" long, cut in two: 3 seams instead of 2.
    const plan = planSlabs(createCounter('U'), GRANITE);
    expect(plan.slabs).toBe(2);
    expect(plan.seams).toHaveLength(2);
    expect(plan.pieces.map((p) => p.length).sort()).toEqual([93, 96, 96]);
  });
});

describe('every plan', () => {
  const shapes: [string, Counter][] = [
    ['straight 200"', straight(200)],
    ['default L', createCounter('L')],
    ['long L', (() => { const c = createCounter('L'); c.legs = [{ length: 150, depth: 25.5 }, { length: 180, depth: 30 }]; return c; })()],
    ['default U', createCounter('U')],
    ['big U', (() => { const c = createCounter('U'); c.legs = [{ length: 130, depth: 25.5 }, { length: 200, depth: 25.5 }, { length: 70, depth: 36 }]; return c; })()],
  ];

  it.each(shapes)('%s: pieces add up to the counter exactly', (_, counter) => {
    const plan = planSlabs(counter, GRANITE);
    const pieceArea = plan.pieces.reduce((sum, p) => sum + p.length * p.depth, 0);
    expect(pieceArea).toBeCloseTo(areaSqIn(outline(counter)), 6);
  });

  it.each(shapes)('%s: pieces stay on their slab and never overlap', (_, counter) => {
    for (const slab of [GRANITE, QUARTZ]) expectValidLayout(planSlabs(counter, slab));
  });
});

function expectValidLayout(plan: SlabPlan) {
  const boxes = plan.pieces.map((p) => {
    const [w, h] = p.rotated ? [p.depth, p.length] : [p.length, p.depth];
    return { slab: p.slab, x1: p.x, y1: p.y, x2: p.x + w, y2: p.y + h };
  });
  for (const b of boxes) {
    expect(b.x1).toBeGreaterThanOrEqual(SLAB_TRIM);
    expect(b.y1).toBeGreaterThanOrEqual(SLAB_TRIM);
    expect(b.x2).toBeLessThanOrEqual(plan.slab.length - SLAB_TRIM + 1e-9);
    expect(b.y2).toBeLessThanOrEqual(plan.slab.width - SLAB_TRIM + 1e-9);
  }
  for (const a of boxes) {
    for (const b of boxes) {
      if (a === b || a.slab !== b.slab) continue;
      const overlap = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
      expect(overlap).toBe(false);
    }
  }
}

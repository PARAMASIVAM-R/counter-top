import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICE_LIST } from './priceList';
import { quote, type QuoteOptions } from './quote';
import { areaSqIn, canRoundCorner, type Counter, createCounter, outline, validateCounter } from './shapes';

const eased: QuoteOptions = { materialId: 'granite', level: 1, edgeProfileId: 'eased', cutouts: {} };

function sqFt(counter: Counter) {
  return areaSqIn(outline(counter)) / 144;
}

describe('area', () => {
  it('straight: length × depth', () => {
    // 120 × 25.5 = 3060 sq in = 21.25 sq ft
    expect(sqFt(createCounter('straight'))).toBe(21.25);
  });

  it('L: counts the shared corner once', () => {
    // back 120 × 25.5 = 3060, plus left below it (96 − 25.5) × 25.5 = 1797.75 → 4857.75 sq in = 33.734 sq ft
    // Adding both legs in full (the common mistake) would give 38.25 sq ft.
    expect(sqFt(createCounter('L'))).toBeCloseTo(33.734375, 6);
  });

  it('U: counts both shared corners once', () => {
    // 144 × 96 bounding box minus the open middle (144 − 51) × (96 − 25.5) = 13824 − 6556.5 = 7267.5 sq in
    expect(sqFt(createCounter('U'))).toBeCloseTo(50.46875, 6);
  });

  it('follows leg sizes when they change', () => {
    const counter = createCounter('L');
    counter.legs[0] = { length: 60, depth: 25.5 };
    // 3060 + (60 − 25.5) × 25.5 = 3939.75 sq in
    expect(areaSqIn(outline(counter))).toBeCloseTo(3939.75, 6);
  });
});

describe('edges', () => {
  it('charges the profile on finished edges only', () => {
    // L finished edges: back run end 25.5 + back run front 94.5 + left run front 70.5 + left run end 25.5 = 216" = 18 ft
    expect(quote(createCounter('L'), eased, DEFAULT_PRICE_LIST).finishedEdgeFt).toBe(18);
  });

  it('a run end against a wall is not charged', () => {
    const counter = createCounter('L');
    counter.edges[1] = 'wall'; // back run ends at a side wall
    // 216 − 25.5 = 190.5" = 15.875 ft → 15.88
    expect(quote(counter, eased, DEFAULT_PRICE_LIST).finishedEdgeFt).toBe(15.88);
  });

  it('backsplash is measured on its own edges', () => {
    const counter = createCounter('U');
    counter.edges[0] = 'backsplash'; // 144" back wall = 12 ft
    expect(quote(counter, eased, DEFAULT_PRICE_LIST).backsplashFt).toBe(12);
  });
});

describe('corners', () => {
  it('only outside corners between two finished edges can be rounded', () => {
    const counter = createCounter('L');
    const points = outline(counter);
    const roundable = points.map((_, i) => canRoundCorner(counter, points, i));
    // 0 back-left (walls), 1 back-right (wall + end), 2 front-right of back run ✓,
    // 3 inside corner ✗, 4 front-bottom of left run ✓, 5 bottom-left (wall)
    expect(roundable).toEqual([false, false, true, false, true, false]);
  });

  it('ignores radius on a corner that cannot be rounded', () => {
    const counter = createCounter('straight');
    counter.corners = ['radius', 'radius', 'radius', 'radius']; // only the two front corners count
    const line = quote(counter, eased, DEFAULT_PRICE_LIST).lines.find((l) => l.label === 'Radius corner');
    expect(line).toMatchObject({ quantity: 2, amount: 100 });
  });
});

describe('quote', () => {
  it('itemizes a typical straight counter', () => {
    const counter = createCounter('straight');
    counter.edges[0] = 'backsplash';
    const result = quote(
      counter,
      { materialId: 'quartz', level: 2, edgeProfileId: 'halfBullnose', cutouts: { undermountSink: 1, faucetHole: 1 } },
      DEFAULT_PRICE_LIST,
    );
    expect(result.lines.map((l) => [l.label, l.quantity, l.amount])).toEqual([
      ['Quartz, level 2', 21.25, 1912.5], // 21.25 × $90
      ['Half bullnose edge', 14.25, 114], // (25.5 + 120 + 25.5)" = 14.25 ft × $8
      ['Undermount sink cutout', 1, 250],
      ['Faucet hole', 1, 25],
      ['Backsplash', 10, 250], // 10 ft × $25
    ]);
    expect(result.total).toBe(2551.5);
    expect(result.minimumApplied).toBe(false);
  });

  it('eased edge shows as a free line', () => {
    const line = quote(createCounter('straight'), eased, DEFAULT_PRICE_LIST).lines[1];
    expect(line).toMatchObject({ label: 'Eased edge', amount: 0 });
  });

  it('tops small jobs up to the minimum, and the lines still add up', () => {
    const vanity = createCounter('straight');
    vanity.legs[0] = { length: 30, depth: 22 };
    const result = quote(vanity, eased, DEFAULT_PRICE_LIST);
    // 660 sq in = 4.58 sq ft × $55 = $251.90, minimum $750 → top-up $498.10
    expect(result.subtotal).toBe(251.9);
    expect(result.minimumApplied).toBe(true);
    expect(result.lines.at(-1)).toMatchObject({ label: 'Minimum job charge', amount: 498.1 });
    expect(result.total).toBe(750);
    expect(result.lines.reduce((sum, l) => sum + l.amount, 0)).toBeCloseTo(750, 6);
  });

  it('gives no price for an impossible shape', () => {
    const counter = createCounter('L');
    counter.legs[0] = { length: 20, depth: 25.5 }; // left run shorter than the back run is deep
    const result = quote(counter, eased, DEFAULT_PRICE_LIST);
    expect(result.errors).toEqual(['Left run must be longer than the back run is deep.']);
    expect(result.total).toBe(0);
  });

  it('reports unknown options', () => {
    const result = quote(createCounter('straight'), { ...eased, level: 9 }, DEFAULT_PRICE_LIST);
    expect(result.errors).toEqual(['Granite has no level 9.']);
  });
});

describe('validateCounter', () => {
  it('accepts every preset', () => {
    for (const kind of ['straight', 'L', 'U'] as const) expect(validateCounter(createCounter(kind))).toEqual([]);
  });

  it('rejects a U whose back run is too short for its two side runs', () => {
    const counter = createCounter('U');
    counter.legs[1].length = 50; // side runs are 25.5 + 25.5 = 51 deep
    expect(validateCounter(counter)).toContain('Back run must be longer than the left and right runs are deep together.');
  });
});

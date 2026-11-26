// The counter's shape. Everything is in inches, seen from above.
// The back wall runs along the top (y = 0), the left wall down the left side (x = 0), y grows downwards like SVG.

export type ShapeKind = 'straight' | 'L' | 'U';

/** wall: against a wall, left raw. finished: exposed, gets the edge profile. backsplash: against a wall, with a backsplash on it. */
export type EdgeType = 'wall' | 'finished' | 'backsplash';

export type CornerType = 'square' | 'radius';

export interface Point {
  x: number;
  y: number;
}

/** One straight run of counter. Length is measured along its wall, all the way into the corner. */
export interface Leg {
  length: number;
  depth: number;
}

/**
 * What is saved. The outline is worked out from kind + legs, so editing a size keeps the edge and corner choices.
 * Legs go around the room from left to right: Straight [run], L [left, back], U [left, back, right].
 * edges[i] runs from outline point i to point i + 1; corners[i] is outline point i.
 */
export interface Counter {
  kind: ShapeKind;
  legs: Leg[];
  edges: EdgeType[];
  corners: CornerType[];
}

export const STANDARD_DEPTH = 25.5; // 24" base cabinet + 1.5" overhang

export function createCounter(kind: ShapeKind): Counter {
  switch (kind) {
    case 'straight':
      return {
        kind,
        legs: [{ length: 120, depth: STANDARD_DEPTH }],
        // back wall, right end, front, left end
        edges: ['wall', 'finished', 'finished', 'finished'],
        corners: Array(4).fill('square'),
      };
    case 'L':
      return {
        kind,
        legs: [
          { length: 96, depth: STANDARD_DEPTH },
          { length: 120, depth: STANDARD_DEPTH },
        ],
        // back wall, back run end, back run front, left run front, left run end, left wall
        edges: ['wall', 'finished', 'finished', 'finished', 'finished', 'wall'],
        corners: Array(6).fill('square'),
      };
    case 'U':
      return {
        kind,
        legs: [
          { length: 96, depth: STANDARD_DEPTH },
          { length: 144, depth: STANDARD_DEPTH },
          { length: 96, depth: STANDARD_DEPTH },
        ],
        // back wall, right wall, right run end, right run front, back run front, left run front, left run end, left wall
        edges: ['wall', 'wall', 'finished', 'finished', 'finished', 'finished', 'finished', 'wall'],
        corners: Array(8).fill('square'),
      };
  }
}

/** The outline, clockwise on screen, starting at the back-left corner. */
export function outline(counter: Counter): Point[] {
  const { kind, legs } = counter;
  switch (kind) {
    case 'straight': {
      const [{ length: a, depth: d }] = legs;
      return [p(0, 0), p(a, 0), p(a, d), p(0, d)];
    }
    case 'L': {
      const [left, back] = legs;
      return [
        p(0, 0),
        p(back.length, 0),
        p(back.length, back.depth),
        p(left.depth, back.depth), // inside corner
        p(left.depth, left.length),
        p(0, left.length),
      ];
    }
    case 'U': {
      const [left, back, right] = legs;
      const a = back.length;
      return [
        p(0, 0),
        p(a, 0),
        p(a, right.length),
        p(a - right.depth, right.length),
        p(a - right.depth, back.depth), // inside corner
        p(left.depth, back.depth), // inside corner
        p(left.depth, left.length),
        p(0, left.length),
      ];
    }
  }
}

/** Problems that make the shape impossible. Empty when the shape is fine. */
export function validateCounter(counter: Counter): string[] {
  const errors: string[] = [];
  const names = legNames(counter.kind);
  counter.legs.forEach((leg, i) => {
    if (!(leg.length > 0)) errors.push(`${names[i]} length must be more than 0.`);
    if (!(leg.depth > 0)) errors.push(`${names[i]} depth must be more than 0.`);
  });
  if (errors.length) return errors;

  if (counter.kind === 'L') {
    const [left, back] = counter.legs;
    if (left.length <= back.depth) errors.push('Left run must be longer than the back run is deep.');
    if (back.length <= left.depth) errors.push('Back run must be longer than the left run is deep.');
  }
  if (counter.kind === 'U') {
    const [left, back, right] = counter.legs;
    if (left.length <= back.depth) errors.push('Left run must be longer than the back run is deep.');
    if (right.length <= back.depth) errors.push('Right run must be longer than the back run is deep.');
    if (back.length <= left.depth + right.depth) errors.push('Back run must be longer than the left and right runs are deep together.');
  }
  return errors;
}

export function legNames(kind: ShapeKind): string[] {
  return { straight: ['Run'], L: ['Left run', 'Back run'], U: ['Left run', 'Back run', 'Right run'] }[kind];
}

/** Names for each edge, in outline order, for labels and screen readers. */
export function edgeNames(kind: ShapeKind): string[] {
  return {
    straight: ['Back', 'Right end', 'Front', 'Left end'],
    L: ['Back wall', 'Back run end', 'Back run front', 'Left run front', 'Left run end', 'Left wall'],
    U: ['Back wall', 'Right wall', 'Right run end', 'Right run front', 'Back run front', 'Left run front', 'Left run end', 'Left wall'],
  }[kind];
}

export interface Measurements {
  areaSqFt: number;
  finishedEdgeFt: number;
  backsplashFt: number;
  radiusCorners: number;
}

/** What the shop charges by. Quantities are rounded to 2 decimals, as they appear on the quote. */
export function measure(counter: Counter): Measurements {
  const points = outline(counter);
  const inchesOf = (type: EdgeType) =>
    counter.edges.reduce((sum, edge, i) => (edge === type ? sum + edgeLength(points, i) : sum), 0);
  return {
    areaSqFt: round2(areaSqIn(points) / 144),
    finishedEdgeFt: round2(inchesOf('finished') / 12),
    backsplashFt: round2(inchesOf('backsplash') / 12),
    radiusCorners: counter.corners.filter((c, i) => c === 'radius' && canRoundCorner(counter, points, i)).length,
  };
}

export interface RoundedOutline {
  points: Point[];
  rounded: boolean[];
  /** Where the outline enters (a) and leaves (b) each corner; the corner point itself unless it is rounded. */
  ends: { a: Point; b: Point }[];
}

/** The outline with radius corners rounded off, for drawing (plan view and 3D). */
export function roundedOutline(counter: Counter, radius: number): RoundedOutline {
  const points = outline(counter);
  const n = points.length;
  const rounded = points.map((_, i) => counter.corners[i] === 'radius' && canRoundCorner(counter, points, i));
  const ends = points.map((p, i) => {
    if (!rounded[i]) return { a: p, b: p };
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const r = Math.min(radius, edgeLength(points, (i - 1 + n) % n) / 2, edgeLength(points, i) / 2);
    return { a: towards(p, prev, r), b: towards(p, next, r) };
  });
  return { points, rounded, ends };
}

function towards(from: Point, to: Point, distance: number): Point {
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: from.x + ((to.x - from.x) / len) * distance, y: from.y + ((to.y - from.y) / len) * distance };
}

/** Unit vector pointing out of the counter, away from edge i. */
export function outwardNormal(points: Point[], i: number): Point {
  const a = points[i];
  const b = points[(i + 1) % points.length];
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const sign = Math.sign(signedArea(points)) || 1;
  return { x: (sign * (b.y - a.y)) / length, y: (sign * -(b.x - a.x)) / length };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Area in square inches (shoelace formula). Shared corners are counted once because it works on the outline. */
export function areaSqIn(points: Point[]): number {
  return Math.abs(signedArea(points));
}

export function edgeLength(points: Point[], i: number): number {
  const a = points[i];
  const b = points[(i + 1) % points.length];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Outside corners bulge out; inside corners (where two runs meet) point in. Works for any angle. */
export function isOutsideCorner(points: Point[], i: number): boolean {
  const n = points.length;
  const prev = points[(i - 1 + n) % n];
  const here = points[i];
  const next = points[(i + 1) % n];
  const cross = (here.x - prev.x) * (next.y - here.y) - (here.y - prev.y) * (next.x - here.x);
  return Math.sign(cross) === Math.sign(signedArea(points));
}

/** A corner can be rounded only if it sticks out and both edges meeting there are finished. */
export function canRoundCorner(counter: Counter, points: Point[], i: number): boolean {
  const n = points.length;
  const before = counter.edges[(i - 1 + n) % n];
  const after = counter.edges[i];
  return before === 'finished' && after === 'finished' && isOutsideCorner(points, i);
}

function signedArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function p(x: number, y: number): Point {
  return { x, y };
}

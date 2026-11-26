// How many slabs a counter needs, and where the seams go.
//
// Stone is bought by the whole slab, so the square footage alone doesn't tell a shop what a job really uses.
// The counter is cut into straight pieces at its corners; each corner square can go with either leg, and
// which one changes everything: an L of 120" + 96" cut one way needs two slabs, cut the other way one.
// We try every way of cutting the corners, split pieces longer than a slab, lay the pieces out on slabs
// and keep the plan with the fewest slabs, then the fewest seams.
//
// Simplifications: pieces are laid out in rows (how counter strips are usually nested), veining and
// book-matching are ignored, and seams aren't kept away from sinks yet.

import { areaSqIn, type Counter, outline, type Point, validateCounter } from './shapes';

export const SLAB_TRIM = 1; // inches lost on each slab edge (rough, chipped edges)
export const SAW_KERF = 0.5; // inches between pieces

export interface SlabSize {
  length: number;
  width: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A piece to cut, in counter coordinates. `along` is the direction its length runs in. */
interface Piece {
  name: string;
  rect: Rect;
  along: 'x' | 'y';
  /** Set for a whole L or U cut as one piece: its outline, relative to rect's corner. */
  shape?: Point[];
}

export interface Seam {
  a: Point;
  b: Point;
}

export interface PlacedPiece {
  number: number;
  name: string;
  length: number;
  depth: number;
  /** Where the piece is in the drawing, to label it. */
  rect: Rect;
  shape?: Point[];
  slab: number;
  /** Where it sits on its slab, in inches from the slab's top-left corner. */
  x: number;
  y: number;
  rotated: boolean;
}

export interface SlabPlan {
  slab: SlabSize;
  slabs: number;
  seams: Seam[];
  pieces: PlacedPiece[];
  /** Share of the bought stone that ends up in the counter, 0–100. */
  yieldPercent: number;
  problems: string[];
}

export function planSlabs(counter: Counter, slab: SlabSize): SlabPlan {
  const empty = (problems: string[]): SlabPlan => ({ slab, slabs: 0, seams: [], pieces: [], yieldPercent: 0, problems });
  if (validateCounter(counter).length) return empty([]);

  const usable = { length: slab.length - 2 * SLAB_TRIM, width: slab.width - 2 * SLAB_TRIM };
  let best: SlabPlan | null = null;
  let tooDeep = false;

  for (const candidate of cutOptions(counter, usable)) {
    const { pieces, seams } = splitLongPieces(candidate.pieces, candidate.seams, usable.length);
    const placed = layOut(pieces, usable);
    if (!placed) {
      tooDeep = true;
      continue;
    }
    const slabs = Math.max(...placed.map((p) => p.slab)) + 1;
    const plan: SlabPlan = {
      slab,
      slabs,
      seams,
      pieces: placed,
      yieldPercent: Math.round((areaSqIn(outline(counter)) / (slabs * slab.length * slab.width)) * 100),
      problems: [],
    };
    if (!best || plan.slabs < best.slabs || (plan.slabs === best.slabs && plan.seams.length < best.seams.length)) best = plan;
  }

  return best ?? empty(tooDeep ? [`A piece is deeper than a ${slab.width}" slab is wide.`] : []);
}

/** Every way of cutting the counter into straight pieces at its corners (plus one whole piece, if it fits on a slab). */
function cutOptions(counter: Counter, usable: SlabSize): { pieces: Piece[]; seams: Seam[] }[] {
  const points = outline(counter);
  const width = Math.max(...points.map((p) => p.x));
  const height = Math.max(...points.map((p) => p.y));
  const options: { pieces: Piece[]; seams: Seam[] }[] = [];

  if (counter.kind === 'straight') {
    return [{ pieces: [{ name: 'Run', rect: { x: 0, y: 0, w: width, h: height }, along: 'x' }], seams: [] }];
  }

  const fitsWhole = (width <= usable.length && height <= usable.width) || (height <= usable.length && width <= usable.width);
  if (fitsWhole) {
    const name = counter.kind === 'L' ? 'L-shaped piece' : 'U-shaped piece';
    options.push({ pieces: [{ name, rect: { x: 0, y: 0, w: width, h: height }, along: 'x', shape: points }], seams: [] });
  }

  if (counter.kind === 'L') {
    const [left, back] = counter.legs;
    const a = back.length;
    // Corner square cut with the back run, seam across the left run
    options.push({
      pieces: [
        { name: 'Back run', rect: { x: 0, y: 0, w: a, h: back.depth }, along: 'x' },
        { name: 'Left run', rect: { x: 0, y: back.depth, w: left.depth, h: left.length - back.depth }, along: 'y' },
      ],
      seams: [{ a: { x: 0, y: back.depth }, b: { x: left.depth, y: back.depth } }],
    });
    // Corner square cut with the left run, seam across the back run
    options.push({
      pieces: [
        { name: 'Back run', rect: { x: left.depth, y: 0, w: a - left.depth, h: back.depth }, along: 'x' },
        { name: 'Left run', rect: { x: 0, y: 0, w: left.depth, h: left.length }, along: 'y' },
      ],
      seams: [{ a: { x: left.depth, y: 0 }, b: { x: left.depth, y: back.depth } }],
    });
  }

  if (counter.kind === 'U') {
    const [left, back, right] = counter.legs;
    const a = back.length;
    for (const leftWithBack of [true, false]) {
      for (const rightWithBack of [true, false]) {
        const backStart = leftWithBack ? 0 : left.depth;
        const backEnd = rightWithBack ? a : a - right.depth;
        const leftTop = leftWithBack ? back.depth : 0;
        const rightTop = rightWithBack ? back.depth : 0;
        options.push({
          pieces: [
            { name: 'Back run', rect: { x: backStart, y: 0, w: backEnd - backStart, h: back.depth }, along: 'x' },
            { name: 'Left run', rect: { x: 0, y: leftTop, w: left.depth, h: left.length - leftTop }, along: 'y' },
            { name: 'Right run', rect: { x: a - right.depth, y: rightTop, w: right.depth, h: right.length - rightTop }, along: 'y' },
          ],
          seams: [
            leftWithBack
              ? { a: { x: 0, y: back.depth }, b: { x: left.depth, y: back.depth } }
              : { a: { x: left.depth, y: 0 }, b: { x: left.depth, y: back.depth } },
            rightWithBack
              ? { a: { x: a - right.depth, y: back.depth }, b: { x: a, y: back.depth } }
              : { a: { x: a - right.depth, y: 0 }, b: { x: a - right.depth, y: back.depth } },
          ],
        });
      }
    }
  }
  return options;
}

/** A piece longer than the slab is cut into equal parts, with a seam at each cut. */
function splitLongPieces(pieces: Piece[], seams: Seam[], maxLength: number) {
  const out: Piece[] = [];
  const allSeams = [...seams];
  for (const piece of pieces) {
    const length = piece.along === 'x' ? piece.rect.w : piece.rect.h;
    const parts = piece.shape ? 1 : Math.ceil(length / maxLength);
    if (parts <= 1) {
      out.push(piece);
      continue;
    }
    const step = length / parts;
    for (let i = 0; i < parts; i++) {
      const { x, y, w, h } = piece.rect;
      const rect = piece.along === 'x' ? { x: x + i * step, y, w: step, h } : { x, y: y + i * step, w, h: step };
      out.push({ ...piece, name: `${piece.name} (${i + 1} of ${parts})`, rect });
      if (i > 0) {
        allSeams.push(
          piece.along === 'x'
            ? { a: { x: rect.x, y }, b: { x: rect.x, y: y + h } }
            : { a: { x, y: rect.y }, b: { x: x + w, y: rect.y } },
        );
      }
    }
  }
  return { pieces: out, seams: allSeams };
}

interface Row {
  y: number;
  height: number;
  used: number;
}

/**
 * Lays pieces out in rows along each slab, longest first, using the first row they fit in.
 * Returns null if a piece can't fit on a slab at all.
 */
function layOut(pieces: Piece[], usable: SlabSize): PlacedPiece[] | null {
  const sized = pieces.map((piece) => {
    const length = piece.along === 'x' ? piece.rect.w : piece.rect.h;
    const depth = piece.along === 'x' ? piece.rect.h : piece.rect.w;
    // A short, wide piece (a whole L) may only fit turned sideways
    const fitsAsIs = length <= usable.length && depth <= usable.width;
    const rotated = !fitsAsIs && depth <= usable.length && length <= usable.width;
    return { piece, length, depth, slabLength: rotated ? depth : length, slabDepth: rotated ? length : depth, rotated };
  });
  if (sized.some((s) => s.slabLength > usable.length || s.slabDepth > usable.width)) return null;

  const order = [...sized].sort((a, b) => b.slabLength - a.slabLength || b.slabDepth - a.slabDepth);
  const slabs: Row[][] = [];
  const placed: PlacedPiece[] = [];

  for (const s of order) {
    let spot: { slab: number; row: Row } | null = null;
    for (let i = 0; i < slabs.length && !spot; i++) {
      const row = slabs[i].find((r) => s.slabDepth <= r.height && r.used + SAW_KERF + s.slabLength <= usable.length);
      if (row) spot = { slab: i, row };
    }
    for (let i = 0; i < slabs.length && !spot; i++) {
      const last = slabs[i].at(-1)!;
      const y = last.y + last.height + SAW_KERF;
      if (y + s.slabDepth <= usable.width) {
        const row = { y, height: s.slabDepth, used: -SAW_KERF };
        slabs[i].push(row);
        spot = { slab: i, row };
      }
    }
    if (!spot) {
      const row = { y: 0, height: s.slabDepth, used: -SAW_KERF };
      slabs.push([row]);
      spot = { slab: slabs.length - 1, row };
    }
    const x = spot.row.used + SAW_KERF;
    spot.row.used = x + s.slabLength;
    placed.push({
      number: 0,
      name: s.piece.name,
      length: s.length,
      depth: s.depth,
      rect: s.piece.rect,
      shape: s.piece.shape,
      slab: spot.slab,
      x: x + SLAB_TRIM,
      y: spot.row.y + SLAB_TRIM,
      rotated: s.rotated,
    });
  }

  // Number pieces in the order they appear in the drawing
  const drawingOrder = pieces.map((p) => p.rect);
  return placed
    .sort((a, b) => drawingOrder.indexOf(a.rect) - drawingOrder.indexOf(b.rect))
    .map((p, i) => ({ ...p, number: i + 1 }));
}

// What a job saves: the counter and the options chosen for its quote, as JSON in Job.drawing.
import { DEFAULT_PRICE_LIST, type CutoutId } from './priceList';
import type { QuoteOptions } from './quote';
import { type Counter, createCounter, type CornerType, type EdgeType, outline, type ShapeKind } from './shapes';

export interface Drawing {
  version: 1;
  counter: Counter;
  options: QuoteOptions;
}

/** The material on the job is a name ("Quartz"); the price list uses ids ("quartz"). */
export function materialIdFor(name: string): string {
  return DEFAULT_PRICE_LIST.materials.find((m) => m.name.toLowerCase() === name.trim().toLowerCase())?.id ?? DEFAULT_PRICE_LIST.materials[0].id;
}

export function materialName(id: string): string {
  return DEFAULT_PRICE_LIST.materials.find((m) => m.id === id)?.name ?? id;
}

export function defaultDrawing(material: string): Drawing {
  const stone = DEFAULT_PRICE_LIST.materials.find((m) => m.id === materialIdFor(material))!;
  const color = stone.colors[0];
  return {
    version: 1,
    counter: createCounter('L'),
    options: { materialId: stone.id, colorId: color.id, level: color.level, edgeProfileId: 'eased', cutouts: {} },
  };
}

export function serializeDrawing(drawing: Drawing): string {
  return JSON.stringify(drawing);
}

/**
 * Reads a saved drawing. Anything missing or malformed gives the default for the job's material,
 * so a bad record can't break the page.
 */
export function parseDrawing(json: string, material: string): Drawing {
  if (!json) return defaultDrawing(material);
  try {
    const data = JSON.parse(json);
    if (data?.version === 1 && isCounter(data.counter) && isOptions(data.options)) {
      return { version: 1, counter: data.counter, options: data.options };
    }
  } catch {
    // fall through to the default
  }
  return defaultDrawing(material);
}

const KINDS: ShapeKind[] = ['straight', 'L', 'U'];
const EDGES: EdgeType[] = ['wall', 'finished', 'backsplash'];
const CORNERS: CornerType[] = ['square', 'radius'];
const CUTOUTS = new Set<string>(DEFAULT_PRICE_LIST.cutouts.map((c) => c.id));

function isCounter(c: unknown): c is Counter {
  if (!c || typeof c !== 'object') return false;
  const counter = c as Counter;
  if (!KINDS.includes(counter.kind)) return false;
  const preset = createCounter(counter.kind);
  if (!Array.isArray(counter.legs) || counter.legs.length !== preset.legs.length) return false;
  if (!counter.legs.every((leg) => isPositive(leg?.length) && isPositive(leg?.depth))) return false;
  const corners = outline(counter).length;
  return (
    Array.isArray(counter.edges) && counter.edges.length === corners && counter.edges.every((e) => EDGES.includes(e)) &&
    Array.isArray(counter.corners) && counter.corners.length === corners && counter.corners.every((x) => CORNERS.includes(x))
  );
}

function isOptions(o: unknown): o is QuoteOptions {
  if (!o || typeof o !== 'object') return false;
  const options = o as QuoteOptions;
  return (
    typeof options.materialId === 'string' &&
    (options.colorId === undefined || typeof options.colorId === 'string') &&
    Number.isInteger(options.level) &&
    typeof options.edgeProfileId === 'string' &&
    !!options.cutouts && typeof options.cutouts === 'object' &&
    Object.entries(options.cutouts).every(([id, n]) => CUTOUTS.has(id as CutoutId) && Number.isInteger(n) && (n as number) >= 0)
  );
}

function isPositive(n: unknown): boolean {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

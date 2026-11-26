import { type KeyboardEvent, useId } from 'react';
import {
  canRoundCorner,
  type Counter,
  edgeLength,
  edgeNames,
  type EdgeType,
  outline,
  outwardNormal,
  type Point,
} from '../counter/shapes';
import { formatInches } from '../counter/units';

const NEXT_EDGE: Record<EdgeType, EdgeType> = { finished: 'wall', wall: 'backsplash', backsplash: 'finished' };
const EDGE_LABEL: Record<EdgeType, string> = { finished: 'finished edge', wall: 'against wall', backsplash: 'backsplash' };
const RADIUS = 3; // inches, how round a radius corner looks
const WALL = 4; // inches, drawn wall thickness

interface Props {
  counter: Counter;
  onChange: (counter: Counter) => void;
  invalid?: boolean;
}

/** Plan view of the counter. Click an edge to change what it is; click an outside corner to round it. */
export function CounterDrawing({ counter, onChange, invalid }: Props) {
  const hatchId = `hatch${useId().replace(/:/g, '')}`;
  const points = outline(counter);
  const names = edgeNames(counter.kind);
  const n = points.length;

  const width = Math.max(...points.map((p) => p.x));
  const height = Math.max(...points.map((p) => p.y));
  const k = Math.max(width, height, 24) / 100; // one "unit" so text and handles look the same size on any counter
  const pad = WALL + 14 * k;

  const isWallSide = (i: number) => counter.edges[(i + n) % n] !== 'finished';
  const rounded = points.map((_, i) => counter.corners[i] === 'radius' && canRoundCorner(counter, points, i));
  const roundable = points.map((_, i) => canRoundCorner(counter, points, i));

  // Where the outline enters (a) and leaves (b) each corner; the same point unless the corner is rounded.
  const cornerEnds = points.map((p, i) => {
    if (!rounded[i]) return { a: p, b: p };
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const r = Math.min(RADIUS, edgeLength(points, (i - 1 + n) % n) / 2, edgeLength(points, i) / 2);
    return { a: towards(p, prev, r), b: towards(p, next, r) };
  });

  const outlinePath =
    `M ${xy(cornerEnds[0].a)} ` +
    points.map((p, i) => (rounded[i] ? `L ${xy(cornerEnds[i].a)} Q ${xy(p)} ${xy(cornerEnds[i].b)}` : `L ${xy(p)}`)).join(' ') +
    ' Z';

  const setEdge = (i: number) => {
    const edges = [...counter.edges];
    edges[i] = NEXT_EDGE[edges[i]];
    onChange({ ...counter, edges });
  };
  const toggleCorner = (i: number) => {
    const corners = [...counter.corners];
    corners[i] = corners[i] === 'radius' ? 'square' : 'radius';
    onChange({ ...counter, corners });
  };
  const onKey = (action: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <svg
      className={`drawing${invalid ? ' drawing-invalid' : ''}`}
      viewBox={`${-pad} ${-pad} ${width + 2 * pad} ${height + 2 * pad}`}
      role="group"
      aria-label="Counter drawing"
    >
      <defs>
        <pattern id={hatchId} patternUnits="userSpaceOnUse" width={1.6 * k} height={1.6 * k} patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={1.6 * k} className="hatch-line" />
        </pattern>
      </defs>

      {/* Walls behind wall and backsplash edges, joined at corners where two walls meet */}
      {counter.edges.map((type, i) => {
        if (type === 'finished') return null;
        const a = points[i];
        const b = points[(i + 1) % n];
        const out = outwardNormal(points, i);
        const len = edgeLength(points, i) || 1;
        const dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
        const start = isWallSide(i - 1) ? move(a, dir, -WALL) : a;
        const end = isWallSide(i + 1) ? move(b, dir, WALL) : b;
        const band = [start, end, move(end, out, WALL), move(start, out, WALL)];
        return <polygon key={`wall${i}`} points={band.map(xy).join(' ')} fill={`url(#${hatchId})`} className="wall-band" />;
      })}

      <path d={outlinePath} className="stone" />

      {counter.edges.map((type, i) => {
        const start = cornerEnds[i].b;
        const end = cornerEnds[(i + 1) % n].a;
        const a = points[i];
        const b = points[(i + 1) % n];
        const out = outwardNormal(points, i);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const label = move(mid, out, (type === 'finished' ? 0 : WALL) + 5 * k);
        const length = edgeLength(points, i);
        const next = EDGE_LABEL[NEXT_EDGE[type]];
        return (
          <g
            key={`edge${i}`}
            className={`edge edge-${type}`}
            role="button"
            tabIndex={0}
            aria-label={`${names[i]}, ${formatInches(length)}, ${EDGE_LABEL[type]}. Activate to make it ${next}.`}
            onClick={() => setEdge(i)}
            onKeyDown={onKey(() => setEdge(i))}
          >
            <title>{`${names[i]}: ${EDGE_LABEL[type]} (click for ${next})`}</title>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="edge-hit" />
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="edge-line" />
            <text x={label.x} y={label.y} fontSize={3.6 * k} className="dimension" transform={upright(a, b, label)}>
              {formatInches(length)}
            </text>
          </g>
        );
      })}

      {points.map((p, i) =>
        roundable[i] ? (
          <g
            key={`corner${i}`}
            className={`corner${rounded[i] ? ' corner-radius' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={rounded[i]}
            aria-label={`Corner between ${names[(i - 1 + n) % n]} and ${names[i]}: ${rounded[i] ? 'radius' : 'square'}`}
            onClick={() => toggleCorner(i)}
            onKeyDown={onKey(() => toggleCorner(i))}
          >
            <title>{rounded[i] ? 'Radius corner (click for square)' : 'Square corner (click to round)'}</title>
            <circle cx={p.x} cy={p.y} r={3.5 * k} className="corner-hit" />
            <circle cx={p.x} cy={p.y} r={1.6 * k} className="corner-dot" />
          </g>
        ) : null,
      )}
    </svg>
  );
}

function xy(p: Point) {
  return `${p.x},${p.y}`;
}

function move(p: Point, dir: Point, distance: number): Point {
  return { x: p.x + dir.x * distance, y: p.y + dir.y * distance };
}

function towards(from: Point, to: Point, distance: number): Point {
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return move(from, { x: (to.x - from.x) / len, y: (to.y - from.y) / len }, distance);
}

/** Rotates a label to run along its edge, never upside down; vertical labels read bottom to top, as on drawings. */
function upright(a: Point, b: Point, at: Point) {
  let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (angle >= 90) angle -= 180;
  if (angle < -90) angle += 180;
  return `rotate(${angle} ${at.x} ${at.y})`;
}

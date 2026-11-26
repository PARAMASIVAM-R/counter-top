import { useId } from 'react';
import type { StoneColor } from '../counter/priceList';
import { type Counter, roundedOutline } from '../counter/shapes';
import { StonePattern } from './StonePattern';

/** A small picture of the counter's shape in its stone, for lists. */
export function CounterThumbnail({ counter, color }: { counter: Counter; color: StoneColor }) {
  const stoneId = `thumb${useId().replace(/:/g, '')}`;
  const { points, rounded, ends } = roundedOutline(counter, 3);
  const width = Math.max(...points.map((p) => p.x));
  const height = Math.max(...points.map((p) => p.y));
  const pad = Math.max(width, height) * 0.06;
  const d =
    `M ${ends[0].a.x},${ends[0].a.y} ` +
    points.map((p, i) => (rounded[i] ? `L ${ends[i].a.x},${ends[i].a.y} Q ${p.x},${p.y} ${ends[i].b.x},${ends[i].b.y}` : `L ${p.x},${p.y}`)).join(' ') +
    ' Z';
  return (
    <svg className="thumbnail" viewBox={`${-pad} ${-pad} ${width + 2 * pad} ${height + 2 * pad}`} aria-hidden="true">
      <defs>
        <StonePattern id={stoneId} color={color} />
      </defs>
      <path d={d} fill={`url(#${stoneId})`} className="thumbnail-stone" />
    </svg>
  );
}

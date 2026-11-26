import { useId } from 'react';
import type { StoneColor } from '../counter/priceList';
import type { Point } from '../counter/shapes';
import { SLAB_TRIM, type PlacedPiece, type SlabPlan } from '../counter/slabs';
import { formatInches } from '../counter/units';
import { Term } from '../help/Help';
import { StonePattern } from './StonePattern';

/** Each slab to scale, in the chosen stone, with the pieces cut from it. Numbers match the pieces on the drawing. */
export function SlabLayout({ plan, material, color }: { plan: SlabPlan; material: string; color: StoneColor }) {
  const stoneId = `slabstone${useId().replace(/:/g, '')}`;
  if (plan.problems.length) return <p className="errors">{plan.problems.join(' ')}</p>;
  if (!plan.slabs) return <p className="muted">Fix the drawing to see the slab layout.</p>;

  const { length, width } = plan.slab;
  const k = length / 100;
  return (
    <>
      <p className="slab-summary">
        <strong>{plan.slabs} <Term id="slab">{plan.slabs === 1 ? 'slab' : 'slabs'}</Term></strong> of {color.name} {material.toLowerCase()},{' '}
        {formatInches(length)} × {formatInches(width)}
        <span className="muted">
          {' '}· <Term id="seam">{seamText(plan.seams.length)}</Term> · <Term id="yield">{plan.yieldPercent}% of the stone used</Term>
        </span>
      </p>
      <div className="slabs">
        {Array.from({ length: plan.slabs }, (_, s) => (
          <figure key={s} className="slab">
            <svg viewBox={`-1 -1 ${length + 2} ${width + 2}`} role="img" aria-label={`Slab ${s + 1}: ${piecesOn(plan.pieces, s)}`}>
              <defs>
                <StonePattern id={stoneId} color={color} />
              </defs>
              <rect x={0} y={0} width={length} height={width} fill={`url(#${stoneId})`} className="slab-stone" />
              <rect x={0} y={0} width={length} height={width} className="slab-offcut" />
              <rect x={SLAB_TRIM} y={SLAB_TRIM} width={length - 2 * SLAB_TRIM} height={width - 2 * SLAB_TRIM} className="slab-trim" />
              {plan.pieces.filter((p) => p.slab === s).map((p) => <SlabPiece key={p.number} piece={p} k={k} fill={`url(#${stoneId})`} />)}
            </svg>
            <figcaption>Slab {s + 1}</figcaption>
          </figure>
        ))}
      </div>
      <ol className="piece-list">
        {plan.pieces.map((p) => (
          <li key={p.number}>
            <span className="piece-badge">{p.number}</span>
            {p.name}
            <span className="muted">
              {' '}· {formatInches(p.length)} × {formatInches(p.depth)}
              {plan.slabs > 1 && ` · slab ${p.slab + 1}`}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

function SlabPiece({ piece, k, fill }: { piece: PlacedPiece; k: number; fill: string }) {
  const [w, h] = piece.rotated ? [piece.depth, piece.length] : [piece.length, piece.depth];
  const cx = piece.x + w / 2;
  const cy = piece.y + h / 2;
  return (
    <g>
      <title>{`${piece.number}. ${piece.name}: ${formatInches(piece.length)} × ${formatInches(piece.depth)}`}</title>
      {piece.shape ? (
        <polygon points={placeShape(piece).map((p) => `${p.x},${p.y}`).join(' ')} fill={fill} className="slab-piece" />
      ) : (
        <rect x={piece.x} y={piece.y} width={w} height={h} fill={fill} className="slab-piece" />
      )}
      <circle cx={cx} cy={cy} r={3.6 * k} className="slab-label-bg" />
      <text x={cx} y={cy} fontSize={4.4 * k} className="slab-label">{piece.number}</text>
    </g>
  );
}

/** A whole L or U drawn in place on its slab, turned a quarter if it was rotated to fit. */
function placeShape(piece: PlacedPiece): Point[] {
  const { x: ox, y: oy, h } = piece.rect;
  return piece.shape!.map((p) => {
    const local = { x: p.x - ox, y: p.y - oy };
    return piece.rotated ? { x: piece.x + (h - local.y), y: piece.y + local.x } : { x: piece.x + local.x, y: piece.y + local.y };
  });
}

function piecesOn(pieces: PlacedPiece[], slab: number) {
  return pieces.filter((p) => p.slab === slab).map((p) => `piece ${p.number}, ${p.name}`).join('; ');
}

export function seamText(seams: number) {
  return seams === 0 ? 'no seams' : seams === 1 ? '1 seam' : `${seams} seams`;
}

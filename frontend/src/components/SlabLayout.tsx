import type { Point } from '../counter/shapes';
import { SLAB_TRIM, type PlacedPiece, type SlabPlan } from '../counter/slabs';
import { formatInches } from '../counter/units';

/** Each slab to scale, with the pieces cut from it. Numbers match the pieces on the drawing. */
export function SlabLayout({ plan, material }: { plan: SlabPlan; material: string }) {
  if (plan.problems.length) return <p className="errors">{plan.problems.join(' ')}</p>;
  if (!plan.slabs) return <p className="muted">Fix the drawing to see the slab layout.</p>;

  const { length, width } = plan.slab;
  const k = length / 100;
  return (
    <>
      <p className="slab-summary">
        <strong>{plan.slabs} {plan.slabs === 1 ? 'slab' : 'slabs'}</strong> of {material}, {formatInches(length)} × {formatInches(width)}
        <span className="muted"> · {seamText(plan.seams.length)} · {plan.yieldPercent}% of the stone used</span>
      </p>
      <div className="slabs">
        {Array.from({ length: plan.slabs }, (_, s) => (
          <figure key={s} className="slab">
            <svg viewBox={`-1 -1 ${length + 2} ${width + 2}`} role="img" aria-label={`Slab ${s + 1}: ${piecesOn(plan.pieces, s)}`}>
              <rect x={0} y={0} width={length} height={width} className="slab-stone" />
              <rect x={SLAB_TRIM} y={SLAB_TRIM} width={length - 2 * SLAB_TRIM} height={width - 2 * SLAB_TRIM} className="slab-trim" />
              {plan.pieces.filter((p) => p.slab === s).map((p) => <SlabPiece key={p.number} piece={p} k={k} />)}
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

function SlabPiece({ piece, k }: { piece: PlacedPiece; k: number }) {
  const [w, h] = piece.rotated ? [piece.depth, piece.length] : [piece.length, piece.depth];
  const cx = piece.x + w / 2;
  const cy = piece.y + h / 2;
  return (
    <g>
      <title>{`${piece.number}. ${piece.name}: ${formatInches(piece.length)} × ${formatInches(piece.depth)}`}</title>
      {piece.shape ? (
        <polygon points={placeShape(piece).map((p) => `${p.x},${p.y}`).join(' ')} className="slab-piece" />
      ) : (
        <rect x={piece.x} y={piece.y} width={w} height={h} className="slab-piece" />
      )}
      <text x={cx} y={cy} fontSize={5 * k} className="slab-label">{piece.number}</text>
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

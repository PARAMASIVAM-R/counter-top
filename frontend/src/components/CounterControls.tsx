import { useEffect, useId, useState } from 'react';
import { type Counter, legNames, type Measurements, type ShapeKind } from '../counter/shapes';
import { formatFeetInches, formatTypedInches, parseInches } from '../counter/units';

const SHAPES: { kind: ShapeKind; label: string; icon: string }[] = [
  { kind: 'straight', label: 'Straight', icon: 'M2 6 H22 V12 H2 Z' },
  { kind: 'L', label: 'L-shape', icon: 'M2 2 H22 V8 H8 V22 H2 Z' },
  { kind: 'U', label: 'U-shape', icon: 'M2 2 H22 V22 H16 V8 H8 V22 H2 Z' },
];

export function ShapePicker({ kind, onSelect }: { kind: ShapeKind; onSelect: (kind: ShapeKind) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Counter shape">
      {SHAPES.map((shape) => (
        <button
          key={shape.kind}
          type="button"
          role="radio"
          aria-checked={kind === shape.kind}
          className={kind === shape.kind ? 'active' : ''}
          onClick={() => kind !== shape.kind && onSelect(shape.kind)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={shape.icon} />
          </svg>
          {shape.label}
        </button>
      ))}
    </div>
  );
}

export function LegInputs({ counter, onChange }: { counter: Counter; onChange: (counter: Counter) => void }) {
  const names = legNames(counter.kind);
  const setLeg = (i: number, field: 'length' | 'depth', value: number) => {
    const legs = counter.legs.map((leg, j) => (j === i ? { ...leg, [field]: value } : leg));
    onChange({ ...counter, legs });
  };

  return (
    <div className="legs">
      {counter.legs.map((leg, i) => (
        <fieldset key={`${counter.kind}-${i}`} className="leg">
          <legend>{names[i]}</legend>
          <DimensionInput label="Length" value={leg.length} onChange={(v) => setLeg(i, 'length', v)} />
          <DimensionInput label="Depth" value={leg.depth} onChange={(v) => setLeg(i, 'depth', v)} />
        </fieldset>
      ))}
      <p className="hint">Inches, or feet and inches: 120, 25 1/2, 10' 6". Lengths run along the wall, into the corner.</p>
    </div>
  );
}

/** Text input for a size. Accepts the ways people write sizes and updates the drawing as soon as it can read one. */
function DimensionInput({ label, value, onChange }: { label: string; value: number; onChange: (inches: number) => void }) {
  const id = useId();
  const [text, setText] = useState(formatTypedInches(value));
  const [focused, setFocused] = useState(false);
  const parsed = parseInches(text);
  const valid = parsed !== null && parsed > 0;

  // Show changes made elsewhere, and tidy what was typed once the field is left.
  useEffect(() => {
    if (!focused) setText(formatTypedInches(value));
  }, [value, focused]);

  return (
    <div className="dimension-input">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={!valid}
        aria-describedby={`${id}-hint`}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const inches = parseInches(e.target.value);
          if (inches !== null && inches > 0) onChange(inches);
        }}
      />
      <span id={`${id}-hint`} className={valid ? 'hint' : 'hint hint-error'}>
        {valid ? formatFeetInches(parsed) : 'Not a size'}
      </span>
    </div>
  );
}

export function EdgeLegend() {
  return (
    <ul className="legend">
      <li><span className="swatch swatch-finished" />Finished edge</li>
      <li><span className="swatch swatch-wall" />Against wall</li>
      <li><span className="swatch swatch-backsplash" />Backsplash</li>
      <li><span className="swatch swatch-corner" />Square corner</li>
      <li><span className="swatch swatch-corner swatch-radius" />Radius corner</li>
      <li><span className="swatch swatch-seam" />Seam</li>
    </ul>
  );
}

export function MeasurementList({ m }: { m: Measurements }) {
  return (
    <dl className="measurements">
      <div><dt>Area</dt><dd>{m.areaSqFt.toFixed(2)} sq ft</dd></div>
      <div><dt>Finished edge</dt><dd>{m.finishedEdgeFt.toFixed(2)} lin ft</dd></div>
      <div><dt>Backsplash</dt><dd>{m.backsplashFt.toFixed(2)} lin ft</dd></div>
      <div><dt>Radius corners</dt><dd>{m.radiusCorners}</dd></div>
    </dl>
  );
}

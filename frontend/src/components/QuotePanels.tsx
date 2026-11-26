import { useId } from 'react';
import { colorFor, type CutoutId, type PriceList } from '../counter/priceList';
import type { Quote, QuoteOptions } from '../counter/quote';
import type { SlabPlan } from '../counter/slabs';
import { Term, useShowHelp } from '../help/Help';
import { seamText } from './SlabLayout';
import { StoneSwatch } from './StonePattern';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const wholeMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function formatMoney(amount: number): string {
  return money.format(amount);
}

interface OptionsProps {
  options: QuoteOptions;
  prices: PriceList;
  onChange: (options: QuoteOptions) => void;
}

export function OptionsPanel({ options, prices, onChange }: OptionsProps) {
  const id = useId();
  const showHelp = useShowHelp();
  const material = prices.materials.find((m) => m.id === options.materialId) ?? prices.materials[0];
  const color = colorFor(material, options.colorId, options.level);
  const set = (changes: Partial<QuoteOptions>) => onChange({ ...options, ...changes });
  const setCutout = (cutoutId: CutoutId, count: number) =>
    set({ cutouts: { ...options.cutouts, [cutoutId]: Math.max(0, Math.min(9, count)) } });

  return (
    <div className="options">
      <div className="field field-wide">
        <span className="field-label"><Term id="material">Material</Term></span>
        <div className="segmented segmented-small" role="radiogroup" aria-label="Material">
          {prices.materials.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={m.id === material.id}
              className={m.id === material.id ? 'active' : ''}
              onMouseEnter={() => showHelp(m.id)}
              onFocus={() => showHelp(m.id)}
              onClick={() => {
                showHelp(m.id);
                if (m.id !== material.id) set({ materialId: m.id, colorId: m.colors[0].id, level: m.colors[0].level });
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="field field-wide">
        <span className="field-label">
          <Term id="stoneColor">Stone colour</Term>: <strong>{color.name}</strong> ·{' '}
          <Term id="level">level {color.level}</Term>, {wholeMoney.format(material.pricePerSqFtByLevel[color.level - 1])}/<Term id="sqft">sq ft</Term>
        </span>
        <div className="colors" role="radiogroup" aria-label="Stone colour">
          {material.colors.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={c.id === color.id}
              className={`color${c.id === color.id ? ' active' : ''}`}
              title={`${c.name} · level ${c.level}`}
              onMouseEnter={() => showHelp('stoneColor')}
              onClick={() => set({ colorId: c.id, level: c.level })}
            >
              <StoneSwatch color={c} />
              <span className="color-name">{c.name}</span>
              <span className="color-level">Level {c.level}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field field-wide">
        <label htmlFor={`${id}-edge`}>
          <Term id="edgeProfile">Edge profile</Term> <span className="hint">on <Term id="finished">finished edges</Term></span>
        </label>
        <select
          id={`${id}-edge`}
          value={options.edgeProfileId}
          onFocus={() => showHelp(options.edgeProfileId)}
          onChange={(e) => {
            set({ edgeProfileId: e.target.value });
            showHelp(e.target.value);
          }}
        >
          {prices.edgeProfiles.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.pricePerLinearFoot ? `${wholeMoney.format(e.pricePerLinearFoot)}/lin ft` : 'included'}
            </option>
          ))}
        </select>
      </div>

      <div className="field-wide">
        <span className="field-label"><Term id="cutouts">Cutouts</Term></span>
        <ul className="cutouts">
          {prices.cutouts.map((c) => {
            const count = options.cutouts[c.id] ?? 0;
            return (
              <li key={c.id}>
                <span>
                  <Term id={c.id}>{c.name}</Term>
                  <span className="hint"> · {wholeMoney.format(c.price)} each</span>
                </span>
                <span className="stepper" role="group" aria-label={c.name}>
                  <button type="button" aria-label={`Remove ${c.name}`} disabled={count === 0} onClick={() => setCutout(c.id, count - 1)}>−</button>
                  <output aria-live="polite">{count}</output>
                  <button type="button" aria-label={`Add ${c.name}`} disabled={count >= 9} onClick={() => setCutout(c.id, count + 1)}>+</button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function QuotePanel({ quote, minimumJob, plan }: { quote: Quote; minimumJob: number; plan: SlabPlan }) {
  if (quote.errors.length) {
    return <p className="muted">Fix the drawing to see a price.</p>;
  }
  return (
    <>
      <table className="quote">
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.label}>
              <td>
                <Term id={line.term}>{line.label}</Term>
                <div className="hint">{describe(line.quantity, line.unit, line.unitPrice)}</div>
              </td>
              <td className="amount">{line.amount === 0 && line.unit !== 'each' ? 'Included' : formatMoney(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="amount total">{formatMoney(quote.total)}</td>
          </tr>
        </tfoot>
      </table>
      {quote.minimumApplied && (
        <p className="hint">Below the {wholeMoney.format(minimumJob)} <Term id="minimumJob">minimum job charge</Term>, so the minimum applies.</p>
      )}
      <p className="hint"><Term id="installed">Installed price</Term>, before tax. Prices are ballpark defaults.</p>
      {plan.slabs > 0 && (
        <div className="quote-slabs">
          <strong>Stone needed:</strong> {plan.slabs} <Term id="slab">{plan.slabs === 1 ? 'slab' : 'slabs'}</Term>,{' '}
          <Term id="seam">{seamText(plan.seams.length)}</Term>
          <div className="hint"><Term id="yield">{plan.yieldPercent}% of the stone</Term> bought ends up in the counter.</div>
          {plan.yieldPercent < 50 && (
            <div className="hint warning">
              More than half of the stone is left over. Check the price covers it, or quote by the slab.
            </div>
          )}
        </div>
      )}
    </>
  );
}

function describe(quantity: number, unit: string, unitPrice: number): string {
  const amount = unit === 'each' ? `${quantity}` : `${quantity.toFixed(2)} ${unit}`;
  return `${amount} × ${formatMoney(unitPrice)}`;
}

import { useId } from 'react';
import type { CutoutId, PriceList } from '../counter/priceList';
import type { Quote, QuoteOptions } from '../counter/quote';
import type { SlabPlan } from '../counter/slabs';
import { seamText } from './SlabLayout';

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
  const material = prices.materials.find((m) => m.id === options.materialId) ?? prices.materials[0];
  const set = (changes: Partial<QuoteOptions>) => onChange({ ...options, ...changes });
  const setCutout = (cutoutId: CutoutId, count: number) =>
    set({ cutouts: { ...options.cutouts, [cutoutId]: Math.max(0, Math.min(9, count)) } });

  return (
    <div className="options">
      <div className="field">
        <label htmlFor={`${id}-material`}>Material</label>
        <select
          id={`${id}-material`}
          value={material.id}
          onChange={(e) => {
            const next = prices.materials.find((m) => m.id === e.target.value)!;
            set({ materialId: next.id, level: Math.min(options.level, next.pricePerSqFtByLevel.length) });
          }}
        >
          {prices.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-level`}>Level</label>
        <select id={`${id}-level`} value={options.level} onChange={(e) => set({ level: Number(e.target.value) })}>
          {material.pricePerSqFtByLevel.map((price, i) => (
            <option key={i} value={i + 1}>Level {i + 1} · {wholeMoney.format(price)}/sq ft</option>
          ))}
        </select>
      </div>
      <div className="field field-wide">
        <label htmlFor={`${id}-edge`}>Edge profile <span className="hint">on finished edges</span></label>
        <select id={`${id}-edge`} value={options.edgeProfileId} onChange={(e) => set({ edgeProfileId: e.target.value })}>
          {prices.edgeProfiles.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.pricePerLinearFoot ? `${wholeMoney.format(e.pricePerLinearFoot)}/lin ft` : 'included'}
            </option>
          ))}
        </select>
      </div>

      <div className="field-wide">
        <span className="field-label">Cutouts</span>
        <ul className="cutouts">
          {prices.cutouts.map((c) => {
            const count = options.cutouts[c.id] ?? 0;
            return (
              <li key={c.id}>
                <span>
                  {c.name}
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
                {line.label}
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
        <p className="hint">Below the {wholeMoney.format(minimumJob)} minimum job charge, so the minimum applies.</p>
      )}
      <p className="hint">Installed price, before tax. Prices are ballpark defaults.</p>
      {plan.slabs > 0 && (
        <div className="quote-slabs">
          <strong>Stone needed:</strong> {plan.slabs} {plan.slabs === 1 ? 'slab' : 'slabs'}, {seamText(plan.seams.length)}
          <div className="hint">{plan.yieldPercent}% of the stone bought ends up in the counter.</div>
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

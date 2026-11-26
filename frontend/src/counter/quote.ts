import type { CutoutId, PriceList } from './priceList';
import { type Counter, measure, round2, validateCounter } from './shapes';

export interface QuoteOptions {
  materialId: string;
  /** 1-based, matching how shops talk about levels. */
  level: number;
  edgeProfileId: string;
  cutouts: Partial<Record<CutoutId, number>>;
}

export type Unit = 'sq ft' | 'lin ft' | 'each';

export interface QuoteLine {
  label: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  areaSqFt: number;
  finishedEdgeFt: number;
  backsplashFt: number;
  subtotal: number;
  minimumApplied: boolean;
  total: number;
  /** When not empty, the shape is impossible and there is no price. */
  errors: string[];
}

/**
 * Prices a counter. Quantities are rounded to 2 decimals before multiplying and every amount to cents,
 * so the lines on the quote add up exactly to the total the customer sees.
 */
export function quote(counter: Counter, options: QuoteOptions, prices: PriceList): Quote {
  const errors = validateCounter(counter);
  const material = prices.materials.find((m) => m.id === options.materialId);
  const edgeProfile = prices.edgeProfiles.find((e) => e.id === options.edgeProfileId);
  const materialPrice = material?.pricePerSqFtByLevel[options.level - 1];
  if (!material) errors.push(`Unknown material "${options.materialId}".`);
  else if (materialPrice === undefined) errors.push(`${material.name} has no level ${options.level}.`);
  if (!edgeProfile) errors.push(`Unknown edge profile "${options.edgeProfileId}".`);
  if (errors.length || !material || !edgeProfile || materialPrice === undefined) {
    return { lines: [], areaSqFt: 0, finishedEdgeFt: 0, backsplashFt: 0, subtotal: 0, minimumApplied: false, total: 0, errors };
  }

  const { areaSqFt, finishedEdgeFt, backsplashFt, radiusCorners } = measure(counter);

  const lines: QuoteLine[] = [
    line(`${material.name}, level ${options.level}`, areaSqFt, 'sq ft', materialPrice),
    line(`${edgeProfile.name} edge`, finishedEdgeFt, 'lin ft', edgeProfile.pricePerLinearFoot),
  ];
  for (const cutout of prices.cutouts) {
    const count = options.cutouts[cutout.id] ?? 0;
    if (count > 0) lines.push(line(cutout.name, count, 'each', cutout.price));
  }
  if (radiusCorners > 0) lines.push(line('Radius corner', radiusCorners, 'each', prices.radiusCornerEach));
  if (backsplashFt > 0) lines.push(line('Backsplash', backsplashFt, 'lin ft', prices.backsplashPerLinearFoot));

  const subtotal = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const minimumApplied = subtotal < prices.minimumJob;
  if (minimumApplied) {
    const topUp = round2(prices.minimumJob - subtotal);
    lines.push({ label: 'Minimum job charge', quantity: 1, unit: 'each', unitPrice: topUp, amount: topUp });
  }
  const total = minimumApplied ? prices.minimumJob : subtotal;

  return { lines, areaSqFt, finishedEdgeFt, backsplashFt, subtotal, minimumApplied, total, errors: [] };
}

function line(label: string, quantity: number, unit: Unit, unitPrice: number): QuoteLine {
  return { label, quantity, unit, unitPrice, amount: round2(quantity * unitPrice) };
}

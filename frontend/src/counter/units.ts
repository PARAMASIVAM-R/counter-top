// Sizes are inches everywhere. Shops write them to the nearest 1/8", e.g. 25 1/2 or 10' 6".

const EIGHTHS = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];
const TYPED_EIGHTHS = ['', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'];

function splitEighths(inches: number): [number, number] {
  const eighths = Math.round(inches * 8);
  return [Math.floor(eighths / 8), eighths % 8];
}

/** 94.5 → 94½" */
export function formatInches(inches: number): string {
  const [whole, eighths] = splitEighths(inches);
  return `${whole}${EIGHTHS[eighths]}"`;
}

/** 126.5 → 10' 6½" */
export function formatFeetInches(inches: number): string {
  const [whole, eighths] = splitEighths(inches);
  const feet = Math.floor(whole / 12);
  const rest = `${whole % 12}${EIGHTHS[eighths]}"`;
  return feet ? `${feet}' ${rest}` : rest;
}

/** 25.5 → "25 1/2": the form people type, so an input can show it back. */
export function formatTypedInches(inches: number): string {
  const [whole, eighths] = splitEighths(inches);
  return eighths ? `${whole} ${TYPED_EIGHTHS[eighths]}` : `${whole}`;
}

const UNICODE_FRACTIONS: Record<string, string> = { '⅛': '1/8', '¼': '1/4', '⅜': '3/8', '½': '1/2', '⅝': '5/8', '¾': '3/4', '⅞': '7/8' };
const INCHES = /^(?:(\d+(?:\.\d+)?)(?:[\s-]+(\d+)\/(\d+))?|(\d+)\/(\d+))$/;

/**
 * Reads what someone types: 120, 120.5, 25 1/2, 25-1/2, 25½, 10', 10' 6", 10ft 6in.
 * Returns inches, or null if it can't be read.
 */
export function parseInches(text: string): number | null {
  let s = text.trim().toLowerCase();
  for (const [glyph, typed] of Object.entries(UNICODE_FRACTIONS)) s = s.replaceAll(glyph, ` ${typed}`);
  s = s
    .replace(/(feet|foot|ft|′|’)/g, "'")
    .replace(/(inches|inch|in|″|”|'')/g, '"')
    .trim();

  let feet = 0;
  const feetMatch = s.match(/^(\d+(?:\.\d+)?)\s*'\s*(.*)$/);
  if (feetMatch) {
    feet = Number(feetMatch[1]);
    s = feetMatch[2];
  }
  s = s.replace(/"$/, '').trim();
  if (s === '') return feetMatch ? feet * 12 : null;

  const m = s.match(INCHES);
  if (!m) return null;
  const [, whole, num, den, onlyNum, onlyDen] = m;
  const fraction = (n?: string, d?: string) => (n && d ? Number(n) / Number(d) : 0);
  if ((den && Number(den) === 0) || (onlyDen && Number(onlyDen) === 0)) return null;
  const inches = whole !== undefined ? Number(whole) + fraction(num, den) : fraction(onlyNum, onlyDen);
  return feet * 12 + inches;
}

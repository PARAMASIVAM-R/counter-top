import { describe, expect, it } from 'vitest';
import { formatFeetInches, formatInches, formatTypedInches, parseInches } from './units';

describe('parseInches', () => {
  it.each([
    ['120', 120],
    ['120.5', 120.5],
    ['25 1/2', 25.5],
    ['25-1/2', 25.5],
    ['25½', 25.5],
    ['25 ½"', 25.5],
    ['3/4', 0.75],
    ['10\'', 120],
    ['10\' 6"', 126],
    ['10\'6 1/2"', 126.5],
    ['10ft 6in', 126],
    ['  96 in ', 96],
  ])('%s → %d', (text, inches) => {
    expect(parseInches(text)).toBe(inches);
  });

  it.each(['', 'abc', '25 1/0', '1/2/3', '10\' abc', '-5'])('rejects %j', (text) => {
    expect(parseInches(text)).toBeNull();
  });
});

describe('formatting', () => {
  it('inches with fractions to the nearest 1/8', () => {
    expect(formatInches(94.5)).toBe('94½"');
    expect(formatInches(25.374)).toBe('25⅜"');
    expect(formatInches(23.99)).toBe('24"');
  });

  it('feet and inches', () => {
    expect(formatFeetInches(120)).toBe('10\' 0"');
    expect(formatFeetInches(126.5)).toBe('10\' 6½"');
    expect(formatFeetInches(25.5)).toBe('2\' 1½"');
    expect(formatFeetInches(9)).toBe('9"');
  });

  it('the typed form reads back to the same value', () => {
    for (const inches of [120, 25.5, 70.125, 33.75]) expect(parseInches(formatTypedInches(inches))).toBe(inches);
  });
});

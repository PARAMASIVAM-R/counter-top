import { describe, expect, it } from 'vitest';
import { createCounter, isUntouched, switchShape } from './shapes';

describe('switching shape', () => {
  it('keeps the depth that was typed', () => {
    const straight = createCounter('straight');
    straight.legs[0].depth = 22;
    expect(switchShape(straight, 'U').legs.map((l) => l.depth)).toEqual([22, 22, 22]);
  });

  it('keeps each leg\'s own depth where the new shape has the same leg', () => {
    const l = createCounter('L');
    l.legs = [{ length: 96, depth: 25.5 }, { length: 120, depth: 30 }];
    expect(switchShape(l, 'U').legs.map((leg) => leg.depth)).toEqual([25.5, 30, 25.5]);
  });

  it('a preset with only its depth changed has nothing to lose', () => {
    const c = createCounter('L');
    c.legs[0].depth = 24;
    expect(isUntouched(c)).toBe(true);
  });

  it.each([
    ['a length', (c: ReturnType<typeof createCounter>) => { c.legs[1].length = 110; }],
    ['an edge', (c: ReturnType<typeof createCounter>) => { c.edges[0] = 'backsplash'; }],
    ['a corner', (c: ReturnType<typeof createCounter>) => { c.corners[2] = 'radius'; }],
  ])('changing %s is work that switching would lose', (_, change) => {
    const c = createCounter('L');
    change(c);
    expect(isUntouched(c)).toBe(false);
  });
});

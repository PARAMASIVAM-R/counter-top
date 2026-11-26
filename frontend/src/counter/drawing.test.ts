import { describe, expect, it } from 'vitest';
import { defaultDrawing, materialIdFor, parseDrawing, serializeDrawing } from './drawing';
import { createCounter } from './shapes';

describe('saved drawings', () => {
  it('round-trips', () => {
    const drawing = defaultDrawing('Quartz');
    drawing.counter = createCounter('U');
    drawing.counter.edges[0] = 'backsplash';
    drawing.options = { materialId: 'quartz', level: 2, edgeProfileId: 'ogee', cutouts: { undermountSink: 1 } };
    expect(parseDrawing(serializeDrawing(drawing), 'Quartz')).toEqual(drawing);
  });

  it('a job that was never quoted starts as an L in its material', () => {
    const drawing = parseDrawing('', 'Marble');
    expect(drawing.counter.kind).toBe('L');
    expect(drawing.options.materialId).toBe('marble');
  });

  it.each([
    ['not JSON', '{oops'],
    ['wrong version', JSON.stringify({ ...defaultDrawing('Granite'), version: 2 })],
    ['edges do not match the shape', JSON.stringify({ ...defaultDrawing('Granite'), counter: { ...createCounter('L'), edges: ['wall'] } })],
    ['negative size', JSON.stringify({ ...defaultDrawing('Granite'), counter: { ...createCounter('straight'), legs: [{ length: -1, depth: 25.5 }] } })],
    ['unknown cutout', JSON.stringify({ ...defaultDrawing('Granite'), options: { ...defaultDrawing('Granite').options, cutouts: { hotTub: 1 } } })],
  ])('falls back to the default when the record has %s', (_, json) => {
    expect(parseDrawing(json, 'Granite')).toEqual(defaultDrawing('Granite'));
  });

  it('matches material names from the job, ignoring case', () => {
    expect(materialIdFor('quartz ')).toBe('quartz');
    expect(materialIdFor('Soapstone')).toBe('granite'); // not on the price list: first material
  });
});

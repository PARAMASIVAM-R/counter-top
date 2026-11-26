// Draws a stone surface for a colour: speckled granite, veined marble, or plain quartz.
// One image is used everywhere (plan, slabs, colour swatches, 3D), so the stone looks the same in each.
// It is generated, not photographed: the same colour always draws the same pattern.

import type { StoneColor } from '../counter/priceList';

/** The image covers this many inches of stone. */
export const TEXTURE_INCHES = 144;
const SIZE = 1024;

export interface StoneTexture {
  canvas: HTMLCanvasElement;
  url: string;
}

const cache = new Map<string, StoneTexture>();

export function stoneTexture(color: StoneColor): StoneTexture {
  const cached = cache.get(color.id);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const random = seeded(color.id);
  const pick = () => color.accents[Math.floor(random() * color.accents.length)];

  ctx.fillStyle = color.base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Soft clouds of lighter and darker stone
  for (let i = 0; i < 60; i++) {
    const x = random() * SIZE;
    const y = random() * SIZE;
    const r = 60 + random() * 220;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  if (color.look === 'speckle') {
    // Granite: mineral grains of a few colours, mostly small, some larger crystals
    // At 7 px per inch, grains are about ⅛" to ½" across
    for (let i = 0; i < 26000; i++) {
      const big = random() > 0.92;
      const rx = big ? 1.4 + random() * 2.2 : 0.45 + random() * 1.1;
      ctx.globalAlpha = 0.35 + random() * 0.6;
      ctx.fillStyle = pick();
      ctx.beginPath();
      ctx.ellipse(random() * SIZE, random() * SIZE, rx, rx * (0.5 + random() * 0.5), random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (color.look === 'veins') {
    // Marble: long wandering veins, soft and blurred, with thin sharp lines through them and fainter branches
    for (let v = 0; v < 9; v++) {
      const main = v < 4;
      const path = vein(random, main ? 70 : 30);
      ctx.strokeStyle = main ? color.accents[0] : pick();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.filter = 'blur(2px)';
      ctx.globalAlpha = main ? 0.35 : 0.2;
      ctx.lineWidth = main ? 6 + random() * 6 : 3;
      ctx.stroke(path);
      ctx.filter = 'none';
      ctx.globalAlpha = main ? 0.65 : 0.35;
      ctx.lineWidth = main ? 1.2 : 0.7;
      ctx.stroke(path);
    }
  } else {
    // Plain quartz: a faint fine grain so it doesn't look like plastic
    for (let i = 0; i < 6000; i++) {
      ctx.globalAlpha = 0.08 + random() * 0.1;
      ctx.fillStyle = pick();
      ctx.fillRect(random() * SIZE, random() * SIZE, 1.2, 1.2);
    }
  }
  ctx.globalAlpha = 1;

  const texture = { canvas, url: canvas.toDataURL('image/jpeg', 0.88) };
  cache.set(color.id, texture);
  return texture;
}

/** A vein: starts off one side and wanders across, turning a little at each step. */
function vein(random: () => number, steps: number): Path2D {
  const path = new Path2D();
  let x = random() * SIZE;
  let y = random() * SIZE;
  let angle = random() * Math.PI * 2;
  path.moveTo(x, y);
  for (let i = 0; i < steps; i++) {
    angle += (random() - 0.5) * 0.6;
    x += Math.cos(angle) * 22;
    y += Math.sin(angle) * 22;
    path.lineTo(x, y);
  }
  return path;
}

/** Repeatable random numbers from a text seed (mulberry32). */
function seeded(text: string): () => number {
  let seed = 0;
  for (const ch of text) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

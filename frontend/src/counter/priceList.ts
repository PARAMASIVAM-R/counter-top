// Default prices. Ballpark US figures from consumer cost guides (see ROADMAP.md and ANSWERS.md);
// a real shop would set its own. Material prices are installed prices: stone, fabrication and installation.

export type CutoutId = 'undermountSink' | 'dropInSink' | 'cooktop' | 'faucetHole';

/** A stone a customer picks. Its level (price group) comes with it: common stones are level 1, rare ones level 3. */
export interface StoneColor {
  id: string;
  name: string;
  level: number;
  /** How the stone looks: speckled (granite), veined (marble and marble-look quartz) or plain. */
  look: 'speckle' | 'veins' | 'solid';
  base: string;
  accents: string[];
}

export interface Material {
  id: string;
  name: string;
  /** Price per sq ft for each level (group). Index 0 is level 1, the cheapest stones. */
  pricePerSqFtByLevel: number[];
  /** Typical slab size in inches. Real slabs vary by quarry and brand. */
  slab: { length: number; width: number };
  colors: StoneColor[];
}

export interface EdgeProfile {
  id: string;
  name: string;
  pricePerLinearFoot: number;
}

export interface Cutout {
  id: CutoutId;
  name: string;
  price: number;
}

export interface PriceList {
  materials: Material[];
  edgeProfiles: EdgeProfile[];
  cutouts: Cutout[];
  radiusCornerEach: number;
  backsplashPerLinearFoot: number;
  minimumJob: number;
}

/** The colour chosen on a quote, or for older quotes without one, the first colour at its level. */
export function colorFor(material: Material, colorId: string | undefined, level: number): StoneColor {
  return (
    material.colors.find((c) => c.id === colorId) ??
    material.colors.find((c) => c.level === level) ??
    material.colors[0]
  );
}

export const DEFAULT_PRICE_LIST: PriceList = {
  materials: [
    // Prices: sources give $50–130 (granite) and $50–200 (quartz) per sq ft installed.
    // Slabs: natural stone is about 9–10' × 5–6'; standard quartz is about 10' × 4'8" (jumbo is larger).
    // Colours: well-known stone names; their levels are typical, a real shop sets its own.
    {
      id: 'granite',
      name: 'Granite',
      pricePerSqFtByLevel: [55, 75, 95],
      slab: { length: 114, width: 66 },
      colors: [
        { id: 'luna-pearl', name: 'Luna Pearl', level: 1, look: 'speckle', base: '#bdbab4', accents: ['#2f2f31', '#ece9e4', '#7d7a76'] },
        { id: 'uba-tuba', name: 'Uba Tuba', level: 1, look: 'speckle', base: '#262a22', accents: ['#7a6a35', '#0f120e', '#4b5a3c'] },
        { id: 'santa-cecilia', name: 'Santa Cecilia', level: 2, look: 'speckle', base: '#c4a273', accents: ['#5a2f24', '#e6d3ad', '#2c2420', '#8c6a44'] },
        { id: 'absolute-black', name: 'Absolute Black', level: 3, look: 'solid', base: '#1b1b1d', accents: ['#2c2c30'] },
      ],
    },
    {
      id: 'quartz',
      name: 'Quartz',
      pricePerSqFtByLevel: [70, 90, 120],
      slab: { length: 120, width: 56 },
      colors: [
        { id: 'pure-white', name: 'Pure White', level: 1, look: 'solid', base: '#f1efea', accents: ['#d9d6cf'] },
        { id: 'concrete-grey', name: 'Concrete Grey', level: 1, look: 'speckle', base: '#9c9b97', accents: ['#7f7e7a', '#b9b8b3', '#5c5b58'] },
        { id: 'carrara-look', name: 'Carrara Look', level: 2, look: 'veins', base: '#eeede9', accents: ['#8f9398', '#b9bcc0'] },
        { id: 'calacatta-look', name: 'Calacatta Look', level: 3, look: 'veins', base: '#f6f4ef', accents: ['#6f6e6c', '#b49a6a'] },
      ],
    },
    {
      id: 'marble',
      name: 'Marble',
      pricePerSqFtByLevel: [90, 120, 150],
      slab: { length: 108, width: 64 },
      colors: [
        { id: 'carrara', name: 'Carrara', level: 1, look: 'veins', base: '#e7e6e2', accents: ['#8e9297', '#b8bbbf'] },
        { id: 'nero-marquina', name: 'Nero Marquina', level: 2, look: 'veins', base: '#1e1e20', accents: ['#e9e7e2', '#9a9894'] },
        { id: 'calacatta-gold', name: 'Calacatta Gold', level: 3, look: 'veins', base: '#f5f2ea', accents: ['#7a6f5e', '#c2a66b'] },
      ],
    },
  ],
  edgeProfiles: [
    { id: 'eased', name: 'Eased', pricePerLinearFoot: 0 }, // usually included
    { id: 'bevel', name: 'Bevel', pricePerLinearFoot: 5 }, // $2–6
    { id: 'halfBullnose', name: 'Half bullnose', pricePerLinearFoot: 8 }, // $2–8
    { id: 'fullBullnose', name: 'Full bullnose', pricePerLinearFoot: 12 }, // $6–12
    { id: 'ogee', name: 'Ogee', pricePerLinearFoot: 20 }, // $10–30
  ],
  cutouts: [
    { id: 'undermountSink', name: 'Undermount sink cutout', price: 250 }, // $200–400, edges polished
    { id: 'dropInSink', name: 'Drop-in sink cutout', price: 150 }, // $100–200
    { id: 'cooktop', name: 'Cooktop cutout', price: 150 },
    { id: 'faucetHole', name: 'Faucet hole', price: 25 }, // $20–125 for small cutouts
  ],
  radiusCornerEach: 50, // assumption: no published figure found
  backsplashPerLinearFoot: 25, // assumption: 4" splash in the same stone
  minimumJob: 750, // assumption: shops have a minimum, figure not published
};

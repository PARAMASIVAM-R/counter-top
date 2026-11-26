// Default prices. Ballpark US figures from consumer cost guides (see ROADMAP.md and ANSWERS.md);
// a real shop would set its own. Material prices are installed prices: stone, fabrication and installation.

export type CutoutId = 'undermountSink' | 'dropInSink' | 'cooktop' | 'faucetHole';

export interface Material {
  id: string;
  name: string;
  /** Price per sq ft for each level (group). Index 0 is level 1, the cheapest stones. */
  pricePerSqFtByLevel: number[];
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

export const DEFAULT_PRICE_LIST: PriceList = {
  materials: [
    { id: 'granite', name: 'Granite', pricePerSqFtByLevel: [55, 75, 95] }, // sources: $50–130 installed
    { id: 'quartz', name: 'Quartz', pricePerSqFtByLevel: [70, 90, 120] }, // sources: $50–200 installed
    { id: 'marble', name: 'Marble', pricePerSqFtByLevel: [90, 120, 150] },
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

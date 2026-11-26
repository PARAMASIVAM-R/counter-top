import type { ReactNode } from 'react';

// Plain-words meanings for the trade terms on screen, for shop staff who are new and for customers.

export interface GlossaryEntry {
  title: string;
  text: string;
  picture?: ReactNode;
}

/** Side view of a slab's edge: stone on the left, the shaped edge on the right. */
function EdgeSection({ d, label }: { d: string; label: string }) {
  return (
    <svg viewBox="-4 0 64 26" className="help-picture" role="img" aria-label={label}>
      <path d={d} className="help-stone" />
    </svg>
  );
}

function SinkSection({ under }: { under: boolean }) {
  return (
    <svg viewBox="0 0 120 50" className="help-picture" role="img" aria-label={under ? 'Sink fixed under the stone' : 'Sink rim resting on the stone'}>
      <rect x="2" y="12" width="38" height="8" className="help-stone" />
      <rect x="80" y="12" width="38" height="8" className="help-stone" />
      {under ? (
        <path d="M36 21 H84 V44 Q84 48 80 48 H40 Q36 48 36 44 Z" className="help-sink" />
      ) : (
        <path d="M30 10 H90 V12 H84 V44 Q84 48 80 48 H40 Q36 48 36 44 V12 H30 Z" className="help-sink" />
      )}
    </svg>
  );
}

function CornerPicture({ round }: { round: boolean }) {
  return (
    <svg viewBox="0 0 60 40" className="help-picture" role="img" aria-label={round ? 'Rounded corner' : 'Sharp corner'}>
      <path d={round ? 'M4 4 H44 Q56 4 56 16 V36 H4 Z' : 'M4 4 H56 V36 H4 Z'} className="help-stone" />
    </svg>
  );
}

function BacksplashPicture() {
  return (
    <svg viewBox="0 0 80 50" className="help-picture" role="img" aria-label="Side view: backsplash standing on the counter against the wall">
      <rect x="2" y="2" width="6" height="46" className="help-wall" />
      <rect x="8" y="18" width="5" height="14" className="help-stone" />
      <rect x="8" y="32" width="68" height="6" className="help-stone" />
    </svg>
  );
}

function SeamPicture() {
  return (
    <svg viewBox="0 0 120 30" className="help-picture" role="img" aria-label="Two pieces of stone joined at a seam">
      <rect x="2" y="6" width="57" height="18" className="help-stone" />
      <rect x="61" y="6" width="57" height="18" className="help-stone" />
      <line x1="60" y1="4" x2="60" y2="26" className="help-seam" />
    </svg>
  );
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // Edges
  finished: {
    title: 'Finished edge',
    text: 'An edge you can see and touch, at the front or an open end. It is polished and shaped, so it is charged per foot.',
  },
  wall: {
    title: 'Against the wall',
    text: 'The side pushed up to a wall (or a fridge). Nobody sees it, so it is left plain and there is no edge charge.',
  },
  backsplash: {
    title: 'Backsplash',
    text: 'A short strip of the same stone, about 4 inches tall, standing on the counter against the wall. It keeps water and food off the wall.',
    picture: <BacksplashPicture />,
  },
  squareCorner: {
    title: 'Square corner',
    text: 'A normal sharp 90° corner. No extra charge. Click a corner dot to make it rounded.',
    picture: <CornerPicture round={false} />,
  },
  radiusCorner: {
    title: 'Radius corner',
    text: 'A rounded corner instead of a sharp one. Kinder to hips and children. It costs extra because it is shaped by hand. Only corners that stick out into the room can be rounded.',
    picture: <CornerPicture round />,
  },

  // Sizes
  run: {
    title: 'Run',
    text: 'One straight section of counter along a wall. An L-shape has two runs, a U-shape three.',
  },
  length: {
    title: 'Length',
    text: 'How long a run is, measured along the wall right into the corner, in inches. You can type 120, 10\' or 10\' 6".',
  },
  depth: {
    title: 'Depth',
    text: 'From the wall to the front edge. Most kitchens are 25½": a 24" cabinet plus 1½" of stone hanging over the front.',
  },
  sqft: {
    title: 'Square feet (sq ft)',
    text: 'The area of the counter top. Stone is priced by it. 12 × 12 inches is one square foot.',
  },
  linft: {
    title: 'Linear feet (lin ft)',
    text: 'Length measured along a line, in feet. Used for edges and backsplash, which are long and thin.',
  },

  // Stone
  material: {
    title: 'Material',
    text: 'The kind of stone. Granite and marble come out of the ground; quartz is made in a factory from crushed stone and resin.',
  },
  granite: {
    title: 'Granite',
    text: 'Natural stone with a speckled look. Very hard, handles heat well, needs sealing now and then.',
  },
  quartz: {
    title: 'Quartz',
    text: 'Man-made stone: crushed quartz bound with resin. Even colour, no sealing needed, but hot pans can mark it.',
  },
  marble: {
    title: 'Marble',
    text: 'Natural stone with soft veins. Beautiful but softer: it scratches and stains more easily than granite or quartz.',
  },
  stoneColor: {
    title: 'Stone colour',
    text: 'The exact stone the customer chooses. Each one belongs to a price level: common stones cost less, rare or popular ones more.',
  },
  level: {
    title: 'Level (price group)',
    text: 'Shops group stones by price. Level 1 is the cheapest, common stones; level 3 the rarest. Picking a colour sets its level.',
  },
  slab: {
    title: 'Slab',
    text: 'The big flat sheet of stone the shop buys, about 9–10 feet long and 5 feet wide. Your counter pieces are cut out of it. Shops must buy whole slabs.',
  },
  seam: {
    title: 'Seam',
    text: 'Where two pieces of stone are glued together. Needed when a counter is longer than a slab or turns a corner. Seams are thin, but shops try to keep them few and out of sight.',
    picture: <SeamPicture />,
  },
  yield: {
    title: 'Stone used',
    text: 'How much of the stone bought ends up in the counter. The rest is offcuts. A low number means the shop pays for stone it can\'t use.',
  },

  // Edge profiles
  edgeProfile: {
    title: 'Edge profile',
    text: 'The shape the front edge is cut and polished into. Fancier shapes take more work, so they cost more per foot.',
  },
  eased: {
    title: 'Eased edge',
    text: 'A square edge with the sharpness just taken off. Simple and modern. Usually included in the price.',
    picture: <EdgeSection label="Eased edge, square with softened corners" d="M0 6 H48 Q50 6 50 8 V18 Q50 20 48 20 H0 Z" />,
  },
  bevel: {
    title: 'Bevel edge',
    text: 'The top corner is cut off at an angle, like a small slope. Clean and easy to wipe.',
    picture: <EdgeSection label="Bevel edge, top corner cut at an angle" d="M0 6 H44 L50 12 V20 H0 Z" />,
  },
  halfBullnose: {
    title: 'Half bullnose edge',
    text: 'The top of the edge is rounded over, the bottom stays square. Soft to lean on, good for families.',
    picture: <EdgeSection label="Half bullnose, rounded top" d="M0 6 H42 A8 8 0 0 1 50 14 V20 H0 Z" />,
  },
  fullBullnose: {
    title: 'Full bullnose edge',
    text: 'The whole edge is rounded, top and bottom, like the end of a bull\'s nose. A classic look.',
    picture: <EdgeSection label="Full bullnose, fully rounded" d="M0 6 H43 A7 7 0 0 1 43 20 H0 Z" />,
  },
  ogee: {
    title: 'Ogee edge',
    text: 'A decorative S-shaped curve. A traditional, fancy look that takes the most work, so it costs the most.',
    picture: <EdgeSection label="Ogee edge, S-shaped curve" d="M0 6 H38 C46 6 43 14 50 14 V20 H0 Z" />,
  },

  // Cutouts
  cutouts: {
    title: 'Cutouts',
    text: 'Holes cut in the stone for a sink, a cooktop or a tap. Each one is cut and finished by hand, so each is charged.',
  },
  undermountSink: {
    title: 'Undermount sink',
    text: 'The sink is fixed under the stone, so the edge of the hole shows and must be polished. Easy to wipe crumbs straight in. Costs more than drop-in.',
    picture: <SinkSection under />,
  },
  dropInSink: {
    title: 'Drop-in sink',
    text: 'The sink has a rim that rests on top of the stone and hides the cut edge, so the hole needs no polishing. Cheaper.',
    picture: <SinkSection under={false} />,
  },
  cooktop: {
    title: 'Cooktop cutout',
    text: 'A hole for a stove top that sits into the counter.',
  },
  faucetHole: {
    title: 'Faucet hole',
    text: 'A small round hole drilled for a tap, soap pump or water filter.',
  },

  // Price
  minimumJob: {
    title: 'Minimum job charge',
    text: 'Every job costs the shop a visit to measure, a slab, and a trip to install. Very small jobs are charged at least this amount.',
  },
  installed: {
    title: 'Installed price',
    text: 'Includes the stone, cutting and shaping it, and fitting it in the home.',
  },
};

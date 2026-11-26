import { useMemo } from 'react';
import type { StoneColor } from '../counter/priceList';
import { stoneTexture, TEXTURE_INCHES } from '../stone/texture';

/** An SVG fill of the stone, to scale in inches. Use as fill="url(#id)" inside an SVG measured in inches. */
export function StonePattern({ id, color }: { id: string; color: StoneColor }) {
  const url = useMemo(() => stoneTexture(color).url, [color]);
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={TEXTURE_INCHES} height={TEXTURE_INCHES}>
      <image href={url} width={TEXTURE_INCHES} height={TEXTURE_INCHES} preserveAspectRatio="none" />
    </pattern>
  );
}

/** A small square sample of the stone, for picking a colour. */
export function StoneSwatch({ color }: { color: StoneColor }) {
  const url = useMemo(() => stoneTexture(color).url, [color]);
  return <span className="swatch-stone" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />;
}

export const isTabletPortrait = () => matchMedia('(min-width:701px) and (max-width:1100px) and (orientation:portrait)').matches;

// Hero-only camera: keep the responsive behavior of the other sections intact.
// References are authored in logo_horizontal.svg and logo_vertical.svg.
export function getHeroFrame(width: number, height: number) {
  const portrait = height > width;
  const mode = portrait ? 'portrait' : width / height >= 1.55 ? 'landscape-width' : 'landscape-height';
  const masterWidth = portrait ? 2280.13 : 5132.9;
  const masterHeight = portrait ? 4152.38 : 2816.14;
  // Portrait fits the short-L reference frame, deliberately not the whole SVG.
  const scale = portrait ? Math.min(width / (2096.13 - 184), height / (3570.14 - 582.48))
    : mode === 'landscape-width' ? width / 5132.89 : height / 2816.14;
  // punt_top_v is missing in the export; (899.66, 0) is the approved approximation.
  const centerX = portrait ? (899.66 + 1380.47) / 2 : 5132.89 / 2;
  const centerY = portrait ? (0 + 4152.38) / 2 : 2816.14 / 2;
  const x = width / 2 - centerX * scale;
  const y = height / 2 - centerY * scale;
  return { portrait, mode, masterWidth, masterHeight, scale, x, y,
    focalX: x + (portrait ? 541.83 : 1130.78) * scale,
    focalY: y + (portrait ? 1466.065 : 851.8) * scale };
}

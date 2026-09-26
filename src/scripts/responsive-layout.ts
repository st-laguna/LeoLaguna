export const isTabletPortrait = () => matchMedia('(min-width:701px) and (max-width:1100px) and (orientation:portrait)').matches;

// Hero-only camera: keep the responsive behavior of the other sections intact.
// References are authored in logo_horizontal.svg and logo_vertical.svg.
export function getHeroFrame(width: number, height: number) {
  const portrait = height > width;
  const mode = portrait ? 'portrait' : width / height >= 1.55 ? 'landscape-width' : 'landscape-height';
  const masterWidth = portrait ? 2280.13 : 5132.9;
  const masterHeight = portrait ? 4152.38 : 3331.5;
  // Portrait uses line_left_v / line_right_v; landscape uses punt_left_h / punt_right_h.
  const left = portrait ? 184 : -43.1;
  const right = portrait ? 2096.13 : 5089.8;
  // line_top_h is y=0; use line_bot_h's y2 at the bottom edge of the artwork.
  const top = 0, bottom = 3331.5;
  // Width-driven frames intentionally allow vertical cropping.
  const scale = mode === 'landscape-height' ? height / (bottom - top) : width / (right - left);
  const centerX = (left + right) / 2;
  // Preserve portrait's vertical framing; landscape centers the current height references.
  const centerY = portrait ? 4152.38 / 2 : (top + bottom) / 2;
  const x = width / 2 - centerX * scale;
  const y = height / 2 - centerY * scale;
  return { portrait, mode, masterWidth, masterHeight, scale, x, y,
    focalX: x + (portrait ? 541.83 : 1130.78) * scale,
    focalY: y + (portrait ? 1466.065 : 851.8) * scale };
}

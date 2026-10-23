export const isTabletPortrait = () => document.documentElement.hasAttribute('data-tablet-portrait');
export const phoneMedia = '(max-width:700px), (max-width:1000px) and (max-height:500px)';
export const phonePortraitMedia = '(max-width:700px) and (orientation:portrait)';
export const isPhonePortrait = () => isPhoneViewport() && matchMedia(phonePortraitMedia).matches;
export const isPhoneViewport = () => !document.documentElement.hasAttribute('data-ipad') && !isTabletPortrait() && matchMedia(phoneMedia).matches;
// Hero-only camera: keep the responsive behavior of the other sections intact.
// References are authored in logo_horizontal.svg and logo_vertical.svg.
export function getHeroFrame(width: number, height: number) {
  const portrait = height > width;
  if (document.documentElement.hasAttribute('data-adaptive-hero')) {
    const masterWidth = portrait ? 390 : 844, masterHeight = portrait ? 844 : 390;
    const scale = portrait ? width / masterWidth : Math.max(width / masterWidth, height / masterHeight);
    const x = portrait ? 0 : width * (328.25 / 844) - 328.25 * scale;
    const y = height * (portrait ? 287.06 / 844 : 300.6 / 390) - (portrait ? 287.06 : 300.6) * scale;
    return {portrait,mode:portrait?'mobile-portrait':'mobile-landscape',masterWidth,masterHeight,scale,x,y,
      focalX:width*.52,focalY:height*.25};
  }
  const mode = portrait ? 'portrait' : width / height >= 1.55 ? 'landscape-width' : 'landscape-height';
  const masterWidth = portrait ? 2280.13 : 5132.9;
  const masterHeight = portrait ? 4152.38 : 3331.5;
  // Portrait retains its authored crop; landscape fits the actual SVG outer edges.
  const left = portrait ? 184 : 0;
  const right = portrait ? 2096.13 : masterWidth;
  // line_top_h is y=0; use line_bot_h's y2 at the bottom edge of the artwork.
  const top = 0, bottom = 3331.5;
  // Width-driven frames intentionally allow vertical cropping.
  const scale = width / (right - left);
  const centerX = (left + right) / 2;
  // Preserve portrait's vertical framing; landscape centers the current height references.
  const centerY = portrait ? 4152.38 / 2 : (top + bottom) / 2;
  const x = width / 2 - centerX * scale;
  const y = height / 2 - centerY * scale;
  return { portrait, mode, masterWidth, masterHeight, scale, x, y,
    focalX: x + (portrait ? 541.83 : 1130.78) * scale,
    focalY: y + (portrait ? 1466.065 : 851.8) * scale };
}

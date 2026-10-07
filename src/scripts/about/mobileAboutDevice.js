// Shared with the pre-paint gate. Device identity covers large iPads in landscape.
export const mobileAboutMedia = '(max-width:700px), (max-width:1000px) and (max-height:500px), (min-width:701px) and (max-width:1400px) and (orientation:portrait), (pointer:coarse) and (max-width:1400px)';
export function isMobileAbout() {
  const root = document.documentElement;
  const ipad = root.hasAttribute('data-ipad') || /iPad/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.platform || navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ipad || root.hasAttribute('data-large-tablet-landscape') || matchMedia(mobileAboutMedia).matches;
}

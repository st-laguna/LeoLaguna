// Geometry fallback for tablet previews which expose a desktop UA/fine pointer.
// No width ceiling: real iPads always qualify by identity; tall landscape views
// use the same composition without reclassifying ordinary 16:9/16:10 laptops.
export const tabletLandscapeMedia = '(orientation:landscape) and (min-height:701px) and (max-aspect-ratio:3/2)';

// One geometry policy shared by pre-paint initialization and deferred modules.
// Pointer capabilities affect interaction, never the amount of available space.
export const phoneLayoutMedia = '(max-width:700px), (max-width:1000px) and (max-height:500px)';
export const tabletPortraitMedia = '(min-width:701px) and (orientation:portrait)';
export const tabletLandscapeMedia = '(orientation:landscape) and (min-width:701px) and (max-width:1000px) and (min-height:501px), (orientation:landscape) and (min-height:701px) and (max-aspect-ratio:3/2), (orientation:landscape) and (min-width:1001px) and (max-height:500px)';
export const compactLayoutMedia = phoneLayoutMedia + ', ' + tabletPortraitMedia + ', ' + tabletLandscapeMedia;

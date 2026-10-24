import {mobileJourneyMedia} from './responsive-layout';
export const compactServiceMedia=mobileJourneyMedia;
export const compactServices=()=>matchMedia(compactServiceMedia).matches;

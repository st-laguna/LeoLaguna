# Large tablet landscape pass

Scope: viewport >=1367px wide, >=701px high, landscape, with coarse-pointer capability or the existing iPad identity flag. Screen dimensions and DPR do not decide layout. Laptop, desktop without touch, portrait and phone profiles are excluded.

## Causes and changes

- Viewport: responsive-init deliberately cached 100svh and ignored height-only resize. Native-scroll also fixed sticky stage/closing heights to that cached value. Keep the stable outer scroll runways, but size visible stages, case media, Brands handoff and footer from the live visual viewport. Ignore pinch zoom; batch ScrollTrigger refresh after 220ms of settled height change. Gallery geometry now observes its own scroller rather than depending on a window-width change.
- Services: preserve the existing intermediate desktop 2-column/4-row thumbnail rule. No thumbnail layout overrides were added for this profile.
- Educational gallery: Chromium did NOT reproduce Safari's invisible-image rendering. At the reported handoff position, images were decoded (1920px), opacity 1, visibility visible and no clipping. Found competing ownership: CSS forced transform:none!important on transferred figures while their scrub tween retained transforms/layers. Removed that CSS override and clear the transferred figure's transform/promotion through GSAP on handoff. Reverse restores the original timeline-controlled row. This removes a real conflict, but does not establish the exact Safari compositor failure as confirmed.
- Horizontal touch: previously only vertical document scroll drove the master. A scoped intent gate now maps predominantly horizontal swipes to that same coordinate, with bounded momentum. Vertical swipes remain native; controls and active model gestures are excluded. No second animation timeline controls the rail.
- Gallery footer: any-pointer:coarse moved the center unit to its own full-width row, leaving the other groups lower. Large landscape explicitly retains three columns, centered in the same vertical band and with a 190px compact strip.
- Main footer/background: footer.ts treated every iPad as compact. That obsolete variant painted a dark outer surface under a separately revealing marquee. Large landscape now selects the canonical desktop strip and a stationary final-theme section background. Content/reveal animations remain in place; viewport/Brands overlap uses consistent current height. No seam overlay was added.
- Brands: complete composition is centered with a shared width/max-width and automatic equal side margins; internal columns remain together.
- About: editorial eligibility excluded all iPads and required a fine pointer. Large touch landscape now mounts the current editorial component; portrait/orientation changes remount the appropriate existing version. Typography/bands are scoped to this profile.
- CV: dark --button-coral referenced a token unavailable in the CV environment. The existing CTA now has a coral fallback in both themes, light text in dark mode and the project's arrow.svg mask instead of a Unicode arrow. The narrow CV color override is necessary because the existing shared CTA rule locks black with !important.
- Logo: shared journey logic could animate it away after its section; header CSS explicitly hid it during footer/contact state. The persistent mark now survives later sections on desktop and large landscape. Existing Contact-control retraction remains independent.

## Changed files

- src/scripts/responsive-init.js
- src/styles/large-tablet-landscape.css (new)
- src/scripts/large-tablet-viewport.ts (new)
- src/layouts/BaseLayout.astro
- src/pages/about.astro
- src/scripts/about/editorialAbout.js
- src/scripts/about/aboutController.js
- src/scripts/tablet-horizontal-gesture.ts (new)
- src/scripts/case-study.ts
- src/scripts/projects.ts
- src/scripts/footer.ts
- src/scripts/home-journey.ts
- src/styles/header-persistent.css
- src/scripts/service-sticky-grid.ts
- src/styles/service-sticky-grid.css
- src/components/cv/Sidebar.astro
- docs/large-tablet-landscape.md (this report)

## Verification

Edge/Chromium touch emulation at 1590x1060, DPR 2:
- Initial load and 2x4 Services grid; canonical complete footer selected.
- Height 1060 -> 1160 -> 1060: visible journey stage/footer follow each exact height.
- Educational gallery scroll .95 -> 1 -> .95 -> 1: same row coordinates restored; opacity 1 / visibility visible throughout; decoded images remain present.
- Tap transferred image opens lightbox; View All closes successfully.
- Gallery footer three group centers aligned in a 190px strip.
- Horizontal CDP finger gesture advances the existing case rail; vertical CDP gesture preserves native scroll.
- About mounts editorial in landscape and returns to portrait layout on rotation.
- Light/dark footer backgrounds match palette; Contact retracts while mark remains visible.
- Desktop 2560x1440 logo visible at Featured Works, Brands and Contact.
- CV dark CTA coral and light-text contrast verified; arrow uses SVG mask.
- Regression profile checks: laptop 1279x645 retains 3x3; desktop 2560x1440 retains desktop grid; tablet 1060x1590 stays portrait; phone 390x844 stays mobile. These are layout/state checks, not exhaustive device QA.
- npm run build and git diff --check pass. Existing >500KB chunk warning remains.

## Remaining validation

No real Safari/iPadOS or installed WebKit runtime is available here. Safari browser-chrome collapse, Safari-only repaint failure, physical-device momentum and appearance during continuous scrolling require on-device validation. Chromium touch emulation is not Safari. Do not treat the Safari invisible-image issue as conclusively reproduced/resolved from these tests alone.

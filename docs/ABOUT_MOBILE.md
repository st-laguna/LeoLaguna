# Mobile / iPad About

The `/about/` page selects `MobileAbout.astro` for phones and tablets. Desktop keeps its existing editorial UI and WebGL controller. `mobileAboutDevice.js` shares the exact device rule between the pre-paint gate and runtime; iPad identity keeps large iPads on the 2D experience in either orientation.

## Files and editable values

- `src/components/about/MobileAbout.astro`: head SVG, diagonal intro layout, hamburger navigation, stickers and one native dialog. No Laguna wordmark or language/theme controls appear in this English-only experience.
- `src/styles/about-mobile.css`: all composition and motion tuning. Overrides are gated by `html[data-about-mobile]`.
- `src/scripts/about/mobileAbout.ts`: anatomical/card state transitions, shared fracture geometry, assets, resizing and cleanup. Menu state is owned by the shared navigation controller.
- `src/components/NavigationMenu.astro`, `src/scripts/navigation-menu.ts` and `src/styles/navigation-menu.css`: the same menu component, logic and compact styling used by Home; see `docs/NAVIGATION_MENU.md`.
- `src/scripts/about/mobileAboutContent.ts`: sticker IDs, copy, image pairs and rotations.
- `scripts/optimize-about-stickers.mjs`: `node scripts/optimize-about-stickers.mjs` regenerates transparent, trimmed 640/960px stickers from the original assets.

Head framing was developed in the former `about-split-test.astro` prototype and integrated into `/about/`: portrait scale 2.8, Y -12%, crop 608/416; landscape scale 2, crop 608/620. Portrait upper/lower compensation is .414 of the base distance, added independently of each layer's travel. The original 1 / 1.10 / 1.10 / 1.10 layer multipliers and masks are preserved. Layers 1–4 use `mobile-a8` or `ipad-a8`; layer 5 is excluded.

`--portrait-gap` (.58) and `--landscape-gap` (.64) control the full central opening. The intro follows the supplied mockup: facts at top-left, right-aligned description at bottom-right, coral ampersand in the center. Intentional line breaks preserve the composition across sizes.

## Interaction

`closed → opening → intro → leaving-intro → stickers`.

The four layers open automatically as soon as About is ready, without a tap; its start delay is controlled by --split-start-delay. The card fades in only after the last layer completes. Tap the intro card or its tap-to-explore button to reveal the six stickers. The hint arrows continuously animate while visible, except with reduced motion. Each sticker opens the same dialog with its own copy/photo. Close with ×, Escape, or a backdrop tap. The hamburger uses the same full-screen 550ms top-to-bottom reveal as Home. It contains exactly Home, Service, Work and Contact. The Formal Stuff sits separately at the bottom and reuses the shared coral action-pill button and arrow styling. There is no Close Exploration menu entry. Empty artwork in the sticker state or Escape closes the head.

Automatic opening starts 500ms after About is ready. Opening uses 800ms with cubic-bezier(.5,0,.35,1); closing uses 660ms with cubic-bezier(.65,0,.35,1). Opening stagger is .30 (about 19% of eased travel); closing stagger remains .35 (about 17%). The background blends from #A8A8A8 to #1C1C1C starting with layer 4, using a static dark overlay's opacity. Closing restores gray. Taps during transitions are dropped, never queued. Closing settles each layer independently to prevent fractional-pixel seams.

Navigation into About uses the same cross-document snapshot transition as the other pages, with no theme-wipe overlays. A running mobile Hero/Service transition is cancelled when navigating to About instead of swallowing the link. The anatomical cascade begins immediately when the assets are ready. Menu links stay enabled through native activation; pagehide closes the menu, avoiding early inert/focusout races.

## Performance and lifecycle

- Mobile never mounts WebGL or preloads GLB models. Desktop never requests anatomical/sticker assets on initial load.
- Source-alpha gradient rims are static and subtle; no blur, drop-shadow filter, or per-frame JS.
- Motion uses transforms/opacity. ResizeObserver measures only stage size, without requestAnimationFrame loops.
- Stickers load after the head opens; photo images load on demand. Generated sticker variants total about 273KB at 640px or 470KB at 960px, excluding anatomy/photos.
- Reduced motion skips transitions and stagger. Rotation, hidden tabs, BFCache and Astro navigation settle or clean up timers, observers, listeners and dialogs.
- Existing preference controls remain inside the hidden, inert desktop subtree. They become available normally when returning to desktop; saved global preferences are preserved.

## Verified

Phone 390×844 / 844×390; iPad 768×1024 / 1024×768 / 1024×1366 / 1366×1024. Checked forward/reverse ordering, repeated taps, card fit, all six photo/copy pairs, asset requests and centered gap. Desktop 1440×900 and 1366×768 geometry/styles match the pre-change baseline and retain WebGL.

The isolated `about-split-test.astro` prototype was retired after integration into `/about/`; `/about-split-test/` is no longer generated. Real-device Safari remains useful for final visual judgment and touch feel.

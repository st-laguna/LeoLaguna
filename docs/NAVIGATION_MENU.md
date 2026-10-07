# Shared navigation menu

Home and mobile/iPad About render `src/components/NavigationMenu.astro`. Both use `src/scripts/navigation-menu.ts` for opening, closing, selection, keyboard handling and cleanup, and `src/styles/navigation-menu.css` for compact-menu dimensions and animations.

`BaseLayout.astro` and `MobileAbout.astro` declare configuration only; their previous menu templates/controllers were removed. Existing header CSS retains desktop positioning and tablet-specific placement. The duplicated icon/panel animation declarations were removed from `global.css` and `ipad-portrait.css`.

## Configuration

Props: `context` (`site` or `about`), unique `id`, `links` (`label`, `href`, optional `i18n`), `preferences`, and `formal`.

- Site keeps Service, About, Works and Contact, with its existing theme/language controls and contact CTA. Its existing work submenu is passed through the named `submenu` slot.
- About keeps Home, Service, Work and Contact. `preferences=false` omits the theme/language controls; `formal=true` configures the shared footer button as The Formal Stuff linking to `/cv/`.
- About retains the requested white square/black hamburger and white menu palette. These are context tokens, not separate menu implementations.

The footer reuses `SiteControls.astro`, including the shared coral action-pill, arrow and typography. Its defaults remain unchanged for existing pages; optional `preferences`, `projectHref`, `projectLabel` and `projectI18n` configure the About variant.

## Motion and interaction

Compact panels reveal top-to-bottom in 550ms using cubic-bezier(.76,0,.24,1). Icon lines transform in 350ms; the middle line fades in 250ms.

All primary links render `[+]`. Touch/keyboard selection rotates the plus 45° into a cross, scales the selected link to 1.025 and moves it 6px; other links fade to .42 opacity. Pointer hover follows the same styling. Escape closes the menu, and Tab stays within its controls. Reduced motion skips the transitions.

Cross-document anchors remain enabled until native activation/pagehide. Same-document section navigation uses the existing `leo:close-menu` event. The anatomical About cascade no longer controls menu state, so its delayed automatic start cannot close a menu that is being used.

Compact widths use 100vw so Home's reserved scrollbar gutter does not make its links narrower than About's. The mobile/iPad variants share font sizes, padding, icon dimensions and curves.

Verified in 390×844, 844×390 and 768×1024; Home/About computed sizes and animation values match. Desktop Home header geometry was compared at 1440×900 and 1366×768; desktop About geometry, WebGL and original contact CTA were also checked. Touch navigation Home→About→Home remains functional during the automatic head opening.

# Performance diagnosis — 2026-10-05

Repository: X:\MainWP. Clean Git baseline. Production build passes (8 static routes, 2.84 s reported build time). This diagnosis was recorded before source changes. Browser baseline collection is in progress; timings below are not field CWV scores.

## Architecture

All pages are static Astro templates; no framework islands or client hydration directives were found. Browser work comes from explicit module and inline scripts, not Astro hydration. Document navigation is full-document navigation with custom exit/reveal and browser back/forward cache handling. Persistent document listeners are therefore not automatically cross-page leaks.

Home: inline preference/responsive/navigation/Hero setup; shared preferences, contact modal, GSAP/ScrollTrigger, Lenis on fine pointers; HomeJourney + Workflow, Projects/gallery, FeaturedWorks, Brands, Footer. Hero dynamically imports Three for pointer distortion; footer uses a separate raw WebGL refraction pipeline. Work routes share BaseLayout and case-study rail; WWF contains the model and video. About owns its controller and dynamically selects dogScene or portraitScene. CV owns two desktop Lenis scrollers, accordions, video cards, progress and contact.

Responsive authority spans CSS plus responsive-init attributes: phone <=700 or short landscape <=1000x500; tablet portrait 701–1400; several legacy CSS queries stop at 1100; large touch landscape >=1367x701. iPad stabilizes svh on width changes, suppresses GSAP toolbar refresh, and disables Lenis/scroll pacing. Large tablet deliberately tracks visualViewport and defers refresh until scroll settles. Altering these regimes without physical device regression tests is high risk.

## Prioritized findings

| Severity / file | Current behavior and cost | Expected benefit / recommendation | Regression risk / visual effect |
|---|---|---|---|
| CRITICAL functional: src/data/projects.ts | References /videos/6.webm, absent from public; both panel and gallery will fail when selected. | Supply authored file. User confirmed they will add it later; do not substitute video 10. | Content decision; unchanged pending user asset. |
| HIGH: components/cv/AccordionItem.astro | Every collapsed card has live full-size img src; hidden content competes with visible CV, with large decoded dimensions. | Activate src on expansion, reserve intrinsic dimensions, retain existing reveal. | Low; first opening now depends on network. No pixel/quality change. |
| HIGH: components/cv/AnimationRow.astro | Four videos autoplay without preload bounds even while collapsed/offscreen. Combined files 21.93 MB decimal. | No initial source; activate on expanded visible card; pause on collapse/offscreen/hidden/pagehide and resume when eligible. | Low; media starts when revealed; no visual redesign. |
| HIGH: scripts/footer.ts | Custom cursor RAF starts on desktop and perpetually writes transform even before pointer input and while cursor invisible. | Schedule only while visible and moving/pulsing; stop after convergence and on hidden/pointer-mode changes. | Low; preserve easing/pulse. Invisible scheduling change. |
| HIGH: components/CaseStudy.astro, scripts/case-study.ts | All case images and next preview eager; video autoplay/preload auto; model module imported immediately. | Keep first image eager, warm subsequent images near either scroll axis; gate model import/context on proximity; gate video playback on viewport/document visibility. | Low to moderate; near-view margin must cover horizontal rail. No quality change. |
| HIGH lifecycle: scripts/hero-distortion.ts | pagehide calls permanent finish, including persisted BFCache entries; returning leaves enhancement dead. | Pause persisted pagehide and sync on persisted pageshow; dispose only actual destruction. | Low; restores approved effect. |
| MEDIUM lifecycle: scripts/about/portraitScene.js | load calls frame directly while requested RAF can already be pending; frame resets RAF handle, potentially schedules a duplicate entrance chain. | Cancel tracked callback before synchronous ready frame. | Low; retains first-frame-before-reveal semantics. |
| MEDIUM memory: scripts/about/dogScene.js | Actor materials are replaced by attach, but resource tracking of replacements waits until after async shader compilation. Disposal during compile misses replacement materials. | Track attached model immediately before await compileAsync. | Low; lifetime-only fix. |
| MEDIUM: scripts/footer-marquee.ts | Non-iPad footer context/textures initialize far below fold; iPad already defers. | Apply visibility initialization gate to all devices, resize when entering. | Low; same shader and dimensions. |
| MEDIUM: pages/about.astro, styles/about.css | About fonts are byte-identical to /fonts versions but use different URLs. | Reuse canonical /fonts URLs and matching preloads. | Low; byte-identical assets, same font rules. |
| MEDIUM: data/cv/experience.js, data/case-studies.ts | Identical video bytes repeated under distinct URLs prevent cache reuse across routes. | Reference existing canonical /videos paths; keep old files for compatibility. | Low; SHA-256 equality confirmed. |
| MEDIUM: public/_headers | Stable font filenames are immutable for one year; replacements can remain stale. About/models, /models, CV lack explicit policy. | Revalidate stable asset paths; reserve immutable for hashed /_astro files. | Low correctness improvement; evaluate CDN behavior post-deploy. |
| HIGH opportunity, deferred: scripts/home-journey.ts, scripts/projects.ts | Hero and mobile stack animate width/height/top/left; layout and mask work remains during scroll. Desktop journey reads offset geometry in showWorkflowLogo during updates. | Profile real iPad trace, then narrowly cache safe geometry. Transform-only rewrite would affect handoff, clipping and layout. | High; architectural/visual equivalence testing required. Do not rewrite silently. |
| HIGH opportunity, deferred: large public images / GLBs | IMAR1 is 6210x5666 (~141 MB decoded RGBA); SPM1 is 1.54 MB; 3 main actors total 7.60 MB. | Generate reviewed responsive image/texture variants; preserve full originals for zoom; quantify decode/GPU savings. | Medium; quality comparison required. No blind re-encode. |
| MEDIUM opportunity, deferred: brands.css | Mobile logo CSS streams run infinitely, including offscreen. | Pause via visibility while preserving entry presentation timing. | Moderate timing change; measure compositor cost first. |
| MEDIUM opportunity, deferred: BaseLayout / astro.config | All CSS is inlined: home 187,938 style bytes; case pages ~100,718 each, including home-specific responsive selectors. | Compare shared external CSS and route-specific imports under cold/warm navigation. | Moderate cascade/loading risk; no speculative global split. |
| LOW: unused source utilities | footerGradient.ts/testLoader/ipad legacy helpers have no active imports from routes found by search. | Leave source; no evidence these ship. | Removing files provides no browser benefit. |

## Baseline inventory

All emitted JS: 2,005,342 bytes raw, 510,950 sum of individually gzipped files. This is NOT initial page transfer: includes dynamic Three, WASM decoder wrappers and fallback decoder. Largest chunks: Three 736,589 raw /185,290 gzip; Draco JS fallback 719,410 /148,812; GSAP 69,582 /27,051; ScrollTrigger 42,725 /17,412. Installed dependency tree has single top-level Three/GSAP/Lenis; no framework runtime. Public directory totals 131,226,269 bytes; duplicate files inflate deployment size but only duplicate URLs requested by a visitor affect transfer.

Home HTML 340,791 raw /57,746 gzip. About 127,200 /27,750. CV 124,717 /25,929. Case HTML 137–138 KB raw /28–29 KB gzip. Complete asset dimensions, hashes, model primitives and page scripts are in baseline-inventory.json.

## Rendering and event review

GSAP registers once per module but shares the bundled plugin; repeated registerPlugin is not duplicated dependency execution. HomeJourney/Brands/FeaturedWorks/entrances use gsap.matchMedia with cleanup; Projects explicitly kills old timelines/triggers on configure; gallery destroys Lenis ticker and sticky contexts on close. Rebuilds occur on genuine breakpoint/orientation changes. No proven growing ScrollTrigger leak yet. Many listeners only clean up during HMR, which is compatible with full document navigation; don't demand SPA teardown without an SPA router.

Home scroll updates geometry/masks/card transforms; Projects updates rail or mobile layout. Footer coalesces scroll geometry into one RAF but cursor loop is separate. Pointer handlers in contact and distortion read bounding rects; contact only during active interaction, distortion only initial hero. Footer marquee reads six transforms per active mobile frame. Non-passive touchmove in tablet-horizontal-gesture and transition locks is intentional because it cancels gestures. Brand preview is demand-driven; CV RAF stops on document hidden; About scenes are visibility gated.

WebGL: Hero DPR <=1.5 desktop, <=1 tablet, omitted on phones; demand-driven displacement, no postprocessing. Portrait DPR <=1.5; one scene rendered on scroll/entrance. About full scene DPR1, render scale .85 (.75 small), max 2.1M pixels, adaptive .6 floor, shadow 1024, render/look/output passes, tracked resources and bounded decoder workers. Case model DPR<=1.5, shadows off on touch, on-demand desktop and continuous touch preview while visible. Footer raw WebGL <=1.5 desktop/1 touch, two blur targets, texture limits; offscreen frame loop already stops. Existing DPR choices are retained.

Model geometry is not the main download cost: Leo 9,039 triangles, Simba 8,160, Morena 11,311; caseta ~3,383 triangles /27 primitives /3 materials. All authored model materials are double-sided; halos blend transparency. Changing culling or textures needs visual review. Runtime draw calls/GPU memory require renderer instrumentation/real-device testing, not inference from primitive count.

## Loading hierarchy and validation limits

Critical: active-theme responsive Hero source, visible first case image, document styling/fonts. Near future: journey intermediates/workflow, active/next project panels, case neighbors, model viewport approaching. Deferred: View All, zoom originals, collapsed CV media, footer context. Preserve current theme-selective Hero preload and image quality.

Likely homepage LCP is active theme Hero image (verify PerformanceObserver), subject to masked entrance and text candidates. Existing aspect ratios/dimensions reserve most layout. Font swapping and locale-dependent text can shift content. INP risks: portrait vertex scan, model compile, full-size image decode, bulk gallery opening, synchronous refresh and theme updates. No claimed field LCP/INP/CLS or numeric Lighthouse score.

Public header probe confirmed Cloudflare, HTML max-age=0,must-revalidate and fonts one-year immutable. Repository also contains GitHub Pages deployment workflow, so deployment authority should be verified; do not change it. Local compression estimates are not wire Brotli measurements. No DNS or deployment changes planned.

# Astro performance audit and implementation report

**Project:** X:\MainWP · **Date:** October 5, 2026 (America/Lima) · **Status:** local changes validated; not committed or deployed.

## 1. Executive summary

The site already uses Astro appropriately: static HTML, no framework hydration, shared GSAP/ScrollTrigger chunks, conditional 3D imports, and substantial visibility/disposal protection. The largest avoidable initial cost was hidden CV media. The main continuous-work defect was the desktop custom cursor's unconditional RAF loop. Both are fixed without changing the authored layout or media quality.

The first diagnosis was saved before source edits; see [diagnosis.md](diagnosis.md). Asset inventories and browser results accompany this report. Measurements are local production-build tests, not Lighthouse scores or production field metrics.

**Engineering health, approximate qualitative assessment:** before: sound architecture with significant loading inefficiency and several lifecycle gaps. After: stronger loading/lifecycle behavior, with the same sophisticated rendering costs. Neither state warrants a numeric performance score without real-device traces and field data. The missing video remains an explicitly acknowledged content issue.

## 2. Main bottlenecks and prioritized findings

The diagnosis table supplies file/component, behavior, reason, benefit, fix, regression risk and visual status for each initial finding. The following updates reflect verification:

| Priority | Finding | Final disposition |
|---|---|---|
| CRITICAL functional | `/videos/6.webm` referenced but missing | User will add later. Slot preserved; no substitution or content deletion. |
| HIGH | 48 collapsed CV images requested before opening anything | Fixed: sources activated on expansion; intrinsic dimensions retained. |
| HIGH | CV videos authored with unconditional autoplay | Fixed: source and playback require expanded, intersecting, active document. Baseline Chromium showed **zero playing videos**, so no claimed measured four-decoder saving; the unsafe authoring is removed. |
| HIGH | Desktop custom cursor writes transform forever | Fixed: demand-driven RAF, settles at 0.05 px combined error, wakes for movement/pulse, pauses while invisible/hidden. |
| HIGH | Every case-study image and end preview loads eagerly | Fixed: first image remains eager; later panels warm within a one-viewport margin in both axes. |
| HIGH | Case video can autoplay/preload while unseen; no document visibility guard | Fixed: preload none, viewport/visibility/page-lifecycle playback control. |
| HIGH lifecycle | Hero permanently disposed on BFCache pagehide | Fixed: persisted navigation pauses, persisted return resynchronizes; actual destruction disposes. |
| MEDIUM | Case model imports/creates context immediately | Fixed: import gated by 300 px proximity. WWF model is already near the initial viewport in measured layouts, so **no initial JS saving claimed there**. |
| MEDIUM | Footer GPU context created at page start outside iPad | Fixed: allocate on footer visibility for every device. Same shader and DPR. |
| MEDIUM memory | About replacement material ownership registered after awaited shader compile | Fixed: register immediately after attach, before await. Prevents disposal-during-compile gap. No heap-growth claim. |
| MEDIUM lifecycle | Mobile About directly runs frame while a RAF may be pending | Fixed: cancel pending callback before synchronous readiness frame; preserves reveal ordering. |
| MEDIUM | Byte-identical fonts/videos at different URL paths | Fixed references: About fonts reuse `/fonts`; CV and WWF video reuse canonical `/videos` URLs. Old files retained. |
| LOW build hygiene | Audit prose caused Tailwind to generate additional utilities | Audit folder explicitly excluded from scanning in both Tailwind entry stylesheets. No authored design rules changed. |

No confirmed growing ScrollTrigger leak was found. Repeated desktop→phone→desktop round trips produced **14, 14, 14, 14** active triggers on Home. This is one tested state sequence, not proof for every breakpoint or every dialog combination.

## 3. Before/after measurements

Fresh Chromium contexts, local uncompressed production server, no network or CPU throttling. Initial snapshot follows load plus 4 seconds. Resource bytes are the sum of Resource Timing transferSize for subresources; they **exclude the document** and may omit ongoing transfers. They include local response overhead. Decimal MB below. They are not production Brotli transfer totals. Desktop 1440×900; phone 390×844/DPR3/touch; tablet emulation 1024×1366/DPR2/touch. The tablet context is Chromium, not Safari and not an iPad user agent.

| Measurement | Before | After | Change |
|---|---:|---:|---:|
| CV initial subresource requests, all three profiles | 73 | 25 | −48 |
| CV initial subresource bytes | 15.527 MB | 0.917 MB | −94.1% |
| CV initial image bytes | 15.354 MB | 0.743 MB | −95.2% |
| GroAqua desktop initial subresource bytes | 1.328 MB | 0.438 MB | −67.1% |
| GroAqua desktop initial requests | 27 | 22 | −5 |
| GroAqua phone initial subresource bytes | 1.514 MB | 0.623 MB | −58.8% |
| GroAqua tablet initial subresource bytes | 1.514 MB | 0.922 MB | −39.1%; larger viewport warms more images |
| WWF desktop initial subresource bytes | 2.993 MB | 2.156 MB | −28.0% |
| WWF desktop initial requests | 32 | 30 | −2 |
| Home desktop RAF callbacks in 1.5 s idle window | 819 | 552 | −32.6% |
| All emitted JS, raw | 2,005,342 B | 2,006,730 B | +1,388 B |
| Sum of individually gzipped emitted JS | 510,950 B | 511,413 B | +463 B |

The final inventory was collected after removing a now-unused footer flag and excluding the audit folder from Tailwind scanning. Browser before/after records precede that final cleanup (55 B raw JS difference); final inline style sizes returned to baseline. The small JS increase pays for lifecycle/loading guards. Home image payload and About initial payload are effectively unchanged. Desktop Home JS rose by 487 B in the local transfer sample. This work improves when work occurs, not dependency size. Build elapsed time changed from 2.84 s to 1.47 s on the first after build, but warm caches make that **an invalid speedup claim**.

All emitted JS includes conditional Three and Draco fallback assets, not just startup JS. Three remains 736,589 B raw /185,290 gzip; GSAP 69,582 /27,051; ScrollTrigger 42,725 /17,412. Draco's JS fallback remains 719,410 B raw and is not evidence that every visitor fetches it. Two emitted decoder wrappers plus public decoder copies merit packaging review, but no duplicate runtime download was established.

Font canonicalization avoids up to 217,444 B of duplicate font-body downloads when navigating between pages using the same cached files. Canonical video paths similarly enable cache reuse; no measured warm-navigation byte saving is asserted. Public assets remain 131,226,269 B because compatible old paths and original quality were retained.

## 4. Rendering, memory and WebGL

| System | Scheduling / quality | Audit result |
|---|---|---|
| Hero distortion | Dynamic Three; phones excluded; DPR≤1.5 desktop/≤1 tablet; event-driven decay | Quality retained. Hidden/covered states pause. BFCache handling repaired. |
| Full About | DPR1 with .85 scale, .75 small viewport, adaptive floor .6, max 2.1M pixels; 1024 shadow map; render/look/output passes | Existing visibility, context-loss, loader pool and disposal protections retained. Early material tracking repaired. |
| Mobile About portraits | DPR≤1.5; scroll/entrance demand; one renderer | Pending RAF race repaired. O(vertex count) CPU head-bounds calculation remains a potential startup long task. |
| WWF case model | DPR≤1.5; 1024 shadows desktop, shadows disabled touch; touch preview rotation | Near-view initialization; visible rendering rules unchanged. |
| Footer refraction | Raw WebGL; DPR≤1.5 desktop/1 coarse; two blur targets and capped texture size | Initialization now deferred. Existing offscreen frame pause retained. |

A focused WebGL call-count probe, captured after a 2.5 s page interval, observed Home canvas 1425×1260 with 3 cumulative draw calls, WWF canvas 864×900 with 29, and full About canvas 1224×765 with 1,998. These include startup and animation, are **not draw calls per frame**, and are not GPU timing. Home initially had only the Hero WebGL context; footer initialization was separately verified after reaching the footer. Do not extrapolate these host/DPR1 numbers to iPad.

GLB inspection:

| Asset | Triangles / primitives | Embedded textures |
|---|---|---|
| Leo | 9,039 /1 | 512×512 WebP |
| Simba | 8,160 /1 | 1024×1024 WebP |
| Morena | 11,311 /1 | 1024×1024 WebP |
| Caseta | ~3,383 /27 | two 4800×1440 WebPs |
| Libro2 | 247 /1 | 2048×2048 WebP |
| Each halo | 192 /1 | 1366×1367 PNG with transparency |

The two caseta textures imply 55,296,000 B of base RGBA storage, approximately 73.7 MB with a full mip chain, excluding driver/CPU copies. The encoded GLB is only 653,556 B; transfer size hides this memory cost. The three actors total 7.60 MB encoded, but their embedded images total only ~0.256 MB; animation/buffer data, not merely textures, should be investigated before proposing compression. All authored materials are double-sided; halos use blending. Samplers use linear magnification and trilinear mipmapped minification. No culling, shadow, texture or DPR change was made.

## 5. Images, videos, fonts and loading hierarchy

**Critical:** active-theme responsive Hero, visible first case image, visible CV portrait, required fonts. Existing theme-selective Hero preload remains. Desktop observed LCP candidate is `.hero__image--light` using `1H-1440.webp`; tablet observed candidate is `3H.webp`. Dark theme selects corresponding dark assets.

**Near future:** journey intermediate/workflow images, active or approaching project panels, one-viewport case neighbors, model within 300 px. This avoids treating all below-fold assets identically.

**Deferred:** View All gallery sources, lightbox originals, collapsed CV accordion images, collapsed video cards, distant case preview and footer renderer. CV accordion opening activates that accordion's images together. First reveal on slow connections may wait for media; reserve dimensions and retain the existing reveal rather than lowering resolution.

Largest image concerns: unused/reference `imgs/hero/010.png` is 5.60 MB; no active route reference found. SPM1 WebP is 1.54 MB at 3200×2002. IMAR1 is 6210×5666, implying ~140.7 MB RGBA decode despite only 0.49 MB encoded. WWF_OMI3 is 3368×4763 (~64.2 MB decoded). These are candidates for reviewed display-size variants with originals retained for zoom. Hero and service thumbnails already have responsive variants. General project/gallery/featured images often lack srcset; no blanket AVIF re-encode was justified or performed.

CV four authored video files total 21,930,873 B. They now reuse `/videos/7.webm`, `/videos/9.webm`, `/videos/3.webm`, `/videos/havida.webm`. The first-open/close playback test passed. Baseline media transfer was not fully measurable from the snapshot: no claimed 21.93 MB initial saving. Most portfolio videos already used preload none and intersection/modal guards. WWF now has explicit document/page lifecycle control. Existing posters stay unchanged; no invented poster or transcoding. A codec/bitrate probe was unavailable (`ffprobe` absent); resolution and compatibility must be validated with actual files/browser targets before changing encoding. The browser successfully decoded the tested CV video. A complete codec compatibility certification is not claimed.

Fonts: Host Grotesk 31,204 B, Archivo 186,240 B locally. About uses variable weight declarations; global declarations retain their existing 400/800 ranges to avoid changing typography. CV still uses Google Fonts with display=swap and preconnect; self-hosting could remove external CSS latency but needs matching font versions/weights and visual verification. Existing font preloads remain aligned with used URLs.

## 6. CSS, layout, scrolling and device behavior

Expensive intentional systems remain: Hero geometric mask/shrink, mobile project stack width/height/top updates, contact holographic masks/blends and backdrop blur, fixed difference-blend header, active footer refraction, and animated brand streams. No measured paint trace establishes that removing any one effect is justified. Broad transform-only rewrites would change geometry, hit testing and handoff behavior; they are deferred.

`home-journey.ts` writes layout properties during scrub; `showWorkflowLogo` can read offset geometry before later writes. `projects.ts` caches major guide geometry but mobile stack still changes layout. Footer scroll work is RAF-coalesced; cursor now settles. Brand preview uses cached dimensions and demand-driven motion. Contact and Hero pointer handlers read rects only during relevant interaction. Mobile footer reads six computed transforms to synchronize the existing effect; this remains worth profiling on Safari. ScrollProgress changes a small width value on CV panel scroll; low priority.

MatchMedia cleanup was reviewed in HomeJourney, main, entrances, Brands, FeaturedWorks, CaseStudy and ServiceStickyGrid. Projects explicitly disposes previous trigger/tween sets before configuration; gallery creates and destroys its own Lenis ticker. The tested Home round trips retain 14 triggers. Workflow has document-lifetime listeners and a boot guard; with full-document navigation these are not proven cross-page leaks. Adding an Astro client router later would require revisiting HMR-only cleanup in multiple scripts.

Native non-passive gesture listeners are retained where preventDefault is required, including modal transitions and horizontal tablet gestures. iPad toolbar-only height changes remain separated from stable layout; large-tablet dynamic height intentionally follows visualViewport and waits to refresh. Changing these contracts was not necessary for the implemented fixes.

**iPad/mobile changes:** defer CV/case media, canonical cache URLs, defer footer context, stop hidden video work, preserve mobile About's single RAF ownership. **Desktop changes:** same loading fixes, idle cursor reduction, correct Hero persisted return, same full-quality models, typography, masks and animation choreography.

## 7. Core Web Vitals and robustness

No Lighthouse/PageSpeed run, CrUX sample, INP field measurement, heap soak or GPU timing was available in this audit. PerformanceObserver captured LCP candidates and layout shifts, not an authoritative field score. Local LCP times varied too much with caches/font/network/GPU startup to claim improvement. TTFB/FCP were not benchmarked over a controlled production network.

Home desktop sampled no layout shifts; tablet sampled a 0.01948 sum before and after. WWF desktop recorded a 0.36849 shift sum in both broad runs, while a separate focused cold-page trace recorded none. This is an unresolved, timing-dependent baseline observation, not a regression fixed here. The simple sum is not the CWV session-window CLS algorithm. Reproduce under network throttling with shift-source capture before changing rail reveal/layout. The global font-ready ScrollTrigger refresh and initial horizontal activation are candidates, not established causes.

INP candidates remaining: portrait head-geometry scan; shader compilation/texture upload; bulk gallery source activation/decode; theme and language changes; synchronous refresh after layout changes. Existing queuing/token guards reduce several races. New async playback completion rechecks eligibility, so a late play resolution cannot leave a collapsed/hidden video playing.

No uncaught JavaScript errors in the 15-page/profile baseline or after matrices; all five case routes passed full-rail deferred-image checks. This is not an assertion that every asset or interaction is error-free. Missing video 6 remains untested as successful content, by design. Production contact delivery was not attempted; its 23 existing mocked tests passed but do not validate real email delivery.

## 8. Network / Cloudflare

Read-only public response-header checks confirmed Cloudflare, HTML `Cache-Control: public, max-age=0, must-revalidate`, and **Brotli HTML** when requested. `/fonts/HostGrotesk.woff2` currently has one-year immutable caching. `/about/models/leo.glb` has max-age=0/must-revalidate and an ETag; a repeat request may revalidate rather than retransmit the full body. Do not describe it as an unconditional repeated full download.

Hashed `/_astro` immutable caching is appropriate. Unversioned fonts with one-year immutable policy can become stale after a replacement; versioned URLs are the preferred future fix. Images/videos have month-long stable-path caching. Model/CV cache policy can be improved after deciding update/versioning behavior. No DNS, headers, infrastructure or deployment workflow changes made. The repo still includes a GitHub Pages workflow, while project docs and public headers indicate Cloudflare; verify which publishing path is authoritative before deployment changes.

## 9. Files changed

- `src/components/cv/AccordionItem.astro`: defer image sources; intrinsic dimensions; load on expansion.
- `src/components/cv/AnimationRow.astro`: deferred video markup and controller import.
- `src/scripts/cv-videos.ts` (new): expanded/visible/active-document playback ownership and cleanup.
- `src/components/CaseStudy.astro`: preserve first image, defer neighbors/preview, video preload none.
- `src/scripts/case-study.ts`: image proximity observer, model import gate/failure state, video lifecycle.
- `src/scripts/footer.ts`: demand-driven cursor loop.
- `src/scripts/footer-marquee.ts`: visibility-gated GPU allocation.
- `src/scripts/hero-distortion.ts`: BFCache-aware lifecycle.
- `src/scripts/about/dogScene.js`: earlier replacement-material ownership.
- `src/scripts/about/portraitScene.js`: cancel pending RAF before immediate ready frame.
- `src/pages/about.astro`, `src/styles/about.css`: canonical byte-identical font URLs.
- `src/data/cv/experience.js`, `src/data/case-studies.ts`: canonical byte-identical video URLs.
- `src/styles/global.css`, `src/styles/about.css`: exclude this audit directory from Tailwind utility detection.
- `docs/performance-audit/`: diagnosis, report and evidence.

No dependency updates, asset re-encoding, Git history changes, commits, or deployment.

## 10. Validation and remaining risks

Production build passes all 8 routes; diff whitespace check passes. Browser matrices cover five representative routes across three viewport/touch profiles before and after. Focused regression checks cover CV image activation, video play/pause, repeated responsive trigger counts, deferred footer shader activation, synthetic persisted lifecycle, every case rail's image loading, dark mobile and reduced motion. Reviewed Home/CV/footer screenshots show the intended composition; this is not exhaustive pixel equivalence across every animation frame. Headless browsers do not reproduce Safari rubber-banding, browser toolbar transitions, thermal throttling or device GPU memory limits.

Monitor on physical iPad Safari: portrait↔landscape while images/GLBs are loading; repeated About remounts and context loss; Hero back/forward return; model zoom/explode then close; gallery enter/exit at scroll endpoints; media reveal on slow connections. Monitor the new first-open CV image/video delay under slow network. The source-less initial state is deliberate; do not reintroduce eager hidden loads to mask it without measurement.

**Remaining opportunities, with tradeoffs:** reviewed responsive image variants (high impact, moderate visual risk); caseta texture-size/format experiments (potential high memory benefit, must compare max zoom); actor animation-buffer compression (measure CPU decode tradeoff); CV local font parity (moderate network benefit); shared CSS extraction (warm-cache benefit versus cold request/cascade risks); visibility pausing of mobile brand streams (timing changes); real paint/INP/CLS investigation of layout-driven scroll systems. These require narrower follow-up decisions and measurements, not a silent architecture rewrite.

## 11. Reproduction and evidence

Evidence JSON includes before/after browser resource records, all asset sizes/hashes/dimensions, embedded GLB textures, and focused regression results. `audit-browser.cjs`, `audit-regression.cjs`, `audit-detail.cjs`, `audit-inventory.cjs`, `audit-models.cjs` are audit harnesses, not production runtime code. They target X:\MainWP and use the bundled local Playwright/Sharp paths. Run from this folder after `npm run build` in project root; Edge must be installed. Broad browser tests use port 4329, focused regression 4330, detail probe 4331 and close their servers. The broad server does not simulate CDN compression or range streaming; focused video regression implements byte ranges. Raw metrics must be interpreted accordingly.

References used for implementation context: [Astro components and their static runtime model](https://docs.astro.build/en/basics/astro-components/), [Tailwind source detection and explicit exclusions](https://tailwindcss.com/docs/detecting-classes-in-source-files). All performance findings above come from this repository, local tests or the specified public header probes.

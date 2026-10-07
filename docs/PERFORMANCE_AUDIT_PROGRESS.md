# Persistent performance audit checkpoint

Last updated: 2026-10-05, America/Lima. Project: `X:\MainWP`.

## Resume rules and current state

- Continue the existing audit. Do not restart, revert completed fixes, reset Git, delete assets, or repeat baseline collection over the preserved baseline files.
- User explicitly requested this persistent checkpoint. Update after meaningful findings/edits/tests and before context compaction or another substantial work block.
- Original request: deep Astro engineering audit, diagnosis first, then safe critical/high and low-risk medium fixes. Preserve approved visual design, animation choreography, responsive layout, typography and media quality. Explain high-risk architectural tradeoffs before modifying those systems.
- First audit/implementation pass is complete and its report was delivered. Current follow-up is checkpoint creation; no new optimization work was requested in this follow-up.
- Changes are local and uncommitted. Nothing deployed. Git was clean at audit start; preserve the current modified/untracked files.
- Actual repository is `X:\MainWP`, NOT the chat working directory `C:\Users\Administrador\Documents\ChatGPT\webpage leolaguna` (the latter contains original audit harnesses/screenshots).
- No subagents were used or authorized. Read `AGENTS.md` for applicable project instructions. Its background dev-server instructions apply if starting a dev server; audit harnesses used their own local production static servers instead.

## Authoritative artifacts

- `docs/performance-audit/diagnosis.md`: structured diagnosis recorded before source changes; severity, file, behavior, cost, benefit, recommendation, risk and visual impact.
- `docs/performance-audit/report.md`: detailed final report, scope, limitations and remaining opportunities.
- `baseline-inventory.json`, `after-inventory.json`, `final-inventory.json`: full public assets, hashes, dimensions, GLB counts, emitted chunk sizes and HTML statistics, under that folder.
- `before-browser.json`, `after-browser.json`: 15 route/profile samples each.
- `regression-results.json`, `detail-results.json`, `model-textures.json`: focused regression, WebGL/shift probe, embedded texture inventory.
- Reproduction harnesses in the same folder: `audit-inventory.cjs`, `audit-browser.cjs`, `audit-regression.cjs`, `audit-detail.cjs`, `audit-models.cjs`.
- Screenshot evidence remains in the chat working directory above: before/after desktop/mobile/tablet page PNGs, `after-footer.png`, and reduced-dark PNGs.
- Harnesses hardcode this repository and the bundled local Node package location. Run from `docs/performance-audit` if using the copied harnesses. Do not overwrite `before` evidence.

## Completed phases and coverage limits

| Requested phase | Completed work | Outstanding / limitation |
|---|---|---|
| 1 Architecture | Static Astro routes, script/import ownership, global vs page systems, responsive authorities mapped | No framework islands/client hydration found; do not propose hydration migration |
| 2 Build/JS | Baseline and after production builds, chunk/compression inventories, dependency tree, dynamic imports, unused-source reference search | No full source-map attribution or exhaustive dead-code proof |
| 3 GSAP/ScrollTrigger | Major implementations/cleanup reviewed; repeated Home breakpoint counts measured | Not every dialog/orientation combination tested |
| 4 RAF/events | Repository-wide scheduling/event searches and major hot paths reviewed; cursor loop fixed | No physical-device CPU trace or all-event-frequency recording |
| 5 Three/WebGL | Scene initialization, visibility, DPR, loading, disposal reviewed; all GLB geometry/embedded textures inventoried; focused draw-call probe | No GPU timings or physical device fidelity comparison; DPR unchanged |
| 6 Images | Complete public image dimensions/size/hash inventory; critical/near/deferred hierarchy; CV/case loading fixes | Responsive re-encodes intentionally deferred pending quality review |
| 7 Video | Markup/loading/playback ownership reviewed; CV/case lifecycle fixed; focused play/pause regression | ffprobe unavailable; full codec/bitrate compatibility audit incomplete |
| 8 CSS/compositing | Expensive patterns searched and active rendering systems inspected | No real Safari paint/layer trace; intentional effects retained |
| 9 Layout/reflow | Geometry reads/writes reviewed in primary scroll/interaction systems | Layout-driven Hero/project rewrite deferred as high risk |
| 10 Responsive/resize | CSS/JS regimes, iPad stable viewport and large-tablet dynamic viewport inspected; round trips tested | Chromium touch emulation is not physical iPad/Safari |
| 11 Memory/cleanup | Main ownership reviewed; material tracking and portrait RAF race repaired | No long-duration heap/GPU-memory soak |
| 12 Fonts | Font sizes, URL duplication, declarations, preloads/display reviewed; identical About font URLs unified | CV Google Fonts retained pending local font parity validation |
| 13 Network/cache | Public Cloudflare headers and Brotli checked; local policies reviewed | No DNS/deploy/cache-policy changes; workflow authority still worth verifying |
| 14 CWV | Local LCP candidates/layout-shift entries collected | No Lighthouse, CrUX, field INP or controlled production TTFB/FCP; WWF shift unresolved |
| 15 Devices | Desktop, phone and tablet-emulation before/after matrices; dark/reduced mobile checks | Real Safari/iPad, thermal and GPU limits unverified |
| 16 Robustness | Uncaught JS errors monitored, all case rails tested, known missing video identified, existing contact tests run | No actual email send, comprehensive accessibility audit or every asset-path certification |

## Findings and implemented optimizations

1. **Critical functional, pending user:** `/videos/6.webm` is referenced but absent. User explicitly answered **“i will add it later.”** Preserve slot 6; do NOT replace it with existing video 10 or ask again without new need.
2. **High, fixed:** 48 collapsed CV images requested initially. Activate sources on expansion and reserve intrinsic dimensions.
3. **High, fixed authoring risk:** CV videos had autoplay without bounds. Now no source until expanded + intersecting; pause on collapse, offscreen, hidden document or pagehide. Baseline Chromium had zero playing videos, so do not claim measured four-decoder or 21.93 MB startup-video savings.
4. **High, fixed:** desktop custom cursor RAF ran perpetually. Demand-driven motion/pulse and convergence/visibility guards retain appearance.
5. **High, fixed:** all case images/end preview eager. Preserve first image; warm other panels within one viewport on both axes.
6. **High, fixed:** case video preload/autoplay/visibility handling. Preload none plus explicit viewport/document/page lifecycle ownership.
7. **High lifecycle, fixed:** Hero permanently disposed on persisted pagehide. Pause for BFCache and resynchronize on persisted pageshow.
8. **Medium, fixed:** case-model import/context gated by 300 px proximity, including failure state. WWF model is already near initial view in measured layouts, so no startup JS reduction claimed there.
9. **Medium, fixed:** footer GPU resources now initialize on visibility on all devices, preserving shader/DPR.
10. **Medium, fixed:** About actor replacement materials tracked before awaited shader compilation to close disposal race.
11. **Medium, fixed:** portrait readiness frame cancels pending RAF before synchronous render, retaining first-frame reveal order.
12. **Medium, fixed:** SHA-256-identical About fonts and CV/WWF videos use canonical shared URLs. Old files retained for compatibility.
13. **Low, fixed:** Tailwind scanned audit prose into utilities. Exclude audit evidence folder; checkpoint follow-up also excludes this exact progress file from both Tailwind entry stylesheets.

Remaining substantive concerns: layout-property animation during Hero/mobile-stack scroll; portrait vertex-bound scan; caseta texture memory; oversized gallery originals; mobile brand streams running offscreen; repeated inline CSS across routes; external CV font CSS; immutable unversioned font URLs. None justifies blind removal, quality reduction or rewrite.

## Files inspected

Inventory/search coverage includes all `src`, `public`, `scripts`, `functions`, `cloudflare`, and project build/deploy configuration. Individual reads were sometimes focused excerpts; do not represent this list as every line of every file reviewed.

- Root/config: `AGENTS.md`, `package.json`, `astro.config.mjs`, `postcss.config.mjs`, `CNAME`, `public/_headers`, `.github/workflows/*`; dependency tree and Git state.
- Layouts/routes: `src/layouts/BaseLayout.astro`, `CVLayout.astro`; `src/pages/index.astro`, `about.astro`; route/script markup searches cover `cv.astro` and `work/[slug].astro`.
- Components: `CaseStudy.astro`, `Workflow.astro` (interaction/cleanup excerpts), `Hero.astro` (markup/style search), `Projects.astro`, `Brands.astro`, `FeaturedWorks.astro`, `ServiceStickyGrid.astro`, `Footer.astro`, `FooterGlass.astro`, `PageNavigation.astro`, `ContactCard.astro`; CV `AnimationRow.astro`, `AccordionItem.astro`, `ExperienceSection.astro`, `ScrollProgress.astro`, `Sidebar.astro`; About component markup/style searches.
- Scripts: `main.ts`, `smooth-scroll.ts`, `home-journey.ts`, `hero-distortion.ts`, `hero-presentation.js`, `projects.ts`, `project-gallery.ts`, `project-videos.ts`, `case-study.ts`, `case-model.ts`, `footer.ts`, `footer-marquee.ts`, `footer-refraction.ts`, `brands.ts`, `brand-preview.ts`, `featured-works.ts`, `entrances.ts`, `cv-scroll.ts`, `responsive-init.js`, `responsive-layout.ts`, `ipad-layout.ts`, `large-tablet-viewport.ts`, `tablet-horizontal-gesture.ts`, `scroll-pacing.ts`, `service-sticky-grid.ts`, `service-cover-transition.ts` (excerpt), `contact-card.ts` (excerpt), `preferences.ts` (excerpt), `document-navigation.js` (excerpt), `page-transition.ts` (excerpt).
- About scripts: `aboutController.js`, `dogScene.js` (major initialization/render/load/dispose excerpts), `portraitScene.js`, `sceneUtils.js`, `sceneConfig.js`, `editorialAbout.js` (excerpt); actor classes and testLoader included in lifecycle/import searches.
- Data: `project-image-size.ts`, `cv/experience.js`, `case-studies.ts`; project/media references searched in other data files.
- Styles: rendering/breakpoint searches across every stylesheet/component; focused reads of global/about/CV/case-study rules and responsive/project/footer/brands snippets.
- Contact: `cloudflare/contact/README.md`, existing test outputs; no contact implementation changes.
- Every public asset sized and hashed; raster metadata and every embedded GLB image inspected programmatically. See inventories rather than listing hundreds of asset names here.

## Modified files (preserve these changes)

- `src/components/cv/AccordionItem.astro`
- `src/components/cv/AnimationRow.astro`
- `src/scripts/cv-videos.ts` (new)
- `src/components/CaseStudy.astro`
- `src/scripts/case-study.ts`
- `src/scripts/footer.ts`
- `src/scripts/footer-marquee.ts`
- `src/scripts/hero-distortion.ts`
- `src/scripts/about/dogScene.js`
- `src/scripts/about/portraitScene.js`
- `src/pages/about.astro`
- `src/styles/about.css`
- `src/styles/global.css`
- `src/data/cv/experience.js`
- `src/data/case-studies.ts`
- `docs/performance-audit/` (new report, diagnosis, evidence/harnesses)
- `docs/PERFORMANCE_AUDIT_PROGRESS.md` (this new checkpoint)

No dependency updates, asset deletions/re-encoding, commits or deployment. No infrastructure/headers changes. The checkpoint exclusion is the only source adjustment made in this follow-up.

## Tests performed and measured results

- Baseline production build: 8 routes, success. Post-fix and final cleanup builds: 8 routes, success. Build-time speed difference is warm-cache noise, not claimed improvement.
- `git diff --check`: passed; Git warns about LF-to-CRLF normalization, not functional failure.
- Before/after browser matrices: `/`, `/cv/`, `/work/groaqua/`, `/work/wwf/`, `/about/` × desktop 1440×900, phone 390×844/DPR3/touch, tablet 1024×1366/DPR2/touch. Zero uncaught JavaScript errors in these samples.
- CV first-open images load; video plays expanded and pauses collapsed: passed.
- Home repeated desktop/phone round trips: active ScrollTriggers **14 → 14 → 14 → 14**.
- Deferred footer GPU initialization at footer: passed.
- Synthetic persisted pagehide/pageshow retains one Hero canvas: passed. Actual browser BFCache restoration not certified.
- Full-rail images load for all five work routes: passed.
- Dark/reduced-motion mobile Home/About/CV: passed.
- Existing `node --test cloudflare/contact/handler.test.mjs cloudflare/contact/pages.test.mjs`: 23 passed. Mocked; no live email delivery claim.
- Reviewed Home/CV/footer screenshots; no intended composition changes. Not exhaustive pixel equivalence at every frame.
- Public headers: Cloudflare confirmed, HTML Brotli confirmed, HTML max-age=0/must-revalidate; font one-year immutable; model ETag with revalidation policy.

| Metric | Before | After |
|---|---:|---:|
| CV initial subresource requests | 73 | 25 |
| CV initial subresource bytes | 15.527 MB | 0.917 MB |
| CV initial image bytes | 15.354 MB | 0.743 MB |
| GroAqua desktop initial subresource bytes | 1.328 MB | 0.438 MB |
| WWF desktop initial subresource bytes | 2.993 MB | 2.156 MB |
| Home desktop idle RAF callbacks /1.5 s | 819 | 552 |
| Total emitted raw JS (final inventory) | 2,005,342 B | 2,006,730 B |
| Sum of individually gzipped JS | 510,950 B | 511,413 B |

Local resource totals exclude document and ongoing transfers, include local response overhead, and do not represent CDN Brotli. The final cleanup removed 55 B raw JS after browser matrix collection. Final pre-checkpoint inline CSS sizes returned to baseline. All emitted JS includes dynamic/decoder assets, not just startup JS.

Important unresolved observation: broad baseline and after WWF desktop tests each summed layout shifts to 0.36849; separate focused run recorded none. This simple sum is not CWV session-window CLS. No cause or improvement established. Tablet Home summed 0.01948 both runs. Desktop Home LCP candidate observed as active-theme Hero image. No field CWV/Lighthouse/INP score given.

Memory evidence: caseta has two 4800×1440 textures (~55.3 MB RGBA base, ~73.7 MB with mipmaps before extra copies). IMAR1 is 6210×5666 (~140.7 MB RGBA). Three main actors total 7.60 MB encoded; their embedded images total ~0.256 MB, so do not assume texture compression solves their transfer cost.

## Remaining tasks and blockers

1. Reproduce WWF timing-dependent layout shift under controlled cold/throttled conditions with node/rectangle attribution. No layout change before evidence.
2. Physical iPad Safari regression: toolbar height, rubber-band scroll, orientation during pending GLB load, repeated About remount, gallery transitions, touch model open/close, context loss, actual BFCache return. Blocker: no physical Safari/iPad session available in current tooling.
3. Measure slow-network first-open CV/case media behavior, long tasks and interaction latency. Audit source-less deferred images' progressive fallback before considering broader reuse.
4. Quality-reviewed responsive gallery variants and model texture/animation-buffer experiments. Blocker: fidelity comparison required; no approved quality reduction or architectural rewrite.
5. Optional narrower optimizations after measurement: brand-stream visibility, font parity/self-hosting, shared CSS extraction and asset versioned caching. Do not alter deployment authority/DNS.
6. User supplies video 6 later. No action or repeated clarification needed now.
7. Full codec probe, real heap/GPU soak and field metrics remain unperformed. ffprobe absent; headless local browser timings are not substitutes.

No tool approval rejection or unresolved permission blocker occurred. Writes/builds in X:\MainWP require the environment's escalated shell path; previously approved concrete operations succeeded. Do not bypass sandbox restrictions.

## Exact next step to resume

Checkpoint creation is complete. Saved at the requested path; both Tailwind entry stylesheets exclude this exact file. Production build passed all 8 routes (1.71 s reported) and git diff --check passed after the checkpoint change. Existing large-chunk and line-ending warnings remain; no new failure. No audit work was restarted or reverted. No active audit server/process remains from the completed harnesses. The next substantive action is described below; checkpoint maintenance itself has no pending task.

For any subsequent substantive audit continuation: first read this file and the report, run `git status --short` to detect intervening user edits, then pursue **remaining task 1** only: create a new, separately named cold/throttled WWF shift-source trace based on `audit-detail.cjs`, recording layout-shift nodes/rectangles and initialization timing. Preserve baseline evidence and existing fixes. If the user supplies different steering, follow it. No need to rerun the whole audit or all previously passed tests without a new failure/change.

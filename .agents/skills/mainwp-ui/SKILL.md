---
name: mainwp-ui
description: Maintain the Leo Laguna MainWP portfolio's frontend, responsive layouts and interactive states. Applies only to this repository, not other websites.
---

# MainWP interface constraints

Read the repository AGENTS.md and inspect the current implementation. Continue existing changes without reverting or rebuilding finished features. The site uses Astro, custom CSS, GSAP/ScrollTrigger and Three.js; preserve its current visual identity, coral accents, typography, graphic wipes and intentional model overlaps unless the user requests a redesign.

- Responsive decisions should follow available width and height. Preserve useful reading sizes and control targets; allow reflow or local scroll when space is exhausted. Avoid fixes named for individual laptop resolutions.
- Services keeps the fixed zero, independently animated second digit, title and paragraph. Desktop copy uses two balanced lines where it fits, three where necessary for legibility. Mobile cards reserve room for navigation; dot visuals and touch areas differ.
- About desktop starts light on entry, then the theme toggle remains authoritative. The loader reads the current theme; preserve its existing logo geometry, timing and wipes. Do not reintroduce continuous light enforcement. Maintain the separate mobile/iPad experience.
- About biography and selection details stay readable, with local scrolling if needed; preserve Difference text blending and the 3D viewport. Confirm image containers cannot overlap descriptions.
- Keep legitimate coral timeline/playhead elements, gallery controls and reentry cleanup. Do not remove global coral styles to fix a local artifact.
- Work's final panel wraps according to available space; short portrait must not inherit a cramped two-column landscape layout. Keep lower links reachable.

Validate the affected component in EN/ES, relevant themes, short and tall proportions, and its interactive/resize states. Reuse prior evidence where applicable; do not restart the entire audit by default. Run npm run build for source changes. No commit, push or deploy without a new explicit user instruction.

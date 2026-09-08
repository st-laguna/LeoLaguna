import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenisInstance } from './smoothScroll';

// Nota: gsap.registerPlugin(ScrollTrigger) ya se ejecuta globalmente
// en scripts/parallax.js — no se repite acá.

let mainTrigger: ScrollTrigger | null = null;
let mobileTrackEl: HTMLElement | null = null;
let mobileScrollHandler: (() => void) | null = null;
let arrowClickHandlers: Array<{ el: HTMLElement; fn: () => void }> = [];
let dotClickHandlers: Array<{ el: HTMLElement; fn: () => void }> = [];
let cardCarousels: Array<() => void> = [];

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktop(): boolean {
	return window.matchMedia("(min-width: 1024px)").matches;
}

/* ============================================================
   🎞️ MINI-CAROUSEL dentro de cada carta (imágenes del proyecto)
============================================================ */
function setupCardCarousel(card: HTMLElement): () => void {
	const imgs = Array.from(card.querySelectorAll<HTMLElement>(".sw-card-img"));
	if (imgs.length <= 1) {
		return () => {};
	}

	let current = 0;
	let interval: ReturnType<typeof setInterval> | null = null;

	function showNext() {
		const next = (current + 1) % imgs.length;
		imgs[current].style.opacity = "0";
		imgs[next].style.opacity = "1";
		current = next;
	}

	function start() {
		if (interval) return;
		interval = setInterval(showNext, 2200);
	}

	function stop() {
		if (interval) { clearInterval(interval); interval = null; }
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) start();
				else stop();
			});
		},
		{ threshold: 0.4 }
	);
	observer.observe(card);

	return () => {
		stop();
		observer.disconnect();
	};
}

/* ============================================================
   🟣 DESKTOP — Secuencia pineada con ScrollTrigger
============================================================ */
function initDesktopSequence(section: HTMLElement) {
	ScrollTrigger.create({
	trigger: "#plankton-section",
	start: "center center",
	endTrigger: "#work",
	end: "top top",
	pin: true,
	pinSpacing: false,
	});
	const pin = section.querySelector<HTMLElement>(".sw-pin");
	const spacer = section.querySelector<HTMLElement>(".sw-scroll-spacer");
	const heroImgWrap = section.querySelector<HTMLElement>(".sw-hero-img-wrap");
	const heroFade = section.querySelector<HTMLElement>(".sw-hero-fade");
	const heroTitle = section.querySelector<HTMLElement>(".sw-hero-title");
	const panel = section.querySelector<HTMLElement>(".sw-panel");
	const track = section.querySelector<HTMLElement>(".sw-track");
	const cards = Array.from(section.querySelectorAll<HTMLElement>(".sw-card"));

	if (!pin || !spacer || !heroImgWrap || !heroFade || !heroTitle || !panel || !track || !cards.length) {
		return;
	}

	const totalCards = cards.length;

	function getCardStep(): number {
		const cardEl = cards[0];
		const cardRect = cardEl.getBoundingClientRect();
		const styles = window.getComputedStyle(cardEl);
		const marginLeft = parseFloat(styles.marginLeft) || 0;
		const marginRight = parseFloat(styles.marginRight) || 0;
		return cardRect.width + marginLeft + marginRight;
	}

	const tl = gsap.timeline({
		scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + window.innerHeight * 5,
            scrub: 1.1,
            pin: pin,
            pinSpacing: true,
            anticipatePin: 0.05,
            invalidateOnRefresh: true,
		},
	});

	mainTrigger = tl.scrollTrigger as ScrollTrigger;

	tl.fromTo(heroImgWrap,
        { width: "80vw", height: "70vh", maxWidth: "1440px", borderRadius: "28px" },
        { width: "100vw", height: "100vh", maxWidth: "100vw", borderRadius: "0px", ease: "none" },
        0
    );
    tl.fromTo(heroTitle,
        { clipPath: "inset(100% 0 0 0)", opacity: 1 },
        { clipPath: "inset(0% 0 0 0)", opacity: 1, duration: 0.1, ease: "none" },
        0.05
    );
    tl.to(heroTitle,
        { clipPath: "inset(0% 0 100% 0)", ease: "none", duration: 0.2 },
        0.34
    );
    tl.fromTo(panel,
        { y: "115vh" },
        { y: "0vh", ease: "none" },
        0.25
    );
    tl.to(heroFade, { opacity: 1, ease: "none" }, 0.15);
    tl.to(heroTitle, { opacity: 0, ease: "none" }, 0.25);

	const horizontalStart = 0.75;
	const horizontalSpan = 1 - horizontalStart;
	const stepSpan = horizontalSpan / (totalCards - 1);

	const progressLine = section.querySelector<HTMLElement>(".sw-progress-line");

    tl.fromTo(progressLine,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", transformOrigin: "left center", duration: horizontalSpan },
        horizontalStart
    );

    tl.to(progressLine,
        { scaleX: 0, transformOrigin: "right center", ease: "none", duration: 0.05 },
        0.99
    );

	cards.forEach((_, i) => {
		if (i === totalCards - 1) return;
		const stepStart = horizontalStart + i * stepSpan;
		tl.to(track, {
			x: () => -getCardStep() * (i + 1),
			ease: "none",
			duration: stepSpan,
		}, stepStart);
	});
}

/* ============================================================
   🟢 MOBILE — swipe nativo + flechas + dots
============================================================ */
function initMobileNav(section: HTMLElement) {
	const track = section.querySelector<HTMLElement>(".sw-track");
	const cards = Array.from(section.querySelectorAll<HTMLElement>(".sw-card"));
	const prevBtn = section.querySelector<HTMLElement>(".sw-nav-arrow--prev");
	const nextBtn = section.querySelector<HTMLElement>(".sw-nav-arrow--next");
	const dots = Array.from(section.querySelectorAll<HTMLElement>(".sw-dot"));

	if (!track || !cards.length) return;
	mobileTrackEl = track;

	function getActiveIndex(): number {
		const trackRect = track!.getBoundingClientRect();
		const center = trackRect.left + trackRect.width / 2;
		let closest = 0;
		let closestDist = Infinity;
		cards.forEach((card, i) => {
			const rect = card.getBoundingClientRect();
			const cardCenter = rect.left + rect.width / 2;
			const dist = Math.abs(cardCenter - center);
			if (dist < closestDist) { closestDist = dist; closest = i; }
		});
		return closest;
	}

	function updateUI() {
		const active = getActiveIndex();
		if (prevBtn) (prevBtn as HTMLButtonElement).disabled = active === 0;
		if (nextBtn) (nextBtn as HTMLButtonElement).disabled = active === cards.length - 1;
		dots.forEach((dot, i) => {
			dot.setAttribute("data-active", String(i === active));
		});
	}

	function goTo(index: number) {
		const clamped = Math.max(0, Math.min(cards.length - 1, index));
		const card = cards[clamped];
		track!.scrollTo({ left: card.offsetLeft - track!.offsetLeft, behavior: "smooth" });
	}

	mobileScrollHandler = () => {
		window.requestAnimationFrame(updateUI);
	};
	track.addEventListener("scroll", mobileScrollHandler, { passive: true });

	if (prevBtn) {
		const fn = () => goTo(getActiveIndex() - 1);
		prevBtn.addEventListener("click", fn);
		arrowClickHandlers.push({ el: prevBtn, fn });
	}
	if (nextBtn) {
		const fn = () => goTo(getActiveIndex() + 1);
		nextBtn.addEventListener("click", fn);
		arrowClickHandlers.push({ el: nextBtn, fn });
	}

	dots.forEach((dot, i) => {
		const fn = () => goTo(i);
		dot.addEventListener("click", fn);
		dotClickHandlers.push({ el: dot, fn });
	});

	updateUI();
}

/* ============================================================
   🚀 INIT / DESTROY
============================================================ */
const breakpointMql = window.matchMedia("(min-width: 1024px)");
let breakpointHandler: ((e: MediaQueryListEvent) => void) | null = null;

// ── NUEVO: handler para cambio de orientación dentro del mismo breakpoint ──
let orientationHandler: (() => void) | null = null;
let orientationTimer: ReturnType<typeof setTimeout> | null = null;

function initMobileSequence(section: HTMLElement) {
  const panel = section.querySelector<HTMLElement>(".sw-panel");
  const heroImgWrap = section.querySelector<HTMLElement>(".sw-hero-img-wrap");
  const heroTitle = section.querySelector<HTMLElement>(".sw-hero-title");
  const heroFade = section.querySelector<HTMLElement>(".sw-hero-fade");

  if (!panel || !heroImgWrap || !heroTitle || !heroFade) return;

  // Reset completo del estado visual antes de reanimar
  gsap.set(panel, { clearProps: "transform" });
  panel.style.transform = "translateY(100vh)";
  gsap.set(heroImgWrap, { clearProps: "all" });
  gsap.set(heroTitle, { clipPath: "inset(100% 0 0 0)", opacity: 1 });
  gsap.set(heroFade, { clearProps: "opacity" });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + window.innerHeight * 3,
      scrub: 1.2,
      pin: section.querySelector<HTMLElement>(".sw-pin"),
      pinSpacing: true,
      invalidateOnRefresh: true,
    }
  });

  tl.fromTo(heroImgWrap,
    { width: "75vw", height: "50vh", borderRadius: "20px" },
    { width: "100vw", height: "100vh", borderRadius: "0px", ease: "none" },
    0
  );
  tl.to(heroFade, { opacity: 1, ease: "none" }, 0.3);
  tl.to(heroTitle,
    { clipPath: "inset(0% 0 0 0)", ease: "none", duration: 0.2 },
    0.35
  );
  tl.to(heroTitle,
    { clipPath: "inset(0% 0 100% 0)", ease: "none", duration: 0.15 },
    0.6
  );
  tl.to(panel, { y: "0vh", ease: "none" }, 0.55);

  initMobileNav(section);
}

export function initSelectedWork() {
	destroySelectedWork();

	const section = document.getElementById("work");
	if (!section) return;

	const cards = Array.from(section.querySelectorAll<HTMLElement>(".sw-card"));
	cardCarousels = cards.map((card) => setupCardCarousel(card));

	if (prefersReducedMotion()) {
		section.classList.add("sw--reduced-motion");
	} else {
		section.classList.remove("sw--reduced-motion");

		if (isDesktop()) {
			initDesktopSequence(section);
		} else {
			initMobileSequence(section);
		}
	}

	// ── Breakpoint desktop ↔ mobile ──
	if (breakpointHandler) {
		breakpointMql.removeEventListener("change", breakpointHandler);
	}
	breakpointHandler = () => initSelectedWork();
	breakpointMql.addEventListener("change", breakpointHandler);

	// ── Orientación dentro de mobile (portrait ↔ landscape sin cruzar 1024px) ──
	if (orientationHandler) {
		window.removeEventListener("resize", orientationHandler);
	}

	let lastOrientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";

	orientationHandler = () => {
		// Debounce 150ms — espera que el viewport termine de recalcularse
		if (orientationTimer) clearTimeout(orientationTimer);
		orientationTimer = setTimeout(() => {
			const currentOrientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";

			// Solo actúa si cambió la orientación Y seguimos en mobile
			if (currentOrientation !== lastOrientation && !isDesktop()) {
				lastOrientation = currentOrientation;
				initSelectedWork();
			}
		}, 150);
	};

	window.addEventListener("resize", orientationHandler, { passive: true });
}

export function destroySelectedWork() {
	if (mainTrigger) {
		mainTrigger.kill();
		mainTrigger = null;
	}

	// Mata todos los ScrollTriggers activos para evitar triggers huérfanos
	ScrollTrigger.getAll().forEach(st => st.kill());

	if (mobileTrackEl && mobileScrollHandler) {
		mobileTrackEl.removeEventListener("scroll", mobileScrollHandler);
	}
	mobileTrackEl = null;
	mobileScrollHandler = null;

	arrowClickHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn));
	arrowClickHandlers = [];

	dotClickHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn));
	dotClickHandlers = [];

	cardCarousels.forEach((cleanup) => cleanup());
	cardCarousels = [];
}

export function teardownSelectedWork() {
	destroySelectedWork();

	if (breakpointHandler) {
		breakpointMql.removeEventListener("change", breakpointHandler);
		breakpointHandler = null;
	}

	// ── Limpiar listener de orientación al salir de la página ──
	if (orientationHandler) {
		window.removeEventListener("resize", orientationHandler);
		orientationHandler = null;
	}

	if (orientationTimer) {
		clearTimeout(orientationTimer);
		orientationTimer = null;
	}
}
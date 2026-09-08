const REVEAL_THRESHOLD = 0.0001;

interface StackCard {
  item: HTMLElement;
  header: HTMLElement;
  exploreMobile: HTMLElement | null;
  stepHeight: number;
}

let rafId: number | null = null;
let cards: StackCard[] = [];
let container: HTMLElement | null = null;
let track: HTMLElement | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildStack(): void {

  
  container = document.querySelector<HTMLElement>(".services-right");
  if (!container) return;

  const items = Array.from(
    container.querySelectorAll<HTMLElement>(".services-item")
  );
  if (items.length === 0) return;

  track = container.querySelector<HTMLElement>(".services-track");
  if (!track) return;

  const GAP = 56;

cards = items.map((item) => {
    const header = item.querySelector<HTMLElement>(".services-item-header");
    if (!header) {
      throw new Error(
        "servicesStack: .services-item-header no encontrado dentro de .services-item"
      );
    }
const exploreMobile = item.querySelector<HTMLElement>(".services-explore-mobile");
    return {
      item,
      header,
      exploreMobile,
      stepHeight: item.offsetHeight,
    };
  });

  // 🔵 CSS VARIABLES (FUERA DEL MAP)
  document.documentElement.style.setProperty(
    "--services-card-count",
    String(items.length)
  );

  document.documentElement.style.setProperty(
    "--services-card-gap",
    `${GAP}px`
  );

  // 🔵 HEIGHT TOTAL (FUERA DEL MAP)
  // Debe coincidir con la misma escala de tiempo que usa update():
  // cada transición ahora dura (cardHeight * 1.6) + triggerOffset,
  // no solo cardHeight. Si cambias el 1.6 en update(), cámbialo aquí también.
  const cardHeight = items[0]?.offsetHeight ?? 0;
  const SCROLL_MULTIPLIER = 1.6;
  const scrollDistance = cardHeight * SCROLL_MULTIPLIER;
  const triggerOffsetEstimate = (track?.offsetHeight ?? cardHeight) * 0.25;

  const totalHeight =
    scrollDistance * (items.length - 1) +
    triggerOffsetEstimate +
    GAP * (items.length + 1);

  document.documentElement.style.setProperty(
    "--services-total-height",
    `${totalHeight}px`
  );

  const cardHeightTablet = Math.round(cardHeight * 0.85);
const cardHeightMobile = Math.round(cardHeight * 0.75);

document.documentElement.style.setProperty(
  "--services-card-height",
  `${cardHeight}px`
);
document.documentElement.style.setProperty(
  "--services-card-height-tablet",
  `${cardHeightTablet}px`
);
document.documentElement.style.setProperty(
  "--services-card-height-mobile",
  `${cardHeightMobile}px`
);

}

function update(): void {
  rafId = null;
  if (!track || !container || cards.length === 0) return;

  const containerRect = container.getBoundingClientRect();

  // 🔵 estable en mobile (no depende de innerHeight)
  const triggerOffset = containerRect.height * 0.25;
  const rel = Math.max(0, -(containerRect.top - triggerOffset));

  const stageHeight =
    track?.offsetHeight ?? cards[0]?.item.offsetHeight ?? 0;

  cards.forEach((card, i) => {
    const { item, header } = card;

    const stepHeight = item.getBoundingClientRect().height;
    const scrollDistance = stepHeight * 1.6;

    const peek = header.getBoundingClientRect().height;

    if (i === 0) {
      item.style.transform = "translateY(0px)";
      header.style.transform = "translateY(0%)";
      return;
    }

    // Mismo colchón inicial para TODAS las transiciones, no solo la primera.
    const start = (i - 1) * scrollDistance + triggerOffset;

    let progress = (rel - start) / scrollDistance;
    progress = Math.max(0, Math.min(1, progress));

    const yPos =
      (1 - progress) * stageHeight +
      progress * (peek * i);

    item.style.transform = `translateY(${Math.max(
      peek * i,
      yPos
    )}px)`;

    const headerReveal =
      progress > 0.3 ? 1 : progress / 0.3;

    header.style.transform = `translateY(${
      -100 * (1 - headerReveal)
    }%)`;

    // El "Explore" de la card ANTERIOR (i - 1) se oculta a medida que
    // esta card (i) empieza a cubrirla.
    const prevExplore = cards[i - 1]?.exploreMobile;
    if (prevExplore) {
      const isVisible = progress < 0.15;
      prevExplore.classList.toggle("is-visible", isVisible);
    }

    // La ÚLTIMA card siempre puede mostrar su propio "Explore"
    // mientras nadie la está cubriendo (no tiene card siguiente).
    if (i === cards.length - 1 && card.exploreMobile) {
      card.exploreMobile.classList.add("is-visible");
    }
  });
}

function onScroll(): void {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(update);
}

function teardown(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  window.removeEventListener("scroll", onScroll);
  cards.forEach(({ item, header }) => {
    item.style.transform = "";
    header.style.transform = "";
  });
  cards = [];
  container = null;
  track = null;
}

export function initServicesStack(): void {
  teardown();

  const section = document.getElementById("services");
  if (!section) return;

  if (prefersReducedMotion()) {
    section.classList.add("services--reduced-motion");
    return;
  }

  section.classList.remove("services--reduced-motion");
  
  // Forzar reflow para que CSS mobile esté aplicado
  requestAnimationFrame(() => {
    buildStack();
    if (cards.length === 0) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, { passive: true });
  });
}

export function destroyServicesStack(): void {
  teardown();
}
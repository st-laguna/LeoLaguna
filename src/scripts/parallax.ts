import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   🧹 DESTROY — limpia todo antes de reinicializar
============================================================ */
export const destroyAnimations = () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    gsap.killTweensOf(".process-stages-contain");
    gsap.killTweensOf(".process-stages-overlay");
    gsap.killTweensOf(".layer");
};

/* ============================================================
   🟠 STICKY CARDS
   Secuencia por carta:
   - Entra desde abajo (translateY 100% → 0%)
   - Se queda visible
   - Cuando llega la siguiente, se achica y oscurece (va "atrás")
============================================================ */
export const initStickyCards = () => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) return;

    const collection = document.querySelector<HTMLElement>(".process-stages-collection");
    const items = document.querySelectorAll<HTMLElement>(".process-stages-item");
    if (!collection || !items.length) return;

    const totalCards = items.length;

    // Cada carta ocupa 1/totalCards del scroll total
    // Dividimos ese espacio en dos mitades:
    //   - primera mitad: la carta entra (sube desde abajo)
    //   - segunda mitad: la carta anterior se achica y oscurece

    items.forEach((item, index) => {
        const contain = item.querySelector<HTMLElement>(".process-stages-contain");
        const overlay = item.querySelector<HTMLElement>(".process-stages-overlay");
        if (!contain || !overlay) return;

        const randomRotZ = (Math.random() - 0.5) * 6;

        // Posición inicial: todas las cartas excepto la primera fuera de pantalla
        if (index > 0) {
            gsap.set(contain, { y: "100%" });
        }

        // ── ENTRADA: esta carta sube desde abajo ──────────────────
        // Solo cartas 2, 3 y 4 (index > 0)
        if (index > 0) {
            const enterStart = `${((index - 0.5) / totalCards) * 100}% top`;
            const enterEnd   = `${(index / totalCards) * 100}% top`;

            gsap.to(contain, {
                y: "0%",
                ease: "none",
                scrollTrigger: {
                    trigger: collection,
                    start: enterStart,
                    end: enterEnd,
                    scrub: 1,
                },
            });
        }

        // ── SALIDA: esta carta se achica y oscurece ───────────────
        // Todas excepto la última (index < totalCards - 1)
        if (index < totalCards - 1) {
            const exitStart = `${(index / totalCards) * 100}% top`;
            const exitEnd   = `${((index + 0.5) / totalCards) * 100}% top`;

            gsap.to(overlay, {
                opacity: 0.6,
                ease: "none",
                scrollTrigger: {
                    trigger: collection,
                    start: exitStart,
                    end: exitEnd,
                    scrub: 1,
                },
            });

            gsap.to(contain, {
                scale: 0.88,
                rotationX: 8,
                rotationZ: randomRotZ,
                ease: "none",
                scrollTrigger: {
                    trigger: collection,
                    start: exitStart,
                    end: exitEnd,
                    scrub: 1,
                },
            });
        }
    });
};

/* ============================================================
   🟢 PARALLAX HERO
============================================================ */
export function initParallax() {
    document.querySelectorAll<HTMLElement>(".layer").forEach((layer) => {
        const speed = Number(layer.dataset.speed);

        gsap.to(layer, {
            y: () => -(window.innerHeight * speed),
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true,
            },
        });
    });
}

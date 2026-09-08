import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export let lenisInstance: Lenis | null = null;

export function initSmoothScroll() {
  if (window.matchMedia("(max-width: 1023px)").matches) return;
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.08,
    smoothWheel: true,
  });

  lenisInstance = lenis;

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.addEventListener("refresh", () => lenis.resize());
  ScrollTrigger.refresh();

  return () => {
    lenis.destroy();
    lenisInstance = null;
  };
}
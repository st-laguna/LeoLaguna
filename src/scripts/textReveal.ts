import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initTextReveal() {
    const texts = gsap.utils.toArray<HTMLElement>(".text");

    texts.forEach((text) => {
        gsap.to(text, {
            backgroundSize: "100%",
            ease: "none",
            scrollTrigger: {
                trigger: text,
                start: "top 80%",
                end: "top 80%",
                scrub: true,
            },
        });
    });
}
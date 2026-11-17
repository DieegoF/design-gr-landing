// Scroll suave (Lenis) sincronizado con GSAP ScrollTrigger.
// Solo en el navegador y solo si el visitante no pidió reducir animaciones.
// En pantallas táctiles Lenis no toca el scroll nativo (syncTouch apagado).
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function startSmooth() {
  if (lenis || typeof window === "undefined") return lenis;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.085,
    wheelMultiplier: 0.95,
    // el panel del asistente tiene su propio scroll: que siga funcionando
    allowNestedScroll: true,
    // la rueda sobre un 3D interactivo es zoom, no scroll de la página
    prevent: (node) => node.tagName === "CANVAS" || node.hasAttribute("data-lenis-prevent"),
  });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (t: number) => lenis?.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Desplazamiento a un elemento o a una posición, suave si Lenis está activo. */
export function scrollSuave(target: HTMLElement | number) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.3 });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth", block: "start" });
}

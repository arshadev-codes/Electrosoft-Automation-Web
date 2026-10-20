import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let active: Lenis | null = null;

/** Scroll the page to `y`, through Lenis when it's running so the two never fight. */
export function scrollToY(y: number) {
  if (active) active.scrollTo(y, { duration: 0.9 });
  else window.scrollTo({ top: y });
}

/** Inertial page scroll, driven by the GSAP ticker so ScrollTrigger scrubs stay in sync. */
export function useSmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, touchMultiplier: 1.4 });
    active = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      active = null;
    };
  }, []);
}

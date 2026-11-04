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

/** Jump to `y` with no easing (behind the page transition's veil). */
export function jumpToY(y: number) {
  if (active) active.scrollTo(y, { immediate: true, force: true });
  window.scrollTo({ top: y });
}

/** Freeze or release wheel and touch scrolling (while a page transition runs). */
export function holdScroll(on: boolean) {
  if (!active) return;
  if (on) active.stop();
  else active.start();
}

/**
 * ScrollTriggers must be measured top to bottom: each one's position depends on the pin spacers above it.
 * A section built with gsap.matchMedia (Report's pin, Lineup's deal) is rebuilt when the screen crosses a
 * breakpoint (a tablet turning, a window resized), and the rebuilt triggers land at the end of the list,
 * so everything below them was measured without their pin (Why sat in its exit haze, ~2400 px early).
 * Sorting by page order before every refresh keeps creation order from mattering.
 */
function sortByPage() {
  const all = ScrollTrigger.getAll();
  const els = [...new Set(all.map(t => t.trigger).filter((el): el is Element => !!el && el.isConnected))]
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const at = new Map(els.map((el, i) => [el, i]));
  // no trigger element (whole-page progress): first, as created; same element: creation order (stable sort)
  ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => (at.get(a.trigger as Element) ?? -1) - (at.get(b.trigger as Element) ?? -1));
}

/** Inertial page scroll, driven by the GSAP ticker so ScrollTrigger scrubs stay in sync. */
export function useSmoothScroll() {
  useEffect(() => {
    ScrollTrigger.addEventListener('refreshInit', sortByPage);
    // content that changes height after the last measure (a section re-laid out by React at a breakpoint,
    // late fonts or images) leaves every trigger below it stale: re-measure once the page settles.
    // Only a height the last refresh didn't produce counts, so a refresh never re-triggers itself.
    const page = document.getElementById('root') ?? document.body;
    let known = page.offsetHeight, wait = 0;
    const measured = () => { known = page.offsetHeight; };
    const ro = new ResizeObserver(() => {
      if (page.offsetHeight === known) return;
      window.clearTimeout(wait);
      wait = window.setTimeout(() => { if (page.offsetHeight !== known) ScrollTrigger.refresh(); }, 180);
    });
    ScrollTrigger.addEventListener('refresh', measured);
    ro.observe(page);
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', sortByPage);
      ScrollTrigger.removeEventListener('refresh', measured);
      ro.disconnect(); window.clearTimeout(wait);
    };
  }, []);

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

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, type Location } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { holdScroll, jumpToY, scrollToY } from '../hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

const NAMES: Record<string, string> = {
  '/': 'Home', '/about': 'About', '/products': 'Products', '/transformer-testing': 'Testing Solutions', '/projects': 'Projects',
  '/gallery': 'Gallery', '/contact': 'Contact', '/track': 'Track your order', '/privacy-policy': 'Privacy Policy',
};

let pending: Promise<unknown> | null = null;
/**
 * A page that needs a moment before it looks right (the hero's 3D bay) calls this while it mounts;
 * the sheet then holds on the destination's name until the promise settles, for 1.8 s at most.
 */
export function holdReveal(ready: Promise<unknown>) { pending = ready; }

/** Where a hash link should land: its target just under the header, or the top of the page. */
function targetY(hash: string) {
  const el = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  return el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 96) : 0;
}

/*
 * Page change: a scan sweep. A sheet of page-coloured drafting paper rises over the page behind a
 * glowing brand line, the destination's name shows for a beat, the route swaps underneath, and the
 * sheet sweeps on up and away to uncover the new page. Links within the same page just scroll.
 */
export default function PageTransition({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const veil = useRef<HTMLDivElement>(null), line = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null), name = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (location.key === shown.key) return;
    if (location.pathname === shown.pathname) {
      setShown(location);
      scrollToY(targetY(location.hash));
      return;
    }
    const swap = () => {
      pending = null;
      flushSync(() => setShown(location));
      jumpToY(targetY(location.hash));
      ScrollTrigger.refresh();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { swap(); return; }
    let live = true;
    // after the swap: wait for the new page if it asked, then uncover it
    const hold = () => {
      const wait = pending;
      if (!wait) return;
      tl.pause();
      Promise.race([wait, new Promise(r => setTimeout(r, 1800))]).then(() => { if (live) tl.resume(); });
    };

    const v = veil.current!, l = line.current!;
    name.current!.textContent = NAMES[location.pathname] ?? '';
    holdScroll(true);
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { gsap.set([v, l], { visibility: 'hidden' }); holdScroll(false); } });
    // cover: the sheet's top edge rises with the line on it
    tl.set([v, l], { visibility: 'visible' })
      .fromTo(v, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55 }, 0)
      .fromTo(l, { top: '100%' }, { top: '0%', duration: 0.55 }, 0)
      .fromTo(label.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.32)
      .call(swap, undefined, 0.62)
      .call(hold, undefined, 0.66)
    // uncover: the sheet's bottom edge rises the same way, the new page appearing beneath it
      .to(label.current, { opacity: 0, y: -14, duration: 0.25, ease: 'power2.in' }, 0.74)
      .to(v, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.65 }, 0.82)
      .fromTo(l, { top: '100%' }, { top: '0%', duration: 0.65 }, 0.82);
    // a newer navigation mid-sweep: drop this one; the next effect starts from the page on screen
    return () => { live = false; tl.kill(); gsap.set([v, l], { visibility: 'hidden' }); holdScroll(false); };
  }, [location]); // `shown` is read, not watched: only a new location starts a transition

  return (
    <>
      {children(shown)}
      <div className="pt-veil" ref={veil} aria-hidden="true">
        <span className="pt-name" ref={label}><svg viewBox="0 0 16 22"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="currentColor" /></svg><span ref={name} /></span>
      </div>
      <div className="pt-line" ref={line} aria-hidden="true" />
    </>
  );
}

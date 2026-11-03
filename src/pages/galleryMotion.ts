import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { magnetic } from '../hooks/magnetic';

gsap.registerPlugin(ScrollTrigger);

/*
 * /gallery motion:
 *   hero  — the headline rises and a light runs across it; tabs and chips follow
 *   wall  — each print opens like a camera shutter (blades part from the middle, a flash fades; CSS
 *           .on) as it scrolls in, a row at a time
 *   (the filter's rearranging and the viewer live in Gallery.tsx)
 * Reduced motion: every print open.
 */
export function createGalleryMotion(root: HTMLElement, reduce: boolean) {
  const items = gsap.utils.toArray<HTMLElement>('.gl-item', root);
  if (reduce) { items.forEach(i => i.classList.add('on')); return; }
  const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);

  gsap.timeline({ delay: 0.1 })
    .fromTo($('.gl-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out' }, 0)
    .fromTo($('.gl-h1 .ln > span'), { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, ease: 'power2.inOut' }, 0.7)
    .fromTo($('.gl-lede, .gl-tabs'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.2)
    .fromTo($('.gl-chips button'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.03, ease: 'power2.out', clearProps: 'opacity,transform' }, 0.45);

  ScrollTrigger.batch(items, {
    start: 'top 92%', once: true,
    onEnter: batch => batch.forEach((el, i) => gsap.delayedCall(i * 0.09, () => el.classList.add('on'))),
  });

  return magnetic(root.querySelector<HTMLElement>('.pr-cta .pill'));
}

/** After the filter rearranges the wall: open any print now on screen, and re-measure. */
export function revealNew(grid: HTMLElement) {
  ScrollTrigger.refresh();
  grid.querySelectorAll<HTMLElement>('.gl-item:not(.gone):not(.on)').forEach((el, i) => {
    if (el.getBoundingClientRect().top < window.innerHeight) gsap.delayedCall(i * 0.06, () => el.classList.add('on'));
  });
}

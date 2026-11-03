import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { magnetic } from '../hooks/magnetic';

gsap.registerPlugin(ScrollTrigger);

/*
 * /projects motion: the register as a stack of drawing sheets.
 *   hero   — the headline rises and a light runs across it (first load only)
 *   stack  — sheets are sticky (CSS), each laid on the one before; as a sheet comes over, the one
 *            beneath settles back a little and dims, like paper under paper
 *   sheet  — when it arrives: a site photo develops (from over-exposed and soft to sharp), or the
 *            transformer is drawn line by line and its bushings light R Y B (CSS, .on); the photo
 *            pushes in slowly while its sheet is on top
 *   filter — the new stack is dealt in (sheetsIn)
 * Reduced motion: sheets still stack (that is layout), everything else in its final state.
 */
export function createProjectsMotion(root: HTMLElement, reduce: boolean, intro: boolean) {
  const sheets = gsap.utils.toArray<HTMLElement>('.pj-sheet', root);
  // A sheet taller than the space under the header could never show its foot while stuck, so each
  // sheet sticks no lower than "its bottom 16px above the screen's bottom" (phones, short laptops).
  const fit = () => sheets.forEach(s => {
    s.style.top = '';
    const css = parseFloat(getComputedStyle(s).top) || 0;
    s.style.top = `${Math.min(css, window.innerHeight - s.offsetHeight - 16)}px`;
  });
  fit();
  window.addEventListener('resize', fit);
  const unfit = () => { window.removeEventListener('resize', fit); sheets.forEach(s => { s.style.top = ''; }); };

  if (reduce) { sheets.forEach(s => s.classList.add('on')); return unfit; }

  const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);
  if (intro) {
    gsap.timeline({ delay: 0.1 })
      .fromTo($('.pj-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0)
      .fromTo($('.pj-h1 .ln > span'), { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0.7)
      .fromTo($('.pj-lede, .pj-bar'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.2)
      .fromTo($('.pj-index li'), { opacity: 0, y: 24, rotate: -3 }, { opacity: 1, y: 0, rotate: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, 0.45);
  } else {
    gsap.fromTo($('.pj-index li'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'expo.out' });
  }

  sheets.forEach((s, i) => {
    ScrollTrigger.create({ trigger: s, start: 'top 72%', once: true, onEnter: () => s.classList.add('on') });
    const img = s.querySelector('img');
    if (img) gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    const next = sheets[i + 1];
    if (next) {
      const top = parseFloat(next.style.top) || 0;
      gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: `top ${top}px`, scrub: true } })
        .to(s, { scale: 0.94, ease: 'none' }, 0)
        .to(s.querySelector('.pj-dim'), { opacity: 1, ease: 'none' }, 0);
    }
  });

  const off = magnetic(root.querySelector<HTMLElement>('.pr-cta .pill'));
  return () => { off(); unfit(); };
}

/** After a filter change: the new stack is dealt onto the desk. */
export function sheetsIn(root: HTMLElement, reduce: boolean) {
  if (reduce) return;
  gsap.fromTo(gsap.utils.toArray<HTMLElement>('.pj-sheet', root).slice(0, 2),
    { y: 60, opacity: 0, rotate: 1.2 }, { y: 0, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out', clearProps: 'transform,opacity' });
}

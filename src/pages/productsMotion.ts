import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { magnetic } from '../hooks/magnetic';

gsap.registerPlugin(ScrollTrigger);

/*
 * Products page motion, in the switchboard's own terms:
 *   hero  — the headline rises and a light runs across it, then the single-line diagram draws itself
 *           (incomer, then the busbar), the range energises feeder by feeder as each breaker snaps
 *           shut and the counter climbs; once all are live, current keeps flowing through the diagram
 *   board — the vertical busbar fills with current as you read down, a spark riding its leading edge;
 *           each section's node lights as you reach it; each product's breaker closes, current runs
 *           out to it, viewfinder brackets lock onto the photo while it scans from a blueprint ghost
 *           into colour, the text rises and the key points tick off. Photos drift against the scroll
 *           and sink into the paper haze as they leave
 *   cta   — the button pulls toward the pointer; hovering it closes the last, open feeder (CSS)
 * Reduced motion: everything energised and in place from the start.
 */
export function createProductsMotion(root: HTMLElement, reduce: boolean) {
  const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);
  const drops = $('.sld-group li'), secs = $('.pr-sec'), items = $('.pr-item');
  const sld = root.querySelector<HTMLElement>('.sld'), count = root.querySelector<HTMLElement>('.sld-hud b');

  if (reduce) {
    [...drops, ...secs, ...items, ...$('.pr-pts li')].forEach(el => el.classList.add('on'));
    sld?.classList.add('is-live');
    if (count) count.textContent = String(drops.length);
    return;
  }

  // hero
  let lit = 0;
  const hero = gsap.timeline({ delay: 0.1 })
    .fromTo($('.pr-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0)
    .fromTo($('.pr-h1 .ln > span'), { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0.7)
    .fromTo($('.pr-lede'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
    .fromTo($('.sld-in [pathLength]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, stagger: 0.06, ease: 'power2.inOut' }, 0.35)
    .fromTo($('.sld-bus'), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0.85)
    .fromTo($('.sld-hud'), { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 0.9)
    .fromTo($('.sld-cat'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, 1.05);
  // each feeder drops off the bus with its breaker open, then the breaker snaps shut
  drops.forEach((d, i) => {
    const at = 1.15 + i * 0.07;
    hero.fromTo(d.querySelectorAll('svg, a > span:not(.sld-peek)'), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }, at)
      .call(() => { d.classList.add('on'); if (count) count.textContent = String(++lit); }, undefined, at + 0.22);
  });
  hero.call(() => sld?.classList.add('is-live'), undefined, 1.15 + drops.length * 0.07 + 0.3);

  // board: current down the busbar, scrubbed to the reading position, a spark on its leading edge
  const board = root.querySelector('.pr-board');
  const busST = { trigger: board, start: 'top 55%', end: 'bottom 55%', scrub: true };
  gsap.fromTo($('.pr-bus i'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: busST });
  const spark = root.querySelector<HTMLElement>('.pr-spark');
  if (spark) gsap.fromTo(spark, { top: '0%' }, {
    top: '100%', ease: 'none',
    scrollTrigger: { ...busST, onUpdate: s => gsap.set(spark, { opacity: s.progress > 0.002 && s.progress < 0.998 ? 1 : 0 }) },
  });
  secs.forEach(s => ScrollTrigger.create({
    trigger: s, start: 'top 72%',
    onEnter: () => s.classList.add('on'), onLeaveBack: () => s.classList.remove('on'),
  }));

  items.forEach(item => {
    const q = (s: string) => item.querySelectorAll(s);
    const pts = gsap.utils.toArray<HTMLElement>(q('.pr-pts li'));
    const tl = gsap.timeline({ paused: true })
      .call(() => item.classList.add('on'), undefined, 0) // breaker closes, feeder goes live (CSS)
      .fromTo(q('.pr-crop'), { scale: 1.14, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.2)
      .fromTo(q('.pr-grid'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0.15)
      .fromTo(q('.pr-live'), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.3)
      .fromTo(q('.pr-scan'), { top: '0%', opacity: 1 }, { top: '100%', duration: 1, ease: 'power2.inOut', immediateRender: false }, 0.3)
      .to(q('.pr-scan'), { opacity: 0, duration: 0.25 }, 1.2)
      .to(q('.pr-grid'), { opacity: 0, duration: 0.6 }, 1.15)
      .to(q('.pr-crop'), { opacity: 0.3, duration: 0.8, ease: 'power1.inOut' }, 1.5)
      .fromTo(q('.pr-txt .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.15)
      .fromTo(q('.pr-txt > :not(h3):not(.pr-pts)'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' }, 0.25);
    // the key points tick off one by one, like a test sheet
    pts.forEach((li, i) => {
      const at = 0.5 + i * 0.14;
      tl.fromTo(li, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' }, at)
        .call(() => li.classList.add('on'), undefined, at + 0.1);
    });
    ScrollTrigger.create({ trigger: item, start: 'top 80%', once: true, onEnter: () => tl.play() });

    // the photo drifts against the scroll, then sinks into the paper haze as it leaves the top
    const shot = item.querySelector('.pr-shot'), txt = item.querySelector('.pr-txt');
    gsap.fromTo(shot, { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.timeline({ scrollTrigger: { trigger: item, start: 'bottom 32%', end: 'bottom top', scrub: true } })
      .to(shot, { opacity: 0.15, scale: 0.95, ease: 'none' }, 0)
      .to(txt, { opacity: 0.15, y: -24, ease: 'none' }, 0);
  });

  // cta: a magnetic button
  const off = magnetic(root.querySelector<HTMLElement>('.pr-cta .pill'));

  return () => { hero.kill(); off(); };
}

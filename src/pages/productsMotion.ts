import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * Products page motion, in the switchboard's own terms:
 *   hero  — the headline rises, then the single-line diagram draws itself (incomer, then the busbar),
 *           and the range energises feeder by feeder as each breaker snaps shut
 *   board — the vertical busbar fills with current as you read down; each section's node lights as
 *           you reach it; each product's breaker closes, current runs out to it, its photo scans from
 *           a blueprint ghost into full colour and its text rises in
 * Reduced motion: everything energised and in place from the start.
 */
export function createProductsMotion(root: HTMLElement, reduce: boolean) {
  const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);
  const drops = $('.sld-group li'), secs = $('.pr-sec'), items = $('.pr-item');

  if (reduce) {
    [...drops, ...secs, ...items].forEach(el => el.classList.add('on'));
    return;
  }

  // hero
  const hero = gsap.timeline({ delay: 0.1 })
    .fromTo($('.pr-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0)
    .fromTo($('.pr-lede'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
    .fromTo($('.sld-in [pathLength]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, stagger: 0.06, ease: 'power2.inOut' }, 0.35)
    .fromTo($('.sld-bus'), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0.85)
    .fromTo($('.sld-cat'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, 1.05);
  // each feeder drops off the bus with its breaker open, then the breaker snaps shut
  drops.forEach((d, i) => {
    const at = 1.15 + i * 0.07;
    hero.fromTo(d.querySelectorAll('svg, span'), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }, at)
      .call(() => d.classList.add('on'), undefined, at + 0.22);
  });

  // board: current down the busbar, scrubbed to the reading position
  gsap.fromTo($('.pr-bus i'), { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: root.querySelector('.pr-board'), start: 'top 55%', end: 'bottom 55%', scrub: true },
  });
  secs.forEach(s => ScrollTrigger.create({
    trigger: s, start: 'top 72%',
    onEnter: () => s.classList.add('on'), onLeaveBack: () => s.classList.remove('on'),
  }));

  items.forEach(item => {
    const q = (s: string) => item.querySelectorAll(s);
    const tl = gsap.timeline({ paused: true })
      .call(() => item.classList.add('on'), undefined, 0) // breaker closes, feeder goes live (CSS)
      .fromTo(q('.pr-live'), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, 0.3)
      .fromTo(q('.pr-scan'), { top: '0%', opacity: 1 }, { top: '100%', duration: 1, ease: 'power2.inOut', immediateRender: false }, 0.3)
      .to(q('.pr-scan'), { opacity: 0, duration: 0.25 }, 1.2)
      .fromTo(q('.pr-txt .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.15)
      .fromTo(q('.pr-txt > :not(h3)'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' }, 0.25);
    ScrollTrigger.create({ trigger: item, start: 'top 80%', once: true, onEnter: () => tl.play() });
  });

  return () => hero.kill();
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { magnetic } from '../hooks/magnetic';

gsap.registerPlugin(ScrollTrigger);

export const FROM = 1989;
export const YEAR = new Date().getFullYear();

/*
 * /about motion:
 *   hero    — the headline rises and a light runs across it; the meter's register rolls from 1989 to
 *             this year, the low drums spinning more turns, while its disc keeps turning (CSS)
 *   journey — revision A is drawn as the sheet arrives; then, pinned, the scroll draws revisions B, C
 *             and D onto the same sheet (D stamps the approvals), snapping to each revision
 *   route   — the line fills down the route with the order riding its head; each station lights as it
 *             is reached, quality checks stamp Pass (CSS)
 *   infra   — the lights come on over the office and the workshop (CSS flicker), photos drift
 *   certs   — the stamps press onto the page one after another
 * Reduced motion: final state, revisions picked with the buttons.
 */
export function createAboutMotion(root: HTMLElement, reduce: boolean, onRev: (k: number) => void) {
  const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);
  const one = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);
  const steps = $('.rt-step'), infs = $('.inf');

  // route: the newest station reached is the current one (.cur); the status bar follows it
  const status = one('.rt-status'), segs = status ? gsap.utils.toArray<HTMLElement>(status.querySelectorAll('.rt-segs i')) : [];
  const syncRoute = () => {
    let k = -1;
    steps.forEach((s, i) => { if (s.classList.contains('on')) k = i; });
    steps.forEach((s, i) => s.classList.toggle('cur', i === k));
    segs.forEach((g, i) => { g.classList.toggle('on', i <= k); g.classList.toggle('cur', i === k); });
    const b = status?.querySelector('b');
    if (b && k >= 0) b.textContent = steps[k].dataset.label ?? '';
    status?.classList.toggle('show', k >= 0);
  };

  if (reduce) {
    [...steps, ...infs].forEach(el => el.classList.add('on'));
    syncRoute();
    return;
  }

  // hero
  gsap.timeline({ delay: 0.1 })
    .fromTo($('.ab-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0)
    .fromTo($('.ab-h1 .ln > span'), { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0.7)
    .fromTo($('.ab-lede'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
    .fromTo($('.mtr'), { opacity: 0, y: 30, rotateX: 8 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: 'expo.out' }, 0.15);
  // the register: each drum runs from its 1989 digit to this year's, the lower ones turning more
  const from = String(FROM).split('').map(Number), to = String(YEAR).split('').map(Number);
  $('.drum .strip').forEach((strip, i) => {
    let end = to[i] + 10 * i;
    while (end <= from[i]) end += 10;
    gsap.to(strip, { '--d': end, duration: 1.3 + i * 0.4, delay: 0.7, ease: 'power3.inOut' });
  });
  const years = one('.mtr-read b'), n = { v: 0 };
  gsap.to(n, { v: YEAR - FROM, duration: 2.5, delay: 0.7, ease: 'power3.inOut', onUpdate: () => { if (years) years.textContent = String(Math.round(n.v)); } });

  // journey: revision A as the sheet arrives
  const jr = one('.ab-jr');
  const layers = gsap.utils.toArray<SVGGElement>(root.querySelectorAll('.sheet .lyr'));
  const lp = (k: number) => layers[k] ? gsap.utils.toArray<SVGElement>(layers[k].querySelectorAll('[pathLength]')) : [];
  gsap.fromTo(lp(0), { strokeDashoffset: 1 }, {
    strokeDashoffset: 0, stagger: 0.04, ease: 'none',
    scrollTrigger: { trigger: jr, start: 'top 85%', end: 'top 15%', scrub: 0.5 },
  });
  // then pinned: B, C, D drawn by the scroll
  const stamps = layers[3] ? gsap.utils.toArray<SVGGElement>(layers[3].querySelectorAll('.stp')) : [];
  let last = -1;
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'ab-jr', trigger: jr, start: 'top top', end: '+=300%', pin: true, anticipatePin: 1, scrub: 0.5,
      snap: { snapTo: 1 / 3, duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut' },
      onUpdate: s => { const k = Math.round(s.progress * 3); if (k !== last) { last = k; onRev(k); } },
    },
  });
  tl.fromTo(lp(1), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.05, duration: 0.5, ease: 'none' }, 0.1)
    .fromTo(lp(2), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.05, duration: 0.5, ease: 'none' }, 1.1)
    .fromTo(stamps, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', stagger: 0.18, duration: 0.3, ease: 'power4.in' }, 2.15)
    .set({}, {}, 3);

  // route: the order rides the head of the line; stations light as it reaches them
  const rt = one('.rt'), tok = one('.rt-tok');
  const rtST = { trigger: rt, start: 'top 60%', end: 'bottom 60%', scrub: true };
  gsap.fromTo($('.rt-line i'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: rtST });
  if (tok) gsap.fromTo(tok, { top: '0%' }, {
    top: '100%', ease: 'none',
    scrollTrigger: { ...rtST, onUpdate: s => gsap.set(tok, { opacity: s.progress > 0.002 && s.progress < 0.998 ? 1 : 0 }) },
  });
  steps.forEach(s => ScrollTrigger.create({
    trigger: s, start: 'top+=34 60%',
    onEnter: () => { s.classList.add('on'); syncRoute(); },
    onLeaveBack: () => { s.classList.remove('on'); syncRoute(); },
  }));

  // infrastructure: lights on, then a slow drift
  infs.forEach(f => {
    ScrollTrigger.create({ trigger: f, start: 'top 72%', once: true, onEnter: () => f.classList.add('on') });
    gsap.fromTo(f.querySelector('figure'), { yPercent: 5 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // certifications: stamped one after another
  gsap.timeline({ scrollTrigger: { trigger: one('.stamps'), start: 'top 78%', once: true } })
    .fromTo($('.stamp'), { opacity: 0, scale: 1.7 }, { opacity: 0.92, scale: 1, duration: 0.32, stagger: 0.2, ease: 'power4.in' })
    .fromTo($('.stamps a'), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power1.out' }, 0.5);

  return magnetic(one('.pr-cta .pill'));
}

/** Scroll position that shows revision k (0 A … 3 D). */
export function revScrollY(k: number) {
  const st = ScrollTrigger.getById('ab-jr');
  return st ? st.start + (st.end - st.start) * (k / 3) : null;
}

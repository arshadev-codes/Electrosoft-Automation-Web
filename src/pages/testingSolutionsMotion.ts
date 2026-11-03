import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { magnetic } from '../hooks/magnetic';

gsap.registerPlugin(ScrollTrigger);

/** Live values XfmrScene reads every frame: haze in (load) / out (scroll away), bushing glow. */
export const ts = { hazeIn: 1, hazeOut: 0, glow: 0 };

/*
 * /transformer-testing motion, one moment per section, each in the test floor's own terms:
 *   hero    — the headline rises while the transformer comes up out of the paper haze and is energised;
 *             scrolling away sinks it back into the page
 *   modes   — pinned: scrolling turns the selector switch AUTO → SEMI → MAN, snapping to each position
 *   signal  — a reading travels the wire from the bench to the buyer, scrubbed; each stop lights as it passes
 *   tests   — each row of the test sheet is checked off as it reaches the reading line
 *   ratings — a needle sweeps up the MVA scale reading out as it goes, lighting each project as it
 *             passes its rating; each nameplate catches the light once as it arrives
 *   cta     — the button pulls toward the pointer
 * Reduced motion: everything in its finished state, the switch turned by its buttons.
 */
export function createTestingSolutionsMotion(root: HTMLElement, reduce: boolean, onMode: (i: number) => void) {
  const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);
  const one = (s: string) => root.querySelector<HTMLElement>(s);
  const stops = $('.ts-stop'), rows = $('.ts-row:not(.ts-th)'), marks = $('.ts-mark'), plates = $('.plate');

  if (reduce) {
    Object.assign(ts, { hazeIn: 0, hazeOut: 0, glow: 1 });
    [...stops, ...rows, ...marks, ...plates].forEach(el => el.classList.add('on'));
    return;
  }
  Object.assign(ts, { hazeIn: 1, hazeOut: 0, glow: 0 });

  // hero: text now, the transformer once its scene is ready (TestingSolutions calls heroIn)
  gsap.timeline({ delay: 0.1 })
    .fromTo($('.ts-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0)
    .fromTo($('.ts-h1 .ln > span'), { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0.7)
    .fromTo($('.ts-copy > :not(h1)'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' }, 0.25)
    .fromTo($('.ts-scope'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.6);
  const hero = one('.ts-hero');
  gsap.to(ts, { hazeOut: 1, ease: 'power1.in', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  // modes: the switch turns with the scroll and settles on a position
  const modes = one('.ts-modes');
  const knob = root.querySelector('.sel-knob'), turn = { a: -50 };
  let last = -1;
  // an SVG rotate about the bezel centre, written directly so nothing else can move the pivot
  const arc = root.querySelector<SVGPathElement>('.sel-arc');
  const setKnob = () => {
    knob?.setAttribute('transform', `rotate(${turn.a.toFixed(2)} 120 120)`);
    if (arc) arc.style.strokeDashoffset = (1 - (turn.a + 50) / 100).toFixed(4);
  };
  setKnob();
  gsap.to(turn, {
    a: 50, ease: 'none', onUpdate: setKnob,
    scrollTrigger: {
      id: 'ts-modes', trigger: modes, start: 'top top', end: '+=200%', pin: true, anticipatePin: 1,
      scrub: 0.5, snap: { snapTo: 0.5, duration: { min: 0.2, max: 0.5 }, ease: 'power2.inOut' },
      onUpdate: s => { const i = Math.round(s.progress * 2); if (i !== last) { last = i; onMode(i); } },
    },
  });

  // signal path: the pulse runs the wire; each stop lights once it's reached
  const sig = one('.ts-sig');
  const at = stops.map((_, i) => (i + 0.5) / stops.length);
  gsap.fromTo(sig, { '--p': 0 }, {
    '--p': 1, ease: 'none',
    scrollTrigger: {
      trigger: sig, start: 'top 70%', end: 'bottom 60%', scrub: 0.4,
      onUpdate: s => stops.forEach((el, i) => el.classList.toggle('on', s.progress >= at[i] - 0.06)),
    },
  });

  // test sheet: rows tick as they reach the reading line
  // and the sheet's header counts them
  const passed = one('.ts-doc-bar em'), bar = one('.ts-doc-bar i');
  let n = 0;
  rows.forEach(r => ScrollTrigger.create({
    trigger: r, start: 'top 78%', once: true,
    onEnter: () => {
      r.classList.add('on');
      n++;
      gsap.delayedCall(0.45, () => {
        if (passed) passed.textContent = String(n);
        bar?.style.setProperty('--q', String(n / rows.length));
      });
    },
  }));

  // ratings: the needle sweeps the log scale; projects light as it passes them
  const scale = one('.ts-scale');
  const read = one('.ts-needle em');
  const pos = marks.map(m => parseFloat(m.style.getPropertyValue('--x')) / 100), top = Math.max(...pos);
  // the needle stops at the largest system rather than running off the scale
  gsap.fromTo(scale, { '--n': 0 }, {
    '--n': top, ease: 'none',
    scrollTrigger: {
      trigger: scale, start: 'top 82%', end: 'top 30%', scrub: 0.4,
      onUpdate: s => {
        marks.forEach((m, i) => m.classList.toggle('on', s.progress * top >= pos[i] - 0.001));
        if (read) {
          const v = Math.pow(200, s.progress * top);
          read.textContent = v < 10 ? `${v.toFixed(1)} MVA` : `${Math.round(v)} MVA`;
          read.classList.toggle('rest', s.progress > 0.995); // settled: the nameplate labels take over
        }
      },
    },
  });

  // nameplates catch the light as they arrive
  plates.forEach(p => ScrollTrigger.create({ trigger: p, start: 'top 85%', once: true, onEnter: () => p.classList.add('on') }));

  return magnetic(one('.pr-cta .pill'));
}

/** Called when the 3D transformer has drawn its first frame. */
export function heroIn(reduce: boolean) {
  if (reduce) return;
  gsap.to(ts, { hazeIn: 0, duration: 1.8, ease: 'power2.out' });
  gsap.to(ts, { glow: 1, duration: 1.2, delay: 1.1, ease: 'power2.out' });
}

/** Scroll to a switch position (0 AUTO, 1 SEMI, 2 MAN). */
export function modeScrollY(i: number) {
  const st = ScrollTrigger.getById('ts-modes');
  return st ? st.start + (st.end - st.start) * (i / 2) : null;
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * 1.6b Report generation, pinned and scrubbed:
 *   open  — the closed laptop tilts up toward the viewer and its lid opens; X'mer Prime™ boots
 *   run   — the tests tick to Pass one by one while the report page writes itself
 *   lift  — four parts of the screen lift out toward the viewer, turn to face them and settle beside
 *           the laptop with what they do (phones: one at a time above it)
 *   exit  — the scene sinks into the page haze
 * The laptop is CSS 3D: the lid hinges on the deck and the lifted cards live in the lid's space,
 * so they really leave the screen. All sizes are read from layout, never from transformed boxes.
 */

// The camera looks down on the laptop: a negative tilt brings the deck's front edge down and the lid's
// top toward the viewer. The lid opens past upright (positive) so the screen ends up nearly square on.
const TILT = -17, LID = 13, LEAN = TILT + LID; // LEAN: the screen's final lean in view (negative = top toward us)
const SIDE = [-1, -1, 1, 1], GAP = 40;
// each lifted part's place on the 1280×800 screen: centre (fx, fy) and width (fw), as fractions
const SRC = [
  { fx: 0.175, fy: 0.395, fw: 0.3125 }, // routine tests
  { fx: 0.514, fy: 0.535, fw: 0.328 },  // report page
  { fx: 0.839, fy: 0.31, fw: 0.284 },   // ERP
  { fx: 0.839, fy: 0.76, fw: 0.284 },   // buyer access
];

export function createReportMotion(section: HTMLElement, reduce: boolean) {
  const q = (s: string) => section.querySelector<HTMLElement>(s)!;
  const mb = q('.mb'), lid = q('.mb-lid'), display = q('.mb-display'), ui = q('.mb-ui');
  const pops = gsap.utils.toArray<HTMLElement>('.rp-pop', section);
  const srcs = gsap.utils.toArray<HTMLElement>('[data-src]', section);
  const rows = gsap.utils.toArray<HTMLElement>('.ui-tests li', section);

  // the screen UI is laid out at 1280×800 and scaled to whatever size the display is
  const fit = () => ui.style.setProperty('--s', String(display.clientWidth / 1280));
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(display);

  const setStep = (n: number) => {
    rows.forEach((r, i) => { r.className = i < n ? 'pass' : i === n ? 'run' : ''; });
    ui.classList.toggle('done', n >= rows.length);
  };

  // where a card starts (over its part of the screen) and where it parks, in the lid's space
  const display0 = () => {
    const W = lid.offsetWidth, H = lid.offsetHeight, l = W * 0.024, t = H * 0.042;
    return { W, H, l, t, w: W - 2 * l, h: H - t - H * 0.036 };
  };
  const from = (i: number, pop: HTMLElement) => ({
    x: () => { const d = display0(); return d.l + SRC[i].fx * d.w - d.W / 2; },
    y: () => { const d = display0(); return d.t + SRC[i].fy * d.h - (pop.offsetTop + pop.offsetHeight / 2); },
    z: 2, rotationX: 0, opacity: 0,
    scale: () => (SRC[i].fw * display0().w) / pop.offsetWidth,
  });
  const parked = (i: number, pop: HTMLElement, wide: boolean) => wide
    ? { x: () => SIDE[i] * (lid.offsetWidth / 2 + GAP + pop.offsetWidth / 2), y: 0, z: 70, rotationX: -LEAN, scale: 1, opacity: 1 }
    : { x: 0, y: () => -(pop.offsetTop + pop.offsetHeight) - 32, z: 60, rotationX: -LEAN, scale: 1, opacity: 1 };

  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, c => {
    const wide = !!c.conditions?.wide;

    if (reduce) {
      // one still: open laptop, finished report, the parts beside it (phones: the last one above it)
      gsap.set(mb, { rotationX: TILT });
      gsap.set(lid, { rotationX: LID });
      setStep(rows.length);
      q('.ui-progress i').style.transform = 'none';
      pops.forEach((p, i) => { if (wide || i === pops.length - 1) gsap.set(p, parked(i, p, wide)); });
      if (!wide) gsap.set(q('.rp-head'), { autoAlpha: 0 });
      return;
    }

    const R = { step: 0 };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top top', end: '+=260%', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true },
    });

    // open
    tl.fromTo(mb, { rotationX: -58, y: '4vh', scale: 0.86 }, { rotationX: TILT, y: 0, scale: 1, duration: 0.24, ease: 'power2.inOut' }, 0)
      .fromTo(lid, { rotationX: -88 }, { rotationX: LID, duration: 0.22, ease: 'power2.inOut' }, 0.02)
      .fromTo(display, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.12)
    // run
      .to(R, { step: rows.length, duration: 0.18, onUpdate: () => setStep(Math.floor(R.step + 0.001)) }, 0.24)
      .fromTo(q('.ui-progress i'), { scaleX: 0 }, { scaleX: 1, duration: 0.18 }, 0.24)
      .fromTo(q('.ui-page-body'), { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.18 }, 0.25);

    // lift
    if (!wide) tl.to(q('.rp-head'), { autoAlpha: 0, y: -20, duration: 0.05 }, 0.42);
    pops.forEach((pop, i) => {
      const at = 0.46 + i * (wide ? 0.1 : 0.12);
      tl.fromTo(pop, from(i, pop), { ...parked(i, pop, wide), duration: 0.11, ease: 'power2.out' }, at)
        .to(srcs[i], { opacity: 0.3, duration: 0.05 }, at);
      // phones: each card makes way for the next
      if (!wide && i < pops.length - 1) tl.to(pop, { opacity: 0, z: 160, duration: 0.05, ease: 'power1.in' }, at + 0.1);
    });

    // hold, then sink into the haze
    tl.to([q('.rp-scene'), q('.rp-head')], { opacity: 0, y: '-4vh', filter: 'blur(5px)', duration: 0.08, ease: 'power1.in' }, 0.93);
  });

  return () => { ro.disconnect(); mm.revert(); };
}

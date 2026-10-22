import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * Scroll story for 1.4 Two business lines, shared by Lines (DOM) and LinesScene (3D).
 * Like the hero, the pin and timeline exist from first paint and only move numbers;
 * the 3D chunk loads later and reads them every frame.
 *
 *   panels  — the MCC turns on the turntable, its doors swing open, spec callouts arrive
 *   morph   — doors close; a scan ring rises through it, rebuilding it as a transformer
 *   testing — the transformer goes under test: windings glow, bushings light R Y B
 *   exit    — the camera pulls back and the turntable sinks into the page haze
 * On the way in, the MCC comes up out of that same haze while the section scrolls into place.
 */
export interface LinesState {
  spin: number;   // turntable angle (rad)
  open: number;   // MCC doors, 0..1
  scan: number;   // morph progress, 0 = all panel, 1 = all transformer
  glow: number;   // transformer under test, 0..1
  off: number;    // how far the model sits right of screen centre (world units, negative = left)
  theta: number;  // camera orbit
  phi: number;
  r: number;
  callA: number;  // panel callouts, 0..1
  callB: number;  // transformer callouts, 0..1
  hazeIn: number; // arriving out of the page haze, 1..0
  hazeOut: number; // leaving into it, 0..1
}

export const lines = { S: {} as LinesState };

const START: LinesState = { spin: -0.35, open: 0, scan: 0, glow: 0, off: 1.35, theta: 0.18, phi: 0.16, r: 9.4, callA: 0, callB: 0, hazeIn: 1, hazeOut: 0 };
const STORY = 10.2, END = 11.2; // timeline time: the story, then the exit

export function createLinesMotion(section: HTMLElement, reduce: boolean) {
  const S = lines.S;
  Object.assign(S, START);
  const q = (s: string) => section.querySelector<HTMLElement>(s)!;
  const hudBar = section.querySelector<HTMLElement>('.lx-hud .bar i');
  const hudA = section.querySelector<HTMLElement>('.lx-hud [data-k="a"]'), hudB = section.querySelector<HTMLElement>('.lx-hud [data-k="b"]');

  if (reduce) {
    // one still: the panel open on its turntable, both lines' copy readable
    Object.assign(S, { spin: 0.3, open: 1, callA: 1, off: 0, hazeIn: 0 });
    section.classList.add('is-still');
    return;
  }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section, start: 'top top', end: `+=${Math.round(320 * END / STORY)}%`, pin: true, scrub: 1, anticipatePin: 1,
      onUpdate: st => {
        if (hudBar) hudBar.style.transform = `scaleX(${st.progress})`;
        const b = S.scan > 0.5;
        hudA?.classList.toggle('on', !b); hudB?.classList.toggle('on', b);
      },
    },
  });

  // panels
  tl.to(S, { spin: 0.55, duration: 3.2 }, 0)
    .to(S, { open: 1, duration: 1.8, ease: 'power2.inOut' }, 0.5)
    .to(S, { theta: -0.12, phi: 0.12, r: 8.6, duration: 2.6, ease: 'power1.inOut' }, 0.3)
    .to(S, { callA: 1, duration: 0.8 }, 1.8)
  // morph
    .to(S, { callA: 0, duration: 0.4 }, 3.0)
    .to(S, { open: 0, duration: 0.9, ease: 'power2.inOut' }, 3.0)
    .to(S, { scan: 1, duration: 2.6, ease: 'power1.inOut' }, 3.6)
    .to(S, { spin: 5.75, duration: 3.4, ease: 'power1.inOut' }, 3.4) // one full turn through the scan, ending front-on
    .to(S, { off: -1.35, theta: 0.32, phi: 0.18, r: 9.2, duration: 2.6, ease: 'power2.inOut' }, 3.6)
  // testing
    .to(S, { glow: 1, duration: 1.6, ease: 'power2.in' }, 6.2)
    .to(S, { callB: 1, duration: 0.8 }, 6.8)
    .to(S, { spin: 6.55, theta: 0.12, duration: 2.6, ease: 'power1.out' }, 7)
    .to({}, { duration: 0.6 }, 9.6) // hold the finished shot
  // exit
    .to(S, { callB: 0, duration: 0.3 }, STORY)
    .to(S, { r: 12.5, phi: 0.36, theta: 0.3, duration: END - STORY, ease: 'power2.in' }, STORY)
    .to(S, { hazeOut: 1, duration: END - STORY - 0.1, ease: 'power1.in' }, STORY + 0.1)
    .to([q('.lx-b'), q('.lx-hud')], { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power1.in' }, STORY + 0.2);

  // entry: the MCC comes up out of the haze as the section scrolls into place, before the pin
  gsap.fromTo(S, { hazeIn: 1 }, { hazeIn: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: section, start: 'top 95%', end: 'top 15%', scrub: true } });

  // copy: the panels block wipes up and out, the testing block rises in from a mask
  tl.fromTo(q('.lx-a'), { yPercent: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }, { yPercent: -18, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'power2.in' }, 3.0)
    .fromTo(q('.lx-b'), { yPercent: 18, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' }, { yPercent: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.out' }, 5.6);
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ASSEMBLY, PART_KEYS, TAGS, type PartKey, type SceneState } from '../three/types';

gsap.registerPlugin(ScrollTrigger);

/*
 * Scroll story for the hero, shared by Hero (DOM) and PanelScene (3D).
 * The timeline only animates plain numbers, so it and its pin exist from first paint,
 * before the 3D chunk loads. Pinning later would re-parent the hero and restart its
 * CSS text reveal.
 */

/**
 * A camera shot: orbit radius/angles around a focus point (world space), and `off`, how far
 * the focus sits right of screen centre so captions on the left stay clear.
 */
export type Cam = { r: number; theta: number; phi: number; fx: number; fy: number; fz: number; off: number };

// shots, in scroll order (floor is at y = -1.15)
export const START: Cam = { r: 11.4, theta: -0.22, phi: 0.11, fx: 0, fy: 0.3, fz: 0, off: 2.4 };
const CLOSE_HMI: Cam = { r: 3.1, theta: 0.32, phi: 0.07, fx: -1.59, fy: 0.34, fz: -0.42, off: 0.5 };
const CLOSE_LEADS: Cam = { r: 4.6, theta: -0.42, phi: 0.3, fx: 0.9, fy: 0.75, fz: -0.15, off: 0.6 };
// exploded: first from the bench's side so its layers fan out across the screen, then round to the transformer
const BENCH_SIDE: Cam = { r: 10.6, theta: -0.9, phi: 0.2, fx: -1.4, fy: 0.85, fz: 0.2, off: 1.35 };
const XFMR_SIDE: Cam = { r: 9.6, theta: 0.62, phi: 0.22, fx: 1.55, fy: 1.05, fz: 0.55, off: 1.1 };
export const EXPLODED: Cam = { r: 15.6, theta: 0.24, phi: 0.2, fx: -0.2, fy: 0.95, fz: 0.2, off: 1.4 }; // reduced-motion still
const LOW: Cam = { r: 11.5, theta: -0.4, phi: 0.05, fx: 0, fy: 0.45, fz: 0, off: 1.7 };
const FINAL: Cam = { r: 10.6, theta: 0.2, phi: 0.12, fx: 0, fy: 0.3, fz: 0, off: 1.9 };
// exit: a crane up and back, looking down on the bay as it dissolves into the page
const CRANE: Cam = { r: 15.5, theta: 0.42, phi: 0.5, fx: 0, fy: 0.1, fz: 0, off: 0.9 };

// scroll map (timeline time; the story runs 0..1, then the exit to END)
const T = { connect: 0.06, explode: 0.32, exploded: 0.5, reassemble: 0.66, assembled: 0.84 };
const END = 1.18;

/** Live values the 3D scene reads every frame. E[k].v: 0 = assembled, 1 = exploded. */
export const hero = {
  S: {} as SceneState,
  E: {} as Record<PartKey, { v: number }>,
};

function reset() {
  Object.assign(hero.S, { ...START, spin: 0, glow: 0, test: 0, labels: 0, labelSplit: 0, callouts: 1, calloutIn: 0, haze: 0 });
  PART_KEYS.forEach(k => { hero.E[k] = { v: 0 }; });
}
reset();

/** Call inside a gsap.context scoped to the hero stage. */
export function createHeroMotion(stage: HTMLElement, reduce: boolean) {
  reset();
  const { S, E } = hero;
  const q = (s: string) => stage.querySelector<HTMLElement>(s);
  const hudBar = q('#hudBar'), hudCount = q('#hudCount'), hudState = q('#hudState');
  let hudLabel = '';
  const updateHud = (p: number) => {
    if (hudBar) hudBar.style.transform = `scaleX(${Math.min(1, p)})`;
    const ramp = (a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
    const n = Math.round((ramp(T.explode, T.exploded) - ramp(T.reassemble, T.assembled)) * TAGS.length);
    if (hudCount) hudCount.textContent = `${n} / ${TAGS.length}`;
    const label = p < T.connect ? 'Ready' : p < T.explode ? 'Testing' : p < T.exploded ? 'Exploding'
      : p < T.reassemble ? 'Exploded view' : p < T.assembled ? 'Reassembling' : 'Test complete';
    if (hudState && label !== hudLabel) { hudLabel = label; hudState.innerHTML = `<b>${label}</b>`; }
  };
  updateHud(0);

  if (reduce) {
    PART_KEYS.forEach(k => { E[k].v = 1; });
    Object.assign(S, EXPLODED, { glow: 0.6, test: 1, labels: 1, labelSplit: 0.5, callouts: 0 });
    updateHud((T.exploded + T.reassemble) / 2);
    return;
  }

  const caps = [q('#cap1'), q('#cap2'), q('#cap3')];
  const io2 = 'power2.inOut', io3 = 'power3.inOut';
  // ~5.7 screens of scrolling in total: 4 for the story, 0.7 for the exit, + the hero itself
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: stage, start: 'top top', end: `+=${Math.round(400 * END)}%`, scrub: 0.6, pin: true, anticipatePin: 1, onUpdate: s => updateHud(s.progress * END) },
  });

  // 1 · connect: push in on the X'mer Prime screen, then sweep to the bushings as current flows
  tl.to('#heroCopy', { opacity: 0, y: -60, duration: 0.08, ease: 'power1.in' }, 0)
    .to(S, { callouts: 0, duration: 0.06 }, 0)
    .to(S, { ...CLOSE_HMI, duration: 0.15, ease: io2 }, 0)
    .to(caps[0], { autoAlpha: 1, duration: 0.03 }, 0.07)
    .to(S, { glow: 1, duration: 0.1 }, 0.1)
    .to(S, { test: 0.3, duration: 0.18 }, 0.1)
    .to(S, { ...CLOSE_LEADS, duration: 0.14, ease: io2 }, 0.16)
    .to(caps[0], { autoAlpha: 0, duration: 0.03 }, 0.3)
    .to(caps[1], { autoAlpha: 1, duration: 0.03 }, 0.33);

  // 2 · explode top-down while pulling back wide, hold with a slow orbit
  [...ASSEMBLY].reverse().forEach((k, i) => tl.to(E[k], { v: 1, duration: 0.18, ease: io3 }, T.explode + i * 0.005));
  tl.to(S, { ...BENCH_SIDE, duration: 0.18, ease: io2 }, 0.3)
    .to(S, { test: 0.8, duration: 0.28 }, 0.34)
    .to(S, { labels: 1, duration: 0.06 }, 0.44)
    .to(S, { ...XFMR_SIDE, duration: 0.15, ease: 'sine.inOut' }, T.exploded)
    .to(S, { labelSplit: 1, duration: 0.06 }, 0.52)
    .to(S, { labels: 0, duration: 0.04 }, 0.63)
    .to(caps[1], { autoAlpha: 0, duration: 0.03 }, 0.66);

  // 3 · reassemble bottom-up on a low sweep, land on the hero shot with the report done
  ASSEMBLY.forEach((k, i) => tl.to(E[k], { v: 0, duration: 0.15, ease: io3 }, T.reassemble + i * 0.005));
  tl.to(S, { ...LOW, duration: 0.14, ease: io2 }, T.reassemble)
    .to(S, { ...FINAL, duration: 0.12, ease: io2 }, 0.8)
    .to(S, { test: 1, duration: 0.1 }, 0.78)
    .to(caps[2], { autoAlpha: 1, duration: 0.04 }, 0.82)
    .to(S, { glow: 0.3, duration: 0.08 }, 0.88);

  // 4 · exit: the camera cranes up and back while the bay sinks into the page haze, so the
  // numbers below arrive on clean paper instead of after a cut
  tl.to(caps[2], { autoAlpha: 0, y: -24, duration: 0.05, ease: 'power1.in' }, 1.0)
    .to(S, { ...CRANE, duration: END - 1, ease: 'power2.in' }, 1.0)
    .to(S, { haze: 1, duration: END - 1.03, ease: 'power1.in' }, 1.03)
    .to(q('.hud'), { autoAlpha: 0, duration: 0.05 }, 1.06);
}

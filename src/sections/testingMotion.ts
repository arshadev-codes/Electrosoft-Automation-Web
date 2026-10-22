import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * 1.6 Testing Suite: the blueprint draws itself in about a second as the section comes on screen,
 * and resets when the visitor scrolls back above it so it draws again next time. Every line has
 * pathLength=1, so a 1 → 0 dash offset traces it (frame, core, coils, then bushings, all
 * overlapping); then the hotspots pop on. The tests change on a timer (see Testing.tsx).
 */
export function createTestingMotion(section: HTMLElement, reduce: boolean, onDrawn: () => void) {
  if (reduce) { onDrawn(); return; }
  const lines = section.querySelectorAll<SVGElement>('.bp [pathLength]');
  const draw = gsap.timeline({ paused: true, onComplete: onDrawn })
    .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out', stagger: { amount: 0.45, from: 'start' } }, 0)
    .fromTo(section.querySelectorAll('.bp-spot'), { scale: 0, opacity: 0, transformOrigin: 'center', transformBox: 'fill-box' },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.4)', stagger: 0.06 }, 0.7);
  ScrollTrigger.create({
    trigger: section, start: 'top 72%',
    onEnter: () => draw.play(),
    onLeaveBack: () => draw.pause(0),
  });
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * 1.6 Testing Suite: the blueprint draws itself over ~3.5 s once the section is mostly on screen,
 * and resets when the visitor scrolls back above it so it draws again next time. Every line has
 * pathLength=1, so a 1 → 0 dash offset traces it (frame, core, coils, then bushings); then the
 * hotspots pop on. The tests themselves change on a timer (see Testing.tsx), not with scroll.
 */
export function createTestingMotion(section: HTMLElement, reduce: boolean, onDrawn: () => void) {
  if (reduce) { onDrawn(); return; }
  const lines = section.querySelectorAll<SVGElement>('.bp [pathLength]');
  const draw = gsap.timeline({ paused: true, onComplete: onDrawn })
    .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power1.inOut', stagger: { amount: 2.4, from: 'start' } }, 0)
    .fromTo(section.querySelectorAll('.bp-spot'), { scale: 0, opacity: 0, transformOrigin: 'center', transformBox: 'fill-box' },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)', stagger: 0.1 }, 3.1);
  ScrollTrigger.create({
    trigger: section, start: 'top 40%',
    onEnter: () => draw.play(),
    onLeaveBack: () => draw.pause(0),
  });
}

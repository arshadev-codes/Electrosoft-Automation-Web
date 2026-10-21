import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY } from '../hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

/*
 * 1.6 Testing Suite: the blueprint draws itself once as the section arrives, then the
 * section pins and scroll steps through the tests (snapping to each hotspot).
 */
let jump: (i: number) => void = () => {}, show: (i: number) => void = () => {};
export const testing = {
  goTo: (i: number) => jump(i), // scroll to the test
  show: (i: number) => show(i), // just light it (hover); scrolling takes over again
};

export function createTestingMotion(section: HTMLElement, count: number, reduce: boolean, onIndex: (i: number) => void) {
  let current = 0;
  const setIndex = (i: number) => { if (i !== current) { current = i; onIndex(i); } };
  show = setIndex;

  if (reduce) {
    // no pin, no drawing: hotspots and steps switch the test directly
    jump = i => { current = i; onIndex(i); };
    return () => { jump = show = () => {}; };
  }

  // the sheet draws itself over ~3.5 s once the section is mostly on screen, and resets when the
  // visitor scrolls back above it so it draws again next time. Every line has pathLength=1, so a
  // 1 → 0 dash offset traces it (frame, core, coils, then bushings), then the hotspots pop on.
  const lines = section.querySelectorAll<SVGElement>('.bp [pathLength]');
  const draw = gsap.timeline({ paused: true })
    .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power1.inOut', stagger: { amount: 2.4, from: 'start' } }, 0)
    .fromTo(section.querySelectorAll('.bp-spot'), { scale: 0, opacity: 0, transformOrigin: 'center', transformBox: 'fill-box' },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)', stagger: 0.1 }, 3.1);
  ScrollTrigger.create({
    trigger: section, start: 'top 20%',
    onEnter: () => draw.play(),
    onLeaveBack: () => draw.pause(0),
  });

  const st = ScrollTrigger.create({
    trigger: section, start: 'top top', end: `+=${(count - 1) * 65}%`, pin: true, anticipatePin: 1,
    snap: { snapTo: 1 / (count - 1), duration: { min: 0.2, max: 0.5 }, delay: 0.08, ease: 'power1.inOut' },
    onUpdate: s => setIndex(Math.round(s.progress * (count - 1))),
  });
  // clicking a hotspot or step scrolls to that test's stop inside the pin
  jump = i => { setIndex(i); scrollToY(st.start + (st.end - st.start) * (i / (count - 1))); };
  return () => { jump = show = () => {}; };
}

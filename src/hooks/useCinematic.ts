import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * The page's one scroll transition, the DOM twin of the 3D scenes dissolving into the page colour:
 * a section's content comes up out of the paper haze as it arrives (a little low, soft and
 * faint) and sinks back into it as it leaves. Scrubbed to the scroll, so it moves like a camera
 * rather than playing as a timed entrance. The haze only touches content while it sits in the
 * outer part of the screen, so anything you can stop and read is sharp.
 *
 * `inner` is the content wrapper that moves; the section itself is the trigger, so measurements
 * never see the transform.
 */
export function useCinematic(ref: RefObject<HTMLElement>, inner: string, { enter = true, exit = true } = {}) {
  useLayoutEffect(() => {
    const section = ref.current, el = section?.querySelector<HTMLElement>(inner);
    if (!section || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const st = { a: enter ? 1 : 0, b: 0 }; // haze while arriving, haze while leaving
    const apply = () => {
      const h = Math.max(st.a, st.b * 0.75);
      el.style.opacity = (1 - h).toFixed(3);
      el.style.filter = h > 0.005 ? `blur(${(h * 6).toFixed(2)}px)` : '';
      el.style.transform = h > 0.005 ? `translate3d(0, ${(st.a * 6 - st.b * 4).toFixed(2)}vh, 0) scale(${(1 - st.a * 0.035 - st.b * 0.025).toFixed(4)})` : '';
      el.style.willChange = h > 0.005 && h < 0.995 ? 'transform, opacity, filter' : '';
    };
    const ctx = gsap.context(() => {
      if (enter) gsap.to(st, { a: 0, ease: 'none', onUpdate: apply, scrollTrigger: { trigger: section, start: 'top 96%', end: 'top 55%', scrub: true } });
      if (exit) gsap.to(st, { b: 1, ease: 'none', onUpdate: apply, scrollTrigger: { trigger: section, start: 'bottom 40%', end: 'bottom top', scrub: true } });
    });
    apply();
    return () => {
      ctx.revert();
      ['opacity', 'filter', 'transform', 'will-change'].forEach(p => el.style.removeProperty(p));
    };
  }, [ref, inner, enter, exit]);
}

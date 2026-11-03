import { gsap } from 'gsap';

/** The button pulls toward the pointer while it moves over the button's row. Returns a cleanup. */
export function magnetic(btn: HTMLElement | null, zone: HTMLElement | null = btn?.parentElement ?? null) {
  if (!btn || !zone || !matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
  const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
  const move = (e: PointerEvent) => {
    const r = btn.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
    yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
  };
  const leave = () => { xTo(0); yTo(0); };
  zone.addEventListener('pointermove', move);
  zone.addEventListener('pointerleave', leave);
  return () => { zone.removeEventListener('pointermove', move); zone.removeEventListener('pointerleave', leave); };
}

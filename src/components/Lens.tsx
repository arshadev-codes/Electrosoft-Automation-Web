import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const R = 210; // the lens is 2R across
const PITCH = 120; // major grid square; the minor one is a fifth of it

/*
 * The drawing under the sheet. Around the pointer the page turns translucent and the blueprint it was
 * drawn on shows through: a faint grid pinned to the page (it scrolls with the content), the pointer's
 * page coordinates in the corner of the lens, a ring pulsing out on every click. Only on the open sheet:
 * cards, photos and the 3D stages are opaque and cover it. Fine pointers only, never with reduced motion.
 * The same pointer layer lets every brand button lean a few pixels toward the pointer.
 */
export default function Lens() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const read = el.querySelector<HTMLElement>('.lens-xy')!, ring = el.querySelector<HTMLElement>('.lens-ring')!;
    let x = -1e4, y = -1e4, cx = x, cy = y, seen = false, last = '', held: HTMLElement | null = null;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!seen) { cx = x; cy = y; seen = true; }
      el.classList.add('on');
      // over something to press, the lens closes down so the control stays the thing in focus
      el.classList.toggle('is-tight', !!(e.target as Element).closest?.('a,button,input,textarea,select,label,[role="button"]'));
      // brand buttons lean toward the pointer (the closing cards' buttons have their own, stronger pull)
      const pill = (e.target as Element).closest?.<HTMLElement>('.pill:not(.pr-cta .pill)') ?? null;
      if (pill !== held) { held?.style.removeProperty('--px'); held?.style.removeProperty('--py'); held = pill; }
      if (pill) {
        const r = pill.getBoundingClientRect();
        pill.style.setProperty('--px', `${((x - r.left) / r.width - 0.5) * 8}px`);
        pill.style.setProperty('--py', `${((y - r.top) / r.height - 0.5) * 6}px`);
      }
    };
    const out = (e: PointerEvent) => { if (!e.relatedTarget) el.classList.remove('on'); };
    const down = () => { ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go'); };

    const tick = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      const l = cx - R, t = cy - R, key = `${l.toFixed(1)}|${t.toFixed(1)}|${scrollY}`;
      if (key === last) return;
      last = key;
      el.style.transform = `translate3d(${l}px,${t}px,0)`;
      // the grid belongs to the page, not to the lens
      el.style.backgroundPosition = `${-l % PITCH}px ${-(t + scrollY) % PITCH}px`;
      read.textContent = `x ${String(Math.round(cx)).padStart(4, '0')}  y ${String(Math.round(cy + scrollY)).padStart(5, '0')}`;
    };

    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', out);
    addEventListener('pointerdown', down, { passive: true });
    gsap.ticker.add(tick);
    return () => {
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', out);
      removeEventListener('pointerdown', down);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div className="lens" ref={ref} aria-hidden="true">
      <i className="lens-ring" />
      <span className="lens-xy mono" />
    </div>
  );
}

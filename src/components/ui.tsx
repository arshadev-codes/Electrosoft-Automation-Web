import type { PointerEvent, ReactNode } from 'react';

/** Button arrow; nudges forward on hover (theme.css .arw). */
export const Arrow = () => (
  <svg className="arw" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" /></svg>
);

/** Pointer handlers: the element leans toward the mouse (--rx/--ry) and a highlight follows it (--mx/--my). */
export function tilt(e: PointerEvent<HTMLElement>, max = 9) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget, r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
  el.style.setProperty('--rx', `${((0.5 - y) * max * 0.78).toFixed(2)}deg`);
  el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
}
export function untilt(e: PointerEvent<HTMLElement>) {
  ['--rx', '--ry'].forEach(p => e.currentTarget.style.removeProperty(p));
}

/**
 * Closing card shared by the inner pages: one feeder left open for the visitor's own job.
 * Hovering the main button closes its breaker and current starts to flow (theme.css .pr-cta).
 */
export function FeederCta({ id, tag, children }: { id: string; tag: string; children: ReactNode }) {
  return (
    <section className="pr-cta gut" aria-labelledby={id}>
      <div className="wrap">
        <div className="pr-cta-copy">
          <svg className="pr-cta-fd" viewBox="0 0 132 24" aria-hidden="true">
            <circle className="fd-tap" cx="4" cy="12" r="4" />
            <path className="fd-line" d="M4 12H48M76 12H128" />
            <path className="fd-blade" d="M48 12H76" />
            <path className="fd-flow" d="M8 12H128" />
            <circle className="fd-pin" cx="48" cy="12" r="3" /><circle className="fd-pin" cx="76" cy="12" r="3" />
          </svg>
          <span className="pr-cta-tag">{tag}</span>
          <h2 id={id}>Have a project in mind?</h2>
        </div>
        <div className="pr-cta-btns">{children}</div>
      </div>
    </section>
  );
}

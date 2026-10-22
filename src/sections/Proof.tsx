import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';

gsap.registerPlugin(ScrollTrigger);

// CONTENT.md · Home §2 (+ §6) — the DOM always holds the final value; the count-up only animates it
const STATS = [
  { n: 1989, from: 1950, unit: '', text: 'Established', label: 'Established 1989' },
  { n: 80, from: 0, unit: '%+', text: 'Business from repeat customers', label: '80%+ of business from repeat customers' },
  { n: 65, from: 0, unit: 'kA', text: 'CPRI approved panel design · IP65', label: '65kA / IP65 CPRI approved panel design' },
  { n: 160, from: 0, unit: 'MVA', text: 'Largest transformer rating our test systems handle', label: '160 MVA, the largest transformer rating our test systems handle' },
  // Home §6 Why Electrosoft, folded in here
  { n: 362, from: 0, unit: 'days', text: 'A year, 14 hours a day, so orders ship on time', label: 'We run 362 days a year, 14 hours a day' },
  { n: 100, from: 0, unit: '%', text: 'Of panels tested before dispatch, under a 3-step QA plan', label: '100% of panels tested before dispatch, under a 3-step Quality Assurance Plan' },
];

export default function Proof() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.wrap');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-count]').forEach(n => {
        const end = +n.dataset.count!, o = { v: +(n.dataset.from || 0) };
        n.textContent = String(o.v);
        gsap.to(o, {
          v: end, duration: 1.6, ease: 'power3.out',
          onUpdate: () => { n.textContent = String(Math.round(o.v)); },
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="proof gut" ref={ref} aria-label="Electrosoft in numbers">
      <div className="wrap">
        {STATS.map(s => (
          <div className="stat" key={s.n} role="group" aria-label={s.label}>
            <span className="n" aria-hidden="true">
              <span data-count={s.n} data-from={s.from}>{s.n}</span>{s.unit && <sup>{s.unit}</sup>}
            </span>
            <p aria-hidden="true">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

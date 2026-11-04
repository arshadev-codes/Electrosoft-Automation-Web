import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';

gsap.registerPlugin(ScrollTrigger);

// CONTENT.md · Home §2 (+ §6) — the drums rest on the final value; the roll only animates it (and the label holds it for screen readers)
const STATS = [
  { n: 1989, unit: '', text: 'Established', label: 'Established 1989' },
  { n: 80, unit: '%+', text: 'Business from repeat customers', label: '80%+ of business from repeat customers' },
  { n: 65, unit: 'kA', text: 'CPRI approved panel design · IP65', label: '65kA / IP65 CPRI approved panel design' },
  { n: 160, unit: 'MVA', text: 'Largest transformer rating our test systems handle', label: '160 MVA, the largest transformer rating our test systems handle' },
  // Home §6 Why Electrosoft, folded in here
  { n: 362, unit: 'days', text: 'A year, 14 hours a day, so orders ship on time', label: 'We run 362 days a year, 14 hours a day' },
  { n: 100, unit: '%', text: 'Of panels tested before dispatch, under a 3-step QA plan', label: '100% of panels tested before dispatch, under a 3-step Quality Assurance Plan' },
];

// three turns of the drum: 0–9, 0–9, 0–9
const DIGITS = Array.from({ length: 30 }, (_, i) => <b key={i}>{i % 10}</b>);

export default function Proof() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.wrap');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      // each figure rolls up on drums, like the register of a meter: the low digits turn more and stop last
      el.querySelectorAll<HTMLElement>('.stat').forEach((st, j) => {
        st.querySelectorAll<HTMLElement>('.pd-s').forEach((s, i) => {
          gsap.fromTo(s, { '--d': 0 }, {
            '--d': +s.dataset.end!, duration: 1.3 + +s.dataset.turns! * 0.45 + i * 0.06, delay: (j % 3) * 0.12, ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          });
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
              {String(s.n).split('').map((d, i, all) => {
                const turns = Math.max(0, 2 - (all.length - 1 - i)), end = +d + 10 * turns; // the units drum turns twice, the tens once
                return <span className="pd" key={i}><span className="pd-s" data-end={end} data-turns={turns} style={{ '--d': end } as CSSProperties}>{DIGITS}</span></span>;
              })}
              {s.unit && <sup>{s.unit}</sup>}
            </span>
            <p aria-hidden="true">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

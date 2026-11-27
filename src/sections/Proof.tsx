import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';

gsap.registerPlugin(ScrollTrigger);

// Numeric figures roll on drums; standard names roll in letter by letter.
type Stat = { n?: number; value?: string; unit?: string; certified?: boolean; text: string; label: string };
const STATS: Stat[] = [
  { n: 1989, unit: '', certified: false,text: 'Established', label: 'Established 1989' },
  { value: 'IEC 61439', certified: false, text: 'Certified Panels.', label: 'IEC 61439 certified Panels' },
  { value: '3',unit:"Step" ,certified: false, text: ' Quality Assurance Plan.', label: 'Quality Assurance Plan.' },

  { n: 750, unit: 'MVA', text: 'Largest transformer rating tested using our supplied systems', label: '750 MVA, Largest transformer rating tested using our supplied systems' },
  { n: 765, unit: 'kV ', text: 'Highest voltage tested on supplied system', label: '765 kV Class, Highest voltage tested on supplied system' },
  { n: 65, unit: 'kA', text: 'STC & CPRI-approved panel design · IP65', label: '65 kA / IP65 CPRI-approved panel design' },
];

// three turns of the drum: 0–9, 0–9, 0–9
const DIGITS = Array.from({ length: 30 }, (_, i) => <b key={i}>{i % 10}</b>);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LETTER_REEL = LETTERS + LETTERS;

/**
 * Measure the natural advance width of every character in the reel.
 * We render a hidden "ruler" string at the same font and size, read its
 * bounding-box width, then divide by the number of characters.
 *
 * Because glyphs are proportional, we measure pairs to include
 * kerning, then fall back to single-char measurement.
 */
function measureLetterWidths(
  container: HTMLElement,
  glyphs: string,
): Map<string, number> {
  // Create a hidden ruler span that inherits the container's font
  const ruler = document.createElement('span');
  Object.assign(ruler.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 'inherit',
    letterSpacing: '0',
    top: '0',
    left: '0',
  });
  container.appendChild(ruler);

  const map = new Map<string, number>();
  for (const ch of glyphs) {
    if (map.has(ch)) continue;
    // Measure a repeated run to average out sub-pixel rounding
    const repeat = 8;
    ruler.textContent = ch.repeat(repeat);
    map.set(ch, ruler.getBoundingClientRect().width / repeat);
  }

  container.removeChild(ruler);
  return map;
}

export default function Proof() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.wrap');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ── size each letter drum to its natural glyph width ──────────────────
    // Strategy: measure every character in the reel at the actual rendered
    // font/size, then set each drum column to exactly its target char's width.
    // During the spin, intermediate glyphs are centered inside the column so
    // they never bleed into adjacent columns.
    const textValueSpans = el.querySelectorAll<HTMLElement>('.text-value');
    textValueSpans.forEach(tvSpan => {
      // Collect every unique glyph shown in this stat's reel
      const glyphSet = new Set<string>(LETTER_REEL.split(''));
      const glyphs = [...glyphSet].join('');

      const widthMap = measureLetterWidths(tvSpan, glyphs);

      // Apply the measured width to every drum column (.pd.proof-letter)
      tvSpan.querySelectorAll<HTMLElement>('.proof-letter').forEach(drum => {
        const strip = drum.querySelector<HTMLElement>('.proof-letter__strip');
        if (!strip) return;
        // Resolve the target glyph from data-end (mod LETTERS.length gives index)
        const endIdx = Number(strip.dataset.end) % LETTERS.length;
        const targetChar = LETTERS[endIdx] ?? '';
        // Use the target character's natural advance width for tight spacing.
        const w = widthMap.get(targetChar) ?? 0;
        if (w > 0) drum.style.width = `${w}px`;
      });
    });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // each figure rolls up on drums, like the register of a meter: the low digits turn more and stop last
      el.querySelectorAll<HTMLElement>('.stat').forEach((st, j) => {
        st.querySelectorAll<HTMLElement>('.pd-s:not(.proof-letter__strip)').forEach((s, i) => {
          gsap.fromTo(s, { '--d': 0 }, {
            '--d': +s.dataset.end!, duration: 1.3 + +s.dataset.turns! * 0.45 + i * 0.06, delay: (j % 3) * 0.12, ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          });
        });
      });

      const certificates = [...el.querySelectorAll<HTMLElement>('.stat')].filter(st => st.querySelector('.proof-badge'));
      const certTl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
      let textEnd = 0;
      certificates.forEach((st, j) => {
        st.querySelectorAll<HTMLElement>('.proof-letter__strip').forEach((strip, i) => {
          const at = j * 0.55 + i * 0.07;
          certTl.fromTo(strip, { '--d': 0 }, {
            '--d': +strip.dataset.end!, duration: 1.15, ease: 'power2.inOut',
          }, at);
          textEnd = Math.max(textEnd, at + 1.15);
        });
      });
      certificates.forEach((st, i) => {
        const badge = st.querySelector<SVGElement>('.proof-badge')!;
        const tick = badge.querySelector<SVGPathElement>('.proof-badge__tick');
        const at = textEnd + 0.12 + i * 0.32;
        certTl.fromTo(badge, { scale: 0.65, rotation: -24, autoAlpha: 0 }, {
          scale: 1, rotation: 0, autoAlpha: 1, duration: 0.48, ease: 'back.out(1.8)',
        }, at);
        if (tick) certTl.fromTo(tick, { strokeDashoffset: 22 }, {
          strokeDashoffset: 0, duration: 0.32, ease: 'power2.out',
        }, at + 0.13);
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="proof gut" ref={ref} aria-label="Electrosoft standards and capabilities">
      <div className="wrap">
        {STATS.map(s => (
          <div className="stat" key={s.label} role="group" aria-label={s.label}>
            <span className={`n${s.n === undefined ? ' text-value' : ''}`} aria-hidden="true">
              {s.n === undefined
                ? <span className="proof-wordmark">{Array.from(s.value ?? '').map((letter, i) => {
                    if (letter === ' ') return <span className="proof-space" key={i}>&nbsp;</span>;
                    const end = LETTERS.indexOf(letter.toUpperCase()) + LETTERS.length;
                    // No hardcoded width class — JS measures and sets width at runtime
                    return (
                      <span className="pd proof-letter" key={i}>
                        <span className="pd-s proof-letter__strip" data-end={end} style={{ '--d': end } as CSSProperties}>
                          {Array.from(LETTER_REEL, (glyph, j) => <b key={j}>{glyph}</b>)}
                        </span>
                      </span>
                    );
                  })}</span>
                : String(s.n).split('').map((d, i, all) => {
                    const turns = Math.max(0, 2 - (all.length - 1 - i)), end = +d + 10 * turns;
                    return <span className="pd" key={i}><span className="pd-s" data-end={end} data-turns={turns} style={{ '--d': end } as CSSProperties}>{DIGITS}</span></span>;
                  })}
              {s.certified && (
                <svg className="proof-badge" viewBox="0 0 32 32" focusable="false">
                  <path fill="currentColor" d="m16 1.5 4 2.4 4.7-.2 1.8 4.3 4 2.4-1.2 4.6 1.2 4.6-4 2.4-1.8 4.3-4.7-.2-4 2.4-4-2.4-4.7.2-1.8-4.3-4-2.4 1.2-4.6-1.2-4.6 4-2.4 1.8-4.3 4.7.2z" />
                  <path className="proof-badge__tick" d="m9.5 16.2 4.2 4.1 8.8-9" fill="none" stroke="white" strokeDasharray="22" strokeDashoffset="0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
                </svg>
              )}
              {s.unit && <sup>{s.unit}</sup>}
            </span>
            <p aria-hidden="true">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

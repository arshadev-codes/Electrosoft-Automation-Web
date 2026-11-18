import { useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle, type CSSProperties } from 'react';
import { TESTS } from '../data/testing';
import { useCinematic } from '../hooks/useCinematic';

export interface RoutineTestsProps {
  id?: string;
  headingId?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  maxHeight?: string | number;
}

const RoutineTests = forwardRef<HTMLElement, RoutineTestsProps>(function RoutineTests(
  {
    id = 'routine-tests',
    headingId = 'ts-tests-h',
    title = 'The routine tests it runs.',
    subtitle = 'What each test checks, and the part of the transformer it proves.',
    className = '',
    maxHeight,
  },
  ref
) {
  const innerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLElement);

  const [reduce] = useState(() => (typeof window !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false));

  useCinematic(innerRef, '.ts-sheet');

  useLayoutEffect(() => {
    const el = innerRef.current;
    const scrollEl = scrollRef.current;
    if (!el || !scrollEl) return;

    const rows = scrollEl.querySelectorAll<HTMLElement>('.ts-row:not(.ts-th)');
    const passed = el.querySelector<HTMLElement>('.ts-doc-bar em');
    const bar = el.querySelector<HTMLElement>('.ts-doc-bar i');

    if (reduce) {
      rows.forEach(r => r.classList.add('on'));
      if (passed) passed.textContent = String(rows.length);
      bar?.style.setProperty('--q', '1');
      return;
    }

    let n = 0;
    const updateProgress = () => {
      if (passed) passed.textContent = String(n);
      bar?.style.setProperty('--q', String(n / rows.length));
    };

    // IntersectionObserver inside the scrollable container
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const row = entry.target as HTMLElement;
            if (!row.classList.contains('on')) {
              row.classList.add('on');
              n++;
              updateProgress();
            }
            io.unobserve(row);
          }
        });
      },
      {
        root: scrollEl,
        threshold: 0.25,
      }
    );

    // Observe each row once the section enters the screen
    const secIo = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          rows.forEach(r => io.observe(r));
          secIo.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    secIo.observe(el);

    return () => {
      io.disconnect();
      secIo.disconnect();
    };
  }, [reduce]);

  return (
    <section className={`ts-tests gut ${className}`.trim()} ref={innerRef} id={id} aria-labelledby={headingId}>
      <div className="wrap ts-sheet">
        <div className="sec-head">
          <h2 id={headingId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="ts-doc" role="table" aria-label="Routine tests">
          <div className="ts-doc-bar" aria-hidden="true">
            <b>Routine test sheet</b>
            <span className="mono">
              Passed <em>{reduce ? TESTS.length : 0}</em> / {TESTS.length}
            </span>
            <i style={{ '--q': reduce ? 1 : 0 } as CSSProperties} />
          </div>
          <div className="ts-doc-scroll" ref={scrollRef} style={maxHeight ? { maxHeight } : undefined}>
            <div className="ts-row ts-th" role="row">
              <span role="columnheader">No.</span>
              <span role="columnheader">Test</span>
              <span role="columnheader">What it checks</span>
              <span role="columnheader">Part</span>
              <span role="columnheader">
                <span className="sr">Done</span>
              </span>
            </div>
            {TESTS.map((t, i) => (
              <div className="ts-row" role="row" id={t.id} key={t.id}>
                <span role="cell" className="mono">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 role="cell">{t.name}</h3>
                <p role="cell">{t.text}</p>
                <span role="cell" className="ts-part">
                  {t.part}
                </span>
                <span role="cell" className="ts-tick" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M3.5 8.4l3 3 6-6.6" pathLength={1} />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default RoutineTests;

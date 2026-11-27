import { useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { TESTS, type TestItem } from '../data/testing';
import { useCinematic } from '../hooks/useCinematic';

export interface RoutineTestsProps {
  id?: string;
  headingId?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  maxHeight?: string | number;
  items?: TestItem[];
}

const RoutineTests = forwardRef<HTMLElement, RoutineTestsProps>(function RoutineTests(
  {
    id = 'routine-tests',
    headingId = 'ts-tests-h',
    title = 'The routine tests it runs.',
    subtitle = 'What each test checks, and the part of the transformer it proves.',
    className = '',
    maxHeight,
    items,
  },
  ref
) {
  const innerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLElement);

  const testList = items ?? TESTS;
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

    // Stagger queue: activates intersecting rows sequentially rather than all at once
    const queue: HTMLElement[] = [];
    let timerId: number | null = null;

    const processQueue = () => {
      if (queue.length === 0) {
        timerId = null;
        return;
      }
      const row = queue.shift();
      if (row && !row.classList.contains('on')) {
        row.classList.add('on');
        n++;
        updateProgress();
      }
      // Adaptive cadence: 140ms for gentle rhythm, faster (65ms) if multiple rows are waiting
      const interval = queue.length > 3 ? 65 : 140;
      timerId = window.setTimeout(processQueue, interval);
    };

    const enqueueRow = (row: HTMLElement) => {
      if (row.classList.contains('on') || queue.includes(row)) return;
      queue.push(row);
      if (timerId === null) {
        timerId = window.setTimeout(processQueue, 80);
      }
    };

    // IntersectionObserver inside the scrollable container
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const row = entry.target as HTMLElement;
            enqueueRow(row);
            io.unobserve(row);
          }
        });
      },
      {
        root: scrollEl,
        threshold: 0.2,
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

    // Inertial Smooth Wheel Scroll Engine:
    // Implements fluid lerp momentum (matching site-wide Lenis lerp) while isolating
    // from global window scroll hijack. Once boundary is reached, handoff occurs smoothly.
    let targetY = scrollEl.scrollTop;
    let currentY = scrollEl.scrollTop;
    let isRunning = false;

    const onTick = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.4) {
        currentY = targetY;
        scrollEl.scrollTop = currentY;
        gsap.ticker.remove(onTick);
        isRunning = false;
        return;
      }
      currentY += diff * 0.12;
      scrollEl.scrollTop = currentY;
    };

    const onWheel = (e: WheelEvent) => {
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      if (maxScroll <= 1) return;

      const isDown = e.deltaY > 0;
      const isUp = e.deltaY < 0;

      // Allow smooth internal scroll if there is headroom in the wheel direction
      if ((isDown && targetY < maxScroll - 0.5) || (isUp && targetY > 0.5)) {
        e.preventDefault();
        e.stopPropagation();

        if (reduce) {
          scrollEl.scrollTop += e.deltaY;
          targetY = scrollEl.scrollTop;
          currentY = scrollEl.scrollTop;
          return;
        }

        // Calculate smooth target with boundary clamping
        targetY = Math.max(0, Math.min(maxScroll, targetY + e.deltaY * 0.95));

        if (!isRunning) {
          isRunning = true;
          currentY = scrollEl.scrollTop;
          gsap.ticker.add(onTick);
        }
      } else {
        // At outer boundaries, settle immediately and let the wheel event bubble to normal page scroll
        if (isRunning) {
          gsap.ticker.remove(onTick);
          isRunning = false;
        }
        const boundary = isDown ? maxScroll : 0;
        if (Math.abs(targetY - boundary) <= 0.5) {
          targetY = boundary;
          currentY = boundary;
          scrollEl.scrollTop = boundary;
        } else {
          targetY = scrollEl.scrollTop;
          currentY = scrollEl.scrollTop;
        }
      }
    };

    const onScroll = () => {
      // Sync target when user drags scrollbar thumb natively or uses keyboard
      if (!isRunning) {
        currentY = scrollEl.scrollTop;
        targetY = scrollEl.scrollTop;
      }
    };

    scrollEl.addEventListener('wheel', onWheel, { passive: false });
    scrollEl.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      if (isRunning) gsap.ticker.remove(onTick);
      scrollEl.removeEventListener('wheel', onWheel);
      scrollEl.removeEventListener('scroll', onScroll);
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
              Passed <em>{reduce ? testList.length : 0}</em> / {testList.length}
            </span>
            <i style={{ '--q': reduce ? 1 : 0 } as CSSProperties} />
          </div>
          <div
            className="ts-doc-scroll"
            ref={scrollRef}
            style={maxHeight ? { maxHeight } : undefined}
          >
            <div className="ts-row ts-th" role="row">
              <span role="columnheader">No.</span>
              <span role="columnheader">Test</span>
              <span role="columnheader">What it checks</span>
              <span role="columnheader">Part</span>
              {/* <span role="columnheader">
                <span className="sr">Done</span>
              </span> */}
            </div>
            {testList.map((t, i) => (
              <div className="ts-row" role="row" id={t.id} key={t.id}>
                <span role="cell" className="mono">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 role="cell">{t.name}</h3>
                <p role="cell">{t.text}</p>
                <span role="cell" className="ts-part">
                  {t.part}
                </span>
                {/* <span role="cell" className="ts-tick" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M3.5 8.4l3 3 6-6.6" pathLength={1} />
                  </svg>
                </span> */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default RoutineTests;

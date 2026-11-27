import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Blueprint, { SPOTS } from '../components/Blueprint';
import { createTestingMotion } from './testingMotion';
import { useCinematic } from '../hooks/useCinematic';
import { TESTS } from '../data/testing';

/** 5 key representative tests mapped to the 2D cutaway Blueprint hotspots */
const BLUEPRINT_TESTS = [
  TESTS.find(t => t.id === 'winding-resistance') ?? TESTS[10] ?? TESTS[0], // Winding Resistance (Windings)
  TESTS.find(t => t.id === 'voltage-ratio') ?? TESTS[11] ?? TESTS[1],       // Voltage Ratio & Phase Displacement (HV bushings & leads)
  TESTS.find(t => t.id === 'no-load-loss') ?? TESTS[0] ?? TESTS[2],        // No-Load Loss (Core)
  TESTS.find(t => t.id === 'load-loss') ?? TESTS[4] ?? TESTS[3],           // Load Loss (LV terminals, shorted)
  TESTS.find(t => t.id === 'induced-overvoltage') ?? TESTS[3] ?? TESTS[4], // Induced Over Voltage (HV winding insulation)
];

const NAMES = BLUEPRINT_TESTS.map(t => t.name);
const CYCLE_MS = 5000; // time on each test before moving to the next

export default function Testing() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.tx-wrap');
  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 900px)').matches);
  const test = BLUEPRINT_TESTS[active];

  useEffect(() => {
    const mq = matchMedia('(max-width: 900px)'), on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // tests change on a timer, not with scroll: start once the drawing is done, only while the section
  // is on screen; hovering or clicking a test picks it and restarts the timer
  const [drawn, setDrawn] = useState(false), [inView, setInView] = useState(false);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createTestingMotion(el, reduce, () => setDrawn(true)), el);
    const io = new IntersectionObserver(es => setInView(es[es.length - 1].isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => { ctx.revert(); io.disconnect(); };
  }, [reduce]);

  const running = drawn && inView && !reduce;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setActive(a => (a + 1) % BLUEPRINT_TESTS.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [running, active]);

  return (
    <section id="testing" ref={ref} aria-labelledby="testing-h">
      <div className="tx-wrap">
        <div className="tx-copy">
          <h2 id="testing-h">Transformer testing, automated end to end.</h2>
          <p className="tx-lede">Electrosoft X'mer Edge™ switches the connections, runs each test and writes the report. Here is what it checks, part by part.</p>

          <div className="tx-card" aria-live="polite">
            <div className="tx-meta">
              <span>Test {active + 1} of {BLUEPRINT_TESTS.length} · {SPOTS[active]?.part ?? test.part}</span>
              <span className="tx-steps">
                {BLUEPRINT_TESTS.map((t, i) => <button key={t.id} type="button" aria-label={t.name} className={i === active ? (running ? 'on run' : 'on') : i < active ? 'done' : ''} onClick={() => setActive(i)}><i key={`${active}-${running}`} /></button>)}
              </span>
            </div>
            <h3 key={test.id}>{test.name}</h3>
            <p key={test.id + '-p'}>{test.text}</p>
            <div className="tx-ctas">
              <Link className="pill" to={`/transformer-testing#${test.id}`}>View test details</Link>
              <Link className="tx-all" to="/transformer-testing">All testing solutions</Link>
            </div>
          </div>
        </div>

        <div className="tx-sheet">
          <Blueprint active={active} labels={NAMES} narrow={narrow} onPick={setActive} onHover={setActive} />
        </div>
      </div>
    </section>
  );
}

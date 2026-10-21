import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Blueprint, { SPOTS } from '../components/Blueprint';
import { createTestingMotion, testing } from './testingMotion';

// TODO: CONFIRM — the tests list is [CONFIRM] in CONTENT.md (draft names, shared with the hero bench).
// Descriptions are what each routine test checks in general terms; full detail lives on /transformer-testing#<id>.
const TESTS = [
  { id: 'winding-resistance', name: 'Winding resistance',
    text: 'Passes a steady DC current through each winding and waits for the reading to settle, to catch loose joints, broken strands and tap-changer contact faults.' },
  { id: 'ratio-vector-group', name: 'Ratio & vector group',
    text: 'Compares HV and LV on every tap to confirm the turns ratio, and checks the phase shift between them matches the nameplate vector group.' },
  { id: 'no-load-loss', name: 'No-load loss',
    text: 'Energises the transformer at rated voltage with the other side open, measuring core loss and the magnetising current it draws.' },
  { id: 'load-loss-impedance', name: 'Load loss & impedance',
    text: 'Circulates rated current with the LV terminals shorted, measuring copper loss and the percentage impedance.' },
  { id: 'induced-over-voltage', name: 'Induced over-voltage',
    text: 'Applies above-rated voltage at a raised frequency and holds it, to prove the insulation between turns.' },
];
const NAMES = TESTS.map(t => t.name);

export default function Testing() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 900px)').matches);
  const test = TESTS[active];

  useEffect(() => {
    const mq = matchMedia('(max-width: 900px)'), on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => createTestingMotion(el, TESTS.length, reduce, setActive), el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="testing" ref={ref} aria-labelledby="testing-h">
      <div className="tx-wrap">
        <div className="tx-copy">
          <h2 id="testing-h">Transformer testing, automated end to end.</h2>
          <p className="tx-lede">Electrosoft X'mer Prime™ switches the connections, runs each test and writes the report. Here is what it checks, part by part.</p>

          <div className="tx-card" aria-live="polite">
            <div className="tx-meta">
              <span>Test {active + 1} of {TESTS.length} · {SPOTS[active].part}</span>
              <span className="tx-steps">
                {TESTS.map((t, i) => <button key={t.id} type="button" aria-label={t.name} className={i === active ? 'on' : ''} onClick={() => testing.goTo(i)} />)}
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
          <Blueprint active={active} labels={NAMES} narrow={narrow} onPick={i => testing.goTo(i)} onHover={i => testing.show(i)} />
        </div>
      </div>
    </section>
  );
}

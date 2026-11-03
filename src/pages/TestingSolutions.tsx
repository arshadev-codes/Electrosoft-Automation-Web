import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { SPOTS } from '../components/Blueprint';
import { holdReveal } from '../components/PageTransition';
import { BENCHES, PROJECTS, SYSTEMS, TESTS } from '../data/testing';
import { createTestingSolutionsMotion, heroIn, modeScrollY } from './testingSolutionsMotion';
import { scrollToY } from '../hooks/useSmoothScroll';
import { useCinematic } from '../hooks/useCinematic';
import { Arrow, FeederCta, tilt, untilt } from '../components/ui';

const XfmrScene = lazy(() => import('../components/XfmrScene'));

// TODO: CONFIRM — brochure PDF not supplied yet (same file the footer links to)
const BROCHURE = '/downloads/testing-brochure.pdf';

// X'mer Prime™ features (CONTENT.md), in the order a reading travels
const STOPS = [
  { id: 'xmer', name: 'User friendly', text: 'Set up, run and follow every test on one X\'mer Prime™ screen.' },
  { id: 'report', name: 'Auto report generation', text: 'The test report is written as the results come in.' },
  { id: 'erp', name: 'ERP connectivity', text: 'Results go into your ERP without being typed in again.' },
  { id: 'buyer', name: 'Real-time online access', text: 'Your buyer sees the test data online, as it happens.' },
];

// rating scale: 1 to 200 MVA, logarithmic, so 1.5 MVA and 160 MVA both read
const LOG = (mva: number) => (Math.log10(mva) / Math.log10(200)) * 100;
const TICKS = [1, 2, 5, 10, 20, 50, 100, 200];

/** One phase on the hero scope: three periods of a sine (120 units each), so it loops by one period. */
const WAVE = (shift: number) => {
  let d = '';
  for (let x = 0; x <= 360; x += 4) d += `${x ? 'L' : 'M'}${x} ${(36 - 22 * Math.sin((2 * Math.PI * (x + shift)) / 120)).toFixed(1)}`;
  return d;
};
const PHASES = [['r', 0], ['y', 40], ['b', 80]] as const;

/** The little thing each stop on the signal path produces, drawn in DOM. */
function Artifact({ id }: { id: string }) {
  if (id === 'xmer') return (
    <div className="art art-win">
      <div className="art-bar"><i /><i /><i /><span>X'mer Prime™</span></div>
      <ul>{TESTS.slice(0, 4).map(t => <li key={t.id}><span>{t.name}</span><b /></li>)}</ul>
    </div>
  );
  if (id === 'report') return (
    <div className="art art-doc"><b>Test report</b><i /><i /><i className="s" /><i /><i className="s" /><em /></div>
  );
  if (id === 'erp') return (
    <div className="art art-erp">{[0, 1, 2, 3].map(i => <i key={i} className={i === 2 ? 'hl' : ''}><b /><b /><b /></i>)}</div>
  );
  return (
    <div className="art art-web"><div className="art-url"><em className="live" /><span /></div><i /><i className="s" /><i /></div>
  );
}

/*
 * 3 · Testing Solutions, read as a transformer going through its routine test: the unit under test,
 * the selector that decides who runs it, the path its readings take, the sheet of tests, and the
 * systems already in service on a rating scale. Motion: testingSolutionsMotion.ts.
 */
export default function TestingSolutions() {
  const ref = useRef<HTMLElement>(null), heroRef = useRef<HTMLElement>(null);
  const testsRef = useRef<HTMLElement>(null), benchRef = useRef<HTMLElement>(null);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mode, setMode] = useState(0), [hot, setHot] = useState<string | null>(null);
  const [step, setStep] = useState(0); // hero HUD: which test is running
  useLayoutEffect(() => {
    const el = ref.current, hero = heroRef.current;
    if (!el || !hero) return;
    const ctx = gsap.context(() => createTestingSolutionsMotion(el, reduce, setMode), el);
    const ready = new Promise(res => hero.addEventListener('scene:ready', res, { once: true }));
    holdReveal(ready); // the page transition waits for the transformer (1.8 s max)
    void ready.then(() => ctx.add(() => heroIn(reduce)));
    return () => ctx.revert();
  }, [reduce]);
  // after the page motion: ScrollTriggers must be created in page order, below the selector's pin
  useCinematic(testsRef, '.ts-sheet');
  useCinematic(benchRef, '.wrap');

  useEffect(() => {
    const before = document.title;
    document.title = 'Transformer Testing Solutions — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  // the hero's test run: steps through the tests, then holds on "complete" and starts again
  useEffect(() => {
    if (reduce) { setStep(TESTS.length); return; }
    const id = window.setInterval(() => setStep(s => (s + 1) % (TESTS.length + 2)), 1500);
    return () => window.clearInterval(id);
  }, [reduce]);

  const pickMode = (i: number) => {
    const y = reduce ? null : modeScrollY(i);
    if (y === null) setMode(i); else scrollToY(y);
  };
  const sys = SYSTEMS[mode];

  return (
    <main className="ts" ref={ref}>
      {/* 3.1 hero: the unit under test */}
      <section className="ts-hero" ref={heroRef} aria-labelledby="ts-h">
        <div className="stage-light" aria-hidden="true" />
        <Suspense fallback={null}><XfmrScene sectionRef={heroRef} /></Suspense>
        <div className="ts-copy">
          <h1 className="ts-h1" id="ts-h"><span className="ln"><span>Transformer</span></span><span className="ln"><span>Testing Suite</span></span></h1>
          <p className="ts-lede">Confidence in every connection. Accurate, safe and automated testing for distribution and power transformers.</p>
          <div className="ts-ctas">
            <a className="pill" href={BROCHURE} download>Download brochure</a>
            <Link className="line-btn" to="/contact">Contact us</Link>
          </div>
        </div>
        <ol className="ts-hud mono" aria-label="Routine tests">
          {TESTS.map((t, i) => <li key={t.id} className={i < step ? 'done' : i === step ? 'run' : ''}><i />{t.name}</li>)}
        </ol>
        {/* the scope on the bench: three phases while a test runs, flat once the run is complete */}
        <div className={`ts-scope${step < TESTS.length ? '' : ' idle'}`} aria-hidden="true">
          <svg viewBox="0 0 240 72" preserveAspectRatio="none">
            <path className="grid" d="M0 36H240M60 0V72M120 0V72M180 0V72" />
            <g className="phs">{PHASES.map(([c, sh]) => <path key={c} className={`ph ${c}`} d={WAVE(sh)} />)}</g>
          </svg>
          <p className="mono">{step < TESTS.length ? <><i className="run" />{TESTS[step].name}</> : <><i className="ok" />All tests passed</>}</p>
        </div>
      </section>

      {/* 3.2 the three systems, as the selector switch on the test desk */}
      <section className="ts-modes gut" aria-labelledby="ts-modes-h">
        <div className="wrap ts-modes-in">
          <div className="sel" role="radiogroup" aria-label="Test system">
            <div className="sel-legends">
              {SYSTEMS.map((s, i) => (
                <button key={s.id} type="button" role="radio" aria-checked={i === mode} aria-label={s.name}
                  className={`sel-pos p${i}${i === mode ? ' on' : ''}`} onClick={() => pickMode(i)}>
                  <i className="sel-lamp" />{s.pos}
                </button>
              ))}
            </div>
            <svg className="sel-body" viewBox="0 0 240 240" aria-hidden="true">
              <defs>
                <radialGradient id="selBezel" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D9DDE3" /></radialGradient>
                <linearGradient id="selKnob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3F47" /><stop offset="1" stopColor="#14171C" /></linearGradient>
              </defs>
              <circle cx="120" cy="120" r="104" fill="url(#selBezel)" />
              <circle cx="120" cy="120" r="104" fill="none" stroke="rgba(14,17,22,.12)" />
              <circle cx="120" cy="120" r="86" fill="none" stroke="rgba(14,17,22,.08)" strokeDasharray="1 5" />
              {/* the knob's travel, lit up to where it points */}
              <path className="sel-track" d="M46.46 58.3A96 96 0 0 1 193.54 58.3" />
              <path className="sel-arc" d="M46.46 58.3A96 96 0 0 1 193.54 58.3" pathLength={1} style={{ strokeDashoffset: reduce ? 1 - mode / 2 : 1 }} />
              {[-50, 0, 50].map((a, i) => <line key={a} className={i === mode ? 'on' : ''} x1="120" y1="20" x2="120" y2="32" transform={`rotate(${a} 120 120)`} />)}
              <g className="sel-knob" transform={reduce ? `rotate(${-50 + mode * 50} 120 120)` : undefined}>
                <circle cx="120" cy="120" r="62" fill="url(#selKnob)" />
                <circle cx="120" cy="120" r="62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
                <rect x="108" y="46" width="24" height="148" rx="12" fill="#22262C" stroke="rgba(255,255,255,.1)" />
                <rect x="117" y="52" width="6" height="40" rx="3" fill="#FFFFFF" />
              </g>
            </svg>
          </div>

          <div className="ts-sys" aria-live="polite">
            <h2 id="ts-modes-h">Three ways to run a test.</h2>
            <div className="ts-sys-body" key={sys.id}>
              <h3>{sys.name}</h3>
              <p>{sys.text}</p>
              <ul className="duty">
                {sys.duties.map(([d, t], k) => <li key={t} className={d} style={{ '--k': k } as CSSProperties}><i aria-hidden="true" /><span className="sr">{d === 'auto' ? 'Automatic: ' : 'By the operator: '}</span>{t}</li>)}
              </ul>
              <p className="ts-ref">In service at {sys.ref}</p>
            </div>
            <p className="duty-key" aria-hidden="true"><span className="auto"><i />X'mer Prime™ does it</span><span className="hand"><i />Operator at the desk</span></p>
          </div>
        </div>
      </section>

      {/* 3.3 X'mer Prime™: the path a reading takes */}
      <section className="ts-xmer gut" aria-labelledby="ts-xmer-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ts-xmer-h">From the test bench to your buyer.</h2>
            <p>Electrosoft X'mer Prime™ carries every reading the whole way, with nobody copying numbers.</p>
          </div>
          <ol className="ts-sig" style={{ '--p': reduce ? 1 : 0 } as CSSProperties}>
            <li className="ts-wire" aria-hidden="true"><i /><b /></li>
            {STOPS.map(s => (
              <li className="ts-stop" key={s.id} onPointerMove={tilt} onPointerLeave={untilt}>
                <Artifact id={s.id} />
                <span className="ts-node" aria-hidden="true" />
                <h3>{s.name}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3.4 the tests, as a routine test sheet; Home links here by #<test id> */}
      <section className="ts-tests gut" ref={testsRef} aria-labelledby="ts-tests-h">
        <div className="wrap ts-sheet">
          <div className="sec-head">
            <h2 id="ts-tests-h">The routine tests it runs.</h2>
            <p>What each test checks, and the part of the transformer it proves.</p>
          </div>
          <div className="ts-doc" role="table" aria-label="Routine tests">
            <div className="ts-doc-bar" aria-hidden="true">
              <b>Routine test sheet</b>
              <span className="mono">Passed <em>{reduce ? TESTS.length : 0}</em> / {TESTS.length}</span>
              <i style={{ '--q': reduce ? 1 : 0 } as CSSProperties} />
            </div>
            <div className="ts-row ts-th" role="row">
              <span role="columnheader">No.</span><span role="columnheader">Test</span><span role="columnheader">What it checks</span><span role="columnheader">Part</span><span role="columnheader"><span className="sr">Done</span></span>
            </div>
            {TESTS.map((t, i) => (
              <div className="ts-row" role="row" id={t.id} key={t.id}>
                <span role="cell" className="mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 role="cell">{t.name}</h3>
                <p role="cell">{t.text}</p>
                <span role="cell" className="ts-part">{SPOTS[i].part}</span>
                <span role="cell" className="ts-tick" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 8.4l3 3 6-6.6" pathLength={1} /></svg></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.6 other benches (draft, TODO: CONFIRM in data/testing.ts) */}
      <section className="ts-bench gut" ref={benchRef} aria-labelledby="ts-bench-h">
        <div className="wrap">
          <div>
            <h2 id="ts-bench-h">Reactors and motors too.</h2>
            <p>Test benches beyond transformers, built to order.</p>
          </div>
          <ul>
            {BENCHES.map(b => (
              <li key={b.id} id={b.id}>
                <h3>{b.name}</h3>
                <p>{b.text}{b.link && <> <Link to={b.link}>See DC panels</Link></>}</p>
                <Link className="line-btn" to={`/contact?product=${b.id}`}>Ask about a bench<span className="sr">: {b.name}</span><Arrow /></Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.5 projects on a rating scale */}
      <section className="ts-proj gut" aria-labelledby="ts-proj-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ts-proj-h">In service, up to 160 MVA.</h2>
            <p>Four testing systems, from distribution transformers to 160 MVA power units.</p>
          </div>
          <div className="ts-scale" style={{ '--n': reduce ? LOG(160) / 100 : 0 } as CSSProperties} aria-hidden="true">
            <i className="ts-rule" />
            {TICKS.map(t => <span key={t} className="ts-tk mono" style={{ left: `${LOG(t)}%` }}>{t}{t === 200 ? ' MVA' : ''}</span>)}
            <i className="ts-needle"><em className="mono" /></i>
            {PROJECTS.map((p, i) => (
              <span key={p.id} className={`ts-mark ${i % 2 ? 'dn' : 'up'}${LOG(p.mva) > 80 ? ' end' : ''}`} data-hot={hot === p.id || undefined} style={{ '--x': LOG(p.mva) } as CSSProperties}>
                <b>{p.client}</b><em className="mono">{p.rating}</em>
              </span>
            ))}
          </div>
          {/* hover state is a data attribute: the scroll motion owns the class lists (.on) */}
          <div className="ts-plates">
            {PROJECTS.map(p => (
              <article key={p.id} className="plate" data-hot={hot === p.id || undefined} aria-labelledby={`${p.id}-h`}
                onPointerEnter={() => setHot(p.id)} onPointerMove={e => tilt(e, 6)} onPointerLeave={e => { setHot(null); untilt(e); }}>
                <i className="plate-glint" aria-hidden="true" />
                <header><h3 id={`${p.id}-h`}>{p.client}</h3><span>{p.system}</span></header>
                {p.full && <p className="plate-full">{p.full}</p>}
                <dl className="mono"><div><dt>Rating</dt><dd>up to {p.rating}</dd></div><div><dt>Voltage</dt><dd>{p.kv}</dd></div></dl>
                <ul>{p.scope.map(s => <li key={s}>{s}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FeederCta id="ts-cta-h" tag="Your transformer">
        <a className="line-btn" href={BROCHURE} download>Download brochure</a>
        <Link className="pill" to="/contact?product=transformer-testing">Get a Quote<Arrow /></Link>
      </FeederCta>
    </main>
  );
}

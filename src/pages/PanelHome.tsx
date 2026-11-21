import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { holdReveal } from '../components/PageTransition';
import { BENCHES, PROJECTS, SYSTEMS, TESTS, TEMPTEST, PROJECTS2, TICKS, mvaToPos } from '../data/testing';
import { createPanelMotion, panelHeroIn, panelModeScrollY } from './panelMotion';
import { scrollToY } from '../hooks/useSmoothScroll';
import { useCinematic } from '../hooks/useCinematic';
import { Arrow, FeederCta, tilt, untilt } from '../components/ui';
import RoutineTests from '../sections/RoutineTests';

const XfmrScene = lazy(() => import('../components/XfmrScene'));

// TODO: CONFIRM — brochure PDF not supplied yet (same file the footer links to)
const BROCHURE = '/downloads/testing-brochure.pdf';

// X'mer Edge™ features (CONTENT.md), in the order a reading travels
const STOPS = [
  { id: 'xmer', name: 'User friendly', text: 'Set up, run and follow every test on one X\'mer Prime™ screen.' },
  { id: 'report', name: 'Auto report generation', text: 'The test report is written as the results come in.' },
  { id: 'erp', name: 'ERP connectivity', text: 'Results go into your ERP without being typed in again.' },
  { id: 'buyer', name: 'Real-time online access', text: 'Your buyer sees the test data online, as it happens.' },
];

interface MarkLayout {
  side: 'up' | 'dn';
  align: 'start' | 'center' | 'end';
  level: 1 | 2;
}

const getDefaultLayout = (index: number, mva: number): MarkLayout => {
  const pos = mvaToPos(mva);
  const side: 'up' | 'dn' = index % 2 === 0 ? 'up' : 'dn';
  const align: 'start' | 'center' | 'end' = pos <= 10 ? 'start' : pos >= 88 ? 'end' : 'center';
  return { side, align, level: 1 };
};

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
      <div className="art-bar"><i /><i /><i /><span>X'mer Edge™</span></div>
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
 * Panel Home — exact copy of TestingSolutions layout and animations.
 * Lives at /panel. All internal links are /panel-prefixed.
 * Motion: panelMotion.ts (renamed copy of testingSolutionsMotion.ts).
 */
export default function PanelHome() {
  const ref = useRef<HTMLElement>(null), heroRef = useRef<HTMLElement>(null);
  const benchRef = useRef<HTMLElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const markRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mode, setMode] = useState(0), [hot, setHot] = useState<string | null>(null);
  const [step, setStep] = useState(0); // hero HUD: which test is running
  const [markLayouts, setMarkLayouts] = useState<MarkLayout[]>(() =>
    PROJECTS2.map((p, i) => getDefaultLayout(i, p.mva))
  );

  useLayoutEffect(() => {
    const scaleEl = scaleRef.current;
    if (!scaleEl) return;

    const updateLayouts = () => {
      const rect = scaleEl.getBoundingClientRect();
      const width = rect.width;
      if (width <= 0) return;

      const GAP = 12;

      const items = PROJECTS2.map((p, i) => {
        const el = markRefs.current[i];
        const pos = mvaToPos(p.mva);
        const anchorX = (pos / 100) * width;
        const elWidth = el ? el.getBoundingClientRect().width : Math.min(130, Math.max(60, p.client.length * 7.5));

        let align: 'start' | 'center' | 'end' = 'center';
        let left = anchorX - elWidth / 2;
        let right = anchorX + elWidth / 2;

        if (anchorX - elWidth / 2 < 0 || pos <= 10) {
          align = 'start';
          left = anchorX;
          right = anchorX + elWidth;
        } else if (anchorX + elWidth / 2 > width || pos >= 88) {
          align = 'end';
          left = anchorX - elWidth;
          right = anchorX;
        }

        const side: 'up' | 'dn' = i % 2 === 0 ? 'up' : 'dn';

        return { index: i, pos, left, right, side, align, level: 1 as 1 | 2 };
      });

      for (const side of ['up', 'dn'] as const) {
        const sideItems = items.filter(it => it.side === side).sort((a, b) => a.pos - b.pos);
        const level1Intervals: { left: number; right: number }[] = [];

        for (const item of sideItems) {
          const collides = level1Intervals.some(
            inv => !(item.right + GAP < inv.left || item.left - GAP > inv.right)
          );
          if (collides) {
            item.level = 2;
          } else {
            item.level = 1;
            level1Intervals.push({ left: item.left, right: item.right });
          }
        }
      }

      setMarkLayouts(items.map(it => ({ side: it.side, align: it.align, level: it.level })));
    };

    updateLayouts();
    const observer = new ResizeObserver(updateLayouts);
    observer.observe(scaleEl);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current, hero = heroRef.current;
    if (!el || !hero) return;
    const ctx = gsap.context(() => createPanelMotion(el, reduce, setMode), el);
    const ready = new Promise(res => hero.addEventListener('scene:ready', res, { once: true }));
    holdReveal(ready);
    void ready.then(() => ctx.add(() => panelHeroIn(reduce)));
    return () => ctx.revert();
  }, [reduce]);

  useCinematic(benchRef, '.wrap');

  useEffect(() => {
    const before = document.title;
    document.title = 'Panels & Automation — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  useEffect(() => {
    if (reduce) { setStep(TEMPTEST.length); return; }
    const id = window.setInterval(() => setStep(s => (s + 1) % (TEMPTEST.length + 2)), 1500);
    return () => window.clearInterval(id);
  }, [reduce]);

  const pickMode = (i: number) => {
    const y = reduce ? null : panelModeScrollY(i);
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
            <Link className="line-btn" to="/panel/contact">Contact us</Link>
          </div>
        </div>
        <ol className="ts-hud mono" aria-label="Routine tests">
          {TEMPTEST.map((t, i) => <li key={t} className={i < step ? 'done' : i === step ? 'run' : ''}><i />{t}</li>)}
        </ol>
        {/* the scope on the bench: three phases while a test runs, flat once the run is complete */}
        <div className={`ts-scope${step < TEMPTEST.length ? '' : ' idle'}`} aria-hidden="true">
          <svg viewBox="0 0 240 72" preserveAspectRatio="none">
            <path className="grid" d="M0 36H240M60 0V72M120 0V72M180 0V72" />
            <g className="phs">{PHASES.map(([c, sh]) => <path key={c} className={`ph ${c}`} d={WAVE(sh)} />)}</g>
          </svg>
          <p className="mono">{step < TEMPTEST.length ? <><i className="run" />{TEMPTEST[step]}</> : <><i className="ok" />All tests passed</>}</p>
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
                <radialGradient id="selBezel2" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D9DDE3" /></radialGradient>
                <linearGradient id="selKnob2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3F47" /><stop offset="1" stopColor="#14171C" /></linearGradient>
              </defs>
              <circle cx="120" cy="120" r="104" fill="url(#selBezel2)" />
              <circle cx="120" cy="120" r="104" fill="none" stroke="rgba(14,17,22,.12)" />
              <circle cx="120" cy="120" r="86" fill="none" stroke="rgba(14,17,22,.08)" strokeDasharray="1 5" />
              {/* the knob's travel, lit up to where it points */}
              <path className="sel-track" d="M46.46 58.3A96 96 0 0 1 193.54 58.3" />
              <path className="sel-arc" d="M46.46 58.3A96 96 0 0 1 193.54 58.3" pathLength={1} style={{ strokeDashoffset: reduce ? 1 - mode / 2 : 1 }} />
              {[-50, 0, 50].map((a, i) => <line key={a} className={i === mode ? 'on' : ''} x1="120" y1="20" x2="120" y2="32" transform={`rotate(${a} 120 120)`} />)}
              <g className="sel-knob" transform={reduce ? `rotate(${-50 + mode * 50} 120 120)` : undefined}>
                <circle cx="120" cy="120" r="62" fill="url(#selKnob2)" />
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
            <p className="duty-key" aria-hidden="true"><span className="auto"><i />X'mer Edge™ does it</span><span className="hand"><i />Operator at the desk</span></p>
          </div>
        </div>
      </section>

      {/* 3.3 X'mer Edge™: the path a reading takes */}
      <section className="ts-xmer gut" aria-labelledby="ts-xmer-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ts-xmer-h">From the test bench to your buyer.</h2>
            <p>Electrosoft X'mer Edge™ carries every reading the whole way, with nobody copying numbers.</p>
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

      {/* 3.4 the tests, as a routine test sheet */}
      <RoutineTests />

      {/* 3.6 other benches */}
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
                <p>{b.text}{b.link && <> <Link to={b.link.startsWith('/products') ? `/panel${b.link}` : b.link}>See DC panels</Link></>}</p>
                <Link className="line-btn" to={`/panel/contact?product=${b.id}`}>Ask about a bench<span className="sr">: {b.name}</span><Arrow /></Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3.5 projects on a rating scale */}
      <section className="ts-proj gut" aria-labelledby="ts-proj-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ts-proj-h">In service, up to 750 MVA.</h2>
            <p>Testing systems from distribution transformers to 750 MVA power units.</p>
          </div>
          <div
            ref={scaleRef}
            className="ts-scale"
            style={{ '--n': reduce ? 1 : 0 } as CSSProperties}
            aria-hidden="true"
          >
            <i className="ts-rule" />
            {TICKS.map(t => (
              <span key={t} className="ts-tk mono" style={{ left: `${mvaToPos(t)}%` }}>
                {t}{t === 750 ? ' MVA' : ''}
              </span>
            ))}
            <i className="ts-needle">
              <em className={`mono${reduce ? ' rest' : ''}`}>{reduce ? '750 MVA' : ''}</em>
            </i>
            {PROJECTS2.map((p, i) => {
              const layout = markLayouts[i] || getDefaultLayout(i, p.mva);
              const pos = mvaToPos(p.mva);
              return (
                <span
                  key={p.id}
                  ref={el => { markRefs.current[i] = el; }}
                  className={`ts-mark ${layout.side} ${layout.align} lvl-${layout.level}`}
                  data-hot={hot === p.id || undefined}
                  style={{ '--x': pos } as CSSProperties}
                >
                  <span className="ts-mark-stem" aria-hidden="true" />
                  <b>{p.client}</b>
                  <em className="mono">{p.rating}</em>
                </span>
              );
            })}
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
        <Link className="pill" to="/panel/contact?product=transformer-testing">Get a Quote<Arrow /></Link>
      </FeederCta>
    </main>
  );
}

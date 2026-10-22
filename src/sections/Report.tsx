import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { createReportMotion } from './reportMotion';
import { useCinematic } from '../hooks/useCinematic';

// CONTENT.md · Testing Solutions: X'mer Prime™ runs every test, does the calculations, auto-generates
// reports, connects to ERP and gives buyers real-time online access to test data.
// TODO: CONFIRM — the report module is still being built: the screen is a concept, the unit and values
// are a labelled sample, and the test names are still [CONFIRM] in CONTENT.md.
const TESTS = [
  ['Winding resistance', 'Δ 0.6 %'],
  ['Ratio & vector group', '0.08 % · Dyn11'],
  ['No-load loss', '2.04 kW'],
  ['Load loss & impedance', '6.18 %'],
  ['Induced over-voltage', 'Withstood'],
];
const ERP = ['Test record', 'Unit serial', 'Report PDF'];

// keyboard: five rows of 14, then modifiers around a 7-wide space bar
const KEYS = [...Array(70).fill(1), 1, 1, 1, 7, 1, 1, 1, 1];

const Bolt = () => <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="currentColor" /></svg>;
const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.3l2.6 2.6L12 5.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export default function Report() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.rp-stage', { exit: false }); // the pinned story dissolves on its own way out

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createReportMotion(el, matchMedia('(prefers-reduced-motion: reduce)').matches), el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="report" ref={ref} aria-labelledby="report-h">
      <div className="rp-stage">
        <header className="rp-head">
          <h2 id="report-h">Every test run ends in a finished report.</h2>
          <p>Electrosoft X'mer Prime™ does the calculations and generates the report automatically, with ERP connectivity and real-time online access for your buyers.</p>
        </header>

        <div className="rp-scene">
          <div className="mb">
            <div className="mb-floor" aria-hidden="true" />
            <div className="mb-base" aria-hidden="true">
              <div className="mb-keys">{KEYS.map((w, i) => <i key={i} style={w > 1 ? { gridColumn: `span ${w}` } : undefined} />)}</div>
              <div className="mb-pad" />
            </div>
            <div className="mb-lip" aria-hidden="true" />

            <div className="mb-lid">
              <div className="mb-shell" aria-hidden="true"><Bolt /></div>
              <div className="mb-bezel">
                <i className="mb-cam" aria-hidden="true" />
                <div className="mb-display">
                  {/* X'mer Prime report module, laid out at 1280×800 and scaled to the display */}
                  <div className="mb-ui" aria-hidden="true">
                    <div className="ui-top">
                      <span className="ui-dots"><i /><i /><i /></span>
                      <b className="ui-brand"><Bolt />X'mer Prime™</b>
                      <span className="ui-tabs"><span>Live test</span><span className="on">Reports</span><span>Units</span><span>ERP</span></span>
                      <span className="ui-unit">Sample unit · 1500 kVA · 33 / 0.433 kV</span>
                    </div>
                    <div className="ui-body">
                      <div className="ui-col ui-left">
                        <section className="ui-panel ui-tests" data-src>
                          <h4>Routine tests</h4>
                          <ol>{TESTS.map(([n, v]) => <li key={n}><span>{n}</span><em>{v}</em><b><i /></b></li>)}</ol>
                        </section>
                        <section className="ui-panel ui-status">
                          <h4>Report</h4>
                          <div className="ui-progress"><i /></div>
                          <p><span className="busy">Generating report…</span><span className="done">Report ready · PDF</span></p>
                          <div className="ui-btns"><span>Export PDF</span><span>Send to ERP</span></div>
                        </section>
                      </div>
                      <section className="ui-page" data-src>
                        <div className="ui-page-head"><Bolt /><b>ELECTROSOFT</b><span>Routine test report</span></div>
                        <dl className="ui-meta">
                          <div><dt>Unit</dt><dd>Sample</dd></div><div><dt>Rating</dt><dd>1500 kVA</dd></div>
                          <div><dt>Voltage</dt><dd>33 / 0.433 kV</dd></div><div><dt>Vector group</dt><dd>Dyn11</dd></div>
                        </dl>
                        <div className="ui-page-body">
                          {TESTS.map(([n, v]) => <p key={n}><span>{n}</span><i /><em>{v}</em></p>)}
                          <div className="ui-page-foot"><span>Result: all tests passed</span><b className="ui-stamp">PASSED</b></div>
                        </div>
                      </section>
                      <div className="ui-col ui-right">
                        <section className="ui-panel ui-erp" data-src>
                          <h4>ERP <span className="ui-chip">Synced</span></h4>
                          <ul>{ERP.map(n => <li key={n}>{n}<Tick /></li>)}</ul>
                        </section>
                        <section className="ui-panel ui-buyer" data-src>
                          <h4>Buyer access <span className="ui-live"><i />Live</span></h4>
                          <div className="ui-link">portal / sample-unit</div>
                          <div className="ui-dots5">{TESTS.map(([n]) => <i key={n} />)}<span>5 / 5 tests</span></div>
                        </section>
                      </div>
                    </div>
                  </div>
                  <i className="mb-glare" aria-hidden="true" />
                </div>
              </div>

              {/* the parts that lift out of the screen, with what they do */}
              <div className="rp-pop" style={{ '--py': '-14%' } as CSSProperties}>
                <div className="rp-card">
                  <ol className="rp-mini rp-tests">{TESTS.map(([n]) => <li key={n}><span>{n}</span><b>Pass</b></li>)}</ol>
                  <h3>Every calculation, done for you</h3>
                  <p>X'mer Prime™ runs each test and does all the calculations. Zero human error.</p>
                </div>
              </div>
              <div className="rp-pop" style={{ '--py': '64%' } as CSSProperties}>
                <div className="rp-card">
                  <div className="rp-mini rp-doc">
                    <div><Bolt /><b>Routine test report</b><span>PDF</span></div>
                    <i /><i /><i /><i />
                    <p>All tests passed <b>PASSED</b></p>
                  </div>
                  <h3>The report writes itself</h3>
                  <p>Test reports are generated automatically at the end of the run.</p>
                </div>
              </div>
              <div className="rp-pop" style={{ '--py': '-14%' } as CSSProperties}>
                <div className="rp-card">
                  <ul className="rp-mini rp-erp">{ERP.map(n => <li key={n}>{n}<Tick /></li>)}</ul>
                  <h3>Straight into your ERP</h3>
                  <p>Results and reports flow into your ERP system.</p>
                </div>
              </div>
              <div className="rp-pop" style={{ '--py': '64%' } as CSSProperties}>
                <div className="rp-card">
                  <div className="rp-mini rp-buyer"><span className="ui-live"><i />Live</span><b>portal / sample-unit</b><span className="rp-five">{TESTS.map(([n]) => <i key={n} />)}</span></div>
                  <h3>Live for your buyers</h3>
                  <p>Real-time online access to test data for your buyers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

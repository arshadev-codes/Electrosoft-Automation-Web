import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { createLinesMotion } from './linesMotion';

const LinesScene = lazy(() => import('../components/LinesScene'));

// CONTENT.md · Home §3. Callout facts: company facts + testing-system capacity.
export default function Lines() {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createLinesMotion(el, matchMedia('(prefers-reduced-motion: reduce)').matches), el);
    return () => ctx.revert();
  }, []);

  // build the 3D only as the section approaches, so it never competes with the hero
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="lines" ref={ref} aria-labelledby="lines-h">
      <h2 id="lines-h" className="sr">Two business lines</h2>
      <div className="lx-light" aria-hidden="true" />
      {near && <Suspense fallback={null}><LinesScene sectionRef={ref} /></Suspense>}

      <div className="lx-copy lx-a">
        <h3>Electrosoft X’mer Edge™</h3>
        <p>Experience next-generation transformer testing with fully automated connections, precise test execution, and instant report generation for unmatched accuracy and efficiency.</p>
        
        <Link className="pill" to="/products">View products</Link>
      </div>

      <div className="lx-copy lx-b">
        <h3>Transformer Testing Systems</h3>
        <p>Fully automatic, semi automatic and manual test systems powered by Electrosoft X'mer Edge™, supplied to MSEDCL, Tata Power, Crompton Greaves and more.</p>
        <dl className="lx-plate">
          <div><dt>Largest rating</dt><dd>750 MVA</dd></div>
          <div><dt>At</dt><dd>132 kV</dd></div>
        </dl>
        <Link className="pill" to="/transformer-testing">Explore testing solutions</Link>
      </div>

      {/* pinned to the 3D model; positioned every frame by LinesScene, in this order */}
      <div className="callouts lx-callouts" aria-hidden="true">
        <div hidden className="callout" style={{ '--l': '110px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b><em className="live" />X'mer Edge™</b><span>Runs every test, writes the report</span></div></div>
        <div hidden className="callout right" style={{ '--l': '84px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Ratio &amp; vector group</b><span>Measured and verified</span></div></div>
        <div hidden className="callout down" style={{ '--l': '190px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Report generated</b><span>Test results ready to share</span></div></div>
        <div className="callout left" style={{ '--l': '40px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Up to 750 MVA</b><span>Largest rating our systems test</span></div></div>
        <div className="callout" style={{ '--l': '50px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b><em className="live" />X'mer Edge™</b><span>Runs every test, writes the report</span></div></div>
        <div className="callout down" style={{ '--l': '60px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Zero human error</b><span>Connections switched automatically</span></div></div>
      </div>

      <div className="hud lx-hud mono" aria-hidden="true">
        <span data-k="a" className="on">X'mer Edge™</span>
        <span className="bar"><i /></span>
        <span data-k="b">Testing</span>
      </div>
      <p className="lx-fallback mono" hidden>3D view unavailable in this browser</p>
    </section>
  );
}

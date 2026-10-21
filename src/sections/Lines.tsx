import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { createLinesMotion } from './linesMotion';

const LinesScene = lazy(() => import('../components/LinesScene'));

// CONTENT.md · Home §3. Callout facts: company facts + testing projects (Nucon 160 MVA).
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
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="lines" ref={ref} aria-labelledby="lines-h">
      <h2 id="lines-h" className="sr">Two business lines</h2>
      {near && <Suspense fallback={null}><LinesScene sectionRef={ref} /></Suspense>}
      <div className="lx-vignette" aria-hidden="true" />

      <div className="lx-copy lx-a">
        <h3>Electrical &amp; Automation Panels</h3>
        <p>PLC/SCADA, PCC, MCC, draw-out, APFC, VFD, DC and distribution panels, built to CPRI-approved design and 100% tested before dispatch.</p>
        <dl className="lx-plate">
          <div><dt>Short circuit</dt><dd>65 kA</dd></div>
          <div><dt>Enclosure</dt><dd>IP65</dd></div>
        </dl>
        <Link className="pill" to="/products">View products</Link>
      </div>

      <div className="lx-copy lx-b">
        <h3>Transformer Testing Systems</h3>
        <p>Fully automatic, semi automatic and manual test systems powered by Electrosoft X'mer Prime™, supplied to MSEDCL, Tata Power, Crompton Greaves and more.</p>
        <dl className="lx-plate">
          <div><dt>Largest rating</dt><dd>160 MVA</dd></div>
          <div><dt>At</dt><dd>33 kV</dd></div>
        </dl>
        <Link className="pill" to="/transformer-testing">Explore testing solutions</Link>
      </div>

      {/* pinned to the 3D model; positioned every frame by LinesScene, in this order */}
      <div className="callouts lx-callouts" aria-hidden="true">
        <div className="callout" style={{ '--l': '64px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>65 kA short circuit</b><span>CPRI approved design · IP65</span></div></div>
        <div className="callout" style={{ '--l': '120px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>PLC / SCADA</b><span>Programmed by a team with 20+ years</span></div></div>
        <div className="callout down" style={{ '--l': '50px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>100% tested</b><span>Before dispatch</span></div></div>
        <div className="callout" style={{ '--l': '70px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Up to 160 MVA</b><span>Largest rating our systems test</span></div></div>
        <div className="callout" style={{ '--l': '110px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b><em className="live" />X'mer Prime™</b><span>Runs every test, writes the report</span></div></div>
        <div className="callout down" style={{ '--l': '60px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Zero human error</b><span>Connections switched automatically</span></div></div>
      </div>

      <div className="hud lx-hud mono" aria-hidden="true">
        <span data-k="a" className="on">Panels</span>
        <span className="bar"><i /></span>
        <span data-k="b">Testing</span>
      </div>
      <p className="lx-fallback mono" hidden>3D view unavailable in this browser</p>
    </section>
  );
}

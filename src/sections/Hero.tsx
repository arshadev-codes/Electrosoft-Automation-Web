import { lazy, Suspense, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { createHeroMotion } from './heroMotion';

const PanelScene = lazy(() => import('../components/PanelScene'));

// TODO: CONFIRM — hero focus (panels vs testing vs both) is still open in CONTENT.md; using the "both" draft.
const LINES = ['Electrical,', 'automation and', 'testing systems', 'engineered to'];

export default function Hero() {
  const stageRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current, copy = stage?.querySelector('.hero-copy');
    if (!stage || !copy) return;
    // scroll story + pin first, so the hero is never re-parented after the text starts animating
    const ctx = gsap.context(() => createHeroMotion(stage, matchMedia('(prefers-reduced-motion: reduce)').matches), stage);
    // headline and 3D bay arrive together: wait for the display font and the scene's first frame
    // (capped, so slow devices still get the text); the reveal itself is CSS
    let done = false, fonts = false, scene = false;
    const reveal = () => { if (!done) { done = true; copy.classList.add('is-in'); } };
    const check = () => { if (fonts && scene) requestAnimationFrame(reveal); };
    const onScene = () => { scene = true; check(); };
    stage.addEventListener('scene:ready', onScene);
    document.fonts?.ready.then(() => { fonts = true; check(); });
    const fallback = window.setTimeout(reveal, 3000);
    return () => { done = true; window.clearTimeout(fallback); stage.removeEventListener('scene:ready', onScene); ctx.revert(); };
  }, []);

  return (
    <section id="stage" ref={stageRef} aria-label="An Electrosoft transformer test bench, assembled and exploded">
      <div className="stage-light" />
      <div className="grid-bg" />
      <Suspense fallback={null}>
        <PanelScene stageRef={stageRef} />
      </Suspense>

      <div className="vignette" aria-hidden="true" />

      <div className="hero-copy" id="heroCopy">
        <div className="eyebrow mono fade" style={{ '--i': 0 } as CSSProperties}><span className="dot" />Since 1989 · Thane, India</div>
        <h1 className="h1">
          {LINES.map((l, i) => <span className="ln" key={l}><span style={{ '--i': i } as CSSProperties}>{l}</span></span>)}
          <span className="ln"><span style={{ '--i': LINES.length } as CSSProperties}><em>run for decades.</em></span></span>
        </h1>
        <p className="lede fade" style={{ '--i': 1 } as CSSProperties}>We design, build and commission control panels, plant automation and fully automatic transformer testing systems for industry and government.</p>
        <div className="ctas fade" style={{ '--i': 2 } as CSSProperties}>
          <Link className="pill" to="/contact">Get a Quote</Link>
          <Link className="ghost" to="/transformer-testing">Explore Testing Solutions ›</Link>
        </div>
        <div className="scrollcue mono fade" style={{ '--i': 3 } as CSSProperties}><span className="mouse"><i /></span>Scroll to run the test</div>
      </div>

      <div className="caps" aria-live="polite">
        <div className="cap" id="cap1">
          <span className="mono">Step 1 · Connect</span>
          <h2>Test it without touching a cable.</h2>
          <p>Electrosoft X'mer Prime™ switches the physical connections automatically.</p>
        </div>
        <div className="cap" id="cap2">
          <span className="mono">Step 2 · Test</span>
          <h2>Every test. Every calculation.</h2>
          <p>The software runs every test and does all the calculations. Zero human error.</p>
        </div>
        <div className="cap" id="cap3">
          <span className="mono">Step 3 · Report</span>
          <h2>Reports, auto-generated.</h2>
          <p>ERP connectivity and real-time online access to test data for your buyers.</p>
        </div>
      </div>

      {/* spec callouts pinned to the 3D model; positioned every frame by PanelScene */}
      <div className="callouts" aria-hidden="true">
        <div className="callout" data-id="mva" style={{ '--l': '46px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>Up to 160 MVA</b><span>Largest transformer our test systems handle</span></div></div>
        <div className="callout" data-id="xmer" style={{ '--l': '150px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b><em className="live" />X'mer Prime™</b><span>Fully automatic · ERP connected</span></div></div>
        <div className="callout down" data-id="cpri" style={{ '--l': '58px' } as CSSProperties}><i className="stem" /><i className="pin" /><div className="card"><b>CPRI approved</b><span>65kA · IP65 panel design</span></div></div>
      </div>

      <div className="bay-chip mono"><em className="live" />Test Bay 01 · Live</div>

      <div className="hud mono">
        <span id="hudState"><b>Ready</b></span>
        <span className="bar"><i id="hudBar" /></span>
        <span id="hudCount">0 / 9</span>
      </div>
      <p className="fallback mono" id="fallback" hidden>3D view unavailable in this browser</p>
    </section>
  );
}

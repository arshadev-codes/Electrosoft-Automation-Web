import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useCinematic } from '../hooks/useCinematic';

// CONTENT.md · Home §6 Why Electrosoft. The four promises are four pilot lamps on one panel door:
// each legend plate is the promise's heading, and its line sits on the page under the lamp.
const PROMISES = [
  { id: 'quality', name: 'Quality', text: 'Every product passes a 3-step Quality Assurance Plan.' },
  { id: 'delivery', name: 'Timely delivery', text: 'We run 362 days a year, 14 hours a day, so your order ships on time.' },
  { id: 'pricing', name: 'Competitive pricing', text: 'Better value for the specification than anywhere else.' },
  { id: 'tracking', name: 'Online order tracking', text: 'Track your order anytime with your project number.' },
];
const PRESS = 480, STRIKE = 380; // ms: the button held down, then one lamp after another

/*
 * 1.7 Why Electrosoft: a lamp test. When the door comes into view its Lamp test button goes down and the
 * four lamps strike one after another, each bringing up its promise. Pressing the button runs it again.
 * Reduced motion: all four lit, the button just presses.
 */
export default function Why() {
  const ref = useRef<HTMLElement>(null), panelRef = useRef<HTMLDivElement>(null);
  useCinematic(ref, '.why-wrap');
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [lit, setLit] = useState(reduce ? PROMISES.length : 0);
  const [pressed, setPressed] = useState(false);
  const timers = useRef<number[]>([]);

  const lampTest = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    timers.current = [];
    setPressed(true);
    if (reduce) { setLit(PROMISES.length); later(160, () => setPressed(false)); return; }
    setLit(0);
    later(PRESS, () => setPressed(false));
    PROMISES.forEach((_, i) => later(PRESS + i * STRIKE, () => setLit(i + 1)));
  }, [reduce]);

  // the first time the door is properly on screen, the test runs by itself
  useEffect(() => {
    const el = panelRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      lampTest();
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); timers.current.forEach(window.clearTimeout); };
  }, [lampTest, reduce]);

  return (
    <section id="why" ref={ref} aria-labelledby="why-h">
      <div className="why-wrap">
        <header className="sec-head">
          <h2 id="why-h">Why choose Electrosoft</h2>
          <p>Four promises behind every panel and test system we ship.</p>
        </header>

        <div className={`why-panel${pressed ? ' pressed' : ''}`} ref={panelRef}>
          <div className="why-door" aria-hidden="true" />
          {PROMISES.map((p, i) => (
            <article key={p.id} className={`why-item${i < lit ? ' on' : ''}`} style={{ '--c': i + 1 } as CSSProperties} aria-labelledby={`why-${p.id}`}>
              <div className="why-fit">
                <span className="why-lamp" aria-hidden="true"><i /></span>
                <h3 className="why-plate" id={`why-${p.id}`}>{p.name}</h3>
              </div>
              <div className="why-say">
                <p>{p.text}</p>
                {/* TODO: CONFIRM — the tracking page (/track) is still an open question in PLAN.md */}
                {p.id === 'tracking' && <Link className="line-btn" to="/track">Track your order</Link>}
              </div>
            </article>
          ))}
          <button type="button" className="why-test" onClick={lampTest}>
            <span className="why-btn" aria-hidden="true" />
            <span className="why-plate sm">Lamp test</span>
          </button>
        </div>
      </div>
    </section>
  );
}

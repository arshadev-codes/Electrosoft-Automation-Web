import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

// CONTENT.md · Home §6 Why Electrosoft, as a bento: each promise gets a real visual instead of an icon.
// Quote scope lines come from the company business description; the photo is a real Electrosoft panel.
const SCOPE = ['Design & engineering', 'Manufacture & wiring', 'Testing', 'Installation & commissioning'];
const TRAIL = ['Ordered', 'In production', 'Tested', 'Dispatched'];
const v = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Why() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [step, setStep] = useState(0); // tracking widget: how far the sample order has got

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setInView(true); setStep(TRAIL.length - 1); return; }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the sample order ticks along while the section is on screen, then starts over
  useEffect(() => {
    if (!inView || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setStep(s => (s + 1) % (TRAIL.length + 1)), step === TRAIL.length ? 900 : 1500);
    return () => window.clearTimeout(id);
  }, [inView, step]);
  const reached = Math.min(step, TRAIL.length - 1);

  return (
    <section id="why" ref={ref} aria-labelledby="why-h" className={inView ? 'is-in' : ''}>
      <div className="why-wrap">
        <header className="why-head">
          <h2 id="why-h">Why choose Electrosoft</h2>
          <p>Four promises behind every panel and test system we ship.</p>
        </header>

        <div className="bento">
          <article className="bt bt-quality" style={v(0)}>
            <img src="/img/products/mcc.webp" alt="Inside an Electrosoft MCC panel" loading="lazy" decoding="async" />
            <div className="bt-seal" aria-hidden="true"><b>100%</b><span>tested before dispatch</span></div>
            <div className="bt-txt">
              <h3>Quality</h3>
              <p>Every product passes a 3-step Quality Assurance Plan.</p>
            </div>
          </article>

          <article className="bt bt-delivery" style={v(1)}>
            <h3>Timely delivery</h3>
            <div className="bt-big"><b>362</b><span>days a year</span></div>
            <div className="bt-days" aria-hidden="true">{Array.from({ length: 52 }, (_, i) => <i key={i} className={i < 51 ? 'on' : ''} style={v(i)} />)}</div>
            <p><b>14 hours</b> a day, so your order ships on time.</p>
          </article>

          <article className="bt bt-pricing" style={v(2)}>
            <h3>Competitive pricing</h3>
            <p>Better value for the specification than anywhere else.</p>
            <ul className="bt-quote" aria-label="One quote covers">{SCOPE.map((s, i) => <li key={s} style={v(i)}>{s}</li>)}</ul>
          </article>

          <article className="bt bt-tracking" style={v(3)}>
            <div className="bt-txt">
              <h3>Online order tracking</h3>
              <p>Track your order anytime with your project number.</p>
              <Link className="pill" to="/track">Track your order</Link>
            </div>
            <div className="bt-order" aria-hidden="true">
              {/* TODO: CONFIRM — project number format */}
              <div className="bt-order-top"><span>Project no.</span><b>ES-0000</b><em><i className="live" />Live</em></div>
              <ol>{TRAIL.map((s, i) => <li key={s} className={i <= reached && step < TRAIL.length ? (i === reached ? 'now' : 'done') : ''}><i />{s}</li>)}</ol>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

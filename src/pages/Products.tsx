import { useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { RANGE, type Product } from '../data/products';
import { createProductsMotion } from './productsMotion';
import { scrollToY } from '../hooks/useSmoothScroll';

const COUNT = RANGE.flatMap(g => g.items).length;
const SHORT: Record<string, string> = { assembly: 'Assembly & Wiring', turnkey: 'Turnkey Projects' };

/** Feeders in the hero diagram scroll to their product instead of jumping. */
function jump(e: MouseEvent<HTMLAnchorElement>) {
  const id = e.currentTarget.hash.slice(1), el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  scrollToY(el.getBoundingClientRect().top + window.scrollY - 96);
  history.replaceState(history.state, '', `#${id}`);
}

/** One feeder off the vertical busbar: a tap on the bus, a breaker that closes as the product arrives. */
const Feeder = () => (
  <svg className="pr-feeder" viewBox="0 0 92 24" aria-hidden="true">
    <circle className="fd-tap" cx="3" cy="12" r="3.5" />
    <path className="fd-line" d="M3 12H34M58 12H90" />
    <path className="fd-blade" d="M34 12H58" />
    <circle className="fd-pin" cx="34" cy="12" r="2.6" /><circle className="fd-pin" cx="58" cy="12" r="2.6" />
  </svg>
);

function Item({ p, flip }: { p: Product; flip: boolean }) {
  const src = `/img/products/${p.id}.webp`;
  return (
    <article className={`pr-item${flip ? ' flip' : ''}`} id={p.id} aria-labelledby={`${p.id}-h`}>
      <Feeder />
      <figure className={`pr-shot ${p.cut ? 'cut' : 'frame'}`}>
        <img className="pr-ghost" src={src} alt="" loading="lazy" decoding="async" draggable={false} />
        <div className="pr-live"><img src={src} alt={`${p.name} by Electrosoft`} loading="lazy" decoding="async" draggable={false} /></div>
        <i className="pr-scan" aria-hidden="true" />
      </figure>
      <div className="pr-txt">
        <h3 id={`${p.id}-h`}><span className="ln"><span>{p.name}</span></span></h3>
        {p.sub && <p className="pr-sub">{p.sub}</p>}
        <p className="pr-text">{p.text}</p>
        {p.points.length > 0 && <ul className="pr-pts">{p.points.map(pt => <li key={pt}>{pt}</li>)}</ul>}
        {/* TODO: CONFIRM — /contact (quote form) isn't built yet; it should read ?product= to prefill the requirement */}
        <Link className="line-btn" to={`/contact?product=${p.id}`}>Request a quote<span className="sr"> for {p.name}</span></Link>
      </div>
    </article>
  );
}

/*
 * 2 · Products: the range drawn as a switchboard. The hero is a single-line diagram (incomer, main
 * busbar, one feeder per product, grouped into bus sections by category) that doubles as the index;
 * below, the busbar runs down the page and every product hangs off it as a feeder.
 * Motion: productsMotion.ts.
 */
export default function Products() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createProductsMotion(el, matchMedia('(prefers-reduced-motion: reduce)').matches), el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const before = document.title;
    document.title = 'Products — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  let n = 0;
  return (
    <main className="pr" ref={ref}>
      <section className="pr-hero gut" aria-labelledby="pr-h">
        <div className="wrap">
          <h1 className="pr-h1" id="pr-h"><span className="ln"><span>Every panel your</span></span><span className="ln"><span>plant runs on.</span></span></h1>
          <p className="pr-lede">Ten panel types and two services, from PLC / SCADA to turnkey projects. Every panel is 100% tested before dispatch.</p>

          <nav className="sld" aria-label="The range, as a single-line diagram">
            <svg className="sld-in" viewBox="0 0 96 132" aria-hidden="true">
              <path pathLength={1} d="M24 0V30" /><circle pathLength={1} cx="24" cy="44" r="14" /><circle pathLength={1} cx="24" cy="66" r="14" />
              <path pathLength={1} d="M24 80V96" /><rect pathLength={1} x="16" y="96" width="16" height="16" rx="2" /><path pathLength={1} d="M24 112V130.5H96" />
            </svg>
            <div className="sld-row">
              <i className="sld-bus" aria-hidden="true" />
              <ol className="sld-groups">
                {RANGE.map(g => (
                  <li className="sld-group" key={g.cat} style={{ flexGrow: g.items.length }}>
                    <span className="sld-cat">{g.cat}</span>
                    <ol>
                      {g.items.map(p => (
                        <li key={p.id}>
                          <a href={`#${p.id}`} onClick={jump}>
                            <svg className="sld-drop" viewBox="0 0 20 64" aria-hidden="true">
                              <path className="dr-line" d="M10 0V20M10 44V64" /><path className="dr-blade" d="M10 44V20" />
                              <circle className="dr-pin" cx="10" cy="20" r="2.4" /><circle className="dr-pin" cx="10" cy="44" r="2.4" />
                            </svg>
                            <span>{SHORT[p.id] ?? p.name}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        </div>
      </section>

      <section className="pr-board gut" aria-label={`All ${COUNT} products and services`}>
        <div className="wrap pr-wrap">
          <div className="pr-bus" aria-hidden="true"><i /></div>
          {RANGE.map(g => (
            <div className="pr-sec" key={g.cat}>
              <div className="pr-sec-head"><i aria-hidden="true" /><h2>{g.cat}</h2><span>{g.items.length} {g.cat === 'Services' ? 'services' : g.items.length > 1 ? 'products' : 'product'}</span></div>
              {g.items.map(p => <Item key={p.id} p={p} flip={n++ % 2 === 1} />)}
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT.md · Home §10 contact CTA */}
      <section className="pr-cta gut" aria-labelledby="pr-cta-h">
        <div className="wrap">
          <h2 id="pr-cta-h">Have a project in mind?</h2>
          <div className="pr-cta-btns">
            <Link className="pill" to="/contact">Get a Quote</Link>
            <a className="line-btn" href="tel:+918692888444">Call +91 86928 88444</a>
          </div>
        </div>
      </section>
    </main>
  );
}

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { CHAPTERS, DOCS, ROUTE, STAMPS, type Step } from '../data/about';
import { createAboutMotion, revScrollY, YEAR, FROM } from './aboutMotion';
import { scrollToY } from '../hooks/useSmoothScroll';
import { Arrow, FeederCta } from '../components/ui';
import RouteArt from '../components/RouteArt';

/** One roller of the meter's register: 0–9 four times over, so it can spin several turns. */
const Drum = ({ i, d }: { i: number; d: number }) => (
  <span className={`drum${i === 3 ? ' last' : ''}`}>
    <span className="strip" style={{ '--d': d } as CSSProperties}>{Array.from({ length: 40 }, (_, k) => <b key={k}>{k % 10}</b>)}</span>
  </span>
);

/** The drawing of the company, revised chapter by chapter (viewBox 800 × 600). */
function Drawing({ rev }: { rev: number }) {
  const cls = (k: number) => `lyr${k < rev ? ' done' : k === rev ? ' cur' : ''}`;
  const tag = (x: number, y: number, r: string) => (
    <g className="tag"><polygon points={`${x - 10},${y + 8} ${x},${y - 10} ${x + 10},${y + 8}`} /><text x={x} y={y + 5} textAnchor="middle">{r}</text></g>
  );
  return (
    <svg viewBox="0 0 800 600" aria-hidden="true">
      <defs>
        <pattern id="abGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(11,91,211,.07)" strokeWidth="1" /></pattern>
      </defs>
      <rect x="22" y="22" width="756" height="556" fill="url(#abGrid)" />
      <rect className="frm" x="10" y="10" width="780" height="580" />
      <rect className="frm thin" x="22" y="22" width="756" height="556" />

      {/* A · panels: a three-cabinet lineup */}
      <g className={cls(0)}>
        <path pathLength={1} d="M40 400H760" />
        {[60, 150, 240].map((x, i) => (
          <Fragment key={x}>
            <rect pathLength={1} x={x} y="130" width="90" height="270" rx="2" />
            <path pathLength={1} d={`M${x} 160H${x + 90}M${x} 388H${x + 90}`} />
            {i === 1
              ? <path pathLength={1} d={`M${x} 210H${x + 90}M${x} 255H${x + 90}M${x} 300H${x + 90}M${x} 345H${x + 90}M${x + 38} 228H${x + 52}M${x + 38} 273H${x + 52}M${x + 38} 318H${x + 52}`} />
              : <path pathLength={1} d={`M${x + 82} 250V290`} />}
            {i !== 1 && <><circle pathLength={1} cx={x + 26} cy="190" r="10" /><circle pathLength={1} cx={x + 56} cy="190" r="10" /></>}
          </Fragment>
        ))}
        {tag(70, 110, 'A')}
      </g>

      {/* B · automation and instrumentation: PLC rack, SCADA workstation, a gauge */}
      <g className={cls(1)}>
        <rect pathLength={1} x="68" y="228" width="66" height="44" rx="2" />
        <path pathLength={1} d="M84 228V272M100 228V272M116 228V272" />
        <path pathLength={1} d="M370 400V322L394 292H496L520 322V400M370 322H520" />
        <rect pathLength={1} x="400" y="196" width="100" height="70" rx="4" />
        <path pathLength={1} d="M450 266V292M412 240H440V222H470M440 240V252H488" />
        <circle pathLength={1} cx="445" cy="358" r="17" />
        <path pathLength={1} d="M445 358L456 347" />
        <path pathLength={1} d="M330 172C366 172 368 232 400 232" />
        {tag(404, 178, 'B')}
      </g>

      {/* C · transformer testing: the unit under test, leads sagging back to the desk */}
      <g className={cls(2)}>
        <rect pathLength={1} x="600" y="270" width="140" height="120" rx="3" />
        <path pathLength={1} d={`M592 270H748${[612, 624, 636, 648, 660, 672, 684, 696, 708, 720, 732].map(x => `M${x} 285V375`).join('')}`} />
        <rect pathLength={1} x="690" y="215" width="60" height="26" rx="13" />
        <path pathLength={1} d="M705 241V270M607 400H615M725 400H733" />
        {[620, 650, 680].map(x => <Fragment key={x}><rect pathLength={1} x={x - 6} y="230" width="12" height="40" rx="3" /><circle pathLength={1} cx={x} cy="225" r="4" /></Fragment>)}
        <path className="lead r" pathLength={1} d="M620 221C592 320 548 338 520 336" />
        <path className="lead y" pathLength={1} d="M650 221C622 340 552 356 520 348" />
        <path className="lead b" pathLength={1} d="M680 221C652 360 556 372 520 360" />
        {tag(598, 196, 'C')}
      </g>

      {/* D · today: the approvals, stamped on the sheet */}
      <g className={cls(3)}>
        {[[500, 92, -8, 'CPRI', '65kA · IP65'], [592, 74, 6, 'ISO', 'Certified'], [684, 94, -4, 'MSME', 'Registered']].map(([x, y, r, a, b]) => (
          <g key={a as string} transform={`rotate(${r} ${x} ${y})`}>
            <g className="stp">
              <circle cx={x} cy={y} r="38" className="ring" /><circle cx={x} cy={y} r="31" className="ring thin" />
              <text x={x} y={(y as number) + 2} textAnchor="middle" className="big">{a}</text>
              <text x={x} y={(y as number) + 16} textAnchor="middle" className="small">{b}</text>
            </g>
          </g>
        ))}
        {tag(424, 64, 'D')}
      </g>

      {/* title block, with the revision table */}
      <g className="tb">
        <rect className="frm" x="460" y="430" width="318" height="148" />
        <path className="frm thin" d="M460 458H778M460 480H778M460 500H778M460 520H778M460 540H778M460 560H778M488 480V560" />
        <text x="472" y="450" className="tb-name">Electrosoft Automation Pvt. Ltd.</text>
        <text x="472" y="474">Drawing: the company · since 1989</text>
        {CHAPTERS.map((c, k) => (
          <text key={c.rev} y={495 + k * 20} className={`row${k < rev ? ' done' : k === rev ? ' cur' : ''}`}>
            <tspan x="472">{c.rev}</tspan><tspan x="498">{c.row}</tspan>
          </text>
        ))}
        <text x="472" y="573" className="tb-addr">S7-1/2, Bhiwandi Road, Kalher, Thane</text>
      </g>
    </svg>
  );
}

function RouteStep({ s, side, art }: { s: Step; side: 'l' | 'r'; art?: boolean }) {
  return (
    <div className={`rt-body ${side}`}>
      {art && <RouteArt art={s.art} side={side} inner />}
      <span className="mono">{s.n}</span>
      <h3>{s.name}{s.qc && <span className="rt-pass mono" aria-hidden="true">Pass</span>}</h3>
      <p>{s.text}</p>
    </div>
  );
}

/*
 * 5 · About: the company's journey, told in the drawing office's terms.
 *   hero    — an energy meter whose register rolls from 1989 to this year
 *   journey — one engineering drawing of the company, revised chapter by chapter (pinned)
 *   route   — the route every order takes, three quality checks on the way
 *   infra   — the office and the workshop, where the lights come on
 *   certs   — the approvals, stamped
 * Motion: aboutMotion.ts.
 */
export default function About() {
  const ref = useRef<HTMLElement>(null);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [rev, setRev] = useState(reduce ? CHAPTERS.length - 1 : 0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createAboutMotion(el, reduce, setRev), el);
    return () => ctx.revert();
  }, [reduce]);

  useEffect(() => {
    const before = document.title;
    document.title = 'About — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  const pickRev = (k: number) => {
    const y = reduce ? null : revScrollY(k);
    if (y === null) setRev(k); else scrollToY(y);
  };
  const ch = CHAPTERS[rev];
  const start = String(FROM).split('').map(Number), now = String(YEAR).split('').map(Number);
  let side = 0;

  return (
    <main className="ab" ref={ref}>
      {/* 5.1 hero */}
      <section className="ab-hero gut" aria-labelledby="ab-h">
        <div className="wrap">
          <div className="ab-copy">
            <h1 className="ab-h1" id="ab-h"><span className="ln"><span>Powering industry</span></span><span className="ln"><span>since 1989.</span></span></h1>
            <p className="ab-lede">Since 1989, Electrosoft has grown from panel manufacturing into a complete electrical, automation, instrumentation and transformer testing company, serving small businesses, corporates and government bodies. All products are built to international quality standards.</p>
          </div>
          <div className="mtr" role="img" aria-label={`In service since 1989, ${YEAR - FROM} years`}>
            <i className="scr" /><i className="scr" /><i className="scr" /><i className="scr" />
            <div className="mtr-top"><b>Electrosoft</b><span className="mono">Kalher · Thane</span></div>
            <div className="mtr-win" aria-hidden="true">{[0, 1, 2, 3].map(i => <Drum key={i} i={i} d={reduce ? now[i] : start[i]} />)}</div>
            <div className="mtr-read mono" aria-hidden="true"><span>Since {FROM}</span><span><b>{reduce ? YEAR - FROM : 0}</b> years and running</span></div>
            <div className="mtr-disc" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 5.1 the journey, as one drawing revised over the years */}
      <section className="ab-jr gut" aria-labelledby="ab-jr-h">
        <div className="wrap ab-jr-in">
          <div className="sheet">{<Drawing rev={rev} />}</div>
          <div className="ab-jr-txt">
            <h2 id="ab-jr-h">Our journey.</h2>
            <div className="ab-revs" role="tablist" aria-label="Chapters">
              {CHAPTERS.map((c, k) => (
                <button key={c.rev} type="button" role="tab" aria-selected={k === rev} className={`ab-rev${k === rev ? ' on' : k < rev ? ' done' : ''}`} onClick={() => pickRev(k)}>
                  <i aria-hidden="true">{c.rev}</i>{c.tab}
                </button>
              ))}
            </div>
            <div className="ab-ch" key={ch.rev} role="tabpanel" aria-live="polite">
              <p className="mono">Rev {ch.rev} · {ch.when}</p>
              <h3>{ch.title}</h3>
              <p className="ab-ch-text">{ch.text}</p>
              <ul>{ch.facts.map(f => <li key={f}>{f}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5.2 how we work: the route every order takes */}
      <section className="ab-route gut" aria-labelledby="ab-rt-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ab-rt-h">The route every order takes.</h2>
            <p>Eleven steps from your enquiry to a running system, with <b>three quality checks</b> on the way.</p>
          </div>
          <ol className="rt">
            <li className="rt-line" aria-hidden="true"><i /><b className="rt-tok" /></li>
            {ROUTE.map(s => {
              if ('fork' in s) return (
                <li key={s.n} className="rt-step fork" data-label={`${s.n} ${s.fork.map(f => f.name).join(' & ')}`}>
                  <i className="rt-node" aria-hidden="true" /><i className="rt-bar" aria-hidden="true" />
                  <RouteStep s={s.fork[0]} side="l" art /><RouteStep s={s.fork[1]} side="r" art />
                </li>
              );
              const at = side++ % 2 ? 'l' : 'r';
              return (
                <li key={s.n} className={`rt-step${s.qc ? ' qc' : ''}`} data-label={`${s.n} ${s.name}`}>
                  <i className="rt-node" aria-hidden="true" />
                  <RouteStep s={s} side={at} />
                  <RouteArt art={s.art} side={at === 'l' ? 'r' : 'l'} />
                </li>
              );
            })}
          </ol>
          {/* order status: follows the reader down the route, like tracking an order */}
          <div className="rt-status" aria-hidden="true">
            <span className="mono">Order status</span>
            <b>{ROUTE[0].n} Enquiry</b>
            <i className="rt-segs">{ROUTE.map(s => <i key={s.n} />)}</i>
          </div>
        </div>
      </section>

      {/* 5.3 infrastructure (photos from the old site's gallery) */}
      <section className="ab-infra gut" aria-labelledby="ab-in-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ab-in-h">Where it's made.</h2>
            <p>S7-1/2, Jai Mata Di Compound, Bhiwandi Road, Kalher, Thane. At work <b>362 days a year, 14 hours a day</b>.</p>
          </div>
          <div className="inf">
            <figure><img src="/img/about/office.webp" alt="Electrosoft design office: an engineer drawing a wiring diagram, and the open-plan office" width={910} height={668} loading="lazy" decoding="async" /></figure>
            <div className="inf-txt">
              <h3>Design office</h3>
              <p>Where our estimation engineers prepare the Bill of Material and our design engineers develop the SLD, GA and wiring diagrams for every order.</p>
            </div>
          </div>
          <div className="inf flip">
            <figure><img src="/img/about/workshop.webp" alt="Electrosoft workshop: busbar wiring, a row of finished panels, and sheet metal on the press" width={936} height={486} loading="lazy" decoding="async" /></figure>
            <div className="inf-txt">
              <h3>Workshop</h3>
              <p>Sheet metal and CNC fabrication, 7-tank powder coating, assembly, wiring and testing. Every panel is 100% tested before dispatch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5.4 certifications */}
      <section className="ab-certs gut" aria-labelledby="ab-ce-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ab-ce-h">Approved and certified.</h2>
            <p>A <b>3-step quality assurance plan</b> on every product. The certificates are here to download.</p>
          </div>
          <ul className="stamps">
            {STAMPS.map(s => (
              <li key={s.id}>
                <svg className="stamp" viewBox="0 0 160 160" style={{ '--rot': `${s.rot}deg` } as CSSProperties} aria-hidden="true">
                  <defs><path id={`arc-${s.id}`} d="M24 80A56 56 0 0 1 136 80" /></defs>
                  <circle cx="80" cy="80" r="74" className="ring" /><circle cx="80" cy="80" r="66" className="ring thin" />
                  <text className="arc"><textPath href={`#arc-${s.id}`} startOffset="50%" textAnchor="middle">{s.arc}</textPath></text>
                  <path d="M38 100H122" className="ring thin" />
                  <text x="80" y="92" textAnchor="middle" className="big">{s.big}</text>
                  <text x="80" y="118" textAnchor="middle" className="small">{s.sub}</text>
                </svg>
                <a href={`/downloads/${s.file}`} download>{s.label}<span>PDF</span></a>
              </li>
            ))}
          </ul>
          <div className="ab-docs">
            {DOCS.map(([n, f]) => <a key={f} className="line-btn" href={`/downloads/${f}`} download>{n}<span className="pdf">PDF</span></a>)}
          </div>
        </div>
      </section>

      <FeederCta id="ab-cta-h" tag="Your project">
        <Link className="pill" to="/contact">Get a Quote<Arrow /></Link>
        <a className="line-btn" href="tel:+918692888444">Call +91 86928 88444</a>
      </FeederCta>
    </main>
  );
}

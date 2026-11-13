import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ALL, FILTERS, type Kind, type Project } from '../data/projects';
import { createProjectsMotion, sheetsIn } from './projectsMotion';
import { scrollToY } from '../hooks/useSmoothScroll';
import { Arrow, FeederCta } from '../components/ui';
import { Elevation, ratingLog as LOG } from '../components/Elevation';

const COUNT = { all: ALL.length, panel: ALL.filter(p => p.kind === 'panel').length, test: ALL.filter(p => p.kind === 'test').length };

/** Index thumbnail for a testing system: a small transformer, sized by rating like the sheet's drawing. */
const Mini = ({ mva }: { mva: number }) => {
  const s = 0.7 + 0.3 * LOG(mva);
  return (
    <svg viewBox="0 0 80 60" aria-hidden="true">
      <g transform={`translate(40 50) scale(${s.toFixed(3)})`}>
        <rect x="-20" y="-30" width="40" height="28" rx="1.5" />
        <path d="M-14 -27V-5M-8 -27V-5M-2 -27V-5M4 -27V-5M10 -27V-5M16 -27V-5M-24 -30H24M-15 -30V-42M-7 -30V-42M1 -30V-42" />
        <rect x="6" y="-44" width="16" height="7" rx="3.5" />
        <circle className="r" cx="-15" cy="-44" r="2" /><circle className="y" cx="-7" cy="-44" r="2" /><circle className="b" cx="1" cy="-44" r="2" />
      </g>
      <path d="M8 50H72" className="gnd" />
    </svg>
  );
};

function Sheet({ p, i, n }: { p: Project; i: number; n: number }) {
  const test = p.kind === 'test';
  return (
    <article className={`pj-sheet ${p.kind}`} id={p.id} style={{ '--i': i } as CSSProperties} aria-labelledby={`${p.id}-h`}>
      <div className="pj-vis">
        {test ? <Elevation p={p} />
          : <figure><img src={p.img} alt={`${p.name}, ${p.place}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" /></figure>}
        <i className="pj-marks" aria-hidden="true" />
      </div>
      <div className="pj-tb">
        <div className="pj-tb-top"><span className="mono">Sheet {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span><span className="pj-kind">{test ? 'Testing system' : 'Panels & automation'}</span></div>
        <h2 id={`${p.id}-h`}>{p.name}</h2>
        <p className="pj-sub">{test ? p.client : p.place}</p>
        <dl>
          <div><dt>End user</dt><dd>{p.full ?? p.client}</dd></div>
          {test ? <>
            <div className="half"><dt>System</dt><dd>{p.system}</dd></div>
            <div className="half"><dt>Rating</dt><dd className="mono">up to {p.rating} · {p.kv}</dd></div>
            <div><dt>Scope</dt><dd><ul>{p.scope?.map(s => <li key={s}>{s}</li>)}</ul></dd></div>
          </> : <><div className="half"><dt>Location</dt><dd>{p.place}</dd></div><div className="half"><dt>Client</dt><dd>{p.sector}</dd></div><div><dt>Line</dt><dd>Electrical control panels and automation</dd></div></>}
        </dl>
        {test
          ? <Link className="line-btn" to="/transformer-testing">See the testing suite<Arrow /></Link>
          : <Link className="line-btn" to="/contact">Talk to us about a similar plant<Arrow /></Link>}
      </div>
      <i className="pj-dim" aria-hidden="true" />
    </article>
  );
}

/*
 * 4 · Projects: the project register, as drawing sheets laid one on another. Each sheet carries the
 * site photo (panel projects) or the transformer drawn to its rating (testing systems) and a title
 * block with the facts. The filter picks which sheets are in the stack. Motion: projectsMotion.ts.
 */
export default function Projects() {
  const ref = useRef<HTMLElement>(null), tabs = useRef<HTMLDivElement>(null);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const list = filter === 'all' ? ALL : ALL.filter(p => p.kind === filter);

  // page motion; rebuilt when the filter changes the stack
  const first = useRef(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const off = createProjectsMotion(el, reduce, first.current);
      if (!first.current) sheetsIn(el, reduce);
      return off;
    }, el);
    first.current = false;
    return () => ctx.revert();
  }, [reduce, filter]);

  // the highlight glides to the chosen tab
  useLayoutEffect(() => {
    const box = tabs.current, on = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!box || !on) return;
    box.style.setProperty('--x', `${on.offsetLeft}px`);
    box.style.setProperty('--w', `${on.offsetWidth}px`);
  }, [filter]);

  useEffect(() => {
    const before = document.title;
    document.title = 'Projects — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  // a sheet's place in the stack, ignoring stickiness: the stack's top plus every sheet before it
  const jumpTo = (i: number) => {
    const stack = ref.current?.querySelector<HTMLElement>('.pj-stack');
    if (!stack) return;
    const sheets = [...stack.querySelectorAll<HTMLElement>('.pj-sheet')];
    let y = stack.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(stack).paddingTop);
    for (let k = 0; k < i; k++) y += sheets[k].offsetHeight + parseFloat(getComputedStyle(sheets[k]).marginBottom);
    scrollToY(y - (parseFloat(sheets[i].style.top || getComputedStyle(sheets[i]).top) || 0));
  };

  const pick = (f: 'all' | Kind) => {
    if (f === filter) return;
    setFilter(f);
    const top = ref.current?.querySelector('.pj-stack');
    if (top && top.getBoundingClientRect().top < 0) scrollToY(top.getBoundingClientRect().top + window.scrollY - 140);
  };

  return (
    <main className="pj" ref={ref}>
      <section className="pj-hero gut" aria-labelledby="pj-h">
        <div className="wrap">
          <h1 className="pj-h1" id="pj-h"><span className="ln"><span>From city sewage plants</span></span><span className="ln"><span>to 160 MVA test bays.</span></span></h1>
          <p className="pj-lede">Panels and automation for municipal corporations and industry, and transformer testing systems for power utilities and manufacturers. Some of our recent projects.</p>
          <div className="pj-bar">
            <div className="pj-tabs" ref={tabs} role="group" aria-label="Show projects">
              <i className="pj-glide" aria-hidden="true" />
              {FILTERS.map(f => (
                <button key={f.id} type="button" aria-pressed={f.id === filter} onClick={() => pick(f.id)}>
                  <b className="lg">{f.name}</b><b className="sm">{f.short}</b><span className="mono">{COUNT[f.id]}</span>
                </button>
              ))}
            </div>
            <p className="pj-count mono" aria-live="polite">{list.length} sheets in the register</p>
          </div>
          {/* the sheet index: every sheet in the register, as a thumbnail that jumps to it */}
          <nav className="pj-index" aria-label="Sheet index">
            <ol key={filter}>
              {list.map((p, i) => (
                <li key={p.id}>
                  <a href={`#${p.id}`} onClick={e => { e.preventDefault(); jumpTo(i); }}>
                    <span className={`pj-thumb ${p.kind}`} aria-hidden="true">
                      {p.img ? <img src={p.img} alt="" loading="lazy" decoding="async" /> : <Mini mva={p.mva ?? 1} />}
                    </span>
                    <span className="pj-ix"><span className="mono">{String(i + 1).padStart(2, '0')}</span> {p.tag}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <section className="pj-reg gut" aria-label="Project register">
        <div className="wrap pj-stack" key={filter}>
          {list.map((p, i) => <Sheet key={p.id} p={p} i={i} n={list.length} />)}
        </div>
      </section>

      <FeederCta id="pj-cta-h" tag="Your project">
        <Link className="pill" to="/contact">Get a Quote<Arrow /></Link>
        <a className="line-btn" href="tel:+918692888444">Call +91 86928 88444</a>
      </FeederCta>
    </main>
  );
}

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ALL, type Project } from '../data/projects';
import { Elevation } from '../components/Elevation';
import { Arrow } from '../components/ui';
import { useCinematic } from '../hooks/useCinematic';

// CONTENT.md · Home §7 Featured projects, in that order; the facts come from the project register.
const FEATURED = ['msedcl', 'tata-power', 'swtp-gurugram', 'swtp-powai'].map(id => ALL.find(p => p.id === id)!);
const N = FEATURED.length;
const pad = (n: number) => String(n).padStart(2, '0');
const RINGS = [0.17, 0.5, 0.83]; // ring positions along the spine

/** Left page: the site photograph, or the testing system drawn to its rating. */
function Visual({ p, k, on }: { p: Project; k: number; on: boolean }) {
  const test = p.kind === 'test';
  return (
    <div className={`dz-vis ${p.kind}${on ? ' on' : ''}`}>
      <div className="dz-pic">
        {test ? <Elevation p={p} /> : <img src={p.img} alt={`${p.name}, ${p.place}`} loading="lazy" decoding="async" draggable={false} />}
        <i className="pj-marks" aria-hidden="true" />
      </div>
      <p className="dz-fig mono">Fig. {pad(k + 1)} · {test ? `${p.client}, drawn to rating` : `Site, ${p.place}`}</p>
    </div>
  );
}

/** Right page: the project's title block. */
function Facts({ p, k, live }: { p: Project; k: number; live: boolean }) {
  const test = p.kind === 'test';
  return (
    <div className="dz-facts">
      <div className="dz-facts-top"><span className="mono">Sheet {pad(k + 1)} / {pad(N)}</span><span className="dz-kind">{test ? 'Testing system' : 'Panels & automation'}</span></div>
      <h3 id={`dz-${p.id}`}>{p.name}</h3>
      <p className="dz-sub">{test ? p.client : p.place}</p>
      <dl>
        <div><dt>End user</dt><dd>{p.full ?? p.client}</dd></div>
        {test ? <>
          <div className="half"><dt>System</dt><dd>{p.system}</dd></div>
          <div className="half"><dt>Rating</dt><dd className="mono">up to {p.rating} · {p.kv}</dd></div>
          <div><dt>Scope</dt><dd>{p.scope?.join(' · ')}</dd></div>
        </> : <>
          <div className="half"><dt>Location</dt><dd>{p.place}</dd></div>
          <div className="half"><dt>Client</dt><dd>{p.sector}</dd></div>
          <div><dt>Line</dt><dd>Electrical control panels and automation</dd></div>
        </>}
      </dl>
      <Link className="line-btn" to={`/projects#${p.id}`} tabIndex={live ? undefined : -1}>Open in the register<Arrow /></Link>
    </div>
  );
}

/*
 * 1.8 Featured projects: a project dossier, the ring binder a job is handed over in. It lies closed on
 * the page and opens as it comes into view; every spread is one project, the site photograph or the
 * testing system drawn to its rating on the left, its title block on the right. The visitor turns
 * the sheets: drag a page (swipe on phones), pick an index tab, or use the arrows. Wide screens lay
 * it open left and right; phones stand it up, bound along the middle, sheets turning upward.
 *
 * Leaves: 0 is the cover (its inside carries project 1's picture); leaf k + 1 is project k's title
 * block, and its back carries project k + 1's picture. f leaves turned = project f - 1 on show.
 * Reduced motion: it starts open; sheets change without turning.
 */
export default function Dossier() {
  const ref = useRef<HTMLElement>(null), bookRef = useRef<HTMLDivElement>(null);
  const leaves = useRef<HTMLDivElement[]>([]);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [f, setF] = useState(reduce ? 1 : 0);
  const [seen, setSeen] = useState<number[]>([]);
  const go = useRef<(to: number) => void>(() => {});
  useCinematic(ref, '.dz-wrap');

  useEffect(() => { if (f > 0) setSeen(s => (s.includes(f - 1) ? s : [...s, f - 1])); }, [f]);

  useLayoutEffect(() => {
    const book = bookRef.current, ls = leaves.current;
    if (!book) return;
    const start = reduce ? 1 : 0;
    const t: number[] = ls.map((_, i) => (i < start ? 1 : 0));
    const tweens: (gsap.core.Tween | null)[] = ls.map(() => null);
    let cur = start;

    // one leaf: how far it has turned, and where it sits in the pile (the moving one always on top)
    const paint = (i: number) => {
      const v = t[i], s = ls[i].style;
      s.setProperty('--t', v.toFixed(4));
      s.zIndex = String((v > 0.002 && v < 0.998 ? 40 : 10) + (v < 0.5 ? N + 1 - i : i));
      if (i === 0) book.style.setProperty('--open', v.toFixed(4));
    };
    ls.forEach((_, i) => paint(i));

    // turn to `to` leaves: every leaf out of place turns, one after another, in reading order
    const turn = (to: number) => {
      to = Math.max(1, Math.min(N, to));
      const fwd = to >= cur;
      cur = to;
      setF(to);
      const order = ls.map((_, i) => i).filter(i => t[i] !== (i < to ? 1 : 0));
      if (!fwd) order.reverse();
      order.forEach((i, n) => {
        tweens[i]?.kill();
        const end = i < to ? 1 : 0;
        if (reduce) { t[i] = end; paint(i); return; }
        const o = { v: t[i] };
        tweens[i] = gsap.to(o, {
          v: end, duration: 0.5 + 0.5 * Math.abs(end - o.v), delay: n * 0.14, ease: 'power2.inOut',
          onUpdate: () => { t[i] = o.v; paint(i); },
        });
      });
    };
    go.current = turn;

    // drag a sheet over: it follows the pointer and finishes the turn if pulled far or flicked
    const narrow = matchMedia('(max-width: 760px)');
    type Drag = { id: number; x: number; y: number; i: number; dir: number; live: boolean; lx: number; lt: number; v: number };
    let drag: Drag | null = null;
    const stop = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || cur === 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, i: -1, dir: 1, live: false, lx: e.clientX, lt: e.timeStamp, v: 0 };
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.live) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // a scroll, not a turn
        if (Math.abs(dx) < 8) return;
        const dir = dx < 0 ? 1 : -1; // pulled left: the next sheet
        if (dir > 0 ? cur >= N : cur <= 1) { drag = null; return; }
        drag.live = true; drag.dir = dir; drag.i = dir > 0 ? cur : cur - 1;
        tweens[drag.i]?.kill();
        book.setPointerCapture(e.pointerId);
        book.classList.add('is-turning');
      }
      const span = book.clientWidth * (narrow.matches ? 0.8 : 0.5);
      const p = Math.max(0, Math.min(1, (-dx * drag.dir) / span));
      t[drag.i] = drag.dir > 0 ? p : 1 - p;
      paint(drag.i);
      const dt = Math.max(1, e.timeStamp - drag.lt);
      drag.v = drag.v * 0.6 + ((e.clientX - drag.lx) / dt) * 0.4;
      drag.lx = e.clientX; drag.lt = e.timeStamp;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.live) return;
      book.classList.remove('is-turning');
      // the release is not a click on whatever is under the pointer
      book.addEventListener('click', stop, true);
      window.setTimeout(() => book.removeEventListener('click', stop, true), 0);
      const p = d.dir > 0 ? t[d.i] : 1 - t[d.i];
      turn(p > 0.33 || -d.v * d.dir > 0.45 ? cur + d.dir : cur);
    };
    book.addEventListener('pointerdown', down);
    book.addEventListener('pointermove', move);
    book.addEventListener('pointerup', up);
    book.addEventListener('pointercancel', up);

    // it opens by itself the first time it is properly on screen
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      window.setTimeout(() => { if (cur === 0) turn(1); }, 280);
    }, { threshold: 0.5 });
    if (!reduce) io.observe(book);

    return () => {
      io.disconnect();
      tweens.forEach(tw => tw?.kill());
      book.removeEventListener('pointerdown', down);
      book.removeEventListener('pointermove', move);
      book.removeEventListener('pointerup', up);
      book.removeEventListener('pointercancel', up);
    };
  }, [reduce]);

  const view = f - 1; // the project on show (-1: closed)
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go.current(f + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go.current(f - 1); }
  };
  const tab = (k: number, side: 'r' | 'l') => {
    const shown = side === 'r' ? f <= k + 1 : f > k + 1;
    return (
      <button type="button" className={`dz-tab ${side}`} style={{ '--k': k } as CSSProperties} onClick={() => go.current(k + 1)}
        tabIndex={shown ? undefined : -1} aria-hidden={shown ? undefined : true} aria-current={view === k || undefined}
        aria-label={`Sheet ${k + 1}: ${FEATURED[k].tag}`}>
        <span className="mono">{pad(k + 1)}</span>{FEATURED[k].tag}
      </button>
    );
  };

  return (
    <section id="projects" ref={ref} className="dz gut" aria-labelledby="dz-h">
      <div className="wrap dz-wrap">
        <header className="sec-head">
          <h2 id="dz-h">Built, tested, handed over.</h2>
          <p>Four projects from our register, from transformer test bays to municipal sewage plants.</p>
        </header>

        <div className="dz-desk" onKeyDown={key}>
          <div className={`dz-book${f === 0 ? ' closed' : ''}`} ref={bookRef}>
            <i className="dz-board" aria-hidden="true" />
            <i className="dz-spine" aria-hidden="true" />
            <i className="dz-edges r" aria-hidden="true" /><i className="dz-edges l" aria-hidden="true" />

            {Array.from({ length: N + 1 }, (_, i) => (
              <div className={`dz-leaf${i === 0 ? ' cover' : ''}`} key={i} ref={el => { if (el) leaves.current[i] = el; }}>
                <div className="dz-face front">
                  {i === 0 ? (
                    <div className="dz-cover" onClick={() => { if (f === 0) go.current(1); }}>
                      <div className="dz-label">
                        <span className="dz-logo"><svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" /></svg>ELECTROSOFT</span>
                        <b>Project dossier</b>
                        <span className="mono">Featured projects · {pad(N)} sheets</span>
                      </div>
                      <button type="button" className="dz-open" onClick={() => go.current(1)} tabIndex={f === 0 ? undefined : -1}>Open the dossier<Arrow /></button>
                    </div>
                  ) : (
                    <>
                      <Facts p={FEATURED[i - 1]} k={i - 1} live={view === i - 1} />
                      <i className="dz-holes" aria-hidden="true" />
                      {tab(i - 1, 'r')}
                    </>
                  )}
                </div>
                <div className="dz-face back" aria-hidden={view !== i || undefined}>
                  {i < N && (
                    <div className="dz-mount">
                      <Visual p={FEATURED[i]} k={i} on={seen.includes(i)} />
                      {i > 0 && <i className="dz-holes" aria-hidden="true" />}
                    </div>
                  )}
                  {i > 0 && tab(i - 1, 'l')}
                </div>
              </div>
            ))}

            <div className="dz-mech" aria-hidden="true">{RINGS.map(r => <i key={r} style={{ '--r': r } as CSSProperties} />)}</div>
          </div>
        </div>

        <div className="dz-ctl">
          <div className="dz-step">
            <button type="button" onClick={() => go.current(f - 1)} disabled={f <= 1} aria-label="Previous sheet">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>
            </button>
            <span className="mono" aria-live="polite">{f === 0 ? 'Closed' : `Sheet ${pad(f)} / ${pad(N)}`}</span>
            <button type="button" onClick={() => go.current(f + 1)} disabled={f >= N} aria-label="Next sheet">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
            </button>
          </div>
          <p className="dz-hint"><span className="fine">Drag a page over, or pick a tab.</span><span className="touch">Swipe sideways to turn a sheet.</span></p>
          <Link className="line-btn" to="/projects">The full register<Arrow /></Link>
        </div>
      </div>
    </section>
  );
}

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ALL_TEST, type Project } from '../data/projects';
import { Arrow } from '../components/ui';
import { useCinematic } from '../hooks/useCinematic';

const FEATURED: Project[] = ALL_TEST;
const N_PROJ = FEATURED.length;        // 17 projects
const N = Math.ceil(N_PROJ / 2);       // 9 spreads = leaves to turn
const NUM_LEAVES = N + 1;              // 10 leaves (cover + 9)
const pad = (n: number) => String(n).padStart(2, '0');
const RINGS = [0.17, 0.5, 0.83];

/*
 * Two-per-spread dossier. Each open spread shows:
 *   LEFT  page = back  of leaf (f-1)  → FEATURED[2*(f-1)]
 *   RIGHT page = front of leaf f      → FEATURED[2*(f-1)+1]
 *
 * Tab logic — no spread number ever appears on both sides at once:
 *   LEFT  tabs: spreads 0 … f-1   (current + past)   shown when f > k
 *   RIGHT tabs: spreads f … N-1   (future)            shown when f ≤ k
 *
 * The current spread's tab is always the LAST tab on the left (highlighted).
 * Left tab text uses scaleX(-1) to cancel the back-face rotateY(180deg) mirror.
 */

function Facts({ p, k, live, mirrored }: { p: Project; k: number; live: boolean; mirrored?: boolean }) {
  const isUnder = p.status === 'under-execution';
  const hasRating = p.rating && p.rating !== '—';
  return (
    <div className={`dz-facts${mirrored ? ' dz-facts--mirror' : ''}`}>
      <div className="dz-facts-top">
        <span className="mono">Sheet {pad(k + 1)} / {pad(N_PROJ)}</span>
        <span className="dz-kind">{isUnder ? 'Under Execution' : 'Completed'}</span>
      </div>
      <h3 id={`dz-${p.id}`}>{p.name}</h3>
      <p className="dz-sub">{p.client}</p>
      <dl>
        <div><dt>Client</dt><dd>{p.full ?? p.client}</dd></div>
        <div className="half"><dt>System</dt><dd>{p.system}</dd></div>
        {hasRating && (
          <div className="half"><dt>Rating</dt><dd className="mono">up to {p.rating} · {p.kv}</dd></div>
        )}
        {p.scope && p.scope.length > 0 && (
          <div><dt>Scope</dt><dd>{p.scope.join(' · ')}</dd></div>
        )}
      </dl>
      <Link className="line-btn" to={`/projects#${p.id}`} tabIndex={live ? undefined : -1}>Open in the register<Arrow /></Link>
    </div>
  );
}

export default function Dossier() {
  const ref = useRef<HTMLElement>(null), bookRef = useRef<HTMLDivElement>(null);
  const leaves = useRef<HTMLDivElement[]>([]);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [f, setF] = useState(reduce ? 1 : 0);
  const go = useRef<(to: number) => void>(() => {});
  useCinematic(ref, '.dz-wrap');

  useLayoutEffect(() => {
    const book = bookRef.current, ls = leaves.current;
    if (!book) return;
    const start = reduce ? 1 : 0;
    const t: number[] = ls.map((_, i) => (i < start ? 1 : 0));
    const tweens: (gsap.core.Tween | null)[] = ls.map(() => null);
    let cur = start;

    const paint = (i: number) => {
      const v = t[i], s = ls[i].style;
      s.setProperty('--t', v.toFixed(4));
      s.zIndex = String((v > 0.002 && v < 0.998 ? 40 : 10) + (v < 0.5 ? NUM_LEAVES + 1 - i : i));
      if (i === 0) book.style.setProperty('--open', v.toFixed(4));
    };
    ls.forEach((_, i) => paint(i));

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
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 8) return;
        const dir = dx < 0 ? 1 : -1;
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
      book.addEventListener('click', stop, true);
      window.setTimeout(() => book.removeEventListener('click', stop, true), 0);
      const p = d.dir > 0 ? t[d.i] : 1 - t[d.i];
      turn(p > 0.33 || -d.v * d.dir > 0.45 ? cur + d.dir : cur);
    };
    book.addEventListener('pointerdown', down);
    book.addEventListener('pointermove', move);
    book.addEventListener('pointerup', up);
    book.addEventListener('pointercancel', up);

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

  const spread = f - 1; // 0-based current spread index
  const key = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go.current(f + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go.current(f - 1); }
  };

  /**
   * Index tab for spread k (0-based).
   *
   * RIGHT (front face, outer right edge):
   *   Shown when k >= f  →  f <= k  (future spreads only — not yet visited)
   *
   * LEFT  (back face, outer left edge):
   *   Shown when k < f   →  f > k   (current + past — visited or on-screen now)
   *   Text uses scaleX(-1) in CSS to cancel the back-face rotateY(180°) mirror.
   *   The current spread is always the rightmost/last left tab (highlighted in brand colour).
   *
   * A given spread number k is NEVER on both sides at once.
   */
  const tab = (k: number, side: 'r' | 'l') => {
  const shown = side === 'r' ? f <= k : f > k;

  // Do not render tabs that should be hidden
  if (!shown) return null;

  return (
    <button
      type="button"
      className={`dz-tab ${side}`}
      style={{ '--k': k , borderRadius:side !== 'r' ? '8px 0 0 8px' : '0 8px 8px 0'} as CSSProperties}
      onClick={() => go.current(k + 1)}
      aria-current={spread === k || undefined}
      aria-label={`Spread ${k + 1}: sheets ${pad(2 * k + 1)}–${pad(Math.min(2 * k + 2, N_PROJ))}`}
    >
      {pad(k + 1)}
    </button>
  );
};

  return (
    <section id="projects" ref={ref} className="dz gut" aria-labelledby="dz-h">
      <div className="wrap dz-wrap">
        <header className="sec-head">
          <h2 id="dz-h">Built, tested, handed over.</h2>
          <p>Our transformer testing system projects — completed and under execution.</p>
        </header>

        <div className="dz-desk" onKeyDown={key}>
          <div
            className={`dz-book dz-book--facts-only${f === 0 ? ' closed' : ''}`}
            ref={bookRef}
            style={{ '--n-tabs': N } as CSSProperties}
          >
            <i className="dz-board" aria-hidden="true" />
            <i className="dz-spine" aria-hidden="true" />
            <i className="dz-edges r" aria-hidden="true" /><i className="dz-edges l" aria-hidden="true" />

            {Array.from({ length: NUM_LEAVES }, (_, i) => {
              // Front face of leaf i (i≥1) = RIGHT page of spread i  → project index 2i−1
              const frontIdx = 2 * i - 1;
              const frontProj = i >= 1 && frontIdx < N_PROJ ? FEATURED[frontIdx] : null;
              // Back face of leaf i        = LEFT  page of spread i+1 → project index 2i
              const backIdx = 2 * i;
              const backProj = backIdx < N_PROJ ? FEATURED[backIdx] : null;

              return (
                <div
                  className={`dz-leaf${i === 0 ? ' cover' : ''}`}
                  key={i}
                  ref={el => { if (el) leaves.current[i] = el; }}
                >
                  {/* ── FRONT: cover (i=0) or RIGHT page of spread i ── */}
                  <div className="dz-face front">
                    {i === 0 ? (
                      <div className="dz-cover" onClick={() => { if (f === 0) go.current(1); }}>
                        <div className="dz-label">
                          <span className="dz-logo">
                            <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" /></svg>
                            ELECTROSOFT
                          </span>
                          <b>Project dossier</b>
                          <span className="mono">Testing Systems · {pad(N_PROJ)} projects</span>
                        </div>
                        <button type="button" className="dz-open" onClick={() => go.current(1)} tabIndex={f === 0 ? undefined : -1}>
                          Open the dossier<Arrow />
                        </button>
                      </div>
                    ) : (
                      /* Content leaves: Facts + holes + RIGHT tab (always, even on the blank last page) */
                      <>
                        {frontProj
                          ? <Facts p={frontProj} k={frontIdx} live={spread === i - 1} />
                          : <div className="dz-facts-empty" />
                        }
                        <i className="dz-holes" aria-hidden="true" />
                        {tab(i - 1, 'r')}
                      </>
                    )}
                  </div>

                  {/* ── BACK: LEFT page of spread i (0-based spread index i) ── */}
                  <div className="dz-face back" aria-hidden={spread !== i || undefined}>
                    {i === 0
                      ? /* Cover leaf: .dz-mount gives the white paper background over the dark cover board */
                        backProj && (
                          <div className="dz-mount">
                            <Facts p={backProj} k={backIdx} live={spread === 0} mirrored />
                            <i className="dz-holes" aria-hidden="true" />
                            {tab(i, 'l')}
                          </div>
                        )
                      : /* Regular leaf back — .dz-face already has white paper background */
                        backProj && (
                          <>
                            <Facts p={backProj} k={backIdx} live={spread === i} mirrored />
                            <i className="dz-holes" aria-hidden="true" />
                            {tab(i, 'l')}
                          </>
                        )
                    }
                  </div>
                </div>
              );
            })}

            <div className="dz-mech" aria-hidden="true">
              {RINGS.map(r => <i key={r} style={{ '--r': r } as CSSProperties} />)}
            </div>
          </div>
        </div>

        <div className="dz-ctl">
          <div className="dz-step">
            <button type="button" onClick={() => go.current(f - 1)} disabled={f <= 1} aria-label="Previous spread">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>
            </button>
            <span className="mono" aria-live="polite">
              {f === 0 ? 'Closed' : `Sheets ${pad(2 * f - 1)}–${pad(Math.min(2 * f, N_PROJ))} / ${pad(N_PROJ)}`}
            </span>
            <button type="button" onClick={() => go.current(f + 1)} disabled={f >= N} aria-label="Next spread">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
            </button>
          </div>
          <p className="dz-hint">
            <span className="fine">Drag a page over, or pick a tab.</span>
            <span className="touch">Swipe sideways to turn a sheet.</span>
          </p>
          <Link className="line-btn" to="/projects">The full register<Arrow /></Link>
        </div>
      </div>
    </section>
  );
}

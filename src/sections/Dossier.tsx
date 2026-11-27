import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ALL_TEST, type Project } from '../data/projects';
import { Arrow } from '../components/ui';
import { useCinematic } from '../hooks/useCinematic';

const FEATURED: Project[] = ALL_TEST;
const N_PROJ = FEATURED.length;        // 17 projects
const PROJ_PER_SPREAD = 4;             // 2 records on left page + 2 on right page
const N = Math.ceil(N_PROJ / PROJ_PER_SPREAD); // 5 spreads = 5 folios
const NUM_LEAVES = N + 1;              // 6 leaves (cover + 5 content leaves)
const pad = (n: number) => String(n).padStart(2, '0');
const RINGS = [0.17, 0.5, 0.83];

/**
 * Single Project Technical Record:
 * High-density engineering card with Company, Status badge, Rating & Voltage,
 * Year, System type, and Scope tags.
 */
function RecordCard({
  p,
  k,
  live
}: {
  p: Project;
  k: number;
  live: boolean;
}) {
  const isUnder = p.status === 'under-execution';
  const hasRating = Boolean(p.rating && p.rating !== '—');

  return (
    <article className="dz-record">
      <div className="dz-record-head">
        <div className="dz-record-id-wrap">
          <span className="dz-record-num">{pad(k + 1)}</span>
          <div style={{ minWidth: 0 }}>
            <h4 className="dz-record-title" title={p.full ?? p.client}>
              {p.client}
            </h4>
            <div className="dz-record-client" title={p.name}>
              {p.name}
            </div>
          </div>
        </div>
        <div className="dz-record-badges">
          <span className={`dz-status-pill ${isUnder ? 'under' : 'done'}`}>
            <span className="p-dot" />
            {isUnder ? 'Under Execution' : 'Completed'}
          </span>
          {p.year && <span className="dz-year-pill">{p.year}</span>}
        </div>
      </div>

      <div className="dz-record-specs">
        <div className="dz-spec-item">
          <span className="dz-spec-k">System</span>
          <span className="dz-spec-v" title={p.system}>{p.system}</span>
        </div>
        <div className="dz-spec-item">
          <span className="dz-spec-k">Rating &amp; Voltage</span>
          <span className={`dz-spec-v ${hasRating ? 'mono' : ''}`}>
            {hasRating ? (p.kv && p.kv !== '—' ? `up to ${p.rating} · ${p.kv}` : `up to ${p.rating}`) : 'Custom Plant Setup'}
          </span>
        </div>
        {p.scope && p.scope.length > 0 && (
          <div className="dz-spec-item dz-spec-item--full">
            <span className="dz-spec-k">Scope</span>
            <span className="dz-spec-v" title={p.scope.join(' · ')}>{p.scope.join(' · ')}</span>
          </div>
        )}
      </div>

      <div className="dz-record-foot">
        {/* NOTE: When re-enabling Projects page, change to={`/projects#${p.id}`} */}
        <Link className="dz-record-link" to="/contact" tabIndex={live ? undefined : -1}>
          <span>Inquire about system</span>
          <Arrow />
        </Link>
      </div>
    </article>
  );
}

/**
 * Certified Handover Protocol Card:
 * Balances the final page (Spread 5 right side) alongside project 19.
 */
function QualityHandoverCard({ live }: { live: boolean }) {
  return (
    <article className="dz-record dz-record--certified">
      <div className="dz-record-head">
        <div className="dz-record-id-wrap">
          <span className="dz-record-num" style={{ background: 'rgba(48, 209, 88, 0.12)', color: '#1b7a37' }}>QA</span>
          <div style={{ minWidth: 0 }}>
            <h4 className="dz-record-title">Factory Acceptance &amp; Handover Protocol</h4>
            <div className="dz-record-client">ISO 9001:2015 &bull; CPRI Approved &bull; CE Compliance</div>
          </div>
        </div>
        <span className="dz-status-pill done">
          <span className="p-dot" /> Certified
        </span>
      </div>

      <div className="dz-record-specs">
        <div className="dz-spec-item">
          <span className="dz-spec-k">FAT Protocol</span>
          <span className="dz-spec-v">100% FAT Routine Test Verified</span>
        </div>
        <div className="dz-spec-item">
          <span className="dz-spec-k">Highest Rating</span>
          <span className="dz-spec-v mono">750 MVA · up to 765 kV Class</span>
        </div>
        <div className="dz-spec-item dz-spec-item--full">
          <span className="dz-spec-k">Documentation</span>
          <span className="dz-spec-v">Certified test reports, schematics &amp; client dossier signed</span>
        </div>
      </div>

      <div className="dz-record-foot">
        {/* NOTE: When re-enabling Projects page, change to="/projects" */}
        <Link className="dz-record-link" to="/contact" tabIndex={live ? undefined : -1}>
          <span>Inquire about FAT</span>
          <Arrow />
        </Link>
      </div>
    </article>
  );
}

/**
 * 2 Records Per Page Sheet Component
 */
function PageOfProjects({
  p1,
  p2,
  k1,
  k2,
  live,
  mirrored,
  side,
  isFinalSpreadRight
}: {
  p1: Project | null;
  p2: Project | null;
  k1: number;
  k2: number;
  live: boolean;
  mirrored?: boolean;
  side: 'left' | 'right';
  isFinalSpreadRight?: boolean;
}) {
  return (
    <div className={`dz-facts${mirrored ? ' dz-facts--mirror' : ''}`}>
      <div className="dz-page-head">
        <span className="mono">
          PROJECTS {pad(k1 + 1)}–{pad(Math.min(isFinalSpreadRight ? k1 + 1 : k2 + 1, N_PROJ))} / {pad(N_PROJ)}
        </span>
        <span className="dz-folio-tag">{side === 'left' ? 'LEFT SHEET' : 'RIGHT SHEET'}</span>
      </div>

      <div className="dz-records-stack">
        {p1 && <RecordCard p={p1} k={k1} live={live} />}
        {isFinalSpreadRight ? (
          <QualityHandoverCard live={live} />
        ) : (
          p2 && <RecordCard p={p2} k={k2} live={live} />
        )}
      </div>
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
   * Index Bookmark Tab:
   * Attached directly to the turning page edge (.dz-tab.r on front face, .dz-tab.l on back face).
   * Both faces of leaf k carry Tab (k + 1) at identical vertical slot k.
   *  - Turning right to left: 0°..90° shows front tab, 90°..180° shows back tab seamlessly.
   *  - Turning left to right: 180°..90° shows back tab, 90°..0° shows front tab seamlessly.
   * Physical 3D continuity with zero disappearance or jumps at 50% rotation!
   */
  const renderTab = (k: number, side: 'r' | 'l') => {
    const isActive = f - 1 === k;
    return (
      <button
        key={`tab-${side}-${k}`}
        type="button"
        className={`dz-tab ${side}${isActive ? ' active' : ''}`}
        style={{ '--k': k, '--n-tabs': N } as CSSProperties}
        onClick={(e) => {
          e.stopPropagation();
          go.current(k + 1);
        }}
        aria-current={isActive || undefined}
        aria-label={`Folio ${pad(k + 1)}`}
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

            {/* ── Turning Leaves with Physically Attached Index Tabs ── */}
            {Array.from({ length: NUM_LEAVES }, (_, i) => {
              // Right page of spread i:
              const rightSpreadIdx = i - 1;
              const rightProjIdx1 = rightSpreadIdx * 4 + 2;
              const rightProjIdx2 = rightSpreadIdx * 4 + 3;
              const rightP1 = rightSpreadIdx >= 0 && rightProjIdx1 < N_PROJ ? FEATURED[rightProjIdx1] : null;
              const rightP2 = rightSpreadIdx >= 0 && rightProjIdx2 < N_PROJ ? FEATURED[rightProjIdx2] : null;

              // Left page of spread i+1:
              const leftSpreadIdx = i;
              const leftProjIdx1 = leftSpreadIdx * 4 + 0;
              const leftProjIdx2 = leftSpreadIdx * 4 + 1;
              const leftP1 = leftProjIdx1 < N_PROJ ? FEATURED[leftProjIdx1] : null;
              const leftP2 = leftProjIdx2 < N_PROJ ? FEATURED[leftProjIdx2] : null;

              return (
                <div
                  className={`dz-leaf${i === 0 ? ' cover' : ''}`}
                  key={i}
                  ref={el => { if (el) leaves.current[i] = el; }}
                >
                  {/* ── FRONT FACE: Cover (i=0), Project Sheet, or Summary Sheet ── */}
                  <div className="dz-face front">
                    {i === 0 ? (
                      <>
                        <div className="dz-cover" onClick={() => { if (f === 0) go.current(1); }}>
                          <div className="dz-label">
                            <span className="dz-logo">
                              <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" /></svg>
                              ELECTROSOFT
                            </span>
                            <b>Project dossier</b>
                            <span className="mono">Testing Systems &bull; {pad(N_PROJ)} projects</span>
                          </div>
                          <button type="button" className="dz-open" onClick={() => go.current(1)} tabIndex={f === 0 ? undefined : -1}>
                            Open the dossier<Arrow />
                          </button>
                        </div>
                        {renderTab(0, 'r')}
                      </>
                    ) : (
                      /* Regular right page or final spread right page */
                      rightP1 && (
                        <>
                          <PageOfProjects
                            p1={rightP1}
                            p2={rightP2}
                            k1={rightProjIdx1}
                            k2={rightProjIdx2}
                            live={spread === i - 1}
                            side="right"
                            isFinalSpreadRight={rightSpreadIdx === N - 1}
                          />
                          <i className="dz-holes" aria-hidden="true" />
                          {i < N && renderTab(i, 'r')}
                        </>
                      )
                    )}
                  </div>

                  {/* ── BACK FACE: Left page of spread i+1 (physically attached tab flips to left) ── */}
                  <div className="dz-face back" aria-hidden={spread !== i || undefined}>
                    {i === 0 ? (
                      /* Cover leaf back face: .dz-mount holds the paper surface */
                      leftP1 && (
                        <div className="dz-mount">
                          <PageOfProjects
                            p1={leftP1}
                            p2={leftP2}
                            k1={leftProjIdx1}
                            k2={leftProjIdx2}
                            live={spread === 0}
                            mirrored
                            side="left"
                          />
                          <i className="dz-holes" aria-hidden="true" />
                          {renderTab(0, 'l')}
                        </div>
                      )
                    ) : (
                      /* Regular leaf back */
                      leftP1 && (
                        <>
                          <PageOfProjects
                            p1={leftP1}
                            p2={leftP2}
                            k1={leftProjIdx1}
                            k2={leftProjIdx2}
                            live={spread === i}
                            mirrored
                            side="left"
                          />
                          <i className="dz-holes" aria-hidden="true" />
                          {i < N && renderTab(i, 'l')}
                        </>
                      )
                    )}
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
              {f === 0 ? 'Closed' : `Projects ${pad(Math.min(4 * f - 3, N_PROJ))}–${pad(Math.min(4 * f, N_PROJ))} / ${pad(N_PROJ)}`}
            </span>
            <button type="button" onClick={() => go.current(f + 1)} disabled={f >= N} aria-label="Next spread">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
            </button>
          </div>
          <p className="dz-hint">
            <span className="fine">Drag a page over, or pick a tab.</span>
            <span className="touch">Swipe sideways to turn a sheet.</span>
          </p>
          {/* NOTE: When re-enabling Projects page, change to="/projects" */}
          <Link className="line-btn" to="/contact">Request full register<Arrow /></Link>
        </div>
      </div>
    </section>
  );
}

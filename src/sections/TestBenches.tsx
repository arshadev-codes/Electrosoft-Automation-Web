import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';

gsap.registerPlugin(ScrollTrigger);

const BASE = 'https://fanciful-duckanoo-f1c39c.netlify.app/assets/images/';

interface Product {
  id: string;
  code: string;
  tabLabel: string;
  title: string;
  badge: string;
  img: string;
  capacity: string;
  voltage: string;
  accuracy: string;
  stds: string;
  ref: string;
  text: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'ai-powered',
    code: 'MOD-ETB-9000-AI',
    tabLabel: 'AI-Powered',
    title: 'Advanced Fully Automatic Transformer Test Bench',
    badge: 'UP TO 750 MVA',
    img: 'advanced-trolly.webp',
    capacity: '750',
    voltage: '400',
    accuracy: '0.05',
    stds: 'IEC 61439 • IS 2026 • IEEE C57 • CPRI 65kA',
    ref: 'CG Power & Industrial Solutions (750 MVA)',
    text: "World's most advanced AI-powered testing system with a 43-inch interactive 4K display, voice control, and autonomous routine execution with zero manual rewiring."
  },
  {
    id: 'fully-automatic',
    code: 'MOD-ETB-7000-FA',
    tabLabel: 'Fully Automatic',
    title: 'Fully Automatic Transformer Test Bench',
    badge: 'UP TO 160 MVA',
    img: 'fully-automatic-trolly.webp',
    capacity: '160',
    voltage: '220',
    accuracy: '0.10',
    stds: 'IEC 61439 • IS 2026 • IEEE C57',
    ref: 'MSEDCL (Distribution fleets up to 1500 kVA / 33 kV)',
    text: "Powered by Electrosoft X'mer Prime™ software. Performs all critical transformer tests with minimal connection changes for audit-ready repeatability."
  },
  {
    id: 'semi-automatic',
    code: 'MOD-ETB-5000-SA',
    tabLabel: 'Semi Automatic',
    title: 'Semi-automatic Transformer Test Bench',
    badge: 'UP TO 60 MVA',
    img: 'semi-automatic.webp',
    capacity: '60',
    voltage: '132',
    accuracy: '0.20',
    stds: 'IEC 61439 • IS 2026 • ANSI',
    ref: 'Tata Power Company Limited (Up to 10 MVA / 33 kV) ',
    text: "Combines PLC automation speed with manual verification safety. Controlled via a 15-inch touchscreen HMI with only three primary connections."
  },
  {
    id: 'conventional',
    code: 'MOD-ETB-3000-CV',
    tabLabel: 'Conventional',
    title: 'Conventional Transformer Test Bench',
    badge: 'UP TO 250 MVA',
    img: 'coventional-trolly.webp',
    capacity: '250',
    voltage: '66',
    accuracy: '0.50',
    stds: 'IEC 61439 • IS 2026 • CPRI Approved',
    ref: 'Set-On-Site Electricals (Up to 250 MVA / 66 kV)',
    text: "Rugged control desk with precision joystick-controlled variac excitation, analog/digital metering, and hardware flashover protection."
  },
  {
    id: 'low-voltage',
    code: 'MOD-LTT-1200-MB',
    tabLabel: 'LV Test Trolley',
    title: 'Low Voltage Mobile Test Trolley',
    badge: 'UP TO 1.1 kV',
    img: 'low-voltage-trolly.webp',
    capacity: '1.5',
    voltage: '1.1',
    accuracy: '0.20',
    stds: 'IEC 61439 • IS 2026 • IP54 Mobile',
    ref: 'Factory testing bays & maintenance yards',
    text: "Compact mobile shop-floor trolley with steerable heavy-duty casters and quick-clamp terminals for swift LV winding resistance and ratio checks."
  }
];

const N = PRODUCTS.length;
const mod = (v: number, n: number) => ((v % n) + n) % n;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (u: number) => u * u * (3 - 2 * u);

export default function TestBenches() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  useCinematic(sectionRef, '.tb-wrap');

  const stageBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<Product>(PRODUCTS[0]);
  const [cadText, setCadText] = useState('POS [X: 620.0  Y: 280.0] • 50 Hz');

  const handleInquire = useCallback((item: Product) => {
    setModalOpen(false);
    const messageLines = [
      `Enquiry about: ${item.title} (${item.code})`,
      '',
      'Key Specifications:',
      `- Capacity: Up to ${item.capacity} MVA`,
      `- Voltage Class: Up to ${item.voltage} kV`,
      `- Measurement Accuracy: Class ${item.accuracy}%`,
      `- Standards Compliance: ${item.stds}`,
      `- Reference Installation: ${item.ref}`,
      '',
      'Please provide technical data sheets, quotation, and project drawings.'
    ];

    const searchParams = new URLSearchParams({
      product: item.id,
      need: 'Transformer Testing',
      message: messageLines.join('\n')
    });
    navigate(`/contact?${searchParams.toString()}`);
  }, [navigate]);

  // Motion controller reference (interpolated with GSAP)
  const motion = useRef({ pos: 0, target: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // Drag physics state
  const dragRef = useRef({
    isDragging: false,
    dragMoved: false,
    startX: 0,
    startPos: 0,
    samples: [] as { t: number; p: number }[],
    cardW: 460
  });

  // Wheel throttle state
  const wheelLock = useRef({ last: 0, acc: 0 });

  // 3D positioning update function
  const renderCards = useCallback((pos: number) => {
    const cardW = dragRef.current.cardW;

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const o = mod(i - pos + N / 2, N) - N / 2;
      const u = Math.abs(o);
      const s = o < 0 ? -1 : 1;
      const e = ease(Math.min(u, 1));
      const far = Math.max(0, u - 1);

      // Smooth curved landscape positioning
      const x = s * (e * cardW * 0.76 + far * cardW * 0.32);
      const z = -e * (cardW * 0.48) - far * (cardW * 0.22);
      const ry = -s * e * 50;
      const sc = 1 - 0.11 * e - far * 0.05;
      const op = u > 2.8 ? 0 : u > 2.2 ? 1 - (u - 2.2) / 0.6 : 1;

      el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
      el.style.zIndex = String(Math.round(1000 - u * 100));

      const haze = el.querySelector<HTMLElement>('.tb-haze');
      if (haze) haze.style.opacity = clamp(u * 0.5, 0, 0.72).toFixed(3);

      if (u < 0.45) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
    });

    // Check active index change
    const curActive = mod(Math.round(pos), N);
    setActive(prev => (prev !== curActive ? curActive : prev));
  }, []);

  // Measure stage dimensions
  const measure = useCallback(() => {
    const stg = stageRef.current;
    if (!stg) return;
    const W = stg.clientWidth;
    const H = stg.clientHeight;
    const cw = Math.min(Math.max(W * 0.44, 340), Math.min(H * 1.35, 520));
    dragRef.current.cardW = cw;
    itemRefs.current.forEach(el => {
      if (el) el.style.width = `${cw.toFixed(1)}px`;
    });
    renderCards(motion.current.pos);
  }, [renderCards]);

  // Smooth GSAP Tween to a whole integer index
  const goToIndex = useCallback((targetIdx: number, speed = 0.95) => {
    const curPos = motion.current.pos;
    const curRound = Math.round(curPos);
    const d = mod(targetIdx - curRound + N / 2, N) - N / 2;
    const dest = curRound + d;
    motion.current.target = dest;

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(motion.current, {
      pos: dest,
      duration: speed,
      ease: 'power3.out',
      onUpdate: () => renderCards(motion.current.pos)
    });
  }, [renderCards]);

  const step = useCallback((delta: number) => {
    const dest = Math.round(motion.current.target) + delta;
    motion.current.target = dest;
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(motion.current, {
      pos: dest,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => renderCards(motion.current.pos)
    });
  }, [renderCards]);

  // Window Resize & Initialization
  useEffect(() => {
    measure();
    const stg = stageRef.current;
    if (!stg) return;
    const ro = new ResizeObserver(measure);
    ro.observe(stg);
    return () => ro.disconnect();
  }, [measure]);

  // Pointer Drag Handling (Gentle drag, never too fast, snaps cleanly)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const d = dragRef.current;
    d.isDragging = true;
    d.dragMoved = false;
    d.startX = e.clientX;
    d.startPos = motion.current.pos;
    d.samples = [{ t: performance.now(), p: motion.current.pos }];

    tweenRef.current?.kill();

    const box = stageBoxRef.current;
    if (box) {
      box.classList.add('grabbing');
      box.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = stageBoxRef.current;
    if (box) {
      const rect = box.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setCadText(`POS [X: ${mx.toFixed(1)}  Y: ${my.toFixed(1)}] • 50 Hz`);
    }

    const d = dragRef.current;
    if (!d.isDragging) return;

    const dx = e.clientX - d.startX;
    if (!d.dragMoved && Math.abs(dx) > 6) d.dragMoved = true;
    if (!d.dragMoved) return;

    // pxPerStep is calibrated to 460px so dragging feels grounded and smooth
    const pxPerStep = d.cardW * 1.15;
    const newPos = d.startPos - dx / pxPerStep;
    motion.current.pos = newPos;
    renderCards(newPos);

    const now = performance.now();
    d.samples.push({ t: now, p: newPos });
    while (d.samples.length > 2 && now - d.samples[0].t > 120) d.samples.shift();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.isDragging) return;
    d.isDragging = false;

    const box = stageBoxRef.current;
    if (box) {
      box.classList.remove('grabbing');
      try { box.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    if (!d.dragMoved) {
      const target = e.target as HTMLElement;
      const cardEl = target.closest<HTMLElement>('.tb-item');
      if (cardEl && cardEl.dataset.i !== undefined) {
        const clickedIdx = Number(cardEl.dataset.i);
        if (mod(clickedIdx, N) === active) {
          setModalItem(PRODUCTS[active]);
          setModalOpen(true);
        } else {
          goToIndex(clickedIdx);
        }
      }
      return;
    }

    // Velocity calculation on release
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const v = b && a && b.t - a.t > 8 ? ((b.p - a.p) / (b.t - a.t)) * 1000 : 0;
    const vel = clamp(v, -15, 15);

    // Projected target rounded strictly to nearest whole integer
    const projected = motion.current.pos + vel * 0.16;
    const snapTarget = clamp(Math.round(projected), Math.round(motion.current.pos) - 2, Math.round(motion.current.pos) + 2);

    goToIndex(snapTarget, 1.0);
  };

  // Throttled Wheel / Trackpad Scroll (Smoothed so it never fires too fast)
  useEffect(() => {
    const box = stageBoxRef.current;
    if (!box) return;

    const onWheel = (e: WheelEvent) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontal ? e.deltaX : e.deltaY;
      const now = performance.now();

      if (Math.abs(delta) > 18) {
        wheelLock.current.acc += delta;
        if (Math.abs(wheelLock.current.acc) >= 36 && now - wheelLock.current.last > 520) {
          e.preventDefault();
          step(wheelLock.current.acc > 0 ? 1 : -1);
          wheelLock.current.acc = 0;
          wheelLock.current.last = now;
        }
      }
    };

    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [step]);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key >= '1' && e.key <= '5') { e.preventDefault(); goToIndex(Number(e.key) - 1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      setModalItem(PRODUCTS[active]);
      setModalOpen(true);
    }
  };

  const curr = PRODUCTS[active];

  return (
    <section id="transformer-benches" className="tb-section" ref={sectionRef} aria-labelledby="tb-head-title">
      <div className="tb-wrap">
        
        {/* Section Header */}
        <header className="tb-head">
          <div>
            <div className="tb-eyebrow">
              <span className="tb-beacon" />
              <span>Routine Testing Floor &bull; Since 1989</span>
            </div>
            <h2 id="tb-head-title">Our Transformer Testing Solutions</h2>
          </div>
          <p>Discover a comprehensive suite of automated and conventional testing benches engineered for IEC 61439 &amp; IEEE C57 compliance.</p>
        </header>

        {/* Top System Switcher Tabs */}
        <div className="tb-tabs-bar" role="tablist" aria-label="Transformer Testing Bench Variants">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              className={`tb-tab ${i === active ? 'active' : ''}`}
              type="button"
              onClick={() => goToIndex(i)}
            >
              <span className="tb-tab-idx">0{i + 1}</span>
              <span>{p.tabLabel}</span>
            </button>
          ))}
        </div>

        {/* Landscape Blueprint 3D Stage */}
        <div
          className="tb-stage-box"
          ref={stageBoxRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Interactive Transformer Test Benches 3D Showcase"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="tb-grid" />
          <div className="tb-vignette" />

          {/* CAD Telemetry Readouts */}
          <div className="tb-cad-hud">
            <span hidden className="tb-cad-pill">DWG: ETB-2026-R3 &bull; SCALE 1:10 &bull; GRID 20mm</span>
            <span hidden className="tb-cad-pill">{cadText}</span>
          </div>

          {/* 3D Flow Covers Stage */}
          <div className="tb-stage" ref={stageRef}>
            {PRODUCTS.map((p, i) => (
              <div
                key={p.id}
                ref={el => { itemRefs.current[i] = el; }}
                className={`tb-item ${i === active ? 'is-active' : ''}`}
                data-i={i}
              >
                <div className="tb-card">
                  <div className="tb-card-hud">
                    <span className="tb-badge-code">{p.code}</span>
                    <div className="tb-phase-dots">
                      <span className="p-dot r" />
                      <span className="p-dot y" />
                      <span className="p-dot b" />
                    </div>
                  </div>

                  <div className="tb-vf">
                    <div className="tb-vf-b tl" />
                    <div className="tb-vf-b tr" />
                    <div className="tb-vf-b bl" />
                    <div className="tb-vf-b br" />
                  </div>

                  <div className="tb-img-box">
                    <img src={`${BASE}${p.img}`} alt={p.title} draggable={false} loading="eager" />
                  </div>

                  <div className="tb-card-bezel">
                    <div className="tb-bezel-title">{p.title}</div>
                    <span className="tb-bezel-tag">{p.badge}</span>
                  </div>

                  <div className="tb-haze" />
                </div>
                <div className="tb-mirror" aria-hidden="true">
                  <img src={`${BASE}${p.img}`} alt="" draggable={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation & Progress Controls */}
        <div className="tb-nav-bar">
          <button className="tb-nav-btn" type="button" aria-label="Previous Test System" onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="tb-dots">
            {PRODUCTS.map((p, i) => (
              <button
                key={p.id}
                className={`tb-dot ${i === active ? 'active' : ''}`}
                type="button"
                aria-label={`Go to ${p.title}`}
                onClick={() => goToIndex(i)}
              />
            ))}
          </div>
          <button className="tb-nav-btn" type="button" aria-label="Next Test System" onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Concise Spec & Telemetry Strip (Short & Impactful) */}
        <div className="tb-spec-strip">
          <div className="tb-spec-left">
            <div className="tb-spec-header-row">
              <span className="tb-spec-step-tag">BENCH 0{active + 1} / 0{N}</span>
              <span className="tb-spec-stds">{curr.stds}</span>
            </div>
            <h3 className="tb-spec-title">{curr.title}</h3>
            <p className="tb-spec-desc">{curr.text}</p>
          </div>

          <div className="tb-spec-right">
            {/* 4 Key Metrics */}
            <div className="tb-metrics-row">
              <div className="tb-metric-box">
                <div className="tb-metric-k">Max Rating</div>
                <div className="tb-metric-v">{curr.capacity}<span>MVA</span></div>
              </div>
              <div className="tb-metric-box">
                <div className="tb-metric-k">Voltage</div>
                <div className="tb-metric-v">{curr.voltage}<span>kV</span></div>
              </div>
              <div className="tb-metric-box">
                <div className="tb-metric-k">Accuracy</div>
                <div className="tb-metric-v">{curr.accuracy}<span>%</span></div>
              </div>
              <div className="tb-metric-box">
                <div className="tb-metric-k">Coverage</div>
                <div className="tb-metric-v">16<span>Tests</span></div>
              </div>
            </div>

            {/* Action Row */}
            <div className="tb-action-row" >
              <div className="tb-ref-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span >{curr.ref}</span>
              </div>
              <button
                className="pill"
                type="button"
                onClick={() => {
                  setModalItem(curr);
                  setModalOpen(true);
                }}
                
              >
                <span>Explore Specifications</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Technical Dossier Window */}
      <div
        className={`tb-modal-overlay ${modalOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-bench-title"
        onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <div className="tb-modal-window">
          <div className="tb-modal-head">
            <div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--brand)', fontWeight: 600 }}>
                {modalItem.code} &bull; TECHNICAL SPECIFICATION
              </div>
              <h3 id="modal-bench-title" style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: '18px', marginTop: '2px' }}>
                {modalItem.title}
              </h3>
            </div>
            <button className="tb-modal-close" aria-label="Close dialog" onClick={() => setModalOpen(false)}>
              &times;
            </button>
          </div>
          <div className="tb-modal-body">
            <p style={{ color: 'var(--ink-2)', marginBottom: '18px', fontSize: '14px', lineHeight: 1.6 }}>
              {modalItem.text}
            </p>
            
            <h4 style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: '14px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Routine Tests Supported (IEC 61439 / IS 2026):
            </h4>
            <div className="tb-modal-test-grid">
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Measurement of No-Load Loss &amp; Current</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Measurement of Load Loss &amp; Impedance</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Winding Resistance (HV/LV)</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Voltage Ratio &amp; Vector Group</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Separate Source AC Withstand (HV Test)</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Induced Over Voltage Test (DVDF)</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Magnetic Balance &amp; Neutral Current</span></div>
              <div className="tb-modal-test-card"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Harmonics FFT &amp; Acoustic Sound Level</span></div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="pill"
                type="button"
                onClick={() => handleInquire(modalItem)}
              >
                Inquire for this System &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

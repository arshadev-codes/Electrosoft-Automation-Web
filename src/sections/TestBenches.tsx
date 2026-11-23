/**
 * ============================================================================
 * TestBenches.tsx — 3D Transformer Testing Systems Showcase
 * Electrosoft Design System (DESIGN.md)
 * ============================================================================
 * Architecture Overview:
 * 1. 3D Spatial Ring: Projects cards on a virtual cylinder using 3D transforms
 *    (translate3d, rotateY, scale, opacity) driven by continuous float `motion.pos`.
 * 2. GSAP Momentum & Snapping: Interpolates float positions to integer indices
 *    with smooth cubic easing (`power3.out`).
 * 3. Fast-to-Slow ScrollTrigger: Sweeps cards into view with `expo.out` easing
 *    (explosive launch decelerating into a smooth glide) when the section scrolls in.
 * 4. Auto-Scroll with Pause on Hover: Cycles cards every 3.8s; pauses on hover,
 *    active drag, image preview open, or document invisibility.
 * 5. Direct Card Click Activation: Clicking any peripheral card animates it to
 *    the active center; clicking the active card opens the high-definition image preview.
 * 6. Contact Prefill: "Inquire for this System" serializes technical specs directly
 *    into `/contact` URL search parameters.
 * ============================================================================
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';
import { holdScroll } from '../hooks/useSmoothScroll';
import { Arrow } from '../components/ui';

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

// Safe positive modulo for continuous cyclic wrapping: [0, n - 1]
const mod = (v: number, n: number) => ((v % n) + n) % n;

// Clamps a numeric value between bounds [a, b]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Hermite cubic ease-in-out for natural spatial dispersion: 3u^2 - 2u^3
const ease = (u: number) => u * u * (3 - 2 * u);

/**
 * BenchImagePreview:
 * Inspection photo viewer for transformer test benches adhering to Electrosoft DESIGN.md.
 * Features:
 * - High-definition image display with natural drop-shadow against a frosted backdrop.
 * - Keyboard navigation (Esc to exit, Arrow keys to traverse).
 * - Touch swipe gesture detection.
 * - Prev/Next navigation that stays synchronized with the carousel.
 * - Direct enquiry action linking to the prefilled Contact flow.
 */
interface BenchImagePreviewProps {
  items: Product[];
  activeIdx: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
  onInquire: (item: Product) => void;
}

function BenchImagePreview({ items, activeIdx, onClose, onNavigate, onInquire }: BenchImagePreviewProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const firstRef = useRef(true);
  const swipeStartX = useRef<number | null>(null);

  const total = items.length;
  const current = items[activeIdx];

  const go = useCallback(
    (delta: number) => {
      const next = (activeIdx + delta + total) % total;
      onNavigate(next);
    },
    [activeIdx, total, onNavigate]
  );

  // Entrance and photo swap animations
  useLayoutEffect(() => {
    const root = boxRef.current;
    const el = imgRef.current;
    if (!root || !el) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (firstRef.current) {
      firstRef.current = false;
      gsap.fromTo(root, { '--fade': 0 }, { '--fade': 1, duration: reduce ? 0 : 0.35, ease: 'power2.out' });
      gsap.fromTo(el, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: reduce ? 0 : 0.45, ease: 'expo.out' });
      gsap.fromTo(
        root.querySelectorAll('.vw-ui'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, delay: reduce ? 0 : 0.15, stagger: 0.05, ease: 'power2.out' }
      );
    } else if (!reduce) {
      gsap.fromTo(el, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'expo.out' });
    }
  }, [activeIdx]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [go, onClose]);

  // Lock document scroll while preview is active
  useEffect(() => {
    holdScroll(true);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      holdScroll(false);
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="vw"
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${current.title} image preview`}
      onPointerDown={e => { swipeStartX.current = e.clientX; }}
      onPointerUp={e => {
        if (swipeStartX.current !== null && Math.abs(e.clientX - swipeStartX.current) > 50) {
          go(e.clientX < swipeStartX.current ? 1 : -1);
        }
        swipeStartX.current = null;
      }}
    >
      {/* Light frosted backdrop (click to dismiss) */}
      <button
        type="button"
        className="vw-bg"
        aria-label="Close image preview"
        tabIndex={-1}
        onClick={onClose}
      />

      {/* Top Header: Bench Counter & Close Action */}
      <div className="vw-top vw-ui">
        <span className="mono">
          {String(activeIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} &bull; {current.code}
        </span>
        <button type="button" className="vw-close" onClick={onClose}>
          Close <span aria-hidden="true">Esc</span>
        </button>
      </div>

      {/* Center High-Definition Image Showcase */}
      <figure className="vw-fig">
        <img
          ref={imgRef}
          key={current.id}
          src={`${BASE}${current.img}`}
          alt={current.title}
          draggable={false}
        />
      </figure>

      {/* Bottom Bar: Prev arrow, system specifications + CTA, Next arrow */}
      <div className="vw-bot vw-ui">
        <button
          type="button"
          className="vw-arrow"
          aria-label="Previous test bench"
          onClick={() => go(-1)}
        >
          <Arrow />
        </button>

        <div className="vw-cap">
          <b>{current.title}</b>
          <span>{current.badge} &bull; Up to {current.voltage} kV &bull; Class {current.accuracy}%</span>
          <button
            type="button"
            className="pill"
            style={{ marginTop: '8px', fontSize: '13px', padding: '9px 20px', cursor: 'pointer' }}
            onClick={() => {
              onClose();
              onInquire(current);
            }}
          >
            <span>Inquire for this System</span>
            <Arrow />
          </button>
        </div>

        <button
          type="button"
          className="vw-arrow next"
          aria-label="Next test bench"
          onClick={() => go(1)}
        >
          <Arrow />
        </button>
      </div>
    </div>
  );
}

export default function TestBenches() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  useCinematic(sectionRef, '.tb-wrap');

  const stageBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [cadText, setCadText] = useState('POS [X: 620.0  Y: 280.0] • 50 Hz');

  /**
   * Serializes active bench specifications and navigates to the Contact page
   * with pre-filled enquiry requirements and circuit-breakers satisfied.
   */
  const handleInquire = useCallback((item: Product) => {
    setPreviewOpen(false);
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

  // Interpolated continuous motion state
  const motion = useRef({ pos: 0, target: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // Pointer drag & gesture state
  const dragRef = useRef({
    isDragging: false,
    dragMoved: false,
    startX: 0,
    startPos: 0,
    clickedIdx: -1,
    samples: [] as { t: number; p: number }[],
    cardW: 460
  });

  // Auto-scroll controller refs
  const isHoveredRef = useRef(false);
  const previewOpenRef = useRef(previewOpen);
  previewOpenRef.current = previewOpen;
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * 3D Geometry Projection Engine:
   * Maps each card along a curved spatial ring based on signed distance `o` from `pos`.
   * - `o`: circular distance [-N/2, N/2] relative to current view position.
   * - `x`: horizontal bezier displacement across the stage.
   * - `z`: receding depth into 3D space.
   * - `ry`: inward Y-axis tilt to face the user.
   * - `sc` & `op`: depth scaling and distance-based opacity falloff.
   */
  const renderCards = useCallback((pos: number, syncState = true) => {
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

    // Synchronize active indicator index (bypassed during fast entrance tween for 60/120 FPS)
    if (syncState) {
      const curActive = mod(Math.round(pos), N);
      setActive(prev => (prev !== curActive ? curActive : prev));
    }
  }, []);

  // Measures stage container dimensions to size cards responsively
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

  /**
   * Auto-Advance Carousel Controller:
   * Automatically cycles to the next card every 3.8s. Pauses if the stage is hovered,
   * user is actively dragging, image preview is open, or browser tab is hidden.
   */
  const resetAutoTimer = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (
        !isHoveredRef.current &&
        !dragRef.current.isDragging &&
        !previewOpenRef.current &&
        !document.hidden
      ) {
        const dest = Math.round(motion.current.target) + 1;
        motion.current.target = dest;
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(motion.current, {
          pos: dest,
          duration: 0.9,
          ease: 'power3.out',
          onUpdate: () => renderCards(motion.current.pos)
        });
      }
    }, 1900);
  }, [renderCards]);

  /**
   * Rotates smoothly to target integer index via the shortest circular path
   * (e.g. from index 4 to 0 spins forward +1 rather than rewinding -4).
   */
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
    resetAutoTimer();
  }, [renderCards, resetAutoTimer]);

  // Steps carousel by signed integer (+1 next, -1 previous)
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
    resetAutoTimer();
  }, [renderCards, resetAutoTimer]);

  // Sizing & Resize Observer
  useEffect(() => {
    measure();
    const stg = stageRef.current;
    if (!stg) return;
    const ro = new ResizeObserver(measure);
    ro.observe(stg);
    return () => ro.disconnect();
  }, [measure]);

  /**
   * ScrollTrigger Entrance Animation (Fast-to-Slow & Lag-Free):
   * When the section scrolls into the viewport (top 70%), cards sweep dynamically
   * from `START_OFFSET` to `0`.
   *
   * Kinematics & Seamlessness:
   * 1. Start Offset (-5.0): Represents 1 full 360-degree revolution of all 5 testing systems.
   * 2. Perfect Pre-Render Sync: `motion.current.pos` and `renderCards` start at identical values,
   *    guaranteeing ZERO visual jumps, pop-in, or frame discontinuity when the tween fires.
   * 3. Explosive Deceleration (`expo.out`): Starts with rapid launch speed across the stage,
   *    then effortlessly decelerates into a silky, majestic glide into position 0.
   * 4. 60/120 FPS Throughput (`syncState: false`): Bypasses intermediate React component
   *    re-renders during the high-speed sweep so the GPU handles 100% of the workload.
   */
  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // Fast-to-slow kinematic parameters:
    // START_OFFSET = -5 gives 1 full revolution (can adjust to -4 or -6 as desired)
    // DURATION = 1.8s allows aggressive launch burst followed by silky glide
    const START_OFFSET = -10;
    const DURATION = 1.8;

    // Initialize position and pre-render cards at exact offset to prevent any visual jump
    motion.current.pos = START_OFFSET;
    motion.current.target = 0;
    renderCards(START_OFFSET, false);

    const st = ScrollTrigger.create({
      trigger: sec,
      start: 'top 60%',
      once: true,
      onEnter: () => {
        tweenRef.current?.kill();
        tweenRef.current = gsap.fromTo(
          motion.current,
          { pos: START_OFFSET },
          {
            pos: 0,
            duration: DURATION,
            ease: 'expo.out', // Rapid initial velocity that smoothly eases into rest
            onUpdate: () => renderCards(motion.current.pos, false),
            onComplete: () => {
              motion.current.pos = 0;
              motion.current.target = 0;
              renderCards(0, true);
              resetAutoTimer();
            }
          }
        );
      }
    });

    return () => st.kill();
  }, [renderCards, resetAutoTimer]);

  // Hover & Visibility listeners to manage auto-scroll pausing
  useEffect(() => {
    const box = stageBoxRef.current;
    if (!box) return;

    const onEnter = () => { isHoveredRef.current = true; };
    const onLeave = () => {
      isHoveredRef.current = false;
      resetAutoTimer();
    };

    box.addEventListener('mouseenter', onEnter);
    box.addEventListener('mouseleave', onLeave);

    const onVisChange = () => {
      if (!document.hidden) resetAutoTimer();
    };
    document.addEventListener('visibilitychange', onVisChange);

    resetAutoTimer();

    return () => {
      box.removeEventListener('mouseenter', onEnter);
      box.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisChange);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [resetAutoTimer]);

  /**
   * Pointer Drag & Gesture Handling:
   * Supports smooth mouse/touch dragging with velocity momentum and click detection.
   */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const d = dragRef.current;
    d.isDragging = true;
    d.dragMoved = false;
    d.startX = e.clientX;
    d.startPos = motion.current.pos;
    d.samples = [{ t: performance.now(), p: motion.current.pos }];

    // Cache the clicked card index BEFORE pointer capture redirects events to stageBoxRef
    const target = e.target as HTMLElement;
    const cardEl = target.closest<HTMLElement>('.tb-item');
    d.clickedIdx = cardEl && cardEl.dataset.i !== undefined ? Number(cardEl.dataset.i) : -1;

    tweenRef.current?.kill();

    const box = stageBoxRef.current;
    if (box) {
      box.classList.add('grabbing');
      box.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Update live CAD crosshair coordinates
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
    // 6px deadzone avoids treating tiny taps as drags
    if (!d.dragMoved && Math.abs(dx) > 6) d.dragMoved = true;
    if (!d.dragMoved) return;

    // Displacement ratio calibrated to card width for grounded feel
    const pxPerStep = d.cardW * 1.15;
    const newPos = d.startPos - dx / pxPerStep;
    motion.current.pos = newPos;
    renderCards(newPos);

    // Track time-stamped positions for momentum release
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
      try { box.releasePointerCapture(e.pointerId); } catch (_) { }
    }

    // 1. Tapped without dragging: Activate clicked card, or open high-res preview if already active
    if (!d.dragMoved) {
      if (d.clickedIdx >= 0) {
        const clickedIdx = d.clickedIdx;
        const curActive = mod(Math.round(motion.current.pos), N);
        if (clickedIdx === curActive) {
          setPreviewIdx(curActive);
          setPreviewOpen(true);
        } else {
          goToIndex(clickedIdx);
        }
      }
      d.clickedIdx = -1;
      return;
    }

    // 2. Dragged: Compute release velocity and project to nearest whole card integer
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const v = b && a && b.t - a.t > 8 ? ((b.p - a.p) / (b.t - a.t)) * 1000 : 0;
    const vel = clamp(v, -15, 15);

    const projected = motion.current.pos + vel * 0.16;
    const snapTarget = clamp(Math.round(projected), Math.round(motion.current.pos) - 2, Math.round(motion.current.pos) + 2);

    goToIndex(snapTarget, 1.0);
  };

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key >= '1' && e.key <= '5') { e.preventDefault(); goToIndex(Number(e.key) - 1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      setPreviewIdx(active);
      setPreviewOpen(true);
    }
  };

  // const curr = PRODUCTS[active];

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

   

        {/* Landscape Blueprint 3D Stage */}
        <div
        style={{marginTop:"60px"}}
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
                onClick={() => {
                  if (dragRef.current.dragMoved) return;
                  const curActive = mod(Math.round(motion.current.pos), N);
                  if (i === curActive) {
                    setPreviewIdx(curActive);
                    setPreviewOpen(true);
                  } else {
                    goToIndex(i);
                  }
                }}
              >
                <div className="tb-card">
                  {/* <div className="tb-card-hud">
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
                  </div> */}

                  <div className="tb-img-box">
                    <img src={`${BASE}${p.img}`} alt={p.title} draggable={false} loading="eager" />
                  </div>

                  {/* Interactive Hover Preview Pill */}
                  <div className="tb-preview-pill" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>PREVIEW</span>
                  </div>

                  {/* <div className="tb-card-bezel">
                    <div className="tb-bezel-title">{p.title}</div>
                    <span className="tb-bezel-tag">{p.badge}</span>
                  </div> */}

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
        {/* <div className="tb-spec-strip">
          <div className="tb-spec-left">
            <div className="tb-spec-header-row">
              <span className="tb-spec-step-tag">BENCH 0{active + 1} / 0{N}</span>
              <span className="tb-spec-stds">{curr.stds}</span>
            </div>
            <h3 className="tb-spec-title">{curr.title}</h3>
            <p className="tb-spec-desc">{curr.text}</p>
          </div>

          <div className="tb-spec-right">
            {/* 4 Key Metrics */} {/*
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

            {/* Action Row *
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
        </div> */}

      </div>

      {/* High-Definition Inspection Image Preview */}
      {previewOpen && (
        <BenchImagePreview
          items={PRODUCTS}
          activeIdx={previewIdx}
          onClose={() => setPreviewOpen(false)}
          onNavigate={idx => {
            setPreviewIdx(idx);
            goToIndex(idx);
          }}
          onInquire={handleInquire}
        />
      )}
    </section>
  );
}

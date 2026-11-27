import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { holdReveal } from '../components/PageTransition';
import { createPanelMotion, panelHeroIn, panelModeScrollY } from './panelMotion';
import { scrollToY } from '../hooks/useSmoothScroll';
import { useCinematic } from '../hooks/useCinematic';
import { Arrow, FeederCta, tilt, untilt } from '../components/ui';
import RoutineTests from '../sections/RoutineTests';
import PanelShowcase from '../sections/PanelShowcase';
import type { TestItem } from '../data/testing';
import Client from '../sections/Clients';

const ControlPanelScene = lazy(() => import('../components/ControlPanelScene'));

// Brochure / Company Profile PDF
const BROCHURE = '/downloads/COMPANY_PROFILE.pdf';

/**
 * 3 Core Panel Categories for the 3-position selector switch
 */
const PANEL_SYSTEMS = [
  {
    id: 'power-panels',
    pos: 'POWER',
    name: 'Power Control & Distribution Centres (PCC)',
    text: 'Heavy-duty switchboards up to 6300A with CPRI-certified 65 kA fault withstand, Form 4b segregation, and microprocessor ACB protection.',
    duties: [
      ['auto', '65 kA / 1 sec CPRI short-circuit withstand'],
      ['auto', 'Draw-Out feeder modules for zero process downtime'],
      ['auto', 'Electrolytic copper busbars rated for 50°C ambient'],
    ] as [('auto' | 'hand'), string][],
    ref: 'CPRI STC 65 kA · IP65 · Type-Tested Switchgear',
  },
  {
    id: 'motor-energy',
    pos: 'MOTOR',
    name: 'Motor Control & Energy Systems (MCC, VFD, APFC)',
    text: 'Intelligent motor control centres combining variable frequency drives, motor protection, and SmartAPFC maintaining unity power factor.',
    duties: [
      ['auto', 'SmartAPFC 8-stage automatic capacitor switching to unity PF'],
      ['auto', 'VFD energy optimization matching motor speed to torque load'],
      ['auto', 'Type-2 coordination with thermal-magnetic protection'],
    ] as [('auto' | 'hand'), string][],
    ref: 'Process plants, pumping stations & heavy drives',
  },
  {
    id: 'plant-auto',
    pos: 'AUTO',
    name: 'Plant Automation & PLC/SCADA Systems',
    text: 'Custom PLC programming, intuitive SCADA supervisory systems, and operator control desks engineered with 20+ years of domain experience.',
    duties: [
      ['auto', 'Siemens, Schneider Electric, Allen-Bradley & Omron PLCs'],
      ['auto', 'SCADA supervisory systems (WinCC, Vijeo Citect, Wonderware)'],
      ['auto', 'Complete factory simulation & pre-commissioning verification'],
    ] as [('auto' | 'hand'), string][],
    ref: 'Municipal corporations, water treatment & industry',
  },
];

/**
 * Standard Electrical Control Panel Routine Tests (IEC 61439-1/2, IS 8623)
 */
const PANEL_ROUTINE_TESTS: TestItem[] = [
  {
    id: 'pt-hv',
    name: 'High Voltage (HV) Withstand Test (2.5 kV AC for 1 Min)',
    text: 'Applies 2.5 kV power-frequency voltage between all live phases and the earthed panel enclosure to verify dielectric integrity and insulation barriers.',
    part: 'Main Busbars & Enclosure Insulation',
  },
  {
    id: 'pt-ir',
    name: 'Measurement of Insulation Resistance (1000V Megger)',
    text: 'Measures DC insulation resistance (minimum > 100 MΩ) between phase-to-phase and phase-to-earth before and after dielectric HV testing.',
    part: 'Phase Conductors & Earth System',
  },
  {
    id: 'pt-earth',
    name: 'Earth Continuity and Protective Bonding Resistance',
    text: 'Injects high DC test current between the main earth terminal, door hinge bonds, and structural gland plates to prove low-resistance fault dissipation.',
    part: 'Earthing Busbar & Structural Bonding',
  },
  {
    id: 'pt-clearance',
    name: 'Verification of Clearances and Creepage Distances',
    text: 'Measures physical electrical air clearance and surface tracking creepage distances across busbar supports per IEC 61439-1 table 1 and 2.',
    part: 'SMC/DMC Busbar Supports & Partitions',
  },
  {
    id: 'pt-functional',
    name: 'Operational & Control Circuit Functional Simulation',
    text: 'Energises control transformer, PLC I/O, contactors, and relays to verify trip circuits, auto/manual transfer logic, and interlocks.',
    part: 'PLC, VFD & Control Wiring Harness',
  },
  {
    id: 'pt-interlock',
    name: 'Mechanical & Electrical Interlock Verification',
    text: 'Verifies safety defeat mechanisms, door interlocks preventing opening while energised, and mechanical castel interlocks between incomers and bus coupler.',
    part: 'Door Interlocks & Breaker Operating Handles',
  },
  {
    id: 'pt-drawout',
    name: 'Draw-Out Module Alignment & Contact Engagement Check',
    text: 'Tests smooth insertion, racking mechanism (Service, Test, Isolated positions), safety shutter automatic closure, and secondary control pin alignment.',
    part: 'Draw-Out Trolley & Silver-Plated Jaws',
  },
  {
    id: 'pt-torque',
    name: 'Busbar Joint Torque & Millivolt Drop Check',
    text: 'Calibrated torque wrench verification on all high-tensile grade 8.8 bolts, followed by millivolt drop measurement across joints to prevent hot spots.',
    part: 'Copper Busbar Fishplates & Joint Bolting',
  },
  {
    id: 'pt-stc',
    name: 'Short-Circuit Withstand Capacity (CPRI Certified to 65 kA)',
    text: 'Type-tested design verifying withstand capacity against electrodynamic and thermal forces during a 65 kA short-circuit fault for 1 second.',
    part: 'Busbar Bracing & Heavy Structural Framework',
  },
  {
    id: 'pt-ip',
    name: 'Degree of Protection Verification (IP65 Enclosure Check)',
    text: 'Continuous polyurethane (PU) foam gasket inspection on CNC doors and IP65 sealing gland plates to prevent dust and moisture ingress.',
    part: 'PU Gasketing & Enclosure Seams',
  },
  {
    id: 'pt-relay',
    name: 'Secondary Injection Testing of Protection Relays',
    text: 'Simulates overcurrent, short circuit, and earth fault currents on numerical microprocessor releases to verify calibrated trip timing curves.',
    part: 'Microprocessor Releases & Protection Relays',
  },
  {
    id: 'pt-qap',
    name: 'Final Quality Assurance Protocol & Handover Inspection',
    text: 'Comprehensive 3-step QAP audit verifying schematic matching, component ratings per approved BOM, ferruling, phase color tagging, and nameplates.',
    part: 'Complete Switchboard Assembly',
  },
];

/**
 * Key Panel Installations & Projects with explicit ampere ratings
 */
const PANEL_INSTALLATIONS = [
  { id: 'jagmohan-pmp', amps: 800, client: 'Jagmohan Plamach Pvt. Ltd.', system: 'Plastic Moulding Machine Automation Systems', rating: '800 A · 35 kA', voltage: '415 V', scope: ['Precision PLC Automation', 'Touchscreen HMI Consoles', 'Turnkey Machine Wiring'] },
  { id: 'kbmc-badlapur', amps: 1600, client: 'Kulgaon-Badlapur Municipal Corp', system: 'Water Treatment & Pump Automation', rating: '1600 A · 50 kA', voltage: '415 V', scope: ['PCC Incomer with APFC', 'Multi-Pump Soft Starter MCC', 'Level Telemetry'] },
  { id: 'tata-power', amps: 2000, client: 'Tata Power Company Ltd.', system: 'HT Capacitor & Auxiliary Distribution', rating: '2000 A · 65 kA', voltage: '1.1 kV / 415 V', scope: ['1.1 kV HT Capacitor Panel', 'Busbar Trunking & Coupler', 'Relay Protection'] },
  { id: 'mcgm-powai', amps: 2500, client: 'MCGM (Greater Mumbai)', system: 'Mithi River Treatment Switchgear', rating: '2500 A · 50 kA', voltage: '415 V', scope: ['Heavy-Duty PCC Incomers', 'VFD Pump Control Panels', 'SCADA Integration'] },
  { id: 'mcg-gurugram', amps: 3200, client: 'MCG (Municipal Corp Gurugram)', system: 'Sewage Water Treatment Plant (SWTP)', rating: '3200 A · 50 kA', voltage: '415 V', scope: ['Main PCC with ACB Incomers', 'Auto/Manual PLC Panel', 'Draw-Out MCC Feeders'] },
  { id: 'crompton-greaves', amps: 4000, client: 'Crompton Greaves Industrial', system: 'Power & Protection Switchboards', rating: '4000 A · 65 kA', voltage: '415 V', scope: ['Motorized Changeover Panel', 'Remote I/O (RIO) Cubicles', 'CPRI Certified Busbars'] },
];

/** Current rating scale checkpoints (Amperes, 100A to 6300A) */
const PANEL_TICKS = [100, 400, 800, 1600, 2500, 4000, 6300];
const minAmps = 100, maxAmps = 6300;
const ampsToPos = (a: number) => {
  const logMin = Math.log10(minAmps), logMax = Math.log10(maxAmps);
  const logA = Math.log10(Math.max(minAmps, Math.min(maxAmps, a)));
  return ((logA - logMin) / (logMax - logMin)) * 100;
};

interface MarkLayout {
  side: 'up' | 'dn';
  align: 'start' | 'center' | 'end';
  level: 1 | 2;
}

const getDefaultLayout = (index: number, amps: number): MarkLayout => {
  const pos = ampsToPos(amps);
  const side: 'up' | 'dn' = index % 2 === 0 ? 'up' : 'dn';
  const align: 'start' | 'center' | 'end' = pos <= 15 ? 'start' : pos >= 85 ? 'end' : 'center';
  return { side, align, level: 1 };
};

/** Sine wave generator for 3-phase hero scope */
const WAVE = (shift: number) => {
  let d = '';
  for (let x = 0; x <= 360; x += 4) d += `${x ? 'L' : 'M'}${x} ${(36 - 22 * Math.sin((2 * Math.PI * (x + shift)) / 120)).toFixed(1)}`;
  return d;
};
const PHASES = [['r', 0], ['y', 40], ['b', 80]] as const;

const SPEC_HIGHLIGHTS = [
  'CPRI 65 kA STC',
  'IP65 Enclosure',
  'IEC 61439 Certified',
  '3-Step QA Plan',
  '100% Tested',
];

export default function PanelHome() {
  const ref = useRef<HTMLElement>(null), heroRef = useRef<HTMLElement>(null);
  const benchRef = useRef<HTMLElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const markRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mode, setMode] = useState(0), [hot, setHot] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [doorOpen, setDoorOpen] = useState(false);

  const [markLayouts, setMarkLayouts] = useState<MarkLayout[]>(() =>
    PANEL_INSTALLATIONS.map((p, i) => getDefaultLayout(i, p.amps))
  );

  // Dynamic collision-free label positioning on the rating scale
  useLayoutEffect(() => {
    const scaleEl = scaleRef.current;
    if (!scaleEl) return;

    const updateLayouts = () => {
      const rect = scaleEl.getBoundingClientRect();
      const width = rect.width;
      if (width <= 0) return;

      const GAP = 12;

      const items = PANEL_INSTALLATIONS.map((p, i) => {
        const el = markRefs.current[i];
        const pos = ampsToPos(p.amps);
        const anchorX = (pos / 100) * width;
        const elWidth = el ? el.getBoundingClientRect().width : Math.min(130, Math.max(60, p.client.length * 7));

        let align: 'start' | 'center' | 'end' = 'center';
        let left = anchorX - elWidth / 2;
        let right = anchorX + elWidth / 2;

        if (anchorX - elWidth / 2 < 0 || pos <= 15) {
          align = 'start';
          left = anchorX;
          right = anchorX + elWidth;
        } else if (anchorX + elWidth / 2 > width || pos >= 85) {
          align = 'end';
          left = anchorX - elWidth;
          right = anchorX;
        }

        const side: 'up' | 'dn' = i % 2 === 0 ? 'up' : 'dn';
        return { index: i, pos, left, right, side, align, level: 1 as 1 | 2 };
      });

      for (const side of ['up', 'dn'] as const) {
        const sideItems = items.filter(it => it.side === side).sort((a, b) => a.pos - b.pos);
        const level1Intervals: { left: number; right: number }[] = [];

        for (const item of sideItems) {
          const collides = level1Intervals.some(
            inv => !(item.right + GAP < inv.left || item.left - GAP > inv.right)
          );
          if (collides) {
            item.level = 2;
          } else {
            item.level = 1;
            level1Intervals.push({ left: item.left, right: item.right });
          }
        }
      }

      setMarkLayouts(items.map(it => ({ side: it.side, align: it.align, level: it.level })));
    };

    updateLayouts();
    const observer = new ResizeObserver(updateLayouts);
    observer.observe(scaleEl);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current, hero = heroRef.current;
    if (!el || !hero) return;
    const ctx = gsap.context(() => createPanelMotion(el, reduce, setMode), el);
    const ready = new Promise(res => hero.addEventListener('scene:ready', res, { once: true }));
    holdReveal(ready);
    void ready.then(() => ctx.add(() => panelHeroIn(reduce)));
    return () => ctx.revert();
  }, [reduce]);

  useCinematic(benchRef, '.wrap');

  useEffect(() => {
    const before = document.title;
    document.title = 'Electrical Control Panels & Plant Automation — Electrosoft';
    return () => { document.title = before; };
  }, []);

  useEffect(() => {
    if (reduce) { setStep(SPEC_HIGHLIGHTS.length); return; }
    const id = window.setInterval(() => setStep(s => (s + 1) % (SPEC_HIGHLIGHTS.length + 2)), 1600);
    return () => window.clearInterval(id);
  }, [reduce]);

  const pickMode = (i: number) => {
    const y = reduce ? null : panelModeScrollY(i);
    if (y === null) setMode(i); else scrollToY(y);
  };
  const sys = PANEL_SYSTEMS[mode];

  return (
    <main className="ts" ref={ref}>
      {/* 3.1 Hero: 3D Control Panel (MCC-01) with Interactive Turntable & Door Inspection */}
      <section className="ts-hero" ref={heroRef} aria-labelledby="ts-h">
        <div className="stage-light" aria-hidden="true" />
        <Suspense fallback={null}>
          <ControlPanelScene
            sectionRef={heroRef}
            doorOpen={doorOpen}
            onToggleDoor={() => setDoorOpen(o => !o)}
          />
        </Suspense>

        <div className="ts-copy">
          <h1 className="ts-h1" id="ts-h">
            <span className="ln"><span>Electrical &amp; Automation</span></span>
            <span className="ln"><span>Control Panels</span></span>
          </h1>
          <p className="ts-lede">
            CPRI-approved (65 kA · IP65), IEC 61439 compliant panels designed, manufactured, and 100% tested before dispatch. Engineered to run for decades.
          </p>
          <div className="ts-ctas">
            <Link className="pill" to="/panel/products">Explore All Panels<Arrow /></Link>
            <Link className="line-btn" to="/panel/contact">Request a Quote</Link>
          </div>
        </div>

        {/* Engineering Specification Badges (spaced cleanly, non-colliding) */}
        <ol className="ts-hud mono" aria-label="Panel standards">
          {SPEC_HIGHLIGHTS.map((s, i) => (
            <li key={s} className={i < step ? 'done' : i === step ? 'run' : ''}>
              <i />{s}
            </li>
          ))}
        </ol>

        {/* Live Incomer Scope & Telemetry HUD */}
        <div className={`ts-scope${step < SPEC_HIGHLIGHTS.length ? '' : ' idle'}`} aria-hidden="true">
          <svg viewBox="0 0 240 72" preserveAspectRatio="none">
            <path className="grid" d="M0 36H240M60 0V72M120 0V72M180 0V72" />
            <g className="phs">{PHASES.map(([c, sh]) => <path key={c} className={`ph ${c}`} d={WAVE(sh)} />)}</g>
          </svg>
          <p className="mono">
            <i className="ok" />
            <b>Incomer: 415 V</b> · 50 Hz · 62 A
          </p>
        </div>
      </section>

      {/* 3.2 Switchgear Categories: 3-Position Industrial Rotary Selector */}
      <section className="ts-modes gut" aria-labelledby="ts-modes-h">
        <div className="wrap ts-modes-in">
          <div className="sel" role="radiogroup" aria-label="Panel category switch">
            <div className="sel-legends">
              {PANEL_SYSTEMS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={i === mode}
                  aria-label={s.name}
                  className={`sel-pos p${i}${i === mode ? ' on' : ''}`}
                  onClick={() => pickMode(i)}
                >
                  <i className="sel-lamp" />{s.pos}
                </button>
              ))}
            </div>
            <svg className="sel-body" viewBox="0 0 240 240" aria-hidden="true">
              <defs>
                <radialGradient id="selBezelPanel" cx="40%" cy="30%" r="80%">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#D9DDE3" />
                </radialGradient>
                <linearGradient id="selKnobPanel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3A3F47" />
                  <stop offset="1" stopColor="#14171C" />
                </linearGradient>
              </defs>
              <circle cx="120" cy="120" r="104" fill="url(#selBezelPanel)" />
              <circle cx="120" cy="120" r="104" fill="none" stroke="rgba(14,17,22,.12)" />
              <circle cx="120" cy="120" r="86" fill="none" stroke="rgba(14,17,22,.08)" strokeDasharray="1 5" />
              <path className="sel-track" d="M46.46 58.3A96 96 0 0 1 193.54 58.3" />
              <path className="sel-arc" d="M46.46 58.3A96 96 0 0 1 193.54 58.3" pathLength={1} style={{ strokeDashoffset: reduce ? 1 - mode / 2 : 1 }} />
              {[-50, 0, 50].map((a, i) => <line key={a} className={i === mode ? 'on' : ''} x1="120" y1="20" x2="120" y2="32" transform={`rotate(${a} 120 120)`} />)}
              <g className="sel-knob" transform={reduce ? `rotate(${-50 + mode * 50} 120 120)` : undefined}>
                <circle cx="120" cy="120" r="62" fill="url(#selKnobPanel)" />
                <circle cx="120" cy="120" r="62" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
                <rect x="108" y="46" width="24" height="148" rx="12" fill="#22262C" stroke="rgba(255,255,255,.1)" />
                <rect x="117" y="52" width="6" height="40" rx="3" fill="#FFFFFF" />
              </g>
            </svg>
          </div>

          <div className="ts-sys" aria-live="polite">
            <h2 id="ts-modes-h">Three specialized divisions.</h2>
            <div className="ts-sys-body" key={sys.id}>
              <h3>{sys.name}</h3>
              <p>{sys.text}</p>
              <ul className="duty">
                {sys.duties.map(([d, t], k) => (
                  <li key={t} className={d} style={{ '--k': k } as CSSProperties}>
                    <i aria-hidden="true" />
                    <span className="sr">{d === 'auto' ? 'Standard: ' : 'Optional: '}</span>{t}
                  </li>
                ))}
              </ul>
              <p className="ts-ref">{sys.ref}</p>
            </div>
            <p className="duty-key" aria-hidden="true">
              <span className="auto"><i />Engineered in-house</span>
              <span className="hand"><i />100% Tested at our works</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3.3 Interactive 3D Control Panel Product Showcase */}
      <PanelShowcase />

      {/* 3.4 Standard Routine Tests for Electrical Panels */}
      <RoutineTests
        title="Routine test suite for electrical panels."
        subtitle="Every switchboard is 100% verified against IEC 61439-1/2 and IS 8623 standards before customer inspection."
        items={PANEL_ROUTINE_TESTS}
      />

      {/* 3.5 Panel Rating Scale & Key Installations */}
      <section className="ts-proj gut" aria-labelledby="ts-proj-h">
        <div className="wrap">
          <div className="sec-head">
            <h2 id="ts-proj-h">In service, up to 6300A / 65 kA.</h2>
            <p>Power control centres, MCCs, and automation systems trusted by municipal corporations and industry.</p>
          </div>
          <div
            ref={scaleRef}
            className="ts-scale"
            style={{ '--n': reduce ? 1 : 0 } as CSSProperties}
            aria-hidden="true"
          >
            <i className="ts-rule" />
            {PANEL_TICKS.map(t => (
              <span key={t} className="ts-tk mono" style={{ left: `${ampsToPos(t)}%` }}>
                {t}{t === 6300 ? ' A' : ''}
              </span>
            ))}
            <i className="ts-needle">
              <em className={`mono${reduce ? ' rest' : ''}`}>{reduce ? '6300 A' : ''}</em>
            </i>
            {PANEL_INSTALLATIONS.map((p, i) => {
              const layout = markLayouts[i] || getDefaultLayout(i, p.amps);
              const pos = ampsToPos(p.amps);
              return (
                <span
                  key={p.id}
                  ref={el => { markRefs.current[i] = el; }}
                  className={`ts-mark ${layout.side} ${layout.align} lvl-${layout.level}`}
                  data-hot={hot === p.id || undefined}
                  style={{ '--x': pos } as CSSProperties}
                >
                  <span className="ts-mark-stem" aria-hidden="true" />
                  <b>{p.client}</b>
                  <em className="mono">{p.rating}</em>
                </span>
              );
            })}
          </div>

          <div className="ts-plates">
            {PANEL_INSTALLATIONS.map(p => (
              <article
                key={p.id}
                className="plate"
                data-hot={hot === p.id || undefined}
                aria-labelledby={`${p.id}-h`}
                onPointerEnter={() => setHot(p.id)}
                onPointerMove={e => tilt(e, 6)}
                onPointerLeave={e => { setHot(null); untilt(e); }}
              >
                <i className="plate-glint" aria-hidden="true" />
                <header>
                  <h3 id={`${p.id}-h`}>{p.client}</h3>
                  <span>{p.system}</span>
                </header>
                <dl className="mono">
                  <div><dt>Rating</dt><dd>{p.rating}</dd></div>
                  <div><dt>Voltage</dt><dd>{p.voltage}</dd></div>
                </dl>
                <ul>{p.scope.map(s => <li key={s}>{s}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
{/* Client  */}
      <Client/>

      {/* CTA Section */}
      <FeederCta id="ts-cta-h" tag="Your Switchboard">
        <a className="line-btn" href={BROCHURE} download>Download Company Profile</a>
        <Link className="pill" to="/panel/contact">Request a Quote<Arrow /></Link>
      </FeederCta>
    </main>
  );
}

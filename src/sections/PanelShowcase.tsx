/**
 * ============================================================================
 * PanelShowcase.tsx — Reusable 3D Control Panel Product Showcase
 * Electrosoft Design System (DESIGN.md)
 * ============================================================================
 * Architecture Overview:
 * - 3D Spatial Coverflow: Projects panel equipment on a virtual cylinder using
 *   3D transforms (translate3d, rotateY, scale, depth falloff, and floor reflections).
 * - Multi-Category Switching: Driven by `RANGE` from `src/data/products.ts`,
 *   enabling seamless exploration of Power, Motor, Energy, and Automation panels.
 * - Physics Drag & Auto-Advance: Smooth scrub with momentum flick, keyboard controls,
 *   and automatic cycling (paused on user interaction or hover).
 * - Engineering Dossier Motion Vocabulary:
 *   Authentic Electrosoft motion vocabulary following DESIGN.md:
 *   1. Paper haze: elements arrive lifted out of page background blur and settle into crisp focus.
 *   2. Meter drum counter: mechanical counter two-digit rolling drums.
 *   3. Rubber stamps: standards badges stamped on with -1.5deg recoil.
 *   4. Title mask: editorial title rises up from an overflow mask.
 *   5. Breakers closing: duty items slide in with hairlines drawing left-to-right and tag flash.
 *   6. Action row: fades up last with zero blur.
 *   7. Telemetry chip: label cross-fade and status-beacon pulse replay.
 *   8. Scope box: 0.5s glowing scan line sweeps across while waves re-tune.
 *   9. Metric cards: 60ms staggered odometer rolls for numbers and vertical drum for ingress.
 *   10. Reference box: glowing scan line sweeps across revealing certified project references.
 * ============================================================================
 */

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';
import { holdScroll } from '../hooks/useSmoothScroll';
import { Arrow } from '../components/ui';

gsap.registerPlugin(ScrollTrigger);

export interface PanelShowcaseItem {
  id: string;
  code: string;
  category: string;
  tabLabel: string;
  name: string;
  sub?: string;
  badge: string;
  img: string;
  current: string;
  withstand: string;
  protection: string;
  voltage: string;
  stds: string;
  ref: string;
  text: string;
  points: string[];
  duties?: [('auto' | 'hand'), string][];
  tests?: string[];
}

/** Default technical metadata database mapping products from `RANGE` in `products.ts` */
export const DEFAULT_PANEL_ITEMS: PanelShowcaseItem[] = [
  {
    id: 'pcc',
    code: 'MOD-PCC-6300A',
    category: 'Power',
    tabLabel: 'PCC',
    name: 'Power Control Centres (PCC)',
    sub: 'Heavy-Duty Main Incomer Switchboards',
    badge: 'UP TO 6300A · 65 kA',
    img: '/img/products/pcc.webp',
    current: '6300 A',
    withstand: '65 kA / 1s',
    protection: 'IP65',
    voltage: '415 V',
    stds: 'CPRI 65kA STC • IEC 61439-1/2 • IS 8623 • Form 4b',
    ref: 'Municipal Corporation of Greater Mumbai (MCGM) · Mithi River Project',
    text: 'Heavy-duty power control centres engineered for continuous industrial service, high fault-level withstand, and comprehensive busbar protection.',
    points: ['CPRI approved 65kA design', 'IP65 protection', 'All necessary protections', 'Draw-Out ACB modules with microprocessor releases'],
    duties: [
      ['auto', 'Form 4b separation with segregated busbar & cable chambers'],
      ['auto', 'Microprocessor ACB releases with LSIG ground-fault protection'],
      ['auto', 'Silver-plated electrolytic copper busbars rated for 50°C'],
      ['hand', 'Safety door interlocks & padlockable feeder handles'],
    ],
    tests: [
      'High Voltage Dielectric Withstand Test (2.5 kV AC for 1 Min)',
      'Measurement of Insulation Resistance (1000V Megger > 100 MΩ)',
      'Verification of Protective Conductor / PE Continuity (< 0.1 Ω)',
      'Mechanical Operation of ACB & Breaker Interlocks',
      'Temperature Rise Verification at 6300A Rated Current',
      'Verification of Clearances and Creepage Distances',
    ],
  },
  {
    id: 'mcc',
    code: 'MOD-MCC-4000A',
    category: 'Motors',
    tabLabel: 'MCC',
    name: 'Motor Control Centres (MCC)',
    sub: 'Intelligent Motor Feeders & Protection',
    badge: 'UP TO 4000A · 50 kA',
    img: '/img/products/mcc.webp',
    current: '4000 A',
    withstand: '50 kA / 1s',
    protection: 'IP55',
    voltage: '415 V',
    stds: 'CPRI 50kA • IEC 61439-1/2 • Type-2 Coordinated',
    ref: 'Municipal Corporation of Gurugram (MCG) · Sewage Treatment Plants',
    text: 'Motor control centres combining motor protection, power distribution, and industrial bus communication in one robust package.',
    points: ['20+ year life cycle', 'CPRI approved 50kA / IP55', 'Intelligent communications: Modbus, Profinet & Ethernet/IP'],
    duties: [
      ['auto', 'Type-2 coordination with thermal-magnetic motor circuit protectors'],
      ['auto', 'Intelligent bus connectivity: Modbus RTU, Profinet & Ethernet/IP'],
      ['auto', 'Individual motor feeder compartmentalization with draw-out ease'],
      ['hand', 'Bilingual status annunciator & localized emergency stop buttons'],
    ],
    tests: [
      'High Voltage Dielectric Test (2.5 kV AC for 1 Min)',
      'Insulation Resistance (1000V Megger > 100 MΩ)',
      'Type-2 Coordination Verification with Motor Starters',
      'Thermal & Magnetic Overload Trip Simulation',
      'Live Logic Simulation & Interlock Verification',
      'Phase Sequence & Operational Indication Check',
    ],
  },
  {
    id: 'plc-scada',
    code: 'MOD-PLC-S71500',
    category: 'Automation',
    tabLabel: 'PLC / SCADA',
    name: 'Plant Automation & PLC / SCADA Panels',
    sub: 'Turnkey Process Automation & Control',
    badge: 'HOT REDUNDANT PLC',
    img: '/img/products/plc-scada.webp',
    current: '250 A',
    withstand: '25 kA / 1s',
    protection: 'IP54',
    voltage: '230V / 24VDC',
    stds: 'IEC 61131-3 • ISA-88/95 • CE Compliant • Cybersecure',
    ref: 'Tata Power Company Limited · 33 kV Remote Substation Automation',
    text: 'Complete plant automation: custom PLC programming, intuitive SCADA supervisory systems, and 24/7 industrial support from an engineering team with 20+ years of experience.',
    points: ['SCADA on Vijeo Citect, WinCC, Wonderware, FactoryTalk View', 'Strong data acquisition and programming', 'Full control and monitoring'],
    duties: [
      ['auto', 'Dual redundant CPU hot standby with bumpless transfer'],
      ['auto', 'High-density optical I/O signal conditioning & surge arrestors'],
      ['auto', 'Custom SCADA mimic screens on WinCC, Vijeo Citect & Wonderware'],
      ['hand', 'Manual override bypass switches for critical process actuators'],
    ],
    tests: [
      'High Voltage Dielectric Withstand Test (1.5 kV AC for 1 Min)',
      'Insulation Resistance (500V Megger > 50 MΩ)',
      'Full Live I/O Loop Simulation & Channel Verification',
      'CPU Redundancy Failover Verification (< 20 ms)',
      'Power Supply Fluctuations & Harmonic Rejection Test',
      'Ethernet / Profinet Network Communication Stability',
    ],
  },
  {
    id: 'vfd',
    code: 'MOD-VFD-500KW',
    category: 'Energy',
    tabLabel: 'VFD Panels',
    name: 'Variable Frequency Drive (VFD) Panels',
    sub: 'Harmonic-Filtered Motor Speed Modulation',
    badge: 'UP TO 500 kW',
    img: '/img/products/vfd.webp',
    current: '1000 A',
    withstand: '50 kA / 1s',
    protection: 'IP54',
    voltage: '415 V',
    stds: 'IEEE 519 Harmonics • IEC 61800-3 • Active Forced Cooling',
    ref: 'Industrial process plants, pumping stations & heavy rotating drives',
    text: 'Custom variable frequency drive panels that match motor speed to torque load, cutting energy consumption and extending mechanical equipment life.',
    points: ['80%+ of industrial electricity is used by motors', 'Custom engineered to your exact application', 'Built-in line chokes & bypass'],
    duties: [
      ['auto', 'Dynamic PID pressure, flow & torque regulation'],
      ['auto', 'Built-in line chokes & passive harmonic mitigation (THDi < 5%)'],
      ['auto', 'Automatic bypass contactor sequence for continuous run'],
      ['hand', 'Door-mounted graphic keypad with parameter backup memory'],
    ],
    tests: [
      'High Voltage Dielectric Test (2.5 kV AC for 1 Min)',
      'Harmonic Distortion Level Verification per IEEE 519',
      'Full Load Thermal Rise Test with Forced Ventilation',
      'Overvoltage, Undervoltage & Phase Loss Trips',
      'Automatic Bypass Contactor Transition Test',
      'VFD Ramp-Up and Braking Resistor Verification',
    ],
  },
  {
    id: 'apfc',
    code: 'MOD-APFC-800KVAR',
    category: 'Energy',
    tabLabel: 'SmartAPFC',
    name: 'SmartAPFC Automatic Power Factor Panels',
    sub: 'Thyristor / Contactor Switched Capacitor Banks',
    badge: '0.999 UNITY PF',
    img: '/img/products/apfc.webp',
    current: '1200 A',
    withstand: '50 kA / 1s',
    protection: 'IP54',
    voltage: '415 V',
    stds: 'IEC 60831-1/2 • Detuned 7% Reactors • 8-Stage Microprocessor',
    ref: 'Continuous manufacturing facilities with guaranteed maximum utility incentive',
    text: 'Fully automatic power factor correction achieving unity power factor with detuned harmonic filter reactors preventing resonance.',
    points: ['8 levels of protection', 'Buzzer alarm', 'Heavy-duty MPP capacitors', 'Guaranteed utility bill incentives'],
    duties: [
      ['auto', 'Microprocessor-controlled 8-stage reactive step switching'],
      ['auto', 'Detuned harmonic filter reactors (7% / 14%) preventing resonance'],
      ['auto', 'Zero-crossing thyristor switching for transient-free engagement'],
      ['hand', 'Individual stage isolation & thermal protection fuse bases'],
    ],
    tests: [
      'Dielectric High Voltage Withstand Test (2.5 kV AC for 1 Min)',
      'Capacitance Value & Tolerance Measurement per Step',
      'Detuned Reactor Inductance & Tuning Frequency Verification',
      'Step-by-Step Microprocessor Automatic Switching Test',
      'Over-Temperature & Capacitor Overpressure Trip Check',
      'Harmonic Current Absorption & Resonance Immunity',
    ],
  },
  {
    id: 'draw-out',
    code: 'MOD-DW-3200A',
    category: 'Power',
    tabLabel: 'Draw-Out MCC',
    name: 'Fully Draw-Out MCC / PCC Switchgear',
    sub: 'Zero-Downtime Cassette Modular Feeders',
    badge: 'ZERO DOWNTIME',
    img: '/img/products/draw-out.webp',
    current: '3200 A',
    withstand: '65 kA / 1s',
    protection: 'IP54',
    voltage: '415 V',
    stds: 'IEC 61439 Form 4b • Interlocked Cassette • Silver Contacts',
    ref: 'Critical continuous process refineries, petrochemicals & pharma facilities',
    text: 'Fully draw-out panels for critical process areas: replace a starter or feeder module in under 3 minutes without isolating main busbar power.',
    points: ['Zero process shutdown for module replacement', 'Engineered for critical continuous plants', 'Form 4b segregation'],
    duties: [
      ['auto', '3-position cassette mechanism: Connected, Test, Disconnected'],
      ['auto', 'Automatic safety shutters isolating busbars upon module withdrawal'],
      ['hand', 'Tool-less feeder swap in under 3 minutes with zero downtime'],
      ['auto', 'Auxiliary control contacts for remote SCADA position telemetry'],
    ],
    tests: [
      'High Voltage Dielectric Withstand Test (2.5 kV AC for 1 Min)',
      'Mechanical Endurance (200 Draw-In / Draw-Out Cycles)',
      'Safety Shutter Automatic Closure & IP20 Touch Proof Check',
      'Contact Resistance Verification across Silver Plated Jaws',
      'Auxiliary Contact Timing and Sequence Verification',
      'Earth Bus Continuity during Module Travel',
    ],
  },
  {
    id: 'control-desk',
    code: 'MOD-DSK-MIMIC',
    category: 'Control',
    tabLabel: 'Control Desk',
    name: 'Operator Control Desks & Mimic Consoles',
    sub: 'Ergonomic Control Room Workstations',
    badge: 'CUSTOM MIMIC',
    img: '/img/products/control-desk.webp',
    current: '63 A',
    withstand: '10 kA / 1s',
    protection: 'IP52',
    voltage: '230V / 24VDC',
    stds: 'ISO 11064 Ergonomics • Laser-Etched Acrylic • Multi-Screen',
    ref: 'Central control rooms, water dispatchers & power generating stations',
    text: 'Control desks with printed acrylic mimic diagrams, modular monitor arms, and tactile industrial controls engineered for operator alertness.',
    points: ['Printed acrylic mimic diagrams', 'Ergonomic industrial layout', 'Integrated annunciators and emergency stops'],
    duties: [
      ['auto', 'LED-illuminated continuous process flow mimic diagram'],
      ['auto', 'Modular monitor arms & structured industrial cabling ducts'],
      ['hand', 'Tactile industrial pushbuttons, joy-sticks & key switches'],
      ['auto', 'Emergency trip mushroom buttons with tamper-evident guards'],
    ],
    tests: [
      'Dielectric Insulation Test (1.5 kV AC for 1 Min)',
      'Ergonomic Sightline & Reach Clearance Check (ISO 11064)',
      'Full Wiring Continuity & Ferruling Inspection',
      'Mimic Lamp Annunciator Group Test',
      'Emergency Stop Hardware Trip Reliability',
      'Cable Trunking Grounding & ESD Dissipation Check',
    ],
  },
  {
    id: 'distribution',
    code: 'MOD-DB-800A',
    category: 'Power',
    tabLabel: 'Distribution',
    name: 'AC & DC Distribution Switchboards',
    sub: 'Sub-Distribution & Auxiliary Power Panels',
    badge: 'UP TO 800A',
    img: '/img/products/distribution.webp',
    current: '800 A',
    withstand: '36 kA / 1s',
    protection: 'IP65',
    voltage: '415V / 220VDC',
    stds: 'IEC 61439-3 • IS 13032 • Compact Modular Design',
    ref: 'Heavy infrastructure, industrial plants & commercial complexes',
    text: 'AC and DC distribution boards engineered with phase-segregated copper comb busbars and integrated surge protection for dependable distribution.',
    points: ['AC & DC distribution configurations', '100% tested before dispatch', 'Modular DIN-rail breaker rows'],
    duties: [
      ['auto', 'Compact modular DIN-rail MCB/RCCB branch distribution'],
      ['auto', 'Phase-segregated copper comb busbars preventing phase flashover'],
      ['hand', 'Transparent polycarbonate inspection doors for quick breaker check'],
      ['auto', 'Integrated surge protective devices (SPD Type 1+2)'],
    ],
    tests: [
      'Dielectric High Voltage Withstand Test (2.5 kV AC for 1 Min)',
      'Insulation Resistance (1000V Megger > 100 MΩ)',
      'Short-Circuit Capacity Check on Branch MCBs',
      'Protective Bonding Continuity Check (< 0.1 Ω)',
      'Enclosure Ingress Protection (IP65) Gasket Seal Test',
      'Terminal Torque & Pull-Out Force Verification',
    ],
  },
];

/* Math helpers */
const mod = (v: number, n: number) => ((v % n) + n) % n;
const ease = (u: number) => u * u * (3 - 2 * u);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Parses a technical spec string into numeric value and engineering unit */
function parseNumeric(val?: string): { num: number; unit: string } {
  if (!val) return { num: 0, unit: '' };
  const match = val.match(/^([\d.]+)\s*(.*)$/);
  if (match) {
    return { num: parseFloat(match[1]) || 0, unit: match[2] || '' };
  }
  return { num: 0, unit: val };
}

interface ImagePreviewProps {
  items: PanelShowcaseItem[];
  activeIdx: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
  onInquire: (item: PanelShowcaseItem) => void;
}

function PanelImagePreview({ items, activeIdx, onClose, onNavigate, onInquire }: ImagePreviewProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const swipeStartX = useRef<number | null>(null);

  const total = items.length;
  const current = items[activeIdx];

  const go = useCallback(
    (delta: number) => {
      onNavigate((activeIdx + delta + total) % total);
    },
    [activeIdx, total, onNavigate]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [go, onClose]);

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
      aria-label={`${current.name} high-definition image preview`}
      onPointerDown={e => { swipeStartX.current = e.clientX; }}
      onPointerUp={e => {
        if (swipeStartX.current !== null && Math.abs(e.clientX - swipeStartX.current) > 50) {
          go(e.clientX < swipeStartX.current ? 1 : -1);
        }
        swipeStartX.current = null;
      }}
    >
      <button type="button" className="vw-bg" aria-label="Close image preview" tabIndex={-1} onClick={onClose} />
      <div className="vw-top vw-ui">
        <span className="mono">
          {String(activeIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} &bull; {current.code}
        </span>
        <button type="button" className="vw-close" onClick={onClose}>
          Close <span aria-hidden="true">Esc</span>
        </button>
      </div>

      <figure className="vw-fig">
        <img
          ref={imgRef}
          key={current.id}
          src={current.img}
          alt={current.name}
          draggable={false}
          style={{ maxHeight: '76vh', objectFit: 'contain' }}
        />
      </figure>

      <div className="vw-bar vw-ui">
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{current.name}</h3>
          <p className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {current.stds} &bull; {current.badge}
          </p>
        </div>
        <button type="button" className="pill" onClick={() => onInquire(current)}>
          Request a Quote &rarr;
        </button>
      </div>

      <nav className="vw-nav vw-ui" aria-label="Preview carousel controls">
        <button type="button" className="vw-btn prev" aria-label="Previous image" onClick={() => go(-1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button type="button" className="vw-btn next" aria-label="Next image" onClick={() => go(1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </nav>
    </div>
  );
}

interface SpecModalProps {
  item: PanelShowcaseItem;
  isOpen: boolean;
  onClose: () => void;
  onInquire: (item: PanelShowcaseItem) => void;
}

function PanelSpecModal({ item, isOpen, onClose, onInquire }: SpecModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`tb-modal-overlay${isOpen ? ' open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="tb-modal-window">
        <div className="tb-modal-head">
          <div>
            <div className="tb-spec-step-tag">{item.code} &bull; TECHNICAL SPECIFICATION</div>
            <h3 id="modal-title" style={{ marginTop: '4px' }}>{item.name}</h3>
          </div>
          <button className="tb-modal-close" type="button" onClick={onClose} aria-label="Close dialog">&times;</button>
        </div>
        <div className="tb-modal-body" style={{ padding: '24px 28px' }}>
          <p style={{ color: 'var(--ink-2)', marginBottom: '18px', fontSize: '15px', lineHeight: 1.6 }}>{item.text}</p>

          <h4 style={{ font: '600 15px var(--f-display)', marginBottom: '12px', color: 'var(--ink)' }}>
            Routine QA &amp; Type-Test Verification Checklist (IEC 61439-1/2, IS 8623):
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {(item.tests ?? [
              'High Voltage Dielectric Withstand Test (2.5 kV AC for 1 Min)',
              'Insulation Resistance (1000V Megger > 100 MΩ)',
              'Continuity of the Protective Circuit (PE < 0.1 Ω)',
              'Mechanical Operation of ACB / MCCB & Door Interlocks',
              'Temperature Rise Verification at Rated Ambient (50°C)',
              'Clearances and Creepage Distances Verification',
            ]).map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#FAFBFC', border: '1px solid var(--line)', borderRadius: '10px', fontSize: '13.5px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="pill" type="button" onClick={() => onInquire(item)}>
              Inquire for this Panel &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CurrentRangeConfig {
  tier: 'low' | 'medium' | 'high' | 'very_high';
  label: string;
  cycles: number;      // Wavelength: higher cycles = shorter wavelength; lower = longer wavelength
  amplitude: number;   // Wave peak height in SVG viewBox (0 to 64)
  speed: number;       // Horizontal phase flow speed
  subLabel: string;
}

export const CURRENT_RANGES: Record<'low' | 'medium' | 'high' | 'very_high', CurrentRangeConfig> = {
  low: {
    tier: 'low',
    label: 'LOW LOAD',
    cycles: 1.5,       // Long wavelength (wide, calm oscillations)
    amplitude: 14,
    speed: 0.05,
    subLabel: 'Low Current (< 500 A)',
  },
  medium: {
    tier: 'medium',
    label: 'MEDIUM LOAD',
    cycles: 2.6,       // Medium standard wavelength
    amplitude: 18,
    speed: 0.07,
    subLabel: 'Medium Current (500 A – 1500 A)',
  },
  high: {
    tier: 'high',
    label: 'HIGH LOAD',
    cycles: 3.8,       // Shorter wavelength
    amplitude: 22,
    speed: 0.088,
    subLabel: 'High Current (1501 A – 4500 A)',
  },
  very_high: {
    tier: 'very_high',
    label: 'VERY HIGH LOAD',
    cycles: 5.2,       // Dense, high-frequency current wavelength
    amplitude: 25,
    speed: 0.105,
    subLabel: 'Very High Current (> 4500 A)',
  },
};

export function getCurrentRange(currentStr: string): CurrentRangeConfig {
  const num = parseFloat(currentStr.replace(/[^0-9.]/g, '')) || 0;
  if (num < 500) return CURRENT_RANGES.low;
  if (num <= 1500) return CURRENT_RANGES.medium;
  if (num <= 4500) return CURRENT_RANGES.high;
  return CURRENT_RANGES.very_high;
}

export interface PanelShowcaseProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  items?: PanelShowcaseItem[];
  showCategoryFilter?: boolean;
  className?: string;
}

const FRICTION = 3.2;   // lower = glides longer, higher = stops sooner
const MAX_THROW = 8;    // max cards a single flick can travel
const FLICK_MIN = 1.2;  // cards/second, below this use the normal snap

/**
 * Reusable Electrical & Automation Control Panels 3D Showcase:
 * Seamlessly integrates with the continuous paper design system and provides
 * interactive 3D coverflow, rubber-band wheel scrub, 4-tier oscilloscope, and technical modals.
 */
export default function PanelShowcase({
  id = 'panel-showcase',
  eyebrow = 'CPRI 65kA & IEC 61439 TYPE TESTED',
  title = 'Our Electrical & Automation Control Panels',
  subtitle = 'Engineered for continuous heavy industrial service, 65 kA short-circuit withstand, and 100% routine tested before certified dispatch.',
  items = DEFAULT_PANEL_ITEMS,
  className = '',
}: PanelShowcaseProps) {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  useCinematic(sectionRef, '.wrap');

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 3-Phase Oscilloscope SVG refs
  const waveRRef = useRef<SVGPathElement>(null);
  const waveYRef = useRef<SVGPathElement>(null);
  const waveBRef = useRef<SVGPathElement>(null);

  const N = items.length;

  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [cadCoord, setCadCoord] = useState('SYS.GEO [X: 0415.0  Y: 0050.0]');

  const activeItem = items[active] ?? items[0];

  // Current rating tier for the oscilloscope waveform
  const targetRange = getCurrentRange(activeItem.current);
  const targetRangeRef = useRef(targetRange);
  targetRangeRef.current = targetRange;

  // Parsed numeric metric values for the active panel item
  const curCurrent = useMemo(() => parseNumeric(activeItem.current), [activeItem.current]);
  const curWithstand = useMemo(() => parseNumeric(activeItem.withstand), [activeItem.withstand]);
  const curVoltage = useMemo(() => parseNumeric(activeItem.voltage), [activeItem.voltage]);

  // Parse standards compliance list
  const standardsList = useMemo(() => {
    if (!activeItem?.stds) return ['IEC 61439', 'IS 8623', 'IP65'];
    return activeItem.stds.split('•').map(s => s.trim()).filter(Boolean);
  }, [activeItem?.stds]);

  // Real-Time 3-Phase Oscilloscope with smooth 4-tier wavelength transitions
  useEffect(() => {
    let wavePhase = 0;
    let animId: number;

    // Smoothly interpolated scope parameters for transition between current ratings
    let currCycles = targetRangeRef.current.cycles;
    let currAmp = targetRangeRef.current.amplitude;
    let currSpeed = targetRangeRef.current.speed;

    const renderWave = () => {
      const tgt = targetRangeRef.current;

      // Exponential continuous lerp towards active current rating tier
      currCycles += (tgt.cycles - currCycles) * 0.055;
      currAmp += (tgt.amplitude - currAmp) * 0.055;
      currSpeed += (tgt.speed - currSpeed) * 0.055;

      wavePhase = (wavePhase + currSpeed) % (Math.PI * 2);

      const makePath = (offset: number) => {
        let d = '';
        for (let x = 0; x <= 360; x += 4) {
          const rad = (x / 360) * (Math.PI * 2 * currCycles) + wavePhase + offset;
          const y = 32 - Math.sin(rad) * currAmp;
          d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
        }
        return d;
      };

      if (waveRRef.current) waveRRef.current.setAttribute('d', makePath(0));
      if (waveYRef.current) waveYRef.current.setAttribute('d', makePath((Math.PI * 2) / 3));
      if (waveBRef.current) waveBRef.current.setAttribute('d', makePath((Math.PI * 4) / 3));

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleInquire = useCallback((item: PanelShowcaseItem) => {
    setPreviewOpen(false);
    setModalOpen(false);
    const messageLines = [
      `Enquiry for: ${item.name} (${item.code})`,
      '',
      'Key Technical Specifications:',
      `- Current Rating: ${item.current}`,
      `- Short-Circuit Withstand: ${item.withstand}`,
      `- Ingress Protection: ${item.protection}`,
      `- Voltage System: ${item.voltage}`,
      `- Standards: ${item.stds}`,
      `- Reference Application: ${item.ref}`,
      '',
      'Please share technical GA drawings, SLD diagrams, and quotation.',
    ];

    const params = new URLSearchParams({
      product: item.id,
      category: 'panel',
      message: messageLines.join('\n'),
    });
    navigate(`/contact?${params.toString()}`);
  }, [navigate]);

  // Interpolated continuous motion state
  const motion = useRef({ pos: 0, target: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const dragRef = useRef({
    isDragging: false,
    dragMoved: false,
    startX: 0,
    startY: 0,
    startPos: 0,
    clickedIdx: -1,
    cardW: 380,
    samples: [] as { t: number; p: number }[],
  });

  const isHoveredRef = useRef(false);
  const userInteractedRef = useRef(false);
  const previewOpenRef = useRef(previewOpen);
  previewOpenRef.current = previewOpen;
  const modalOpenRef = useRef(modalOpen);
  modalOpenRef.current = modalOpen;
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 3D Coverflow Projection Engine with rubber-band elastic curves */
  const renderCards = useCallback((pos: number, syncState = true) => {
    const cardW = dragRef.current.cardW;
    const targetDist = Math.abs(motion.current.target - pos);
    const rubberStretch = Math.min(targetDist * 0.035, 0.08);

    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const o = mod(i - pos + N / 2, N) - N / 2;
      const u = Math.abs(o);
      const s = o < 0 ? -1 : 1;
      const e = ease(Math.min(u, 1));
      const far = Math.max(0, u - 1);

      // Smooth curved hyperbola on the seamless sheet
      const x = s * (e * cardW * 0.68 + far * cardW * 0.38);
      const z = -e * 240 - far * 140;
      const ry = -s * e * 52;
      const baseSc = 1 - 0.12 * e - far * 0.06;
      const sc = u < 0.45 ? baseSc + rubberStretch : baseSc;
      const op = u > 2.8 ? 0 : u > 2.2 ? 1 - (u - 2.2) / 0.6 : 1;

      el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
      el.style.zIndex = String(Math.round(1000 - u * 100));

      const haze = el.querySelector<HTMLElement>('.cf-haze');
      if (haze) haze.style.opacity = clamp(u * 0.45, 0, 0.7).toFixed(3);

      if (u < 0.45) el.classList.add('is-active');
      else el.classList.remove('is-active');
    });

    if (syncState) {
      const curActive = mod(Math.round(pos), N);
      setActive(prev => (prev !== curActive ? curActive : prev));
    }
  }, [N]);

  const measure = useCallback(() => {
    const stg = stageRef.current;
    if (!stg) return;
    const W = stg.clientWidth;
    const H = stg.clientHeight;
    // 1:1 Aspect ratio square card proportion
    const cw = Math.min(Math.max(W * 0.38, 280), Math.min(H * 0.78, 440));
    dragRef.current.cardW = cw;
    itemRefs.current.forEach(el => {
      if (el) el.style.width = `${cw.toFixed(1)}px`;
    });
    renderCards(motion.current.pos);
  }, [renderCards]);

  const resetAutoTimer = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (
        !userInteractedRef.current &&
        !isHoveredRef.current &&
        !dragRef.current.isDragging &&
        !previewOpenRef.current &&
        !modalOpenRef.current &&
        !document.hidden
      ) {
        const dest = Math.round(motion.current.target) + 1;
        motion.current.target = dest;
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(motion.current, {
          pos: dest,
          duration: 0.9,
          ease: 'power3.out',
          onUpdate: () => renderCards(motion.current.pos),
        });
      }
    }, 4500);
  }, [renderCards]);

  /** Smooth navigation with anticipation & rubber-band spring recoil */
  const goTo = useCallback((targetIdx: number) => {
    userInteractedRef.current = true;
    tweenRef.current?.kill();

    const cur = motion.current.pos;
    const d = mod(targetIdx - cur + N / 2, N) - N / 2;
    const dest = cur + d;

    // Immediately update active state so card selection and telemetry react without delay
    const curActive = mod(targetIdx, N);
    setActive(curActive);

    motion.current.target = dest;
    // Anticipation + rubber-band elastic overshoot settling
    tweenRef.current = gsap.to(motion.current, {
      pos: dest,
      duration: 0.85,
      ease: 'back.out(1.45)',
      onUpdate: () => renderCards(motion.current.pos),
      onComplete: () => {
        motion.current.pos = mod(dest, N);
        motion.current.target = mod(dest, N);
        renderCards(motion.current.pos, true);
      },
    });
    resetAutoTimer();
  }, [N, renderCards, resetAutoTimer]);

  // Window resize observer
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Smooth wheel scroll inside cf-container with anticipation & rubber-band snap
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelAccum = 0;
    let isThrottled = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;

      wheelAccum += delta;

      if (!isThrottled && Math.abs(wheelAccum) >= 28) {
        isThrottled = true;
        const step = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;

        const nextTarget = Math.round(motion.current.target) + step;
        goTo(nextTarget);

        setTimeout(() => {
          isThrottled = false;
        }, 220);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [goTo]);

  // Initialize cards at rest
  useLayoutEffect(() => {
    renderCards(0, true);
  }, [renderCards]);

  // Pointer drag listeners with momentum throw velocity sampling
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const cardEl = target.closest<HTMLElement>('.cf-item');
    const idx = cardEl ? Number(cardEl.dataset.idx) : -1;

    dragRef.current.isDragging = true;
    dragRef.current.dragMoved = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startPos = motion.current.pos;
    dragRef.current.clickedIdx = idx;
    dragRef.current.samples = [{ t: performance.now(), p: motion.current.pos }];

    tweenRef.current?.kill();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { /* ignore */ }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const st = stageRef.current;
    if (st) {
      const rect = st.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 1000).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 500).toFixed(1);
      setCadCoord(`SYS.GEO [X: ${x}  Y: ${y}]`);
    }

    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.hypot(dx, dy) > 8) dragRef.current.dragMoved = true;

    if (dragRef.current.dragMoved) {
      const cardW = dragRef.current.cardW;
      const sens = 1.05 / cardW;
      motion.current.pos = dragRef.current.startPos - dx * sens;
      renderCards(motion.current.pos);

      const now = performance.now();
      const s = dragRef.current.samples;
      s.push({ t: now, p: motion.current.pos });
      while (s.length > 2 && now - s[0].t > 100) {
        s.shift();
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }

    // If it was a clean click without dragging:
    if (!dragRef.current.dragMoved) {
      const idx = dragRef.current.clickedIdx;
      if (idx >= 0) {
        goTo(idx);
      }
      return;
    }

    // If dragged and released:
    const s = dragRef.current.samples;
    let v = 0;
    if (s.length >= 2) {
      const first = s[0];
      const last = s[s.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.008) {
        v = clamp((last.p - first.p) / dt, -40, 40);
      }
    }

    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flick = !reduced && Math.abs(v) > FLICK_MIN;
    const throwDist = flick ? clamp(v / FRICTION, -MAX_THROW, MAX_THROW) : 0;
    const from = motion.current.pos;
    const targetPos = Math.round(from + throwDist);
    motion.current.target = targetPos;

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(motion.current, {
      pos: targetPos,
      duration: flick ? clamp(0.7 + Math.abs(targetPos - from) * 0.32, 0.8, 2.6) : 0.7,
      ease: flick ? 'power3.out' : 'back.out(1.45)',
      onUpdate: () => renderCards(motion.current.pos),
      onComplete: () => {
        motion.current.pos = mod(targetPos, N);
        motion.current.target = mod(targetPos, N);
        renderCards(motion.current.pos, true);
      },
    });
    resetAutoTimer();
  };

  // ==========================================================================
  // Engineering Dossier Motion Vocabulary (DESIGN.md)
  // Keyed on activeItem.id, wrapped in gsap.context with full cleanup
  // ==========================================================================
  const isFirstRenderRef = useRef(true);
  const prevActiveRef = useRef(active);
  const prevMetricsRef = useRef({
    current: 6300,
    withstand: 65,
    voltage: 415,
    protection: 'IP65',
  });

  const dossierGridRef = useRef<HTMLDivElement>(null);
  const meterDrumRef = useRef<HTMLSpanElement>(null);
  const meterValRef = useRef<HTMLSpanElement>(null);
  const standardsRef = useRef<HTMLDivElement>(null);
  const titleInnerRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const dutiesListRef = useRef<HTMLUListElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const telemetryBeaconRef = useRef<HTMLSpanElement>(null);
  const telemetryLabelRef = useRef<HTMLSpanElement>(null);
  const scopeScanLineRef = useRef<HTMLDivElement>(null);
  const scopeMetaRef = useRef<HTMLDivElement>(null);
  const metricCurrentNumRef = useRef<HTMLSpanElement>(null);
  const metricCurrentUnitRef = useRef<HTMLElement>(null);
  const metricWithstandNumRef = useRef<HTMLSpanElement>(null);
  const metricWithstandUnitRef = useRef<HTMLElement>(null);
  const ingressDrumRef = useRef<HTMLSpanElement>(null);
  const ingressValRef = useRef<HTMLSpanElement>(null);
  const metricVoltageNumRef = useRef<HTMLSpanElement>(null);
  const metricVoltageUnitRef = useRef<HTMLElement>(null);
  const refScanLineRef = useRef<HTMLDivElement>(null);
  const refTextRef = useRef<HTMLDivElement>(null);
  const dossierTlRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    // 1. Skip on the very first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevActiveRef.current = active;
      prevMetricsRef.current = {
        current: curCurrent.num,
        withstand: curWithstand.num,
        voltage: curVoltage.num,
        protection: activeItem.protection,
      };
      return;
    }

    const prevActive = prevActiveRef.current;
    if (prevActive === active) return;

    // 2. Compute shortest wrap-around travel direction (+1 = forward, -1 = backward)
    const diff = mod(active - prevActive + N / 2, N) - N / 2;
    const dir = diff >= 0 ? 1 : -1;

    // 3. Kill previous timeline and clean up temporary drum clones
    if (dossierTlRef.current) {
      dossierTlRef.current.kill();
      dossierTlRef.current = null;
    }
    meterDrumRef.current?.querySelectorAll('.meter-digit-temp').forEach(el => el.remove());
    ingressDrumRef.current?.querySelectorAll('.ingress-temp').forEach(el => el.remove());

    // Respect prefers-reduced-motion: instant simple 0.15s opacity fade without motion
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (dossierGridRef.current) {
        gsap.fromTo(dossierGridRef.current, { opacity: 0.35 }, { opacity: 1, duration: 0.15, ease: 'none' });
      }
      prevActiveRef.current = active;
      prevMetricsRef.current = {
        current: curCurrent.num,
        withstand: curWithstand.num,
        voltage: curVoltage.num,
        protection: activeItem.protection,
      };
      return;
    }

    const prevMetrics = prevMetricsRef.current;
    const prevActiveNumStr = String(prevActive + 1).padStart(2, '0');

    // 4. Wrap animations in gsap.context for scoped cleanup
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          meterDrumRef.current?.querySelectorAll('.meter-digit-temp').forEach(el => el.remove());
          ingressDrumRef.current?.querySelectorAll('.ingress-temp').forEach(el => el.remove());
          prevActiveRef.current = active;
          prevMetricsRef.current = {
            current: curCurrent.num,
            withstand: curWithstand.num,
            voltage: curVoltage.num,
            protection: activeItem.protection,
          };
        },
      });
      dossierTlRef.current = tl;

      // 1 & 2. Meter Drum Counter: SYSTEM 06 / 08 • ARCHITECTURE
      const meterDrum = meterDrumRef.current;
      const curMeterVal = meterValRef.current;
      if (meterDrum && curMeterVal) {
        const tempOld = document.createElement('span');
        tempOld.className = 'meter-digit-temp';
        tempOld.textContent = prevActiveNumStr;
        tempOld.style.position = 'absolute';
        tempOld.style.top = '0';
        tempOld.style.left = '0';
        tempOld.style.width = '100%';
        meterDrum.appendChild(tempOld);

        if (dir > 0) {
          tl.fromTo(tempOld, { yPercent: 0, opacity: 1 }, { yPercent: -100, opacity: 0, duration: 0.45, ease: 'expo.out' }, 0.05);
          tl.fromTo(curMeterVal, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, 0.05);
        } else {
          tl.fromTo(tempOld, { yPercent: 0, opacity: 1 }, { yPercent: 100, opacity: 0, duration: 0.45, ease: 'expo.out' }, 0.05);
          tl.fromTo(curMeterVal, { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, 0.05);
        }
      }

      // 3. Standards Badges: Rubber stamps press on (staggered 50ms)
      const badges = standardsRef.current?.querySelectorAll<HTMLElement>('.std-badge');
      if (badges && badges.length > 0) {
        tl.fromTo(
          badges,
          { scale: 1.15, opacity: 0, rotate: -1.5 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.38, ease: 'back.out(1.8)', stagger: 0.05 },
          0.05
        );
      }

      // 4. Title Mask & Description Paper Haze
      if (titleInnerRef.current) {
        tl.fromTo(
          titleInnerRef.current,
          { yPercent: 100 },
          { yPercent: 0, duration: 0.52, ease: 'expo.out' },
          0.08
        );
      }
      if (descRef.current) {
        tl.fromTo(
          descRef.current,
          { opacity: 0, filter: 'blur(6px)', y: -8, x: dir * 12 },
          { opacity: 1, filter: 'blur(0px)', y: 0, x: 0, duration: 0.52, ease: 'expo.out' },
          0.16 // 0.08s delay after title starts
        );
      }

      // 5. Duties List: Each row closes like a breaker (staggered 70ms)
      const dutyItems = dutiesListRef.current?.querySelectorAll<HTMLElement>('.duty-item');
      if (dutyItems && dutyItems.length > 0) {
        dutyItems.forEach((row, idx) => {
          const rowTime = 0.2 + idx * 0.07;
          const line = row.querySelector<HTMLElement>('.duty-hairline');
          const tag = row.querySelector<HTMLElement>('.duty-tag');

          tl.fromTo(
            row,
            { x: dir * 12, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.42, ease: 'expo.out' },
            rowTime
          );

          if (line) {
            tl.fromTo(
              line,
              { scaleX: 0 },
              { scaleX: 1, duration: 0.36, ease: 'power2.out' },
              rowTime
            );
          }

          if (tag) {
            tl.fromTo(
              tag,
              { backgroundColor: 'rgba(11, 91, 211, 0.22)' },
              { backgroundColor: '', duration: 0.32, ease: 'power1.out' },
              rowTime + 0.12
            );
          }
        });
      }

      // 6. Action Row: Fade up last with zero blur
      if (actionsRef.current) {
        tl.fromTo(
          actionsRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
          0.42
        );
      }

      // 7. Telemetry Head Chip: Cross-fade label & replay status beacon pulse
      if (telemetryLabelRef.current) {
        tl.fromTo(
          telemetryLabelRef.current,
          { opacity: 0, x: dir * 8 },
          { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' },
          0.05
        );
      }
      if (telemetryBeaconRef.current) {
        tl.fromTo(
          telemetryBeaconRef.current,
          { scale: 1.8, opacity: 0.5 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' },
          0.05
        );
      }

      // 8. Scope Box Scan Line Sweep (0.5s) & Scope Meta Haze
      if (scopeScanLineRef.current) {
        tl.fromTo(
          scopeScanLineRef.current,
          { left: '0%', opacity: 1 },
          { left: '100%', opacity: 0, duration: 0.5, ease: 'power2.inOut' },
          0.05
        );
      }
      if (scopeMetaRef.current) {
        tl.fromTo(
          scopeMetaRef.current,
          { opacity: 0, filter: 'blur(5px)', y: -6, x: dir * 12 },
          { opacity: 1, filter: 'blur(0px)', y: 0, x: 0, duration: 0.45, ease: 'expo.out' },
          0.12
        );
      }

      // 9. Metric Cards: Odometer rolls (staggered 60ms) & Ingress vertical drum
      // 9.1 Current Rating
      const curObj = { val: prevMetrics.current };
      tl.to(
        curObj,
        {
          val: curCurrent.num,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => {
            if (metricCurrentNumRef.current) {
              metricCurrentNumRef.current.textContent = Math.round(curObj.val).toString();
            }
          },
        },
        0.1
      );

      // 9.2 Withstand (STC)
      const wstObj = { val: prevMetrics.withstand };
      tl.to(
        wstObj,
        {
          val: curWithstand.num,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => {
            if (metricWithstandNumRef.current) {
              metricWithstandNumRef.current.textContent = Math.round(wstObj.val).toString();
            }
          },
        },
        0.16
      );

      // 9.3 Ingress Rating Drum Roll
      const ingressDrum = ingressDrumRef.current;
      const curIngressVal = ingressValRef.current;
      if (ingressDrum && curIngressVal) {
        const tempOldIngress = document.createElement('span');
        tempOldIngress.className = 'ingress-temp';
        tempOldIngress.textContent = prevMetrics.protection;
        tempOldIngress.style.position = 'absolute';
        tempOldIngress.style.top = '0';
        tempOldIngress.style.left = '0';
        tempOldIngress.style.width = '100%';
        ingressDrum.appendChild(tempOldIngress);

        if (dir > 0) {
          tl.fromTo(tempOldIngress, { yPercent: 0, opacity: 1 }, { yPercent: -100, opacity: 0, duration: 0.45, ease: 'expo.out' }, 0.22);
          tl.fromTo(curIngressVal, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, 0.22);
        } else {
          tl.fromTo(tempOldIngress, { yPercent: 0, opacity: 1 }, { yPercent: 100, opacity: 0, duration: 0.45, ease: 'expo.out' }, 0.22);
          tl.fromTo(curIngressVal, { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, 0.22);
        }
      }

      // 9.4 System Voltage
      const voltObj = { val: prevMetrics.voltage };
      tl.to(
        voltObj,
        {
          val: curVoltage.num,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => {
            if (metricVoltageNumRef.current) {
              metricVoltageNumRef.current.textContent = Math.round(voltObj.val).toString();
            }
          },
        },
        0.28
      );

      // 9.5 Units fade in after numbers land
      const unitEls = [
        metricCurrentUnitRef.current,
        metricWithstandUnitRef.current,
        metricVoltageUnitRef.current,
      ].filter(Boolean);
      if (unitEls.length > 0) {
        tl.fromTo(
          unitEls,
          { opacity: 0 },
          { opacity: 1, duration: 0.22, ease: 'power2.out' },
          0.62
        );
      }

      // 10. Field Proven Reference: Scan line sweeps (0.45s) revealing text
      if (refScanLineRef.current) {
        tl.fromTo(
          refScanLineRef.current,
          { left: '0%', opacity: 1 },
          { left: '100%', opacity: 0, duration: 0.45, ease: 'power2.inOut' },
          0.1
        );
      }
      if (refTextRef.current) {
        tl.fromTo(
          refTextRef.current,
          { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.75 },
          { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.45, ease: 'power2.inOut' },
          0.1
        );
      }
    }, dossierGridRef);

    return () => {
      ctx.revert();
      meterDrumRef.current?.querySelectorAll('.meter-digit-temp').forEach(el => el.remove());
      ingressDrumRef.current?.querySelectorAll('.ingress-temp').forEach(el => el.remove());
    };
  }, [activeItem.id, active, N, curCurrent, curWithstand, curVoltage]);

  return (
    <section id={id} ref={sectionRef} className={`ts gut ${className}`} aria-labelledby={`${id}-h`}>
      <div className="wrap">
        {/* Section Header */}
        <header className="sec-head">
          <div>
            <div className="eyebrow">
              <span className="status-beacon" />
              <span>{eyebrow}</span>
            </div>
            <h2 id={`${id}-h`}>{title}</h2>
          </div>
          <p>{subtitle}</p>
        </header>

        {/* 3D Blueprint Stage */}
        <div
          ref={containerRef}
          className="cf-container"
          data-lenis-prevent
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Interactive 3D Control Panel Showcase"
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; }}
        >
          <div className="blueprint-backdrop" />
          <div className="studio-light-pool" />

          {/* CAD HUD Telemetry Coordinates */}
          <div className="cad-hud">
            <span style={{ display: 'none' }} className="cad-pill">{cadCoord}</span>
            <div className="cad-hud-group">
              <span className="cad-pill">IEC 61439 &bull; IS 8623</span>
              <span className="cad-pill" style={{ color: 'var(--brand)', fontWeight: 600 }}>CPRI 65kA</span>
            </div>
          </div>

          {/* 3D Stage Track */}
          <div
            className="cf-stage"
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                ref={el => { itemRefs.current[i] = el; }}
                className={`cf-item${i === active ? ' is-active' : ''}`}
                data-idx={i}
                onPointerDown={() => {
                  dragRef.current.clickedIdx = i;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              >
                <div className="cf-card">
                  {/* Card Header Phase Dots */}
                  <div className="cf-card-header">
                    <div className="cf-phase-indicator">
                      <span className="phase-dot r" />
                      <span className="phase-dot y" />
                      <span className="phase-dot b" />
                    </div>
                  </div>

                  {/* Corner Viewfinder Brackets */}
                  <div className="cf-viewfinder">
                    <i className="vf-bracket tl" />
                    <i className="vf-bracket tr" />
                    <i className="vf-bracket bl" />
                    <i className="vf-bracket br" />
                  </div>

                  {/* Clean 1:1 Aspect Ratio Equipment Photo */}
                  <div className="cf-card-body">
                    <img src={item.img} alt={item.name} loading="eager" decoding="async" draggable={false} />
                  </div>

                  {/* Card Bottom Bezel Caption */}
                  <div className="cf-cap">
                    <div className="cf-cap-title">{item.name}</div>
                    <span className="cf-cap-rating">{item.badge}</span>
                  </div>

                  {/* Depth Haze */}
                  <div className="cf-haze" />
                </div>

                {/* Soft Floor Shadow */}
                <div className="cf-ground-shadow" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="cf-nav-bar">
          <button type="button" className="cf-nav-btn" aria-label="Previous panel" onClick={() => goTo(active - 1)}>
            <svg viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="cf-dots">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`cf-dot${i === active ? ' active' : ''}`}
                aria-label={`Jump to panel ${i + 1}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <button type="button" className="cf-nav-btn" aria-label="Next panel" onClick={() => goTo(active + 1)}>
            <svg viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* 2-Column Technical Dossier & Telemetry Grid */}
        <div className="cf-dossier-grid" ref={dossierGridRef}>
          {/* Left Column: Narrative, Duties, CTA */}
          <div className="dossier-narrative">
            <div className="dossier-meta">
              <span className="mono-tag">
                SYSTEM{' '}
                <span className="meter-drum" ref={meterDrumRef}>
                  <span className="meter-drum-val" ref={meterValRef}>
                    {String(active + 1).padStart(2, '0')}
                  </span>
                </span>
                {' '} / {String(N).padStart(2, '0')} &bull; ARCHITECTURE
              </span>
              <div className="standard-compliance-list" ref={standardsRef}>
                {standardsList.map(std => (
                  <span key={std} className="std-badge">{std}</span>
                ))}
              </div>
            </div>

            <h3 className="dossier-title">
              <span className="title-mask">
                <span className="title-inner" ref={titleInnerRef}>{activeItem.name}</span>
              </span>
            </h3>
            <p className="dossier-desc" ref={descRef}>{activeItem.text}</p>

            {/* Duties Breakdown */}
            <div className="duties-block">
              <div className="duties-title">Automated vs Operator Scope of Duty</div>
              <ul className="duties-list" ref={dutiesListRef}>
                {(activeItem.duties ?? activeItem.points.map(p => ['auto', p] as [('auto' | 'hand'), string])).map(([type, desc], idx) => (
                  <li key={idx} className="duty-item">
                    <span className={`duty-tag ${type}`}>[{type.toUpperCase()}]</span>
                    <span className="duty-desc">{desc}</span>
                    <span className="duty-hairline" />
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Row */}
            <div className="dossier-actions" ref={actionsRef}>
              <button type="button" className="pill" onClick={() => handleInquire(activeItem)}>
                <span>Request a Quote for this Panel</span>
                <Arrow />
              </button>
              <button type="button" className="ghost-link" onClick={() => setModalOpen(true)}>
                <span>View Routine Test Plan</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column: Live Telemetry & 4-Tier Real-Time Oscilloscope HUD */}
          <div className="dossier-telemetry">
            <div className="telemetry-head">
              <span className="telemetry-title">FLOOR TELEMETRY &bull; STATUS MONITOR</span>
              <span className="telemetry-live-chip">
                <span className="status-beacon" ref={telemetryBeaconRef} />
                <span className="telemetry-chip-label" ref={telemetryLabelRef}>{targetRange.label}</span>
              </span>
            </div>

            {/* Real-Time Oscilloscope Waveform with Dynamic Wavelength */}
            <div className="scope-box">
              <div className="scope-scan-line" ref={scopeScanLineRef} />
              <div className="scope-grid-bg" />
              <svg className="scope-svg" viewBox="0 0 360 64" preserveAspectRatio="none">
                <path ref={waveRRef} stroke="var(--r)" strokeWidth="1.8" fill="none" opacity="0.9" />
                <path ref={waveYRef} stroke="var(--y)" strokeWidth="1.8" fill="none" opacity="0.9" />
                <path ref={waveBRef} stroke="var(--b)" strokeWidth="1.8" fill="none" opacity="0.9" />
              </svg>
              <div className="scope-meta" ref={scopeMetaRef}>
                <span>RYB 3-PHASE BALANCE &bull; {targetRange.subLabel}</span>
                <span>50.0 Hz &bull; {activeItem.voltage.includes('/') ? activeItem.voltage.split('/')[0].trim() : activeItem.voltage}</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">CURRENT RATING</div>
                <div className="metric-value">
                  <span className="metric-num" ref={metricCurrentNumRef}>{curCurrent.num}</span>
                  <em className="metric-unit" ref={metricCurrentUnitRef}> {curCurrent.unit}</em>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">WITHSTAND (STC)</div>
                <div className="metric-value">
                  <span className="metric-num" ref={metricWithstandNumRef}>{curWithstand.num}</span>
                  <em className="metric-unit" ref={metricWithstandUnitRef}> {curWithstand.unit}</em>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">INGRESS RATING</div>
                <div className="metric-value">
                  <span className="drum-mask" ref={ingressDrumRef}>
                    <span className="ingress-val" ref={ingressValRef}>{activeItem.protection}</span>
                  </span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">SYSTEM VOLTAGE</div>
                <div className="metric-value">
                  <span className="metric-num" ref={metricVoltageNumRef}>{curVoltage.num}</span>
                  <em className="metric-unit" ref={metricVoltageUnitRef}>
                    {curVoltage.unit.startsWith('/') ? curVoltage.unit : ` ${curVoltage.unit}`}
                  </em>
                </div>
              </div>
            </div>

            {/* Verified Field Reference */}
            <div className="reference-box">
              <div className="ref-eyebrow">FIELD PROVEN REFERENCE</div>
              <div className="ref-text-wrapper">
                <div className="ref-scan-line" ref={refScanLineRef} />
                <div className="ref-text" ref={refTextRef}>{activeItem.ref}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Definition Image Preview Dialog */}
      {previewOpen && (
        <PanelImagePreview
          items={items}
          activeIdx={active}
          onClose={() => setPreviewOpen(false)}
          onNavigate={idx => {
            goTo(idx);
          }}
          onInquire={handleInquire}
        />
      )}

      {/* Routine Tests & Engineering Spec Modal */}
      <PanelSpecModal
        item={activeItem}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onInquire={handleInquire}
      />
    </section>
  );
}

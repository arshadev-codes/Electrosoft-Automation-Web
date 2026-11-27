/**
 * §1.7 Why choose Electrosoft — scroll-pinned engineering drawing.
 *
 * One drawing sheet (left) + four revision cards (right).
 * Section is PINNED; one scrubbed GSAP timeline draws the sheet chapter by chapter:
 *   A  Quality Assurance      – test bench, three leads draw one-by-one, QA badges + rubber stamp
 *   B  Timely Delivery        – order-to-dispatch schedule: week scale, milestones, Gantt bars that fill
 *                               as a "now" playhead sweeps across, hourglass runs out, clock turns, date locks
 *   C  Competitive Pricing    – price-vs-spec direct manufacturer efficiency curve
 *   D  Online Order Tracking  – factory -> truck drives along route -> customer door + digital live tracker
 *
 * The engineering title block is now full width (edge to edge of the drawing frame) and doubles as a
 * 4-lamp stage annunciator that lights up as you scroll.
 */

import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Timeline layout (units of the master timeline) ─────────────────── */
/** Start time of each chapter. B is intentionally the longest — it carries the most animation. */
const CH = [0, 1.2, 3.4, 4.8] as const;
const TOTAL = 6.6;
/** Resting positions (as scroll progress 0-1) where each chapter is fully drawn. */
const SNAP = [1.15, 3.35, 4.75, 6.55].map((v) => v / TOTAL);
/** Pixels of scroll the pinned section consumes (longer = slower, calmer animation). */
const SCROLL_LENGTH = '+=760%';

/* ─── Chapter B geometry ─────────────────────────────────────────────── */
const RAIL_Y = 200;
const RAIL_X0 = 90;
const RAIL_X1 = 710;
const PH0 = 1.9; // playhead start time
const PHD = 1.2; // playhead duration
const tAt = (x: number) => PH0 + ((x - RAIL_X0) / (RAIL_X1 - RAIL_X0)) * PHD;

const MILESTONES = [
  { cx: 140, n: '01', title: 'Design Freeze', sub: 'Schematic & BOM Lock', green: false },
  { cx: 310, n: '02', title: 'In-House Bays', sub: 'Sheet Metal & Wiring', green: false },
  { cx: 480, n: '03', title: '100% FAT Suite', sub: 'Automated Verification', green: false },
  { cx: 650, n: '04', title: 'Certified Dispatch', sub: 'On-Schedule Handover', green: true },
];

const BARS = [
  { x: 90, w: 110, y: 242, label: 'Design Freeze', green: false },
  { x: 160, w: 210, y: 264, label: 'Fabrication & Wiring', green: false },
  { x: 330, w: 210, y: 286, label: 'Routine Test & FAT', green: false },
  { x: 500, w: 210, y: 308, label: 'Dispatch & Handover', green: true },
];

/** 21 scale ticks across the rail, every 5th one is a major tick. */
const TICKS = Array.from({ length: 21 }, (_, i) => {
  const x = RAIL_X0 + i * 31;
  return `M${x} ${RAIL_Y}V${RAIL_Y + (i % 5 === 0 ? 12 : 6)}`;
}).join('');

/* ─── Title block data ───────────────────────────────────────────────── */
const LAMP_CELLS = [
  { x: 30, title: 'REV A · QA PROTOCOL', done: 'Verified' },
  { x: 215, title: 'REV B · IN-HOUSE BAY', done: 'Scheduled' },
  { x: 400, title: 'REV C · DIRECT VALUE', done: 'Optimized' },
  { x: 585, title: 'REV D · LIVE TRACKER', done: 'Dispatched' },
];

/* ─── Static Data: 4 Engineering Pillars ────────────────────────────── */
interface Row {
  rev: string;
  name: string;
  chip: string;
  lead: string;
  points: string[];
  cta?: { text: string; to: string };
}

const ROWS: Row[] = [
  {
    rev: 'A',
    name: 'Quality Assurance',
    chip: '3-Tier QA Protocol',
    lead: 'Every test system and control desk undergoes exhaustive pre-dispatch validation.',
    points: [
      '100% routine FAT testing before factory handover',
      'CPRI & IEC compliant busbar clearances and thermal boundaries',
      'Traceable calibration certificates provided with every unit',
    ],
  },
  {
    rev: 'B',
    name: 'Timely Delivery',
    chip: 'In-House Execution',
    lead: 'Zero dependency on outside contractors guarantees locked handover dates.',
    points: [
      'Complete in-house sheet fabrication, assembly, wiring & testing bays',
      'Pre-engineered modular schematics & buffered core component stock',
      'Strict milestone schedule tracking from design freeze to dispatch',
    ],
  },
  {
    rev: 'C',
    name: 'Competitive Pricing',
    chip: 'Direct Factory Value',
    lead: 'Direct OEM manufacturer pricing with zero intermediary markups.',
    points: [
      'Standardized modular architecture cuts non-recurring engineering costs',
      'Optimized BOM delivers higher technical specs within your budget',
      'Low total cost of ownership with industrial-grade CPRI switchgear',
    ],
  },
  {
    rev: 'D',
    name: 'Online Order Tracking',
    chip: 'UpComing',
    lead: 'Real-time visibility into your panel build with digital document access.',
    points: [
      'Track project progress from design approval to factory testing',
      'Instant access to approved schematics, BOM, and test certificates',
      'Live dispatch milestones with carrier vehicle tracking',
    ],
    cta: { text: 'Track your order ›', to: '/track' },
  },
];

/* ─── SVG Drawing: pure markup, pathLength={1} for smooth draw-on ─────── */
const WhySVG = memo(function WhySVG({ svgRef }: { svgRef: RefObject<SVGSVGElement > }) {
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 570"
      className="why-svg"
      role="img"
      aria-label="An engineering blueprint drawing that draws itself as you scroll: quality assurance, timely delivery milestones, competitive pricing and online order tracking"
    >
      <defs>
        <pattern id="why-g" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#EEF0F3" />
        </pattern>
      </defs>

      {/* Sheet border */}
      <rect x="16" y="16" width="768" height="538" fill="none" stroke="#0E1116" strokeWidth="2.5" />
      <rect x="30" y="30" width="740" height="510" fill="url(#why-g)" stroke="#DCDFE4" />

      {/* ═══════════════════════════════════════════════════════════════
          s0 · A · Quality: test bench, transformer, leads, QA, stamp
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s0">
        {/* Revision triangle */}
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z" />
          <text className="why-tl" x="80" y="86">A</text>
        </g>

        <g className="why-ink">
          {/* Floor line */}
          <path className="why-dr" pathLength={1} d="M60 380H740" />
          {/* Two-door test panel */}
          <path className="why-dr" pathLength={1} d="M70 130h130v242h-130zM135 130V372M66 372H204V380H66z" />
          <circle className="why-dr" pathLength={1} cx="95" cy="122" r="5" />
          <circle className="why-dr" pathLength={1} cx="175" cy="122" r="5" />
          <circle className="why-dr" pathLength={1} cx="85" cy="158" r="5" />
          <circle className="why-dr" pathLength={1} cx="98" cy="158" r="5" />
          <circle className="why-dr" pathLength={1} cx="111" cy="158" r="5" />
          <path className="why-dr" pathLength={1} d="M78 182h22v22h-22zM108 182h22v22h-22zM78 204L100 182M108 204L130 182" />
          <circle className="why-dr" pathLength={1} cx="158" cy="165" r="8" />
          <circle className="why-dr" pathLength={1} cx="182" cy="165" r="8" />
          <path className="why-dr" pathLength={1} d="M126 250v34M144 250v34" />
          <path className="why-dr" pathLength={1} d="M82 335h44v26h-44zM88 341h32M88 348h32M88 355h32M144 335h44v26h-44zM150 341h32M150 348h32M150 355h32" />
          {/* Test console */}
          <path className="why-dr" pathLength={1} d="M215 150h140v112h-140z" />
          <path className="why-dr" pathLength={1} d="M225 160h60v44h-60zM231 190q6-14 12 0t12 0t12 0" />
          <path className="why-dr" pathLength={1} d="M294 160h18v14h-18zM316 160h18v14h-18zM338 160h12v14h-12zM294 182h18v14h-18zM316 182h18v14h-18zM338 182h12v14h-12z" />
          <path className="why-dr" pathLength={1} d="M215 262l-6 22h154l-6-22" />
          <circle className="why-dr" pathLength={1} cx="232" cy="274" r="4" />
          <circle className="why-dr" pathLength={1} cx="246" cy="274" r="4" />
          <circle className="why-dr" pathLength={1} cx="260" cy="274" r="4" />
          <circle className="why-dr" pathLength={1} cx="274" cy="274" r="4" />
          <circle className="why-dr" pathLength={1} cx="338" cy="274" r="6" />
          <path className="why-dr" pathLength={1} d="M222 284h126v96h-126zM285 284V380M278 320v22M292 320v22M298 352h38v18h-38z" />
          {/* Wheeled transformer */}
          <path className="why-dr" pathLength={1} d="M515 215h200v125h-200zM510 203h210v12h-210zM520 340h190v12h-190z" />
          <path className="why-dr" pathLength={1} d="M541 225V332M555 225V332M569 225V332M583 225V332M597 225V332M611 225V332M625 225V332M639 225V332M653 225V332M667 225V332M681 225V332M695 225V332" />
          {/* 3 Bushing stubs */}
          <path className="why-dr" pathLength={1} d="M548 173h14v30h-14zM588 173h14v30h-14zM628 173h14v30h-14zM544 183h22M544 191h22M584 183h22M584 191h22M624 183h22M624 191h22" />
          {/* Conservator */}
          <path className="why-dr" pathLength={1} d="M645 142h75a12 12 0 0 1 0 24h-75a12 12 0 0 1 0-24zM690 166V203" />
          {/* Wheels */}
          <circle className="why-dr" pathLength={1} cx="545" cy="371" r="9" />
          <circle className="why-dr" pathLength={1} cx="685" cy="371" r="9" />
        </g>

        {/* 3-Phase R/Y/B leads – drawn one by one */}
        <path className="why-wr" pathLength={1} style={{ fill: 'none', stroke: 'var(--r)', strokeWidth: 3, strokeLinecap: 'round' }} d="M355 205C440 205 470 135 555 173" />
        <path className="why-wr" pathLength={1} style={{ fill: 'none', stroke: 'var(--y)', strokeWidth: 3, strokeLinecap: 'round' }} d="M355 215C450 215 520 125 595 173" />
        <path className="why-wr" pathLength={1} style={{ fill: 'none', stroke: 'var(--b)', strokeWidth: 3, strokeLinecap: 'round' }} d="M355 225C460 225 570 120 635 173" />

        {/* Terminal connection points */}
        <circle className="why-tp" cx="555" cy="173" r="4" style={{ fill: 'var(--r)' }} />
        <circle className="why-tp" cx="595" cy="173" r="4" style={{ fill: 'var(--y)' }} />
        <circle className="why-tp" cx="635" cy="173" r="4" style={{ fill: 'var(--b)' }} />

        {/* QA verification check badges */}
        <g className="why-okc">
          <circle className="why-bg" pathLength={1} cx="135" cy="95" r="14" />
          <circle className="why-bg" pathLength={1} cx="285" cy="95" r="14" />
          <circle className="why-bg" pathLength={1} cx="615" cy="95" r="14" />
          <path className="why-bg" pathLength={1} d="M128 95l5 6 9-11M278 95l5 6 9-11M608 95l5 6 9-11" />
        </g>

        {/* Quality rubber stamp */}
        <g id="why-stamp">
          <circle className="why-brand" cx="420" cy="95" r="39" strokeWidth="3" />
          <circle className="why-brand" cx="420" cy="95" r="34" strokeWidth="1.5" />
          <text className="why-t" x="420" y="93" textAnchor="middle" style={{ fill: 'var(--brand)', fontSize: 8, fontWeight: 700 }}>QA VERIFIED</text>
          <text className="why-m" x="420" y="105" textAnchor="middle" style={{ fill: 'var(--brand)', fontWeight: 600 ,fontSize: 8,}}>100% FAT PASS</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          s1 · B · Timely delivery
          Order → dispatch schedule. A red "now" playhead sweeps the rail while
          Gantt bars fill, the hourglass drains and the clock turns.
          (Uses why-xd = draw-on strokes, why-xf = fade-in items.)
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s1">
        {/* Revision triangle (always visible once the scene is) */}
        <g>
          <path className="why-tri" d="M80 64l14 26H66z" />
          <text className="why-tl" x="80" y="86">B</text>
        </g>

        {/* Milestone cards */}
        {MILESTONES.map((m, k) => {
          const x = m.cx - 65;
          const accent = m.green ? '#1FAE4B' : '#0B5BD3';
          return (
            <g key={m.n} id={`why-ms-${k}`} className="why-ms why-xf">
              <rect x={x} y="96" width="130" height="70" rx="8" fill="#fff" stroke={m.green ? '#30D158' : '#DCDFE4'} strokeWidth="1.5" />
              <path d={`M${x} 118V104a8 8 0 0 1 8-8H${x + 122}a8 8 0 0 1 8 8V118Z`} fill={m.green ? '#E8F9ED' : '#F4F6F9'} />
              <circle cx={x + 16} cy="107" r="3.5" fill={accent} />
              <text x={x + 26} y="110.5" style={{ fontSize: 9, fontWeight: 700, fill: accent, textAnchor: 'start', letterSpacing: '0.04em' }} className="why-m">
                MILESTONE {m.n}
              </text>
              <text x={m.cx} y="139" className="why-b" style={{ fontSize: 12.5, textAnchor: 'middle' }}>{m.title}</text>
              <text x={m.cx} y="155" className="why-m" style={{ fontSize: 9, textAnchor: 'middle' }}>{m.sub}</text>
            </g>
          );
        })}

        {/* Stems from cards to rail */}
        {MILESTONES.map((m) => (
          <path key={m.n} className="why-xd why-b-stem" pathLength={1} d={`M${m.cx} 166V${RAIL_Y - 8}`} fill="none" stroke="#0E1116" strokeWidth="1.5" />
        ))}

        {/* Base rail + scale ticks */}
        <path id="why-b-rail" className="why-xd" pathLength={1} d={`M${RAIL_X0} ${RAIL_Y}H${RAIL_X1}`} fill="none" stroke="#0E1116" strokeWidth="2" strokeLinecap="round" />
        <path id="why-b-ticks" className="why-xd" pathLength={1} d={TICKS} fill="none" stroke="#5B6472" strokeWidth="1.2" />

        {/* Blue elapsed-time track (draws with the playhead) */}
        <path id="why-b-track" className="why-xd" pathLength={1} d={`M${RAIL_X0} ${RAIL_Y}H${RAIL_X1}`} fill="none" stroke="#0B5BD3" strokeWidth="4.5" strokeLinecap="round" />

        {/* Scale end labels */}
        <text className="why-m why-xf why-b-lbl" x={RAIL_X0} y="226" style={{ fontSize: 9, fontWeight: 600, textAnchor: 'start' }}>T0 · ORDER CONFIRMED</text>
        <text className="why-m why-xf why-b-lbl" x={RAIL_X1} y="226" style={{ fontSize: 9, fontWeight: 600, textAnchor: 'end' }}>T+N · COMMITTED DISPATCH DATE</text>

        {/* Milestone grid guides */}
        {MILESTONES.map((m) => (
          <path key={m.n} className="why-xf why-b-guide" d={`M${m.cx} 234V330`} fill="none" stroke="#C3CFE6" strokeWidth="1" strokeDasharray="3 4" />
        ))}

        {/* Milestone nodes */}
        {MILESTONES.map((m, k) => (
          <circle key={m.n} id={`why-bn-${k}`} className="why-xf why-b-node" cx={m.cx} cy={RAIL_Y} r="8" fill="#fff" stroke="#0B5BD3" strokeWidth="2.5" />
        ))}

        {/* Gantt: dashed track + filling bar + label */}
        {BARS.map((b, k) => (
          <g key={b.label}>
            <rect className="why-xf why-bar-trk" x={b.x} y={b.y} width={b.w} height="16" rx="3" fill="none" stroke="#B7C7E8" strokeWidth="1" strokeDasharray="3 3" />
            <rect className="why-bar" id={`why-bar-${k}`} x={b.x} y={b.y} width={b.w} height="16" rx="3"
              fill={b.green ? '#CDEFD8' : '#CFE0FB'} stroke={b.green ? '#30D158' : '#0B5BD3'} strokeWidth="1.2" />
            <text className="why-b why-xf why-bar-lbl" x={b.x + 8} y={b.y + 11.5} style={{ fontSize: 9.5, textAnchor: 'start', fill: '#0E1116' }}>
              {b.label}
            </text>
          </g>
        ))}

        {/* "Now" playhead */}
        <g id="why-ph" className="why-xf">
          <path d="M0 184V330" stroke="#E5484D" strokeWidth="1.6" fill="none" />
          <path d="M-6 176L0 170L6 176L0 182Z" fill="#E5484D" />
        </g>

        {/* Hourglass */}
        <g>
          <path className="why-xf why-hg-fill" d="M96 340V350Q96 362 116 366Q96 370 96 382V392H136V382Q136 370 116 366Q136 362 136 350V340Z" fill="#F4F6F9" />
          <path id="why-sand-top" className="why-xf" d="M100 351H132Q128 360 116 364Q104 360 100 351Z" fill="#E9A93B" />
          <path id="why-sand-bot" className="why-xf" d="M101 391H131Q126 382 116 377Q106 382 101 391Z" fill="#E9A93B" />
          <path id="why-stream" d="M116 365V389" fill="none" stroke="#E9A93B" strokeWidth="1.6" strokeDasharray="2 3" />
          <path className="why-xd" pathLength={1} d="M90 340H142M90 392H142" fill="none" stroke="#0E1116" strokeWidth="2.4" strokeLinecap="round" />
          <path className="why-xd" pathLength={1} d="M96 340V350Q96 362 116 366Q96 370 96 382V392M136 340V350Q136 362 116 366Q136 370 136 382V392" fill="none" stroke="#0E1116" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Operational guarantee badges */}
        <g className="why-xf why-b-badge">
          <rect x="156" y="342" width="216" height="48" rx="8" fill="#fff" stroke="#0B5BD3" strokeWidth="1.5" />
          <circle cx="178" cy="366" r="6" fill="#0B5BD3" />
          <text x="194" y="359" style={{ font: '600 12px var(--f-body)', fill: '#0E1116', textAnchor: 'start' }}>100% In-House Bays</text>
          <text x="194" y="377" style={{ font: '400 9.5px var(--f-mono)', fill: '#5B6472', textAnchor: 'start' }}>Zero subcontractor delays</text>
        </g>
        <g className="why-xf why-b-badge">
          <rect x="384" y="342" width="216" height="48" rx="8" fill="#fff" stroke="#30D158" strokeWidth="1.5" />
          <circle cx="406" cy="366" r="6" fill="#30D158" />
          <text x="422" y="359" style={{ font: '600 12px var(--f-body)', fill: '#0E1116', textAnchor: 'start' }}>Milestone Schedule</text>
          <text x="422" y="377" style={{ font: '400 9.5px var(--f-mono)', fill: '#5B6472', textAnchor: 'start' }}>Locked FAT delivery date</text>
        </g>

        {/* Clock */}
        <circle id="why-clk-ring" className="why-xd" pathLength={1} cx="640" cy="366" r="24" fill="none" stroke="#0E1116" strokeWidth="2.2" />
        <g id="why-clk-face" className="why-xf">
          <circle cx="640" cy="366" r="23" fill="#fff" />
          <path d="M640 345v4M661 366h-4M640 387v-4M619 366h4" stroke="#0E1116" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path id="why-hh" d="M0 0V-12" stroke="#0E1116" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path id="why-mh" d="M0 0V-18" stroke="#0B5BD3" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="640" cy="366" r="2.4" fill="#0E1116" />
        </g>
        <g id="why-clk-lbl" className="why-xf">
          <text className="why-b" x="674" y="363" style={{ fontSize: 10, textAnchor: 'start', fill: '#1FAE4B' }}>DISPATCH</text>
          <text className="why-b" x="674" y="377" style={{ fontSize: 10, textAnchor: 'start', fill: '#1FAE4B' }}>DATE LOCKED</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          s2 · C · Competitive pricing: Direct Factory Value vs Market
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s2">
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z" />
          <text className="why-tl" x="80" y="86">C</text>
        </g>
        {/* Axes */}
        <g className="why-ink">
          <path className="why-dr" pathLength={1} d="M150 350V112M144 122L150 110L156 122M150 350H682M672 344L682 350L672 356" />
        </g>
        {/* Typical market curve (grey): climbs early, then flattens out */}
        <path className="why-dr" pathLength={1} style={{ fill: 'none', stroke: 'var(--faint)', strokeWidth: 3, strokeLinecap: 'round' }} d="M170 330 Q330 240 660 216" />
        {/* Electrosoft curve (brand blue): steady climb */}
        <path className="why-dr" pathLength={1} style={{ fill: 'none', stroke: 'var(--brand)', strokeWidth: 3.5, strokeLinecap: 'round' }} d="M170 330 L520 120" />
        {/* Dashed comparison line at x=470 */}
        <path className="why-fd" d="M470 350V150" fill="none" stroke="#AFA3A3" strokeWidth="1.6" strokeDasharray="4 5" />
        {/* Bracket showing higher spec difference */}
        <g className="why-ink">
          <path className="why-dr" pathLength={1} d="M482 149h8V238h-8" />
        </g>
        <g className="why-fd">
          <circle cx="470" cy="238" r="5" fill="#fff" stroke="#160E0E" strokeWidth="2" />
          <circle cx="470" cy="150" r="5" fill="var(--brand)" />
          <circle cx="660" cy="216" r="4" fill="var(--faint)" />
          <circle cx="520" cy="120" r="4" fill="var(--brand)" />
          <text className="why-b" x="502" y="188" style={{ fill: 'var(--brand)', textAnchor: 'start' }}>Direct Factory Value</text>
          <text className="why-m" x="502" y="204" style={{ textAnchor: 'start', fontSize: 10 }}>Higher spec · same budget</text>
          <text className="why-m" x="150" y="105" textAnchor="middle">Specification &amp; Build Quality</text>
          <text className="why-m" x="682" y="372" textAnchor="end">Budget / Price</text>
          <text className="why-m" x="470" y="372" textAnchor="middle">Same Client Budget</text>
          <text className="why-b" x="660" y="242" style={{ textAnchor: 'end', fontSize: 13, fill: 'var(--muted)' }}>Typical Market</text>
          <text className="why-b" x="530" y="116" style={{ textAnchor: 'start', fontSize: 13, fill: 'var(--brand)' }}>Electrosoft</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          s3 · D · Online order tracking: Factory -> Road -> Customer Handover
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s3">
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z" />
          <text className="why-tl" x="80" y="86">D</text>
        </g>
        <g className="why-ink">
          <path className="why-dr" pathLength={1} d="M60 330H740" />
          {/* Electrosoft factory (sawtooth roof) */}
          <path className="why-dr" pathLength={1} d="M80 330V250H225V330M80 250V232L108 214V232L136 214V232L164 214V232L192 214V232H225V250" />
          <path className="why-dr" pathLength={1} d="M200 232V178h12v54" />
          <circle className="why-dr" pathLength={1} cx="207" cy="168" r="4" />
          <circle className="why-dr" pathLength={1} cx="214" cy="156" r="5" />
          <rect className="why-dr" pathLength={1} x="100" y="258" width="92" height="20" rx="4" style={{ fill: '#fff' }} />
          <path className="why-dr" pathLength={1} d="M86 330V296h20v34M118 292h14v12h-14zM138 292h14v12h-14z" />
          <path className="why-dr" pathLength={1} d="M186 330V280h36v50M186 292h36M186 304h36M186 316h36" />
          {/* Customer building */}
          <path className="why-dr" pathLength={1} d="M600 330V214H710V330M596 214H714" />
          <path className="why-dr" pathLength={1} d="M612 198h30v16h-30zM660 202h24v12h-24zM664 208h16" />
          <circle className="why-dr" pathLength={1} cx="627" cy="206" r="5" />
          <path className="why-dr" pathLength={1} d="M612 232h22v16h-22zM640 232h22v16h-22zM668 232h22v16h-22zM612 256h22v16h-22zM640 256h22v16h-22zM668 256h22v16h-22z" />
          <path className="why-dr" pathLength={1} d="M672 298h18v32h-18zM606 290h52" />
          <path className="why-dr" pathLength={1} d="M722 330V244q15-18 30 0V330M722 272h30M722 300h30" />
          {/* Roll-up dock door */}
          <rect className="why-dr" pathLength={1} x="612" y="292" width="40" height="38" style={{ fill: '#E3E6EB' }} />
        </g>
        {/* Animated door panel */}
        <g id="why-cdoor">
          <rect className="why-dr" pathLength={1} x="612" y="292" width="40" height="38" style={{ fill: '#fff' }} />
          <path className="why-dr" pathLength={1} d="M612 302h40M612 312h40M612 322h40" />
        </g>
        {/* Route lines */}
        <path id="why-route" d="M204 342H632" fill="none" stroke="#DCDFE4" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
        <path id="why-routeOn" pathLength={1} d="M204 342H632" fill="none" stroke="#0B5BD3" strokeWidth="3.5" strokeLinecap="round" />
        {/* Labels & nodes */}
        <g className="why-fd">
          <text x="146" y="272" textAnchor="middle" style={{ font: '600 10px var(--f-display)', fill: 'var(--brand)' }}>Electrosoft Plant</text>
          <circle className="why-node" id="why-n0" cx="204" cy="342" r="7" />
          <circle className="why-node" id="why-n1" cx="418" cy="342" r="7" />
          <circle className="why-node" id="why-n2" cx="632" cy="342" r="7" />
          <text className="why-b why-nl" id="why-nl0" x="204" y="372">Dispatched</text>
          <text className="why-b why-nl" id="why-nl1" x="418" y="372">In Transit</text>
          <text className="why-b why-nl" id="why-nl2" x="632" y="372">Delivered &amp; FAT Signed</text>
        </g>
        {/* Animated truck */}
        <g id="why-truck" className="why-ink">
          <path className="why-dr" pathLength={1} d="M0 -14V-66H78V-14M0 -14H120V-32L100 -50H78M86 -43H99L110 -33H86Z M6 -60H72V-20H6Z" />
          <text className="why-fd" x="39" y="-36" textAnchor="middle" style={{ font: '600 10.5px var(--f-display)', fill: 'var(--brand)', stroke: 'none' }}>Electrosoft</text>
          <g className="why-wh" data-x="20"><circle className="why-dr" pathLength={1} r="9" style={{ fill: '#fff' }} /><path className="why-dr" pathLength={1} d="M0 0V-6" /></g>
          <g className="why-wh" data-x="55"><circle className="why-dr" pathLength={1} r="9" style={{ fill: '#fff' }} /><path className="why-dr" pathLength={1} d="M0 0V-6" /></g>
          <g className="why-wh" data-x="105"><circle className="why-dr" pathLength={1} r="9" style={{ fill: '#fff' }} /><path className="why-dr" pathLength={1} d="M0 0V-6" /></g>
        </g>
        {/* Delivery check tick */}
        <g id="why-recv" className="why-okc">
          <circle cx="655" cy="170" r="14" style={{ fill: '#fff' }} />
          <path d="M648 170l5 6 9-11" />
        </g>
        {/* Track search input box */}
        <g className="why-fd">
          <rect x="250" y="105" width="300" height="74" rx="14" fill="#fff" stroke="#DCDFE4" />
          <text className="why-m" x="268" y="126" style={{ fontWeight: 600 }}>Project Tracking Portal</text>
          <rect x="268" y="136" width="176" height="30" rx="8" fill="#F4F5F7" stroke="#DCDFE4" />
          <text className="why-m" x="280" y="156" style={{ fill: '#0B5BD3', fontFamily: 'var(--f-mono)' }}>EA-PRJ-2026-</text>
          <rect className="why-cur" x="382" y="142" width="2" height="18" />
          <rect x="454" y="136" width="82" height="30" rx="15" fill="#0B5BD3" />
          <text className="why-b" x="495" y="156" style={{ fill: '#fff', fontSize: 13 }}>Track</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          Always-visible: full-width engineering title block + stage annunciator.
          Spans the entire inner drawing frame (x 30 → 770), no side gaps.
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-blk">
        <rect x="30" y="408" width="740" height="132" fill="#fff" />
        <rect x="30" y="408" width="740" height="28" fill="#F4F6F9" />

        {/* Rules */}
        <path d="M30 436H770" stroke="#0E1116" strokeWidth="1.5" fill="none" />
        <path d="M30 488H770M200 436V488M440 436V488M620 436V488M215 488V540M400 488V540M585 488V540" stroke="#C9CED6" strokeWidth="1" fill="none" />

        {/* Row 1 · company + drawing title */}
        <text className="why-t" x="44" y="427" style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', textAnchor: 'start', fill: '#0E1116' }}>
          ELECTROSOFT AUTOMATION PVT. LTD.
        </text>
        <text className="why-m" x="756" y="426" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textAnchor: 'end', fill: '#0B5BD3' }}>
          PROJECT EXECUTION &amp; QA BLUEPRINT
        </text>

        {/* Row 2 · technical metadata */}
        <text className="why-m" x="44" y="453" style={{ fontSize: 8.5, textAnchor: 'start' }}>SYSTEM PROTOCOL</text>
        <text className="why-b" x="44" y="476" style={{ fontSize: 12, textAnchor: 'start', fill: '#0B5BD3' }}>ISO 9001:2015 / CPRI</text>

        <text className="why-m" x="214" y="453" style={{ fontSize: 8.5, textAnchor: 'start' }}>FACILITY LOCATION</text>
        <text className="why-b" x="214" y="476" style={{ fontSize: 12, textAnchor: 'start' }}>Kalher, Bhiwandi Road, Thane</text>

        <text className="why-m" x="454" y="453" style={{ fontSize: 8.5, textAnchor: 'start' }}>DRAWING NO.</text>
        <text className="why-b" x="454" y="476" style={{ fontSize: 12, textAnchor: 'start' }}>EA-QA-2026-REV.D</text>

        <text className="why-m" x="634" y="453" style={{ fontSize: 8.5, textAnchor: 'start' }}>SCALE / STATUS</text>
        <text className="why-b" x="634" y="476" style={{ fontSize: 11.5, textAnchor: 'start', fill: 'var(--ok)' }}>N.T.S. · CERTIFIED</text>

        {/* Row 3 · stage annunciator (lamps light up chapter by chapter) */}
        {LAMP_CELLS.map((c, k) => (
          <g key={c.title}>
            <circle id={`why-lamp-${k}`} cx={c.x + 26} cy="514" r="9" fill="#fff" stroke="#C5CAD3" strokeWidth="1.6" style={{ transition: 'fill .3s, stroke .3s' }} />
            <text className="why-b" x={c.x + 46} y="511" style={{ fontSize: 10, textAnchor: 'start', letterSpacing: '0.03em' }}>{c.title}</text>
            <text className="why-m" id={`why-lt-${k}`} x={c.x + 46} y="526" style={{ fontSize: 9, textAnchor: 'start' }}>Pending</text>
          </g>
        ))}

        {/* Outer frame (drawn last so it sits on top) */}
        <rect x="30" y="408" width="740" height="132" fill="none" stroke="#0E1116" strokeWidth="2" />
      </g>

      {/* Mobile cut line (hidden on desktop) */}
      <path id="why-cut" d="M16 404H784" stroke="#0E1116" strokeWidth="2.5" style={{ display: 'none' }} />
    </svg>
  );
});

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function Why() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  const [reduce] = useState(() => (typeof window !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false));
  const [curRow, setCurRow] = useState(0); // 0-3, drives active card
  const rowRpRef = useRef([0, 0, 0, 0]);

  /* ── Responsive viewBox (mobile hides title block) ─────────────────── */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const blk = svg.querySelector<SVGGElement>('#why-blk');
    const cut = svg.querySelector<SVGPathElement>('#why-cut');
    const mq = matchMedia('(max-width:700px)');
    const crop = () => {
      const m = mq.matches;
      svg.setAttribute('viewBox', m ? '0 0 800 408' : '0 0 800 570');
      if (blk) blk.style.display = m ? 'none' : '';
      if (cut) cut.style.display = m ? '' : 'none';
    };
    crop();
    mq.addEventListener('change', crop);
    return () => mq.removeEventListener('change', crop);
  }, []);

  /* ── GSAP: build and run scrubbed timeline ─────────────────────────── */
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg) return;

    const ctx = gsap.context(() => {
      const q = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel));

      /* ── Initial states ───────────────────────────────────────────── */
      gsap.set(q('.why-dr, .why-wr, .why-bg, .why-xd, #why-routeOn'), { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(q('.why-fd, .why-tp, .why-xf, #why-stamp, #why-recv'), { opacity: 0 });
      gsap.set(q('.why-ms'), { y: 12 });
      gsap.set(q('.why-bar'), { attr: { width: 0 } });
      gsap.set(['#why-s1', '#why-s2', '#why-s3'], { opacity: 0 });
      gsap.set('#why-s0', { opacity: 1 });

      /* ── Animated proxy: stamp, truck, door, playhead, sand, clock ── */
      const P = { st: 0, t: 0, door: 0, ph: 0, sand: 0, clk: 0 };
      const stampEl = svg.querySelector<SVGGElement>('#why-stamp')!;
      const truck = svg.querySelector<SVGGElement>('#why-truck')!;
      const wh = q<SVGGElement>('#why-truck .why-wh');
      const cdoor = svg.querySelector<SVGGElement>('#why-cdoor')!;
      const nodes = [0, 1, 2].map((i) => svg.querySelector<SVGCircleElement>(`#why-n${i}`)!);
      const nls = [0, 1, 2].map((i) => svg.querySelector<SVGTextElement>(`#why-nl${i}`)!);
      const playhead = svg.querySelector<SVGGElement>('#why-ph')!;
      const sandTop = svg.querySelector<SVGPathElement>('#why-sand-top')!;
      const sandBot = svg.querySelector<SVGPathElement>('#why-sand-bot')!;
      const stream = svg.querySelector<SVGPathElement>('#why-stream')!;
      const hourHand = svg.querySelector<SVGPathElement>('#why-hh')!;
      const minHand = svg.querySelector<SVGPathElement>('#why-mh')!;

      function xf() {
        /* A · stamp */
        const k = 1.7 - 0.7 * P.st;
        const r = -16 + 8 * P.st;
        stampEl.setAttribute('transform', `translate(420 95) rotate(${r}) scale(${k}) translate(-420 -95)`);

        /* D · truck, wheels, route nodes, door */
        truck.setAttribute('transform', `translate(${225 + 250 * P.t} 330)`);
        wh.forEach((w) => {
          const dx = w.getAttribute('data-x') ?? '0';
          w.setAttribute('transform', `translate(${dx} -9) rotate(${P.t * 900})`);
        });
        [0, 0.5, 0.95].forEach((f, i) => {
          const on = i === 0 ? P.t > 0 : P.t >= f;
          nodes[i]?.classList.toggle('why-node-on', on);
          nls[i]?.classList.toggle('why-nl-on', on);
        });
        cdoor.setAttribute('transform', `translate(0 292) scale(1 ${1 - 0.8 * P.door}) translate(0 -292)`);

        /* B · playhead sweeps the rail */
        playhead.setAttribute('transform', `translate(${RAIL_X0 + (RAIL_X1 - RAIL_X0) * P.ph} 0)`);

        /* B · hourglass: top drains, bottom fills, thin stream falls in between */
        const topS = Math.max(0.001, 1 - P.sand);
        const botS = Math.max(0.001, P.sand);
        sandTop.setAttribute('transform', `translate(116 364) scale(1 ${topS}) translate(-116 -364)`);
        sandBot.setAttribute('transform', `translate(116 391) scale(1 ${botS}) translate(-116 -391)`);
        stream.style.opacity = P.sand > 0.01 && P.sand < 0.99 ? '1' : '0';
        stream.setAttribute('stroke-dashoffset', String(-P.sand * 140));

        /* B · clock hands */
        minHand.setAttribute('transform', `translate(640 366) rotate(${P.clk * 720})`);
        hourHand.setAttribute('transform', `translate(640 366) rotate(${P.clk * 60 - 30})`);
      }
      xf();

      /* ── UI synchronisation helper (cards + title-block lamps) ────── */
      const lamps = [0, 1, 2, 3].map((n) => svg.querySelector<SVGCircleElement>(`#why-lamp-${n}`));
      const lampTxt = [0, 1, 2, 3].map((n) => svg.querySelector<SVGTextElement>(`#why-lt-${n}`));
      const rows = Array.from(section.querySelectorAll<HTMLElement>('.why-row'));
      let curIdx = -1;

      function ui(i: number) {
        if (i === curIdx) return;
        curIdx = i;
        lamps.forEach((l, n) => {
          if (!l) return;
          const done = n < i;
          const active = n === i;
          l.style.fill = done ? '#30D158' : active ? '#0B5BD3' : '#fff';
          l.style.stroke = done ? '#30D158' : active ? '#0B5BD3' : '#C5CAD3';
        });
        lampTxt.forEach((t, n) => {
          if (t) t.textContent = n <= i ? LAMP_CELLS[n].done : 'Pending';
        });
        rows.forEach((r, n) => {
          r.classList.toggle('on', n === i);
          r.classList.toggle('done', n < i);
          r.querySelector('button')?.setAttribute('aria-expanded', String(n === i));
        });
        setCurRow(i);
      }

      /* ── Scrubbed master timeline ─────────────────────────────────── */
      const tl = gsap.timeline({ defaults: { ease: 'none' } });

      /* Chapter A: bench, transformer, leads one-by-one, QA ticks, rubber stamp */
      tl.to('#why-s0 .why-dr', { strokeDashoffset: 0, duration: 0.5, stagger: { amount: 0.25 } }, 0.05)
        .to('#why-s0 .why-fd', { opacity: 1, duration: 0.25 }, 0.12);

      const tps = q<SVGCircleElement>('#why-s0 .why-tp');
      q<SVGPathElement>('#why-s0 .why-wr').forEach((w, n) => {
        tl.to(w, { strokeDashoffset: 0, duration: 0.2, ease: 'power1.inOut' }, 0.45 + n * 0.14)
          .to(tps[n], { opacity: 1, duration: 0.05 }, 0.58 + n * 0.14);
      });
      tl.to('#why-s0 .why-bg', { strokeDashoffset: 0, duration: 0.2, stagger: { amount: 0.1 } }, 0.8)
        .to('#why-stamp', { opacity: 1, duration: 0.08 }, 0.86)
        .to(P, { st: 1, duration: 0.18, ease: 'back.out(2)', onUpdate: xf }, 0.86);

      /* Cross-fades between chapters. B has its own custom draw choreography below. */
      for (let s = 1; s < 4; s++) {
        const c = CH[s];
        tl.to(`#why-s${s - 1}`, { opacity: 0, duration: 0.22, ease: 'power2.in' }, c)
          .to(`#why-s${s}`, { opacity: 1, duration: 0.25, ease: 'power2.out' }, c + 0.1);
        if (s !== 1) {
          tl.to(`#why-s${s} .why-dr`, { strokeDashoffset: 0, duration: 0.55, stagger: { amount: 0.3 }, ease: 'power1.inOut' }, c + 0.15)
            .to(`#why-s${s} .why-fd`, { opacity: 1, duration: 0.25, stagger: { amount: 0.25 }, ease: 'power2.out' }, c + 0.7);
        }
      }

      /* Chapter B: Timely Delivery — a schedule that visibly runs on time */
      {
        const b = CH[1];
        // 1 · structure: rail, ticks, stems, cards, labels
        tl.to('#why-b-rail', { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut' }, b + 0.2)
          .to('#why-b-ticks', { strokeDashoffset: 0, duration: 0.45, ease: 'power1.inOut' }, b + 0.35)
          .to('.why-ms', { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'power2.out' }, b + 0.25)
          .to('.why-b-stem', { strokeDashoffset: 0, duration: 0.3, stagger: 0.08, ease: 'power1.inOut' }, b + 0.4)
          .to('.why-b-node', { opacity: 1, duration: 0.2, stagger: 0.06 }, b + 0.5)
          .to('.why-b-lbl', { opacity: 1, duration: 0.3 }, b + 0.6)
          .to('.why-b-guide', { opacity: 1, duration: 0.3, stagger: 0.06 }, b + 0.5)
          .to('.why-bar-trk', { opacity: 1, duration: 0.3, stagger: 0.08 }, b + 0.55);

        // 2 · hourglass + clock set-up
        tl.to('.why-hg-fill', { opacity: 1, duration: 0.25 }, b + 0.4)
          .to('#why-s1 .why-xd:not(.why-b-stem):not(#why-b-rail):not(#why-b-ticks):not(#why-b-track):not(#why-clk-ring)', { strokeDashoffset: 0, duration: 0.45, stagger: 0.1, ease: 'power1.inOut' }, b + 0.4)
          .to('#why-clk-ring', { strokeDashoffset: 0, duration: 0.4, ease: 'power1.inOut' }, b + 0.5)
          .to(['#why-sand-top', '#why-sand-bot', '#why-clk-face'], { opacity: 1, duration: 0.2 }, b + 0.7)
          .to('.why-bar-lbl', { opacity: 1, duration: 0.25, stagger: 0.08 }, b + 0.65)
          .to('#why-ph', { opacity: 1, duration: 0.1 }, PH0 - 0.05);

        // 3 · the run: playhead, elapsed track, Gantt bars, sand and clock all advance together
        tl.to(P, { ph: 1, duration: PHD, onUpdate: xf }, PH0)
          .to('#why-b-track', { strokeDashoffset: 0, duration: PHD }, PH0)
          .to(P, { sand: 1, duration: PHD, onUpdate: xf }, PH0)
          .to(P, { clk: 1, duration: PHD, onUpdate: xf }, PH0);

        q<SVGRectElement>('.why-bar').forEach((el, n) => {
          const bar = BARS[n];
          tl.to(el, { attr: { width: bar.w }, duration: (bar.w / (RAIL_X1 - RAIL_X0)) * PHD }, tAt(bar.x));
        });

        // milestone nodes turn green exactly as the playhead passes them
        MILESTONES.forEach((m, n) => {
          tl.to(`#why-bn-${n}`, { fill: '#30D158', stroke: '#30D158', duration: 0.12 }, tAt(m.cx));
        });

        // 4 · payoff: playhead leaves, date locks
        tl.to('#why-ph', { opacity: 0, duration: 0.12 }, PH0 + PHD + 0.02)
          .to('#why-clk-ring', { stroke: '#30D158', duration: 0.15 }, PH0 + PHD + 0.05)
          .to('#why-clk-lbl', { opacity: 1, duration: 0.2 }, PH0 + PHD + 0.05)
          .to('.why-b-badge', { opacity: 1, duration: 0.3, stagger: 0.12, ease: 'power2.out' }, PH0 + 0.55);
      }

      /* Chapter D: truck drives along route, route line draws, door opens, tick stamps */
      {
        const d = CH[3];
        tl.to(P, { t: 1, duration: 0.75, onUpdate: xf }, d + 0.85)
          .to('#why-routeOn', { strokeDashoffset: 0, duration: 0.75 }, d + 0.85)
          .to(P, { door: 1, duration: 0.15, onUpdate: xf }, d + 1.6)
          .to('#why-recv', { opacity: 1, duration: 0.1 }, d + 1.7);
      }

      /* Rest padding so the timeline lands exactly on TOTAL */
      tl.to({}, { duration: 0.05 }, TOTAL - 0.05);

      /* Sync UI + per-card progress bar (--rp) */
      tl.eventCallback('onUpdate', () => {
        const t = tl.time();
        let active = 0;
        CH.forEach((c, n) => { if (t >= c - 0.001) active = n; });
        ui(active);
        ROWS.forEach((_, n) => {
          const start = CH[n];
          const end = n < 3 ? CH[n + 1] : TOTAL;
          const rp = Math.max(0, Math.min(1, (t - start) / (end - start)));
          rowRpRef.current[n] = rp;
          rows[n]?.style.setProperty('--rp', String(rp));
        });
      });
      ui(0);

      /* ── Reduced motion fallback ───────────────────────────────────── */
      if (reduce) {
        section.classList.add('why-static');
        tl.pause();
        const show = (n: number) => { tl.time(SNAP[n] * TOTAL); ui(n); };
        show(0);
        rows.forEach((r, n) => {
          r.style.setProperty('--rp', '1');
          r.querySelector('button')?.addEventListener('click', () => show(n));
        });
        return;
      }

      /* ── ScrollTrigger: pin + scrub with chapter snap ──────────────── */
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: SCROLL_LENGTH,
        pin: true,
        scrub: 0.9,
        anticipatePin: 1,
        snap: {
          snapTo: SNAP,
          duration: { min: 0.35, max: 0.7 },
          delay: 0.08,
          ease: 'power2.inOut',
        },
        invalidateOnRefresh: true,
        animation: tl,
      });
      stRef.current = st;
    }, section);

    return () => ctx.revert();
  }, [reduce]);

  /* ── Click on a card → scroll to that chapter ─────────────────────── */
  function jumpTo(k: number) {
    if (reduce) return;
    const st = stRef.current;
    if (!st) return;
    window.scrollTo({
      top: st.start + SNAP[k] * (st.end - st.start),
      behavior: 'smooth',
    });
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <section id="why" ref={sectionRef} aria-labelledby="why-h" className="why-sec gut">
      <div className="why-in wrap">

        {/* ── Left: engineering drawing sheet ── */}
        <div className="why-sheet-col">
          <div className="sheet">
            <WhySVG svgRef={svgRef} />
          </div>
        </div>

        {/* ── Right: heading + revision cards ── */}
        <div className="why-txt">
          <div className="sec-head">
            <h2 id="why-h">Why choose Electrosoft</h2>
            <p>Four engineering commitments behind every panel and test system we manufacture.</p>
          </div>

          <ol className="why-list" id="why-list">
            {ROWS.map((row, k) => (
              <li
                key={row.rev}
                data-row={k}
                className={`why-row${curRow === k ? ' on' : ''}${curRow > k ? ' done' : ''}`}
                style={{ '--rp': rowRpRef.current[k] } as CSSProperties}
              >
                {/* Revision triangle icon */}
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  <path d="M20 5L36 34H4z" />
                  <text x="20" y="30">{row.rev}</text>
                </svg>

                <div className="hd">
                  <button type="button" aria-expanded={curRow === k} onClick={() => jumpTo(k)}>
                    {row.name}
                  </button>
                  <span className="chip">{row.chip}</span>
                </div>

                <div className="bd">
                  <div>
                    <p className="why-lead">{row.lead}</p>
                    <ul className="why-points">
                      {row.points.map((pt, pIdx) => (
                        <li key={pIdx}>
                          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 8.5 6.5 12 13 4" />
                          </svg>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                    {row.cta && (
                      <Link className="why-go" to={row.cta.to}>
                        {row.cta.text}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="why-hint">Scroll to advance the engineering protocol</p>
        </div>

      </div>
    </section>
  );
}
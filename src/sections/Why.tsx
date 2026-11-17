/**
 * §1.7 Why choose Electrosoft — scroll-pinned engineering drawing.
 *
 * One drawing sheet (left) + four revision cards (right).
 * Section is PINNED; one scrubbed GSAP timeline smoothly draws the sheet chapter by chapter:
 *   A  Quality          – test bench, three leads draw one-by-one, QA badges + stamp
 *   B  Timely delivery  – year calendar fills, 362 counter, 14-hour bars
 *   C  Competitive pricing – price-vs-spec chart
 *   D  Online order tracking – factory + truck drives along route + customer door opens
 *
 * Smooth blueprint drawing animation following About.tsx drawing conventions:
 * pathLength={1}, gsap.context, fluid scrub, and chapter snapping.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── static data ─────────────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_PER_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

interface Row { rev: string; name: string; chip: string; text: string; cta?: true }
const ROWS: Row[] = [
  { rev:'A', name:'Quality',               chip:'3-step QA plan',  text:'Every product passes a 3-step Quality Assurance Plan.' },
  { rev:'B', name:'Timely delivery',        chip:'362 days · 14 h', text:'We run 362 days a year, 14 hours a day, so your order ships on time.' },
  { rev:'C', name:'Competitive pricing',    chip:'Better value',    text:'Better value for the specification than anywhere else.' },
  { rev:'D', name:'Online order tracking',  chip:'Project number',  text:'Track your order anytime with your project number.', cta: true },
];

/* ─── SVG drawing (pure markup, pathLength={1} for smooth draw-on) ───── */
function WhySVG({ svgRef }: { svgRef: React.RefObject<SVGSVGElement> }) {
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 570"
      className="why-svg"
      role="img"
      aria-label="An engineering drawing that draws itself as you scroll: quality, timely delivery, competitive pricing and order tracking"
    >
      <defs>
        <pattern id="why-g" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#EEF0F3"/>
        </pattern>
      </defs>

      {/* sheet border */}
      <rect x="16" y="16" width="768" height="538" fill="none" stroke="#0E1116" strokeWidth="2.5"/>
      <rect x="30" y="30" width="740" height="510" fill="url(#why-g)" stroke="#DCDFE4"/>

      {/* ═══════════════════════════════════════════════════════════════
          s0 · A · Quality: test bench, transformer, leads, QA, stamp
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s0">
        {/* revision triangle */}
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z"/>
          <text className="why-tl" x="80" y="86">A</text>
        </g>

        {/* structural lines – all carry class "why-dr" with pathLength={1} */}
        <g className="why-ink">
          {/* floor line */}
          <path className="why-dr" pathLength={1} d="M60 380H740"/>
          {/* two-door panel */}
          <path className="why-dr" pathLength={1} d="M70 130h130v242h-130zM135 130V372M66 372H204V380H66z"/>
          <circle className="why-dr" pathLength={1} cx="95" cy="122" r="5"/>
          <circle className="why-dr" pathLength={1} cx="175" cy="122" r="5"/>
          <circle className="why-dr" pathLength={1} cx="85" cy="158" r="5"/>
          <circle className="why-dr" pathLength={1} cx="98" cy="158" r="5"/>
          <circle className="why-dr" pathLength={1} cx="111" cy="158" r="5"/>
          <path className="why-dr" pathLength={1} d="M78 182h22v22h-22zM108 182h22v22h-22zM78 204L100 182M108 204L130 182"/>
          <circle className="why-dr" pathLength={1} cx="158" cy="165" r="8"/>
          <circle className="why-dr" pathLength={1} cx="182" cy="165" r="8"/>
          <path className="why-dr" pathLength={1} d="M126 250v34M144 250v34"/>
          <path className="why-dr" pathLength={1} d="M82 335h44v26h-44zM88 341h32M88 348h32M88 355h32M144 335h44v26h-44zM150 341h32M150 348h32M150 355h32"/>
          {/* test console */}
          <path className="why-dr" pathLength={1} d="M215 150h140v112h-140z"/>
          <path className="why-dr" pathLength={1} d="M225 160h60v44h-60zM231 190q6-14 12 0t12 0t12 0"/>
          <path className="why-dr" pathLength={1} d="M294 160h18v14h-18zM316 160h18v14h-18zM338 160h12v14h-12zM294 182h18v14h-18zM316 182h18v14h-18zM338 182h12v14h-12z"/>
          <path className="why-dr" pathLength={1} d="M215 262l-6 22h154l-6-22"/>
          <circle className="why-dr" pathLength={1} cx="232" cy="274" r="4"/>
          <circle className="why-dr" pathLength={1} cx="246" cy="274" r="4"/>
          <circle className="why-dr" pathLength={1} cx="260" cy="274" r="4"/>
          <circle className="why-dr" pathLength={1} cx="274" cy="274" r="4"/>
          <circle className="why-dr" pathLength={1} cx="338" cy="274" r="6"/>
          <path className="why-dr" pathLength={1} d="M222 284h126v96h-126zM285 284V380M278 320v22M292 320v22M298 352h38v18h-38z"/>
          {/* wheeled transformer */}
          <path className="why-dr" pathLength={1} d="M515 215h200v125h-200zM510 203h210v12h-210zM520 340h190v12h-190z"/>
          <path className="why-dr" pathLength={1} d="M541 225V332M555 225V332M569 225V332M583 225V332M597 225V332M611 225V332M625 225V332M639 225V332M653 225V332M667 225V332M681 225V332M695 225V332"/>
          {/* 3 bushing stubs */}
          <path className="why-dr" pathLength={1} d="M548 173h14v30h-14zM588 173h14v30h-14zM628 173h14v30h-14zM544 183h22M544 191h22M584 183h22M584 191h22M624 183h22M624 191h22"/>
          {/* conservator */}
          <path className="why-dr" pathLength={1} d="M645 142h75a12 12 0 0 1 0 24h-75a12 12 0 0 1 0-24zM690 166V203"/>
          {/* wheels */}
          <circle className="why-dr" pathLength={1} cx="545" cy="371" r="9"/>
          <circle className="why-dr" pathLength={1} cx="685" cy="371" r="9"/>
        </g>

        {/* R/Y/B leads – drawn one by one (class "why-wr") */}
        <path className="why-wr" pathLength={1} style={{fill:'none',stroke:'var(--r)',strokeWidth:3,strokeLinecap:'round'}}
              d="M355 205C440 205 470 135 555 173"/>
        <path className="why-wr" pathLength={1} style={{fill:'none',stroke:'var(--y)',strokeWidth:3,strokeLinecap:'round'}}
              d="M355 215C450 215 520 125 595 173"/>
        <path className="why-wr" pathLength={1} style={{fill:'none',stroke:'var(--b)',strokeWidth:3,strokeLinecap:'round'}}
              d="M355 225C460 225 570 120 635 173"/>

        {/* terminal dots (class "why-tp") */}
        <circle className="why-tp" cx="555" cy="173" r="4" style={{fill:'var(--r)'}}/>
        <circle className="why-tp" cx="595" cy="173" r="4" style={{fill:'var(--y)'}}/>
        <circle className="why-tp" cx="635" cy="173" r="4" style={{fill:'var(--b)'}}/>

        {/* QA tick badges (class "why-bg") */}
        <g className="why-okc">
          <circle className="why-bg" pathLength={1} cx="135" cy="95" r="14"/>
          <circle className="why-bg" pathLength={1} cx="285" cy="95" r="14"/>
          <circle className="why-bg" pathLength={1} cx="615" cy="95" r="14"/>
          <path   className="why-bg" pathLength={1} d="M128 95l5 6 9-11M278 95l5 6 9-11M608 95l5 6 9-11"/>
        </g>

        {/* rubber stamp */}
        <g id="why-stamp">
          <circle className="why-brand" cx="420" cy="95" r="38" strokeWidth="3"/>
          <circle className="why-brand" cx="420" cy="95" r="31" strokeWidth="1.5"/>
          <text className="why-t" x="420" y="94" textAnchor="middle" style={{fill:'var(--brand)',fontSize:12}}>QA plan</text>
          <text className="why-m" x="420" y="110" textAnchor="middle" style={{fill:'var(--brand)'}}>3 of 3</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          s1 · B · Timely delivery: calendar + counter + hour bars
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s1">
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z"/>
          <text className="why-tl" x="80" y="86">B</text>
        </g>
        {/* calendar boxes rendered by JS */}
        <g id="why-cal"/>
        {/* 362 counter */}
        <g className="why-fd">
          <text id="why-days" x="660" y="196" textAnchor="middle"
                style={{font:'600 54px var(--f-display)',letterSpacing:'-.04em',fill:'var(--ink)'}}>362</text>
          <text className="why-m" x="660" y="218" textAnchor="middle">days a year</text>
        </g>
        {/* hour bars rendered by JS */}
        <g id="why-hrs"/>
        <g className="why-fd">
          <text className="why-m" x="660" y="296" textAnchor="middle">14 hours a day</text>
          {/* "Ships on time" pill */}
          <rect x="585" y="312" width="150" height="34" rx="17" fill="#fff" stroke="#30D158" strokeWidth="2"/>
          <circle cx="605" cy="329" r="5" fill="#30D158"/>
          <text className="why-b" x="623" y="334" style={{textAnchor:'start',fontSize:14}}>Ships on time</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          s2 · C · Competitive pricing: spec vs price chart
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s2">
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z"/>
          <text className="why-tl" x="80" y="86">C</text>
        </g>
        {/* axes */}
        <g className="why-ink">
          <path className="why-dr" pathLength={1} d="M150 350V112M144 122L150 110L156 122M150 350H682M672 344L682 350L672 356"/>
        </g>
        {/* typical market curve (grey): climbs early, then flattens out */}
        <path className="why-dr" pathLength={1} style={{fill:'none',stroke:'var(--faint)',strokeWidth:3,strokeLinecap:'round'}}
              d="M170 330 Q330 240 660 216"/>
        {/* Electrosoft curve (brand blue): steady climb */}
        <path className="why-dr" pathLength={1} style={{fill:'none',stroke:'var(--brand)',strokeWidth:3.5,strokeLinecap:'round'}}
              d="M170 330 L520 120"/>
        {/* dashed same-price comparison vertical line at x=470 */}
        <path className="why-fd" d="M470 350V150" fill="none" stroke="#afa3a3ff" strokeWidth="1.6" strokeDasharray="4 5"/>
        {/* bracket showing higher spec difference */}
        <g className="why-ink">
          <path className="why-dr" pathLength={1} d="M482 149h8V238h-8"/>
        </g>
        <g className="why-fd">
          {/* circle on market curve at x=470, y=238 */}
          <circle cx="470" cy="238" r="5" fill="#fff" stroke="#160e0eff" strokeWidth="2"/>
          {/* circle on Electrosoft line at x=470, y=150 */}
          <circle cx="470" cy="150" r="5" fill="var(--brand)"/>
          <text className="why-b" x="502" y="194" style={{fill:'var(--brand)',textAnchor:'start'}}>Better value</text>
          <text className="why-m" x="150" y="100" textAnchor="middle">Specification</text>
          <text className="why-m" x="682" y="372" textAnchor="end">Price</text>
          <text className="why-m" x="470" y="372" textAnchor="middle">Same budget</text>
          <text className="why-b" x="668" y="210" style={{textAnchor:'start',fontSize:13,fill:'var(--muted)'}}>Typical market</text>
          <text className="why-b" x="528" y="114" style={{textAnchor:'start',fontSize:13,fill:'var(--brand)'}}>Electrosoft</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          s3 · D · Online order tracking: factory + truck + customer
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-s3">
        <g className="why-fd">
          <path className="why-tri" d="M80 64l14 26H66z"/>
          <text className="why-tl" x="80" y="86">D</text>
        </g>
        <g className="why-ink">
          <path className="why-dr" pathLength={1} d="M60 330H740"/>
          {/* Electrosoft factory (sawtooth roof) */}
          <path className="why-dr" pathLength={1} d="M80 330V250H225V330M80 250V232L108 214V232L136 214V232L164 214V232L192 214V232H225V250"/>
          {/* chimney */}
          <path className="why-dr" pathLength={1} d="M200 232V178h12v54"/>
          <circle className="why-dr" pathLength={1} cx="207" cy="168" r="4"/>
          <circle className="why-dr" pathLength={1} cx="214" cy="156" r="5"/>
          {/* factory sign */}
          <rect className="why-dr" pathLength={1} x="112" y="260" width="68" height="18" rx="3"/>
          {/* dock door */}
          <path className="why-dr" pathLength={1} d="M86 330V296h20v34M118 292h14v12h-14zM138 292h14v12h-14z"/>
          <path className="why-dr" pathLength={1} d="M186 330V280h36v50M186 292h36M186 304h36M186 316h36"/>
          {/* customer building */}
          <path className="why-dr" pathLength={1} d="M600 330V214H710V330M596 214H714"/>
          <path className="why-dr" pathLength={1} d="M612 198h30v16h-30zM660 202h24v12h-24zM664 208h16"/>
          <circle className="why-dr" pathLength={1} cx="627" cy="206" r="5"/>
          <path className="why-dr" pathLength={1} d="M612 232h22v16h-22zM640 232h22v16h-22zM668 232h22v16h-22zM612 256h22v16h-22zM640 256h22v16h-22zM668 256h22v16h-22z"/>
          <path className="why-dr" pathLength={1} d="M672 298h18v32h-18zM606 290h52"/>
          {/* silo / water tower */}
          <path className="why-dr" pathLength={1} d="M722 330V244q15-18 30 0V330M722 272h30M722 300h30"/>
          {/* roll-up dock door (animated) */}
          <rect className="why-dr" pathLength={1} x="612" y="292" width="40" height="38" style={{fill:'#E3E6EB'}}/>
        </g>
        {/* animatable door panel */}
        <g id="why-cdoor">
          <rect className="why-dr" pathLength={1} x="612" y="292" width="40" height="38" style={{fill:'#fff'}}/>
          <path className="why-dr" pathLength={1} d="M612 302h40M612 312h40M612 322h40"/>
        </g>
        {/* route line */}
        <path id="why-route" d="M204 342H632" fill="none" stroke="#DCDFE4" strokeWidth="3"
              strokeDasharray="2 9" strokeLinecap="round"/>
        <path id="why-routeOn" pathLength={1} d="M204 342H632" fill="none" stroke="#0B5BD3" strokeWidth="3.5" strokeLinecap="round"/>
        {/* labels + nodes */}
        <g className="why-fd">
          <text x="146" y="273" textAnchor="middle"
                style={{font:'600 11px var(--f-display)',fill:'var(--brand)'}}>Electrosoft</text>
          <circle className="why-node" id="why-n0" cx="204" cy="342" r="7"/>
          <circle className="why-node" id="why-n1" cx="418" cy="342" r="7"/>
          <circle className="why-node" id="why-n2" cx="632" cy="342" r="7"/>
          <text className="why-b why-nl" id="why-nl0" x="204" y="372">Dispatched</text>
          <text className="why-b why-nl" id="why-nl1" x="418" y="372">On the way</text>
          <text className="why-b why-nl" id="why-nl2" x="632" y="372">Delivered</text>
        </g>
        {/* truck (animated translateX) */}
        <g id="why-truck" className="why-ink">
          <path className="why-dr" pathLength={1} d="M0 -14V-66H78V-14M39 -66V-14M0 -14H120V-32L100 -50H78M86 -43H99L110 -33H86Z"/>
          <text className="why-fd" x="39" y="-36" textAnchor="middle"
                style={{font:'600 11px var(--f-display)',fill:'var(--brand)',stroke:'none'}}>Electrosoft</text>
          <g className="why-wh" data-x="20"><circle className="why-dr" pathLength={1} r="9" style={{fill:'#fff'}}/><path className="why-dr" pathLength={1} d="M0 0V-6"/></g>
          <g className="why-wh" data-x="55"><circle className="why-dr" pathLength={1} r="9" style={{fill:'#fff'}}/><path className="why-dr" pathLength={1} d="M0 0V-6"/></g>
          <g className="why-wh" data-x="105"><circle className="why-dr" pathLength={1} r="9" style={{fill:'#fff'}}/><path className="why-dr" pathLength={1} d="M0 0V-6"/></g>
        </g>
        {/* delivery tick */}
        <g id="why-recv" className="why-okc">
          <circle cx="655" cy="170" r="14" style={{fill:'#fff'}}/>
          <path d="M648 170l5 6 9-11"/>
        </g>
        {/* track input box */}
        {/* TODO: make functional in feture   */}
        <g className="why-fd">
          <rect x="250" y="110" width="290" height="70" rx="14" fill="#fff" stroke="#DCDFE4"/>
          <text className="why-m" x="268" y="130">Project number</text>
          <rect x="268" y="140" width="168" height="28" rx="8" fill="#F4F5F7" stroke="#DCDFE4"/>
          <rect className="why-cur" x="278" y="145" width="2" height="18"/>
          <rect x="446" y="140" width="80" height="28" rx="14" fill="#0B5BD3"/>
          <text className="why-b" x="486" y="159" style={{fill:'#fff',fontSize:14}}>Track</text>
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════════════════
          Always-visible: lamp test annunciator + title block
         ═══════════════════════════════════════════════════════════════ */}
      <g id="why-blk">
        {/* lamp test box */}
        <rect x="44" y="418" width="380" height="108" rx="10" fill="none" stroke="#DCDFE4"/>
        <text className="why-m" x="60" y="442">Lamp test</text>
        <text className="why-m" id="why-readout" x="408" y="442" textAnchor="end">1 of 4 lit</text>
        <g textAnchor="middle">
          <circle className="why-lamp" cx="82"  cy="472" r="11"/>
          <circle className="why-lamp" cx="164" cy="472" r="11"/>
          <circle className="why-lamp" cx="246" cy="472" r="11"/>
          <circle className="why-lamp" cx="328" cy="472" r="11"/>
          <text className="why-m" x="82"  y="504">Quality</text>
          <text className="why-m" x="164" y="504">Delivery</text>
          <text className="why-m" x="246" y="504">Pricing</text>
          <text className="why-m" x="328" y="504">Tracking</text>
        </g>

        {/* title block */}
        <rect x="450" y="404" width="320" height="136" fill="#fff" stroke="#0E1116" strokeWidth="2"/>
        <text className="why-t" x="462" y="423" style={{fontSize:13}}>Electrosoft Automation Pvt. Ltd.</text>
        <path d="M450 430H770M450 450H770M450 522H770M482 450V522" stroke="#DCDFE4" fill="none"/>
        <text className="why-m" x="462" y="444" style={{fontSize:11}}>Drawing: why choose Electrosoft</text>
        <g className="why-tb-row" id="why-tb0"><rect className="why-tbr" x="451" y="451" width="318" height="18"/><text x="462" y="464">A</text><text x="494" y="464">Quality</text></g>
        <g className="why-tb-row" id="why-tb1"><rect className="why-tbr" x="451" y="469" width="318" height="18"/><text x="462" y="482">B</text><text x="494" y="482">Timely delivery</text></g>
        <g className="why-tb-row" id="why-tb2"><rect className="why-tbr" x="451" y="487" width="318" height="18"/><text x="462" y="500">C</text><text x="494" y="500">Competitive pricing</text></g>
        <g className="why-tb-row" id="why-tb3"><rect className="why-tbr" x="451" y="505" width="318" height="17"/><text x="462" y="518">D</text><text x="494" y="518">Online order tracking</text></g>
        <text className="why-m" x="462" y="535" style={{fontSize:10}}>S7-1/2, Bhiwandi Road, Kalher, Thane</text>
      </g>

      {/* mobile cut line (hidden on desktop) */}
      <path id="why-cut" d="M16 404H784" stroke="#0E1116" strokeWidth="2.5" style={{display:'none'}}/>
    </svg>
  );
}

/* ─── main component ─────────────────────────────────────────────────── */
export default function Why() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef     = useRef<SVGSVGElement>(null);
  const stRef      = useRef<ScrollTrigger | null>(null);

  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [curRow, setCurRow] = useState(0);           // 0-3, drives active card
  const rowRpRef = useRef([0, 0, 0, 0]);

  /* ── responsive viewBox (mobile hides title block) ─────────────────── */
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const blk = svg.querySelector<SVGGElement>('#why-blk');
    const cut = svg.querySelector<SVGPathElement>('#why-cut');
    const mq  = matchMedia('(max-width:700px)');
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

  /* ── GSAP: build calendar / hours, then run the scrubbed timeline ─── */
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg) return;

    const ctx = gsap.context(() => {
      const NS = 'http://www.w3.org/2000/svg';

      /* ── Build calendar (B scene) ─────────────────────────────────── */
      const calG = svg.querySelector<SVGGElement>('#why-cal')!;
      calG.replaceChildren();
      let dayN = 0;
      MONTHS.forEach((nm, mi) => {
        const cx = 70 + (mi % 4) * 122, cy = 100 + Math.floor(mi / 4) * 90;
        const box = document.createElementNS(NS, 'rect');
        box.setAttribute('x', String(cx));
        box.setAttribute('y', String(cy));
        box.setAttribute('width', '110');
        box.setAttribute('height', '82');
        box.setAttribute('rx', '8');
        box.setAttribute('pathLength', '1');
        box.setAttribute('class', 'why-dr why-cm');
        calG.appendChild(box);

        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(cx + 12));
        t.setAttribute('y', String(cy + 14));
        t.setAttribute('class', 'why-m why-fd');
        t.textContent = nm;
        calG.appendChild(t);

        for (let d = 0; d < DAYS_PER_MONTH[mi]; d++) {
          dayN++;
          const dy = document.createElementNS(NS, 'rect');
          dy.setAttribute('x', String(cx + 12 + (d % 7) * 12));
          dy.setAttribute('y', String(cy + 22 + Math.floor(d / 7) * 12));
          dy.setAttribute('width', '9');
          dy.setAttribute('height', '9');
          dy.setAttribute('rx', '2');
          dy.setAttribute('class', 'why-dy' + (dayN > 362 ? ' why-off' : ''));
          calG.appendChild(dy);
        }
      });

      /* ── Build hour bars (B scene) ─────────────────────────────────── */
      const hrsG = svg.querySelector<SVGGElement>('#why-hrs')!;
      hrsG.replaceChildren();
      for (let h = 0; h < 24; h++) {
        const hb = document.createElementNS(NS, 'rect');
        hb.setAttribute('x', String(580 + h * 7));
        hb.setAttribute('y', '250');
        hb.setAttribute('width', '4.6');
        hb.setAttribute('height', '22');
        hb.setAttribute('rx', '1.5');
        hb.setAttribute('class', 'why-hb' + (h < 14 ? ' why-on' : ''));
        hrsG.appendChild(hb);
      }

      /* ── Initial states ───────────────────────────────────────────── */
      const allDraw = svg.querySelectorAll<SVGElement>('.why-dr, .why-wr, .why-bg, #why-routeOn');
      gsap.set(allDraw, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(svg.querySelectorAll('.why-fd, .why-tp, #why-stamp, #why-recv'), { opacity: 0 });
      gsap.set(['#why-s1', '#why-s2', '#why-s3'], { opacity: 0 });
      gsap.set('#why-s0', { opacity: 1 });

      const days = svg.querySelector<SVGTextElement>('#why-days')!;
      days.textContent = '0';
      const counter = { v: 0 };

      /* ── Animated proxy for stamp, truck, door, checkpoints ───────── */
      const P = { st: 0, t: 0, door: 0 };
      const stampEl = svg.querySelector<SVGGElement>('#why-stamp')!;
      const truck   = svg.querySelector<SVGGElement>('#why-truck')!;
      const wh      = Array.from(svg.querySelectorAll<SVGGElement>('#why-truck .why-wh'));
      const cdoor   = svg.querySelector<SVGGElement>('#why-cdoor')!;
      const nodes   = [0, 1, 2].map(i => svg.querySelector<SVGCircleElement>(`#why-n${i}`)!);
      const nls     = [0, 1, 2].map(i => svg.querySelector<SVGTextElement>(`#why-nl${i}`)!);

      function xf() {
        const k = 1.7 - 0.7 * P.st, r = -16 + 8 * P.st;
        stampEl.setAttribute('transform', `translate(420 95) rotate(${r}) scale(${k}) translate(-420 -95)`);
        truck.setAttribute('transform', `translate(${225 + 245 * P.t} 330)`);
        wh.forEach(w => {
          const dx = w.getAttribute('data-x') ?? '0';
          w.setAttribute('transform', `translate(${dx} -9) rotate(${P.t * 900})`);
        });
        const frac = [0, 0.5, 0.95];
        frac.forEach((f, q) => {
          const on = q === 0 ? P.t > 0 : P.t >= f;
          nodes[q]?.classList.toggle('why-node-on', on);
          nls[q]?.classList.toggle('why-nl-on', on);
        });
        cdoor.setAttribute('transform', `translate(0 292) scale(1 ${1 - 0.8 * P.door}) translate(0 -292)`);
      }
      xf();

      /* ── UI synchronization helper ────────────────────────────────── */
      const lamps  = Array.from(svg.querySelectorAll<SVGCircleElement>('.why-lamp'));
      const tbs    = Array.from(svg.querySelectorAll<SVGGElement>('.why-tb-row'));
      const readEl = svg.querySelector<SVGTextElement>('#why-readout');
      const rows   = Array.from(section.querySelectorAll<HTMLElement>('.why-row'));
      let curIdx   = -1;

      function ui(i: number) {
        if (i === curIdx) return;
        curIdx = i;
        lamps.forEach((l, k) => l.classList.toggle('why-lamp-lit', k <= i));
        tbs.forEach((r, k) => r.classList.toggle('why-tb-on', k === i));
        if (readEl) readEl.textContent = `${i + 1} of 4 lit`;
        rows.forEach((r, k) => {
          r.classList.toggle('on', k === i);
          r.classList.toggle('done', k < i);
          r.querySelector('button')?.setAttribute('aria-expanded', String(k === i));
        });
        setCurRow(i);
      }

      /* ── Scrubbed timeline (4 chapters: 1.0 each) ─────────────────── */
      const tl = gsap.timeline({ defaults: { ease: 'none' } });

      // Cross-fades & draw starts for chapters 1, 2, 3
      for (let s = 1; s < 4; s++) {
        tl.to(`#why-s${s - 1}`, { opacity: 0, duration: 0.2 }, s)
          .to(`#why-s${s}`, { opacity: 1, duration: 0.15 }, s + 0.08)
          .to(`#why-s${s} .why-dr`, { strokeDashoffset: 0, duration: 0.45, stagger: { amount: 0.3 } }, s + 0.1)
          .to(`#why-s${s} .why-fd`, { opacity: 1, duration: 0.2, stagger: { amount: 0.2 } }, s + 0.45);
      }

      // Chapter A: bench, transformer, leads one-by-one, QA ticks, rubber stamp
      tl.to('#why-s0 .why-dr', { strokeDashoffset: 0, duration: 0.45, stagger: { amount: 0.3 } }, 0.05)
        .to('#why-s0 .why-fd', { opacity: 1, duration: 0.2 }, 0.08);

      const tps = Array.from(svg.querySelectorAll<SVGCircleElement>('#why-s0 .why-tp'));
      Array.from(svg.querySelectorAll<SVGPathElement>('#why-s0 .why-wr')).forEach((w, k) => {
        tl.to(w, { strokeDashoffset: 0, duration: 0.18, ease: 'power1.inOut' }, 0.45 + k * 0.14)
          .to(tps[k], { opacity: 1, duration: 0.04 }, 0.58 + k * 0.14);
      });
      tl.to('#why-s0 .why-bg', { strokeDashoffset: 0, duration: 0.16, stagger: { amount: 0.08 } }, 0.82)
        .to('#why-stamp', { opacity: 1, duration: 0.06 }, 0.86)
        .to(P, { st: 1, duration: 0.14, ease: 'back.out(2)', onUpdate: xf }, 0.86);

      // Chapter B: calendar fills, 362 day counter, 14 hours
      tl.to('.why-dy:not(.why-off)', { fill: '#0B5BD3', duration: 0.35, stagger: { amount: 0.45 } }, 1.25)
        .to('.why-hb.why-on', { fill: '#3D86FF', duration: 0.25, stagger: { amount: 0.25 } }, 1.45)
        .to(counter, { v: 362, duration: 0.55, onUpdate: () => { days.textContent = String(Math.round(counter.v)); } }, 1.25);

      // Chapter D: truck drives along route, route line draws, door opens, recv tick stamps
      tl.to(P, { t: 1, duration: 0.6, onUpdate: xf }, 3.25)
        .to('#why-routeOn', { strokeDashoffset: 0, duration: 0.6 }, 3.25)
        .to(P, { door: 1, duration: 0.15, onUpdate: xf }, 3.75)
        .to('#why-recv', { opacity: 1, duration: 0.1 }, 3.82);

      // Rest padding at end of chapter D
      tl.to({}, { duration: 0.1 }, 4.0);

      // Sync UI and --rp progress bar for active card
      tl.eventCallback('onUpdate', () => {
        const t = tl.time();
        const activeIdx = Math.min(3, Math.floor(t + 0.001));
        ui(activeIdx);
        ROWS.forEach((_, k) => {
          const rp = Math.max(0, Math.min(1, t - k));
          rowRpRef.current[k] = rp;
          rows[k]?.style.setProperty('--rp', String(rp));
        });
      });
      ui(0);

      /* ── Reduced motion fallback ───────────────────────────────────── */
      if (reduce) {
        section.classList.add('why-static');
        tl.pause();
        const show = (i: number) => { tl.time(i + 0.99); ui(i); };
        show(0);
        rows.forEach((r, k) => {
          r.style.setProperty('--rp', '1');
          r.querySelector('button')?.addEventListener('click', () => show(k));
        });
        return;
      }

      /* ── ScrollTrigger: pin + scrub with chapter snap ──────────────── */
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=380%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        snap: {
          snapTo: [0.22, 0.47, 0.72, 0.98],
          duration: { min: 0.25, max: 0.5 },
          ease: 'power2.inOut',
        },
        invalidateOnRefresh: true,
        animation: tl,
      });
      stRef.current = st;
    }, section);

    return () => ctx.revert();
  }, [reduce]);

  /* ── click on a card → scroll to that chapter ─────────────────────── */
  function jumpTo(k: number) {
    if (reduce) return;
    const st = stRef.current; if (!st) return;
    const target = k === 0 ? 0.22 : k === 1 ? 0.47 : k === 2 ? 0.72 : 0.98;
    window.scrollTo({
      top: st.start + target * (st.end - st.start),
      behavior: 'smooth',
    });
  }

  /* ─── render ───────────────────────────────────────────────────────── */
  return (
    <section id="why" ref={sectionRef} aria-labelledby="why-h" className="why-sec gut">
      <div className="why-in wrap">

        {/* ── left: drawing sheet ── */}
        <div className="why-sheet-col">
          <div className="sheet">
            <WhySVG svgRef={svgRef}/>
          </div>
        </div>

        {/* ── right: heading + revision cards ── */}
        <div className="why-txt">
          <div className="sec-head">
            <h2 id="why-h">Why choose Electrosoft</h2>
            <p>Four promises behind every panel and test system we ship.</p>
          </div>

          <ol className="why-list" id="why-list">
            {ROWS.map((row, k) => (
              <li
                key={row.rev}
                data-row={k}
                className={`why-row${curRow === k ? ' on' : ''}${curRow > k ? ' done' : ''}`}
                style={{ '--rp': rowRpRef.current[k] } as CSSProperties}
              >
                {/* revision triangle icon */}
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  <path d="M20 5L36 34H4z"/>
                  <text x="20" y="30">{row.rev}</text>
                </svg>

                <div className="hd">
                  <button
                    type="button"
                    aria-expanded={curRow === k}
                    onClick={() => jumpTo(k)}
                  >
                    {row.name}
                  </button>
                  <span className="chip">{row.chip}</span>
                </div>

                <div className="bd">
                  <div>
                    <p>{row.text}</p>
                    {row.cta && (
                      <Link className="why-go" to="/track">
                        Track your order ›
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="why-hint">Scroll to run the lamp test</p>
        </div>

      </div>
    </section>
  );
}

import type { KeyboardEvent } from 'react';

/*
 * Blueprint cutaway of a distribution transformer (front elevation, tank wall cut away).
 * Each test is a hotspot on the part it checks; data-active on the svg lights that part.
 * Every drawn line has pathLength=1 so the whole sheet can "draw itself" (see testingMotion.ts).
 */
export const SPOTS = [
  { x: 336, y: 290, part: 'Windings' },              // winding resistance
  { x: 370, y: 82, part: 'HV bushings & leads' },    // ratio & vector group
  { x: 415, y: 207, part: 'Core' },                  // no-load loss
  { x: 448, y: 128, part: 'LV terminals, shorted' }, // load loss & impedance
  { x: 436, y: 400, part: 'HV winding insulation' }, // induced over-voltage
];

const LIMBS = [200, 300, 400], HVB = [230, 300, 370], LVB = [420, 448, 476];
const P = { pathLength: 1 } as const;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function bushing(x: number, top: number, sheds: number) {
  // porcelain sheds as a zig-zag outline, then the cap and terminal
  const pts: string[] = [];
  for (let k = 0; k <= sheds * 2; k++) pts.push(`${x - (k % 2 ? 13 : 8)},${140 - k * ((140 - top) / (sheds * 2))}`);
  const right = pts.map(p => { const [px, py] = p.split(','); return `${2 * x - +px},${py}`; }).reverse();
  return (
    <g key={x}>
      <rect {...P} x={x - 12} y={140} width={24} height={12} />
      <polyline {...P} points={[...pts, ...right].join(' ')} />
      <rect {...P} x={x - 5} y={top - 8} width={10} height={8} />
      <line {...P} x1={x} y1={top - 8} x2={x} y2={top - 18} />
    </g>
  );
}

export default function Blueprint({ active, labels, onPick, onHover, narrow }: { active: number; labels: string[]; onPick: (i: number) => void; onHover: (i: number) => void; narrow: boolean }) {
  const key = (i: number) => (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(i); } };
  return (
    <svg className="bp" viewBox={narrow ? '50 36 500 494' : '0 0 720 560'} data-active={active} role="img" aria-label="Cutaway drawing of a transformer, showing which part each test checks">
      {/* tank, cover, skid, wheels, radiators */}
      <g className="bp-frame">
        <rect {...P} x={108} y={170} width={384} height={300} rx={4} />
        <rect {...P} x={116} y={178} width={368} height={284} rx={2} className="bp-thin" />
        <line {...P} x1={120} y1={188} x2={480} y2={188} className="bp-oil" />
        <rect {...P} x={100} y={152} width={400} height={18} rx={3} />
        <rect {...P} x={100} y={470} width={400} height={16} rx={2} />
        {[140, 460].map(x => <g key={x}><circle {...P} cx={x} cy={500} r={12} /><circle {...P} cx={x} cy={500} r={3} /></g>)}
        {[60, 492].map(x => (
          <g key={x}>
            <rect {...P} x={x} y={205} width={48} height={235} rx={2} />
            {range(7).map(i => <line key={i} {...P} x1={x + 6 + i * 6} y1={209} x2={x + 6 + i * 6} y2={436} className="bp-thin" />)}
          </g>
        ))}
        {/* conservator, Buchholz pipe */}
        <rect {...P} x={96} y={70} width={100} height={34} rx={17} />
        <polyline {...P} points="180,104 180,152" />
        <rect {...P} x={172} y={120} width={16} height={12} rx={2} />
      </g>

      {/* core: three limbs, top and bottom yokes */}
      <g className="bp-part p-core">
        <rect {...P} x={170} y={196} width={260} height={22} />
        <rect {...P} x={170} y={432} width={260} height={22} />
        {LIMBS.map(cx => <rect key={cx} {...P} x={cx - 14} y={218} width={28} height={214} />)}
        {[203, 210, 439, 446].map(y => <line key={y} {...P} x1={174} y1={y} x2={426} y2={y} className="bp-thin" />)}
      </g>

      {/* LV (inner) and HV (outer, disc-wound) coils, shown cut on both sides of each limb */}
      <g className="bp-part p-lv">
        {LIMBS.map(cx => [-26, 14].map(dx => <rect key={cx + dx} {...P} x={cx + dx} y={236} width={12} height={186} />))}
      </g>
      <g className="bp-part p-hv">
        {LIMBS.map(cx => [-44, 28].map(dx => (
          <g key={cx + dx}>
            <rect {...P} x={cx + dx} y={228} width={16} height={202} />
            {range(24).map(k => <line key={k} {...P} x1={cx + dx + 2} y1={236 + k * 8} x2={cx + dx + 14} y2={236 + k * 8} className="bp-thin" />)}
          </g>
        )))}
      </g>

      {/* HV leads and bushings */}
      <g className="bp-part p-hvb">
        {LIMBS.map((cx, i) => <polyline key={cx} {...P} className="bp-lead" points={`${cx + 36},228 ${cx + 36},${200 - i * 4} ${HVB[i]},${190 - i * 4} ${HVB[i]},152`} />)}
        {HVB.map(x => bushing(x, 70, 6))}
      </g>
      {/* LV leads and bushings, with the shorting link used for the load-loss test */}
      <g className="bp-part p-lvb">
        {LIMBS.map((cx, i) => <polyline key={cx} {...P} className="bp-lead" points={`${cx - 20},236 ${cx - 20},${188 - i * 5} ${LVB[i]},${188 - i * 5} ${LVB[i]},152`} />)}
        {LVB.map(x => bushing(x, 120, 2))}
        <line {...P} x1={408} y1={106} x2={488} y2={106} className="bp-short" />
      </g>

      {/* title block */}
      {!narrow && (
        <g className="bp-title">
          <rect {...P} x={566} y={478} width={146} height={66} />
          <line {...P} x1={566} y1={500} x2={712} y2={500} />
          <line {...P} x1={566} y1={522} x2={712} y2={522} />
          <text x={574} y={494}>ELECTROSOFT</text>
          <text x={574} y={516}>Transformer under test</text>
          <text x={574} y={538}>DWG TX-01 · not to scale</text>
        </g>
      )}

      {/* hotspots: leader to a label in the margin (desktop), numbered dot on the part */}
      {SPOTS.map((s, i) => (
        <g key={i} className={`bp-spot${i === active ? ' on' : ''}`} role="button" tabIndex={0} aria-label={`${labels[i]}: ${s.part}`} aria-pressed={i === active}
          onClick={() => onPick(i)} onMouseEnter={() => onHover(i)} onKeyDown={key(i)}>
          {!narrow && <line x1={s.x + 12} y1={s.y} x2={560} y2={s.y} className="bp-leader" />}
          {!narrow && <text x={568} y={s.y + 4} className="bp-label">{labels[i]}</text>}
          <circle cx={s.x} cy={s.y} r={narrow ? 15 : 11} className="bp-ring" />
          <circle cx={s.x} cy={s.y} r={narrow ? 12 : 9} className="bp-dot" />
          <text x={s.x} y={s.y + (narrow ? 5 : 4)} textAnchor="middle" className="bp-num">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

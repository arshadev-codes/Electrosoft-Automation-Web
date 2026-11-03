import type { CSSProperties, ReactNode } from 'react';
import type { Art } from '../data/about';

/*
 * The workstation beside each step of the About page's route: a small line drawing (viewBox 160 × 100)
 * that draws itself when the order reaches the step (.on), and keeps working while it is the current
 * step (.cur). Lines with class "d" are drawn; --k orders them. Styles: theme.css, "route stations".
 */
const k = (n: number) => ({ '--k': n }) as CSSProperties;

const DRAW: Record<Art, ReactNode> = {
  // a document writes itself, a cursor blinks at the end
  enquiry: <>
    <rect className="d" pathLength={1} x="36" y="10" width="88" height="80" rx="6" />
    <path className="d" pathLength={1} style={k(1)} d="M50 30H110" />
    <path className="d" pathLength={1} style={k(2)} d="M50 44H104" />
    <path className="d" pathLength={1} style={k(3)} d="M50 58H110" />
    <path className="d" pathLength={1} style={k(4)} d="M50 72H84" />
    <rect className="caret" x="88" y="65" width="2.6" height="13" rx="1" />
  </>,
  // a bill of material fills in, a highlight runs its rows
  quote: <>
    <rect className="d" pathLength={1} x="22" y="10" width="116" height="80" rx="5" />
    <path className="d" pathLength={1} style={k(1)} d="M22 26H138M104 10V90" />
    <rect className="sweep" x="23" y="30" width="114" height="11" />
    {[0, 1, 2, 3].map(i => <g key={i} className="row" style={k(i + 2)}><rect x="30" y={33 + i * 12} width={[56, 44, 60, 38][i]} height="5" rx="2.5" /><rect x="112" y={33 + i * 12} width="18" height="5" rx="2.5" /></g>)}
    <path className="d hot" pathLength={1} style={k(6)} d="M104 84H138" />
  </>,
  // a single-line diagram: incomer, transformer, busbar, three feeders whose breakers close
  design: <>
    <path className="d" pathLength={1} d="M80 6V22" />
    <circle className="d" pathLength={1} style={k(1)} cx="80" cy="30" r="8" /><circle className="d" pathLength={1} style={k(1)} cx="80" cy="42" r="8" />
    <path className="d" pathLength={1} style={k(2)} d="M80 50V58M34 58H126" />
    <path className="d" pathLength={1} style={k(3)} d="M50 58V68M80 58V68M110 58V68" />
    {[50, 80, 110].map((x, i) => <path key={x} className="blade" style={{ ...k(4 + i), transformOrigin: `${x}px 68px` }} d={`M${x} 68V82`} />)}
    {[50, 80, 110].map(x => <circle key={x} className="term" cx={x} cy="86" r="3" />)}
  </>,
  // stock arrives: crates slide in and stack
  material: <>
    <path className="d" pathLength={1} d="M14 88H146" />
    {[[30, 56, 0], [70, 56, 1], [50, 24, 2]].map(([x, y, i]) => (
      <g key={i} className="crate" style={k(i)}>
        <rect x={x} y={y} width="38" height="32" rx="2" /><path d={`M${x} ${y + 10}H${x + 38}M${x + 19} ${y}V${y + 32}`} />
      </g>
    ))}
  </>,
  // a sheet feeds under the cutter, sparks fly
  fab: <>
    <rect className="d" pathLength={1} x="70" y="6" width="20" height="24" rx="3" />
    <path className="d" pathLength={1} style={k(1)} d="M80 30V40M12 60H148M28 60V88M132 60V88" />
    <g className="sheet"><rect x="-40" y="44" width="240" height="8" rx="1" /><path d="M-40 48H200" /></g>
    <g className="spk">{[[-14, -8], [12, -10], [-10, -2], [16, -3]].map(([dx, dy], i) => <path key={i} style={k(i)} d={`M80 42l${dx} ${dy}`} />)}</g>
  </>,
  // inspection: a glass passes over the panel, the tick lands
  qc: <>
    <rect className="d" pathLength={1} x="30" y="10" width="58" height="80" rx="3" />
    <path className="d" pathLength={1} style={k(1)} d="M59 10V90M40 24H52M40 34H52M68 24H80M68 34H80" />
    <circle className="d" pathLength={1} style={k(2)} cx="44" cy="62" r="5" /><circle className="d" pathLength={1} style={k(2)} cx="74" cy="62" r="5" />
    <g className="mag"><circle cx="0" cy="0" r="12" /><path d="M9 9L18 18" /></g>
    <circle className="d ok" pathLength={1} style={k(3)} cx="122" cy="50" r="17" />
    <path className="d ok" pathLength={1} style={k(4)} d="M113 50L119 57L131 43" />
  </>,
  // wiring: R Y B routed between the rails, then live
  assembly: <>
    <rect className="d" pathLength={1} x="20" y="8" width="120" height="84" rx="4" />
    <path className="d" pathLength={1} style={k(1)} d="M30 30H130M30 72H130" />
    {[40, 62, 84, 106].map(x => <rect key={x} className="dev" x={x} y="20" width="14" height="16" rx="2" />)}
    {[40, 62, 84, 106].map(x => <rect key={x + 1} className="dev" x={x} y="64" width="14" height="16" rx="2" />)}
    <path className="wire r" pathLength={1} style={k(2)} d="M47 36V48H69V64" />
    <path className="wire y" pathLength={1} style={k(3)} d="M69 36V52H91V64" />
    <path className="wire b" pathLength={1} style={k(4)} d="M113 36V56H47V64" />
  </>,
  // the Megger: the needle swings up and settles, a reading below
  test: <>
    <rect className="d" pathLength={1} x="30" y="8" width="100" height="84" rx="9" />
    <path className="d" pathLength={1} style={k(1)} d="M50 58A30 30 0 0 1 110 58" />
    <path className="d" pathLength={1} style={k(2)} d="M53 44L57 47M64 33L67 37M80 28V33M96 33L93 37M107 44L103 47" />
    <path className="ndl" d="M80 58V32" />
    <circle className="hub" cx="80" cy="58" r="4" />
    <rect className="d" pathLength={1} style={k(3)} x="58" y="68" width="44" height="13" rx="3" />
    <path className="d hot" pathLength={1} style={k(4)} d="M64 74.5H96" />
  </>,
  // acceptance: the sheet is ticked and signed
  accept: <>
    <rect className="d" pathLength={1} x="46" y="14" width="68" height="78" rx="5" />
    <rect className="d" pathLength={1} style={k(1)} x="66" y="8" width="28" height="12" rx="3" />
    <path className="d" pathLength={1} style={k(2)} d="M58 34H102M58 44H94" />
    <path className="d ok" pathLength={1} style={k(3)} d="M58 62L65 69L78 55" />
    <path className="d hot" pathLength={1} style={k(4)} d="M82 78c4-12 7 6 11-4s5 9 9-1 4 5 8 1" />
  </>,
  // dispatch: the crate goes out on the road
  dispatch: <>
    <path className="d" pathLength={1} d="M6 90H154" />
    <path className="lane" d="M6 96H154" />
    <g className="truck">
      <rect className="d" pathLength={1} style={k(1)} x="30" y="42" width="66" height="38" rx="2" />
      <path className="d" pathLength={1} style={k(2)} d="M30 54H96M63 42V80" />
      <path className="d" pathLength={1} style={k(3)} d="M98 52H120L132 66V80H98Z" />
      <path className="d" pathLength={1} style={k(4)} d="M104 57H118L125 66H104Z" />
      {[48, 82, 118].map(x => <circle key={x} className="whl" cx={x} cy="82" r="6.5" />)}
    </g>
  </>,
};

export default function RouteArt({ art, side, inner }: { art: Art; side: 'l' | 'r'; inner?: boolean }) {
  return (
    <div className={`rt-art ${side}${inner ? ' in' : ''} a-${art}`} aria-hidden="true">
      <svg viewBox="0 0 160 100">{DRAW[art]}</svg>
    </div>
  );
}

import { Fragment } from 'react';
import type { Project } from '../data/projects';

/** Position of a rating on the 1–200 MVA log scale (0..1), as on the testing page. */
export const ratingLog = (mva: number) => Math.log10(mva) / Math.log10(200);

/**
 * A testing project, drawn: the transformer elevation at a size set by its rating (1.5 MVA small,
 * 160 MVA large), the rating dimensioned under the tank and the voltage on a leader to the bushings.
 * Lines draw in, then the dimensions, then the bushings light R Y B, once a parent carries `.on`
 * (theme.css .pj-elev). Used by the project register and the home page's project dossier.
 */
export function Elevation({ p }: { p: Project }) {
  const s = 0.7 + 0.36 * ratingLog(p.mva ?? 1);
  const X = (x: number) => 300 + x * s, Y = (y: number) => 404 + y * s;
  const fins = Array.from({ length: 13 }, (_, i) => -108 + i * 18);
  return (
    <svg className="pj-elev" viewBox="60 0 480 470" aria-hidden="true">
      <defs><pattern id={`g-${p.id}`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="rgba(11,91,211,.07)" /></pattern></defs>
      <rect x="60" width="480" height="470" fill={`url(#g-${p.id})`} />
      <path className="ln gnd" pathLength={1} d="M72 404H528" />
      <g transform={`translate(300 404) scale(${s.toFixed(3)})`}>
        <rect className="ln" pathLength={1} x="-124" y="-206" width="248" height="194" rx="4" />
        <path className="ln" pathLength={1} d={`M-136 -206H136${fins.map(x => `M${x} -190V-28`).join('')}`} />
        <path className="ln" pathLength={1} d="M-112 -12V0M-96 -12V0M96 -12V0M112 -12V0" />
        <rect className="ln" pathLength={1} x="34" y="-290" width="120" height="42" rx="21" />
        <path className="ln" pathLength={1} d="M64 -248V-206" />
        {[-92, -48, -4].map((x, i) => (
          <Fragment key={x}>
            <rect className="ln" pathLength={1} x={x - 10} y="-278" width="20" height="72" rx="5" />
            <path className="ln" pathLength={1} d={`M${x - 14} -262H${x + 14}M${x - 14} -246H${x + 14}M${x - 14} -230H${x + 14}`} />
            <circle className={`bush ${['r', 'y', 'b'][i]}`} cx={x} cy="-288" r="8" />
          </Fragment>
        ))}
      </g>
      {/* rating: dimensioned across the tank */}
      <path className="ln dim" pathLength={1} d={`M${X(-124)} ${Y(26)}H${X(124)}M${X(-124)} ${Y(16)}V${Y(36)}M${X(124)} ${Y(16)}V${Y(36)}`} />
      <text className="note" x="300" y={Y(26) + 26} textAnchor="middle">up to {p.rating}</text>
      {/* voltage: on a leader to the HV bushings, out to the free side (the conservator is on the right) */}
      <path className="ln dim" pathLength={1} d={`M${X(-92) - 10} ${Y(-296)}L${X(-92) - 36} ${Y(-296) - 26}H80`} />
      <text className="note" x="80" y={Y(-296) - 34}>{p.kv}</text>
    </svg>
  );
}

// CONTENT.md · Testing Solutions. Shared by the Home testing section and /transformer-testing.

export interface TestItem {
  id: string;
  name: string;
  text: string;
  part: string;
}

/**
 * Routine tests executed on the automated test floor.
 * Covers all standard compliance tests under IEC 60076 / IS 2026.
 */
export const TESTS: TestItem[] = [
  {
    id: 'no-load-loss',
    name: 'Measurement of No-Load Loss and No-Load Current',
    text: 'Energises the transformer at rated voltage and frequency with the secondary open, measuring active core iron losses and magnetising current drawn.',
    part: 'Core & magnetic circuit',
  },
  {
    id: 'load-loss',
    name: 'Measurement of Load Loss',
    text: 'Circulates rated current through windings with secondary terminals short-circuited at reference temperature, measuring I²R copper losses and stray load losses.',
    part: 'Windings & conductor joints',
  },
  {
    id: 'short-circuit-impedance',
    name: 'Measurement of Single-Phase / Three-Phase Short Circuit Impedance',
    text: 'Measures percentage impedance voltage required to circulate rated current at rated frequency, verifying fault withstand capacity and voltage regulation.',
    part: 'Windings & leakage flux geometry',
  },
  {
    id: 'efficiency-regulation',
    name: 'Calculation of Efficiency and Regulation',
    text: 'Computes percentage efficiency and voltage regulation across power factors (unity to 0.8 lag) from measured no-load and load loss data.',
    part: 'Overall transformer performance',
  },
  {
    id: 'applied-voltage',
    name: 'Applied Voltage Test (High Voltage / Separate Source test)',
    text: 'Applies power-frequency AC high voltage between each winding and earth/other windings for 60 seconds to prove major dielectric insulation strength.',
    part: 'Major insulation & bushings',
  },
  {
    id: 'induced-over-voltage',
    name: 'Induced Over Voltage (DVDF) test',
    text: 'Applies twice the rated voltage at double frequency (100/200 Hz) to verify inter-turn, inter-layer, and inter-phase insulation without saturating the core.',
    part: 'Turn-to-turn & layer insulation',
  },
  {
    id: 'temperature-rise',
    name: 'Temperature Rise test',
    text: 'Operates the transformer under simulated total loss conditions until thermal equilibrium to measure winding and top-oil temperature rise above ambient.',
    part: 'Cooling system, oil & radiators',
  },
  {
    id: 'magnetic-balance',
    name: 'Magnetic Balance test',
    text: 'Applies two-phase voltage across one phase and measures induced voltages in the other two limbs to verify magnetic symmetry and detect inter-turn faults or core unbalance.',
    part: 'Core limbs & magnetic symmetry',
  },
  {
    id: 'vector-group',
    name: 'Verification of Vector Group',
    text: 'Verifies phase displacement and angular relationship between primary and secondary line voltages to ensure compatibility for parallel operation.',
    part: 'Terminal connections & configuration',
  },
  {
    id: 'voltage-ratio',
    name: 'Measurement of Voltage Ratio and Check of Phase Displacement',
    text: 'Compares actual transformation voltage ratio with nameplate turns ratio across all tap positions and checks correct phase angle displacement.',
    part: 'Winding taps & turns ratio',
  },
  {
    id: 'winding-resistance',
    name: 'Measurement of Winding Resistance',
    text: 'Injects precise DC current across each phase winding and measures millivolt drop to detect loose connections, broken conductor strands, and tap switch contact resistance.',
    part: 'Windings, brazed joints & tap contacts',
  },
  {
    id: 'insulation-resistance',
    name: 'Measurement of Insulation Resistance',
    text: 'Measures DC insulation resistance (using 1 kV / 2.5 kV / 5 kV Megger) between windings and earth, calculating polarization index (PI) to check moisture and contamination.',
    part: 'Dielectric insulation & barrier paper',
  },
  {
    id: 'zero-sequence-impedance',
    name: 'Measurement of Three-Phase Zero-Sequence Impedance',
    text: 'Measures zero-sequence impedance and resistance by applying single-phase current across paralleled phases with neutral return for earth-fault relay coordination.',
    part: 'Star-connected windings & neutral path',
  },
  {
    id: 'harmonics-no-load',
    name: 'Measurement of the Harmonics of No-Load Current',
    text: 'Analyzes harmonic distortion (3rd, 5th, 7th harmonics) and crest factor of the excitation current using FFT to detect core saturation and non-linear magnetisation.',
    part: 'Core lamination grade & flux density',
  },
  {
    id: 'acoustic-noise',
    name: 'Measurement of Acoustic Noise Level',
    text: 'Measures sound pressure levels in dB(A) around the energized transformer tank in accordance with IEC 60076-10 to detect core magnetostriction or tank resonance.',
    part: 'Tank, core clamping & cooling fans',
  },
  {
    id: 'oltc-tests',
    name: 'Tests on On-Load Tap-Changer',
    text: 'Verifies motorized driving mechanism, mechanical interlocks, step-by-step tap sequence, transition resistor continuity, and contact timing during switching.',
    part: 'OLTC mechanism & diverter switch',
  },
];

/** 5 key representative tests mapped to the 2D cutaway Blueprint hotspots */
export const BLUEPRINT_TESTS: TestItem[] = [
  TESTS[10], // Winding Resistance (Windings)
  TESTS[9],  // Voltage Ratio & Phase Displacement (HV bushings & leads)
  TESTS[0],  // No-Load Loss & Current (Core)
  TESTS[1],  // Load Loss (LV terminals, shorted)
  TESTS[5],  // Induced Over Voltage (HV winding insulation)
];
export const TEMPTEST:string[]=["Winding resistance",
"Ratio & vector group",
"No-load loss",
"Load loss & impedance",
"Induced over-voltage ",
]

/** Who does a step: the system (auto) or the operator at the desk (hand). */
export type Duty = 'auto' | 'hand';

export const SYSTEMS: { id: string; pos: string; name: string; text: string; duties: [Duty, string][]; ref: string }[] = [
  {
    id: 'fully-automatic', pos: 'AUTO', name: 'Fully Automatic',
    text: 'X\'mer Prime™ runs the whole test. Zero human error.',
    duties: [['auto', 'Switches the physical connections'], ['auto', 'Runs every test'], ['auto', 'Does all the calculations'], ['auto', 'Generates the report']],
    ref: 'MSEDCL · distribution transformers up to 1500 kVA / 33 kV',
  },
  {
    id: 'semi-automatic', pos: 'SEMI', name: 'Semi Automatic',
    text: 'Automate where speed matters, control by hand where precision matters.',
    duties: [['auto', 'Automated steps where speed matters'], ['hand', 'Manual control where precision matters'], ['hand', 'Custom test sequences, set up for your range']],
    ref: 'Tata Power · up to 10 MVA / 33 kV',
  },
  {
    id: 'manual', pos: 'MAN', name: 'Manual',
    text: 'Every test run from the control desk, with minimal training.',
    duties: [['hand', 'Run each test from the control desk'], ['hand', 'Read results on meters, HMI or X\'mer Prime™'], ['hand', 'From heat run to resistance measurement']],
    ref: 'Set-On-Site · up to 250 MVA / 66 kV',
  },
];

/** Testing system projects; `mva` places each on the rating scale (0 to 750 MVA). */
export const PROJECTS = [
  { id: 'msedcl', client: 'MSEDCL', full: 'Maharashtra State Electricity Distribution Co. (Mahavitaran)', system: 'Fully automatic', mva: 1.5,
    rating: '1500 kVA', kv: '33 kV', scope: ['Distribution transformers'], status: 'completed' },
  { id: 'tata-power', client: 'Tata Power', system: 'Semi automatic', mva: 10,
    rating: '10 MVA', kv: '33 kV', scope: ['Test bench', 'Power panel', '1.1 kV HT capacitor panel'], status: 'completed' },
  { id: 'kptcl', client: 'KPTCL', system: 'Power transformers', mva: 160,
    rating: '160 MVA', kv: '220 kV', scope: ['Automated test floor', 'Protection suite', 'Real-time report portal'], status: 'completed' },
      { id: 'nucon', client: 'Nucon Switchgear Pvt Ltd', full: 'Nucon Switchgear Pvt Ltd', system: 'Conventional type', mva: 160,
    rating: '160 MVA', kv: '72 kV', scope: ['Test bench; power and VCB panels'], status: 'completed' },
  { id: 'ece-industries', client: 'ECE Industries Limited', full: 'ECE Industries Limited', system: 'Conventional type', mva: 60,
    rating: '60 MVA', kv: '132 kV', scope: ['Transformer testing system'], status: 'completed' },
  { id: 'kiggs-systems', client: 'Kiggs Systems India Pvt Ltd', full: 'Kiggs Systems India Pvt Ltd', system: 'Conventional type', mva: 60,
    rating: '60 MVA', kv: '132 kV', scope: ['Transformer testing system'], status: 'completed' },
  { id: 'vishwas-power', client: 'Vishwas Power Engineering Pvt Ltd', full: 'Vishwas Power Engineering Pvt Ltd', system: 'Conventional type', mva: 160,
    rating: '160 MVA', kv: '220 kV', scope: ['Transformer testing system'], status: 'completed' },
  { id: 'set-on-site', client: 'Set-On-Site Electrical Pvt Ltd', full: 'Set-On-Site Electrical Pvt Ltd', system: 'Conventional type', mva: 250,
    rating: '250 MVA', kv: '66 kV', scope: ['Transformer testing system'], status: 'completed' },
  { id: 'atlanta-core-loss', client: 'Atlanta Electrical Limited', full: 'Atlanta Electrical Limited', system: 'Pre-core loss testing', mva: 0,
    rating: '—', kv: '—', scope: ['Pre-core loss testing panel'], status: 'completed' },
  { id: 'siemens-ctpt', client: 'Siemens Limited', full: 'Siemens Limited', system: 'CT/PT testing', mva: 0,
    rating: '—', kv: '—', scope: ['CT/PT testing system'], status: 'under-execution' },
  { id: 'siemens-breaker', client: 'Siemens Limited', full: 'Siemens Limited', system: 'Breaker testing', mva: 0,
    rating: '—', kv: '—', scope: ['Breaker testing system'], status: 'under-execution' },
  { id: 'cg-power', client: 'CG Power & Industrial Solutions', full: 'CG Power & Industrial Solutions', system: 'Fully advance automatic', mva: 750,
    rating: '750 MVA', kv: '400 kV', scope: ['Transformer testing system'], status: 'under-execution' },
  { id: 'atlanta-500mva', client: 'Atlanta Electrical Limited', full: 'Atlanta Electrical Limited', system: 'Conventional type', mva: 500,
    rating: '500 MVA', kv: '400 kV', scope: ['Transformer testing system'], status: 'under-execution' },
  { id: 'ardisons', client: 'Ardisons Associates Chandigarh', full: 'Ardisons Associates Chandigarh', system: 'Conventional type', mva: 20,
    rating: '20 MVA', kv: '66 kV', scope: ['Transformer testing system'], status: 'under-execution' },
  { id: 'rhine-jaybee-20mva', client: 'Rhine Jaybee Power Pvt Ltd', full: 'Rhine Jaybee Power Pvt Ltd – Manesar', system: 'Fully advance automatic', mva: 20,
    rating: '20 MVA', kv: '66 kV', scope: ['Transformer testing system'], status: 'under-execution' },
  { id: 'rhine-jaybee-500kva', client: 'Rhine Jaybee Power Pvt Ltd', full: 'Rhine Jaybee Power Pvt Ltd – Manesar', system: 'Fully advance automatic', mva: 0.5,
    rating: '500 kVA', kv: '33 kV', scope: ['Transformer testing system'], status: 'under-execution' },
  { id: 'toshiba-ttd', client: 'Toshiba T&D Systems India', full: 'Toshiba Transmission & Distribution Systems (India) Pvt. Ltd.', system: 'Transformer testing', mva: 1,
    rating: '1 MVA', kv: '33 kV', scope: ['Transformer testing system'], status: 'under-execution' },
] as { id: string; client: string; full?: string; system: string; mva: number; rating: string; kv: string; scope: string[]; status: string }[];
// Created sub array  for projects on a rating scale
const PROJECTS2_IDS = [
  'msedcl',
  'tata-power',
  'kptcl',
  'set-on-site',
  'atlanta-500mva',
  'cg-power',
] as const;

export const PROJECTS2 = PROJECTS.filter(project =>
  PROJECTS2_IDS.includes(project.id as typeof PROJECTS2_IDS[number])
);

/**
 * Custom checkpoint positions for the transformer capacity timeline:
 * 1 MVA -> 0%
 * 1.5 MVA -> 8%
 * 10 MVA -> 19%
 * 160 MVA -> 34%
 * 250 MVA -> 52%
 * 500 MVA -> 72%
 * 750 MVA -> 100%
 */
export const CHECKPOINTS = [
  { mva: 1, pos: 0 },
  { mva: 1.5, pos: 8 },
  { mva: 10, pos: 19 },
  { mva: 160, pos: 34 },
  { mva: 250, pos: 52 },
  { mva: 500, pos: 72 },
  { mva: 750, pos: 100 },
] as const;

export const TICKS = [1, 1.5, 10, 160, 250, 500, 750];

/** Piecewise linear interpolation from MVA rating to horizontal percentage [0, 100]. */
export function mvaToPos(mva: number): number {
  if (mva <= CHECKPOINTS[0].mva) return CHECKPOINTS[0].pos;
  const last = CHECKPOINTS[CHECKPOINTS.length - 1];
  if (mva >= last.mva) return last.pos;

  for (let i = 0; i < CHECKPOINTS.length - 1; i++) {
    const curr = CHECKPOINTS[i];
    const next = CHECKPOINTS[i + 1];
    if (mva >= curr.mva && mva <= next.mva) {
      const t = (mva - curr.mva) / (next.mva - curr.mva);
      return curr.pos + t * (next.pos - curr.pos);
    }
  }
  return 0;
}

/** Inverse interpolation: from horizontal percentage [0, 100] to MVA rating. */
export function posToMva(pos: number): number {
  if (pos <= CHECKPOINTS[0].pos) return CHECKPOINTS[0].mva;
  const last = CHECKPOINTS[CHECKPOINTS.length - 1];
  if (pos >= last.pos) return last.mva;

  for (let i = 0; i < CHECKPOINTS.length - 1; i++) {
    const curr = CHECKPOINTS[i];
    const next = CHECKPOINTS[i + 1];
    if (pos >= curr.pos && pos <= next.pos) {
      const t = (pos - curr.pos) / (next.pos - curr.pos);
      return curr.mva + t * (next.mva - curr.mva);
    }
  }
  return CHECKPOINTS[0].mva;
}
// TODO: CONFIRM — reactor and motor benches are not on the old site; added at the owner's request
// (2026-10-23). Only the DC-supply link is sourced (CONTENT.md · DC Panels: "reactor testing").


export const BENCHES = [
  { id: 'motor-bench', name: 'Motor test bench', text: 'Full-load, temperature-rise and vibration testing for induction and synchronous motors up to 5 MW.' },
  { id: 'reactor-bench', name: 'Air-core & iron-core reactor bench', text: 'Impedance and loss measurement at rated frequency with high-Q tuned sources.' },
  { id: 'dc-panel', name: 'DC traction & rectifier panels', text: 'High-current DC panels built to order for metro and railway substations.', link: '/products#dc-switchgear' },
];

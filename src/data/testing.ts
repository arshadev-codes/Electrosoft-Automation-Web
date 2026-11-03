// CONTENT.md · Testing Solutions. Shared by the Home testing section and /transformer-testing.

// TODO: CONFIRM — the tests list is [CONFIRM] in CONTENT.md (draft names, shared with the hero bench);
// standards (IEC 60076 / IS 2026?) are not named until the company confirms them.
// Descriptions are what each routine test checks in general terms.
export const TESTS = [
  { id: 'winding-resistance', name: 'Winding resistance',
    text: 'Passes a steady DC current through each winding and waits for the reading to settle, to catch loose joints, broken strands and tap-changer contact faults.' },
  { id: 'ratio-vector-group', name: 'Ratio & vector group',
    text: 'Compares HV and LV on every tap to confirm the turns ratio, and checks the phase shift between them matches the nameplate vector group.' },
  { id: 'no-load-loss', name: 'No-load loss',
    text: 'Energises the transformer at rated voltage with the other side open, measuring core loss and the magnetising current it draws.' },
  { id: 'load-loss-impedance', name: 'Load loss & impedance',
    text: 'Circulates rated current with the LV terminals shorted, measuring copper loss and the percentage impedance.' },
  { id: 'induced-over-voltage', name: 'Induced over-voltage',
    text: 'Applies above-rated voltage at a raised frequency and holds it, to prove the insulation between turns.' },
];

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
    ref: 'Crompton Greaves · up to 150 MVA / 66 kV',
  },
];

/** Testing system projects; `mva` places each on the rating scale. */
export const PROJECTS = [
  { id: 'msedcl', client: 'MSEDCL', full: 'Maharashtra State Electricity Distribution Co. (Mahavitaran)', system: 'Fully automatic', mva: 1.5,
    rating: '1500 kVA', kv: '33 kV', scope: ['Distribution transformers'] },
  { id: 'tata-power', client: 'Tata Power', system: 'Semi automatic', mva: 10,
    rating: '10 MVA', kv: '33 kV', scope: ['Test bench', 'Power panel', '1.1 kV HT capacitor panel'] },
  { id: 'crompton-greaves', client: 'Crompton Greaves', system: 'Manual', mva: 150,
    rating: '150 MVA', kv: '66 kV · 50 & 60 Hz', scope: ['Test bench; power, PLC, RIO and protection panels', '12.5 MVA / 11 kV / 50 Hz and 5 MVA / 11 kV / 200 Hz MG sets', '6.6 kV / 630 A motorised changeover panel'] },
  { id: 'nucon', client: 'Nucon Switchgears', system: 'Test system', mva: 160,
    rating: '160 MVA', kv: '33 kV', scope: ['Test bench; power and VCB panels', '1600 A dimmer, 1500 kVA / 150 Hz DVDF unit', '600 kVA / 300 kV HV test set, 300 kVA MG set', 'HT isolator for a 50 MVAr capacitor bank'] },
] as { id: string; client: string; full?: string; system: string; mva: number; rating: string; kv: string; scope: string[] }[];

// TODO: CONFIRM — reactor and motor benches are not on the old site; added at the owner's request
// (2026-10-23). Only the DC-supply link is sourced (CONTENT.md · DC Panels: "reactor testing").
export const BENCHES = [
  { id: 'reactor-test-bench', name: 'Reactor test benches', text: 'Benches for testing reactors, with the stable, adjustable DC supply of our DC panels.', link: '/products#dc' },
  { id: 'motor-test-bench', name: 'Motor test benches', text: 'Benches for testing motors, built around your motor range and test list.' },
];

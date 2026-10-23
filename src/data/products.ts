// CONTENT.md · Products: descriptions and key points as written there (no point list where CONTENT.md has none).
// Photos: public/img/products (old site). `cut` = a cut-out on white, shown on a studio sweep; otherwise a framed photo.

export type Product = { id: string; name: string; sub?: string; text: string; points: string[]; cut: boolean };
export type Group = { cat: string; items: Product[] };

export const RANGE: Group[] = [
  { cat: 'Automation', items: [
    { id: 'plc-scada', name: 'PLC / SCADA', cut: true,
      text: 'Complete plant automation: PLC panels, programming, SCADA and support from a team with 20+ years of experience.',
      points: ['SCADA on Vijeo Citect, WinCC, Wonderware, FactoryTalk View', 'Strong data acquisition and programming', 'Full control and monitoring'] },
  ] },
  { cat: 'Power', items: [
    { id: 'pcc', name: 'PCC', sub: 'Power control centre', cut: true,
      text: 'Heavy-duty power control centres with special bus-bar and wiring expertise, combining different equipment into one power system.',
      points: ['CPRI approved 65kA design', 'IP65', 'All necessary protections'] },
    { id: 'draw-out', name: 'Draw-Out MCC / PCC', cut: false,
      text: 'Fully draw-out panels for critical process areas: replace a starter or feeder module without isolating main power.',
      points: ['Zero process shutdown for module change', 'For critical plants'] },
    { id: 'dc', name: 'DC Panels', cut: false,
      text: 'Stable, adjustable DC supply for reactor testing, small water treatment plants and special DC motors.',
      points: ['Fine-tunable output via pot', 'Reactor testing ready'] },
    { id: 'distribution', name: 'Distribution Boards', cut: true,
      text: 'AC and DC distribution boards engineered and built for reliable performance.', points: [] },
  ] },
  { cat: 'Motors', items: [
    { id: 'mcc', name: 'MCC', sub: 'Motor control centre', cut: true,
      text: 'Motor control centres combining motor protection, distribution and industrial communication in one package.',
      points: ['20+ year life cycle', 'CPRI approved 65kA / IP65', 'Intelligent communications'] },
  ] },
  { cat: 'Energy', items: [
    { id: 'apfc', name: 'SmartAPFC', sub: 'Automatic power factor correction', cut: true,
      text: 'Fully automatic power factor correction achieving unity power factor.',
      points: ['8 levels of protection', 'Buzzer alarm', 'Heavy-duty, guaranteed incentive'] },
    { id: 'vfd', name: 'VFD Panels', sub: 'Variable frequency drives', cut: true,
      text: 'Custom variable frequency drive panels that match motor speed to load and cut energy cost.',
      points: ['80%+ of electricity is used by rotating equipment', 'Built to your application'] },
  ] },
  { cat: 'Control', items: [
    { id: 'control-desk', name: 'Control Desk', cut: true,
      text: 'Control desks with printed acrylic mimic panels and intuitive controls.', points: [] },
    { id: 'console', name: 'Console / Workstation', cut: true,
      text: 'Monitor and PC workstations for SCADA control and monitoring.', points: [] },
  ] },
  { cat: 'Services', items: [
    { id: 'assembly', name: 'Panel Assembly & Wiring', cut: false,
      text: 'Custom panel assembly and wiring, in volume or in small runs.',
      points: ['Volume and low-volume custom assembly', 'Manage your supply chain and cost', '100% tested before dispatch'] },
    { id: 'turnkey', name: 'Turnkey Electrical & Automation Projects', cut: false,
      text: 'Full design, engineering and project management.',
      points: ['Independent manufacturer, not an OEM', 'We pick the best products for each need'] },
  ] },
];

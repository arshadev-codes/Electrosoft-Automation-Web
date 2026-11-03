// CONTENT.md · About. The journey uses only facts already in CONTENT.md: 1989 is the one date the
// company has given, so the chapters in between carry no years (your call, 2026-11-02).

export type Chapter = { rev: string; when: string; tab: string; title: string; text: string; facts: string[]; row: string };

export const CHAPTERS: Chapter[] = [
  { rev: 'A', when: '1989', tab: 'Panels', row: 'Panels · 1989', title: 'It starts with panels.',
    text: 'Electrosoft Automation begins in 1989, designing and manufacturing electrical control panels.',
    facts: ['Power and motor control centres', 'Draw-out panels and distribution boards', 'AC and DC panels'] },
  { rev: 'B', when: 'Then', tab: 'Automation', row: 'Automation & instrumentation', title: 'Into automation and instrumentation.',
    text: 'The work grows from the panel into the plant it runs: PLC panels, programming and SCADA, VFD panels, control desks and SCADA workstations.',
    facts: ['A team with 20+ years in automation', 'SCADA on Vijeo Citect, WinCC, Wonderware, FactoryTalk View', 'Control desks with printed acrylic mimics'] },
  { rev: 'C', when: 'Then', tab: 'Testing', row: 'Transformer testing', title: 'Transformer testing.',
    text: 'Complete transformer test systems, run by our own X\'mer Prime™ software, from distribution transformers to large power units.',
    facts: ['Fully automatic, semi automatic and manual systems', 'MSEDCL, Tata Power, Crompton Greaves, Nucon Switchgears', 'Systems for units up to 160 MVA'] },
  { rev: 'D', when: 'Today', tab: 'Today', row: 'Today', title: 'A complete electrical company.',
    text: 'Design, manufacture, supply, installation and commissioning of control panels, automation, instrumentation and transformer testing systems, for small businesses, corporates and government bodies.',
    facts: ['CPRI approved design: 65kA short circuit, IP65', 'ISO certified, MSME registered', '80%+ of orders from repeat customers'] },
];

// How we work: the 11 steps of the old site's how-we-work-diag.png (electrosoftindia.com/about.html),
// shortened. Step 04 runs two things side by side; 05, 07 and 09 are the 3-step quality assurance plan.
export type Art = 'enquiry' | 'quote' | 'design' | 'material' | 'fab' | 'qc' | 'assembly' | 'test' | 'accept' | 'dispatch';
export type Step = { n: string; name: string; text: string; art: Art; qc?: boolean };
export const ROUTE: (Step | { n: string; fork: Step[] })[] = [
  { n: '01', name: 'Enquiry', art: 'enquiry', text: 'Send us a load list, IO list, P&I diagram or electrical drawing, or simply put what you need into words.' },
  { n: '02', name: 'Quotation & PO', art: 'quote', text: 'Our estimation engineers study your requirement and quote with a full Bill of Material. Your order and our reply put us both on the same page.' },
  { n: '03', name: 'Design', art: 'design', text: 'Our design engineers develop the SLD, GA and wiring diagrams and send them to you for approval before manufacturing starts.' },
  { n: '04', fork: [
    { n: '04', name: 'Material', art: 'material', text: 'The purchase team buys the material from our vendors, as per the approved BOM.' },
    { n: '04', name: 'Fabrication', art: 'fab', text: 'Sheet metal craftsmen and CNC machinery make the enclosure; it is powder coated in a 7-tank process, then assembled.' },
  ] },
  { n: '05', name: 'Quality check', art: 'qc', qc: true, text: 'The enclosure and the received materials are checked against the design: quantity, ratings and visible defects.' },
  { n: '06', name: 'Assembly, wiring & programming', art: 'assembly', text: 'Material is fitted as per the GA, labelled and wired as per the approved wiring diagram. Automation systems get their PLC and SCADA programs.' },
  { n: '07', name: 'Quality check', art: 'qc', qc: true, text: 'Component mounting, harnessing, lug crimping and internal labels are checked against the approved drawings.' },
  { n: '08', name: 'Testing & simulation', art: 'test', text: 'Senior engineers run the routine tests (HV, Megger and more), test the functionality and prepare the test reports.' },
  { n: '09', name: 'Quality check', art: 'qc', qc: true, text: 'A final, thorough inspection, so only the best products leave our factory.' },
  { n: '10', name: 'Acceptance', art: 'accept', text: 'We invite you to our works to check and approve the product.' },
  { n: '11', name: 'Packing, dispatch & installation', art: 'dispatch', text: 'Packed as agreed, dispatched with test reports, QC reports and documents, then our installation team puts the system into operation.' },
];

// TODO: CONFIRM — the PDFs are not in public/downloads/ yet (same names the footer uses)
export const STAMPS = [
  { id: 'cpri-65ka', arc: 'CPRI APPROVED DESIGN', big: '65kA', sub: 'Short circuit', file: 'cpri-65ka.pdf', label: 'CPRI 65kA certificate', rot: -7 },
  { id: 'cpri-ip65', arc: 'CPRI APPROVED DESIGN', big: 'IP65', sub: 'Enclosure', file: 'cpri-ip65.pdf', label: 'CPRI IP65 certificate', rot: 5 },
  { id: 'iso', arc: 'ISO CERTIFIED COMPANY', big: 'ISO', sub: 'Certified', file: 'iso.pdf', label: 'ISO certificate', rot: -3 },
  { id: 'msme', arc: 'MSME REGISTERED UNIT', big: 'MSME', sub: 'Registered', file: 'msme.pdf', label: 'MSME certificate', rot: 8 },
];
export const DOCS = [
  ['Company profile', 'company-profile.pdf'], ['QAP for electrical panels', 'qap-electrical.pdf'], ['QAP for automation panels', 'qap-automation.pdf'],
];

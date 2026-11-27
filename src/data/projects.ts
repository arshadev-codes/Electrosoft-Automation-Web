// CONTENT.md · Projects. Panel projects as on the old site's projects.html (photos from there,
// public/img/projects/); testing projects from data/testing.ts.
// TODO: CONFIRM — which panels were supplied on each panel project (CONTENT.md [CONFIRM]); not shown until known.
import { PROJECTS as TESTING } from './testing';

export type Kind = 'panel' | 'test';
export type Project = {
  id: string; kind: Kind; name: string; client: string; full?: string;
  place?: string; tag?: string; sector?: string; img?: string; system?: string; mva?: number; rating?: string; kv?: string; scope?: string[]; status?: string;
  year?: string;
};

const PANEL: Project[] = [
  { id: 'swtp-gurugram', kind: 'panel', name: 'Sewage Water Treatment Plant', client: 'Municipal Corporation of Gurugram (MCG)', sector: 'Municipal corporation', place: 'Gurugram', tag: 'Gurugram', img: '/img/projects/swtp-gurugram.jpg' },
  { id: 'swtp-powai', kind: 'panel', name: 'Sewage Water Treatment Plant', client: 'Municipal Corporation of Greater Mumbai (MCGM)', sector: 'Municipal corporation', place: 'Mithi River, Powai', tag: 'Powai', img: '/img/projects/swtp-powai.jpg' },
  { id: 'swtp-badlapur', kind: 'panel', name: 'Sewage Water Treatment Plant', client: 'Kulgaon-Badlapur Municipal Corporation', sector: 'Municipal corporation', place: 'Badlapur', tag: 'Badlapur', img: '/img/projects/swtp-badlapur.jpg' },
  { id: 'pmp-asangaon', kind: 'panel', name: 'Plastic Moulding Machine Manufacturing Plant', client: 'Jagmohan Plamach Pvt. Ltd.', sector: 'Private company', place: 'Asangaon, Dist. Thane', tag: 'Asangaon', img: '/img/projects/pmp.jpg' },
  
];

const TEST: Project[] = TESTING.map(p => ({
  id: p.id,
  kind: 'test',
  name: p.name,
  client: p.client,
  tag: p.client,
  full: p.full,
  system: p.system,
  mva: p.mva,
  rating: p.rating,
  kv: p.kv,
  scope: p.scope,
  status: p.status,
  year: p.year,
}));

// Alternating panel and test projects for the register, preserving all items
export const ALL: Project[] = Array.from(
  { length: Math.max(PANEL.length, TEST.length) },
  (_, i) => [PANEL[i], TEST[i]]
).flat().filter((p): p is Project => Boolean(p));

// All testing projects for the dossier (complete + under execution)
export const ALL_TEST: Project[] = TEST;

export const FILTERS: { id: 'all' | Kind; name: string; short: string }[] = [
  { id: 'all', name: 'All', short: 'All' }, { id: 'panel', name: 'Panels & Automation', short: 'Panels' }, { id: 'test', name: 'Testing Systems', short: 'Testing' },
];

// CONTENT.md · Gallery. Photos from the old site's gallery (public/img/gallery/, office and workshop in
// public/img/about/). Categories are the old site's product filter; a combination panel sits in each
// of its categories.

export type Place = 'office' | 'workshop' | 'products';
export type Photo = { id: string; src: string; w: number; h: number; place: Place; name: string; cats: string[] };

// product filter (old site) → its section on /products
export const CATS: { id: string; name: string; product: string }[] = [
  { id: 'plc', name: 'PLC', product: 'plc-scada' },
  { id: 'pcc', name: 'PCC', product: 'pcc' },
  { id: 'mcc', name: 'MCC', product: 'mcc' },
  { id: 'draw-out', name: 'Draw-Out MCC', product: 'draw-out' },
  { id: 'apfc', name: 'APFC', product: 'apfc' },
  { id: 'vfd', name: 'VFD', product: 'vfd' },
  { id: 'dc', name: 'DC Panels', product: 'dc' },
  { id: 'db', name: 'Distribution Boards', product: 'distribution' },
  { id: 'desk', name: 'Control Desk', product: 'control-desk' },
  { id: 'console', name: 'Workstation / Console', product: 'console' },
];

const g = (id: string, w: number, h: number, name: string, cats: string[]): Photo =>
  ({ id, src: `/img/gallery/${id}.webp`, w, h, place: 'products', name, cats });

export const PHOTOS: Photo[] = [
  { id: 'office', src: '/img/about/office.webp', w: 910, h: 668, place: 'office', name: 'Design office', cats: [] },
  g('pcc-panel-1', 1920, 1440, 'PCC panel', ['pcc']),
  g('plc-7', 1034, 1920, 'PLC panel', ['plc']),
  g('mcc-5', 1920, 1346, 'MCC panel', ['mcc']),
  g('draw-out-panel-1', 1920, 1440, 'Draw-out panel', ['draw-out']),
  g('apfc-3', 1920, 1440, 'APFC panel', ['apfc']),
  g('vfd-2', 1440, 1920, 'VFD panel', ['vfd']),
  { id: 'workshop', src: '/img/about/workshop.webp', w: 936, h: 486, place: 'workshop', name: 'Workshop', cats: [] },
  g('control-desk-2', 1920, 1616, 'Control desk', ['desk']),
  g('dc-panel-1', 1920, 1440, 'DC panel', ['dc']),
  g('ac-distribution-board-3', 1440, 1920, 'AC distribution board', ['db']),
  g('plc-mcc-vfd-combination-panel-2', 1920, 1440, 'PLC, MCC & VFD combination panel', ['plc', 'mcc', 'vfd']),
  g('wc-1', 1440, 1920, 'Workstation / console', ['console']),
  g('mcc-10', 1920, 1440, 'MCC panel', ['mcc']),
  g('draw-out-panel-5', 1920, 1440, 'Draw-out panel', ['draw-out']),
  g('mcc-apfc-panel-2', 1440, 1920, 'MCC & APFC panel', ['mcc', 'apfc']),
  g('apfc-9', 1920, 1440, 'APFC panel', ['apfc']),
  g('plc-3', 1920, 1440, 'PLC panel', ['plc']),
  g('dc-distribution-board-1', 1920, 1440, 'DC distribution board', ['db', 'dc']),
  g('vfd-mcc-panel-1', 1919, 1124, 'VFD & MCC panel', ['vfd', 'mcc']),
  g('control-desk-1', 1690, 1920, 'Control desk', ['desk']),
  g('dc-panel-6', 1920, 1440, 'DC panel', ['dc']),
];

export const PLACES: { id: 'all' | Place; name: string }[] = [
  { id: 'all', name: 'All' }, { id: 'office', name: 'Office' }, { id: 'workshop', name: 'Workshop' }, { id: 'products', name: 'Products' },
];

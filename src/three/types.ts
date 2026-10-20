import type * as THREE from 'three';
import type { V3 } from './kit';

/** Every moving group in the hero. A GLB model must use these node names (see loadModel.ts). */
export const PART_KEYS = ['tank', 'core', 'lv', 'hv', 'cover', 'bench', 'benchRoof', 'benchInternals', 'benchFascia', 'benchDesk', 'panelInternals', 'panelDoor', 'leads'] as const;
export type PartKey = (typeof PART_KEYS)[number];

/** outer = load-in assembly offset, inner = scroll explode offset. */
export interface Part { outer: THREE.Group; inner: THREE.Group }

/** Animated values driven by the GSAP timeline and read every frame. */
export interface SceneState {
  r: number; theta: number; phi: number; fx: number; fy: number; fz: number; off: number; // camera shot (see heroMotion.ts)
  spin: number;
  glow: number;   // test current flowing through the leads, 0..1
  test: number;   // X'mer Prime test sequence progress, 0..1
  labels: number; // label fade-in, 0..1
  labelSplit: number; // 0 = show bench labels, 1 = show transformer labels
  callouts: number;  // spec callouts, faded out by scroll, 0..1
  calloutIn: number; // spec callouts, faded in after load-in, 0..1
}

export interface SceneModel {
  root: THREE.Object3D;
  parts: Partial<Record<PartKey, Part>>;
  /** Label anchors in each part's inner space. */
  anchors: Partial<Record<PartKey, THREE.Vector3>>;
  /** Spec callout anchors (by callout id), in the given part's inner space. */
  callouts: Record<string, { part: PartKey; v: THREE.Vector3 }>;
  update(t: number, dt: number, s: SceneState): void;
}

/** Explode offsets, in the part's parent space (bench parts: bench-local, +Z = bench front). */
export const EXPLODE: Record<PartKey, V3> = {
  // transformer: core-coil lifts out of the tank, then each winding steps up and right
  tank: [0, 0, -0.1],
  core: [0.35, 0.75, 0.85],
  lv: [0.75, 1.5, 1.15],
  hv: [1.15, 2.25, 1.45],
  cover: [-0.65, 1.3, -0.45],
  leads: [-0.65, 1.6, -0.45],
  // test bench: roof lifts, meter panel and PLC plate pull forward, desk controls rise,
  // power panel door comes off to show the incomer and busbars
  bench: [0, 0, 0],
  benchRoof: [0, 0.7, -0.05],
  benchInternals: [0, 0.06, 0.48],
  benchFascia: [0, 0.16, 1.05],
  benchDesk: [0, 0.45, 0.45],
  panelInternals: [0, 0.04, 0.5],
  panelDoor: [-0.2, 0.06, 1.15],
};

/** Labelled layers. Facts only from CONTENT.md; part names are generic engineering terms. */
/** Parts whose labels belong to the bench shot (the rest show in the transformer shot). */
export const BENCH_PARTS: PartKey[] = ['bench', 'benchRoof', 'benchInternals', 'benchFascia', 'benchDesk', 'panelInternals', 'panelDoor'];

export const TAGS: { part: PartKey; name: string; sub: string; flip?: boolean }[] = [
  { part: 'tank', name: 'Tank & Cooling Fins', sub: 'Transformer under test' },
  { part: 'cover', name: 'Bushings & Conservator', sub: 'HV and LV terminals' },
  { part: 'hv', name: 'HV Windings', sub: 'Disc-wound, three phase' },
  { part: 'lv', name: 'LV Windings', sub: 'Copper foil' },
  { part: 'core', name: 'CRGO Core', sub: 'Three-limb, stepped', flip: true },
  { part: 'leads', name: 'Test Leads', sub: 'Connections switched automatically' },
  { part: 'benchFascia', name: "Test Bench · X'mer Prime™", sub: 'HMI and digital meters' },
  { part: 'benchInternals', name: 'PLC · RIO', sub: 'Switches every test connection' },
  { part: 'panelInternals', name: 'Power Panel', sub: 'Incomer, busbars and feeders', flip: true },
];

/** Bottom-up assembly order for the load-in animation. */
export const ASSEMBLY: PartKey[] = ['bench', 'panelInternals', 'benchInternals', 'tank', 'core', 'lv', 'hv', 'cover', 'panelDoor', 'benchFascia', 'benchDesk', 'benchRoof', 'leads'];

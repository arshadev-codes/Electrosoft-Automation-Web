import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, rbox, cyl, lathe, instanced, plane, group, makeCanvas, canvasTexture, contactShadow, type V3 } from '../kit';
import type { Mats } from '../materials';
import type { Part } from '../types';

/*
 * Three-phase oil-filled distribution transformer, the unit under test.
 * Local space: origin at floor centre, +Z = front (LV side), units ≈ metres.
 */

const PI = Math.PI;
export const LIMB_X = [-0.44, 0, 0.44];
const HV_Z = -0.14, LV_Z = 0.2;
const LV_X = [-0.45, -0.15, 0.15, 0.45];

export function makePart(parent: THREE.Object3D): Part {
  const outer = group(parent), inner = group(outer);
  return { outer, inner };
}

function dialTex() {
  const { c, x } = makeCanvas(128, 128);
  x.fillStyle = '#F4F4F0'; x.beginPath(); x.arc(64, 64, 62, 0, PI * 2); x.fill();
  x.strokeStyle = '#1D1F23'; x.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const a = PI * 0.75 + (i / 10) * PI * 1.5;
    x.beginPath(); x.moveTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); x.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); x.stroke();
  }
  x.strokeStyle = '#D3271F'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.cos(PI * 1.6) * 44, 64 + Math.sin(PI * 1.6) * 44); x.stroke();
  x.fillStyle = '#1D1F23'; x.beginPath(); x.arc(64, 64, 6, 0, PI * 2); x.fill();
  return canvasTexture(c);
}

function ratingPlate() {
  const { c, x } = makeCanvas(256, 192);
  x.fillStyle = '#C9CCD0'; x.fillRect(0, 0, 256, 192);
  x.strokeStyle = '#3A3F45'; x.lineWidth = 4; x.strokeRect(6, 6, 244, 180);
  x.fillStyle = '#1E2228'; x.font = '700 20px Arial'; x.fillText('TRANSFORMER', 22, 38);
  x.fillStyle = '#6B7179';
  for (let i = 0; i < 7; i++) { x.fillRect(22, 56 + i * 17, 70, 6); x.fillRect(110, 56 + i * 17, 120 - (i % 3) * 22, 6); }
  return canvasTexture(c);
}

export function buildTransformer(M: Mats, parent: THREE.Object3D) {
  const root = group(parent);

  /* ---------- tank, fins, skid ---------- */
  const tank = makePart(root), T = tank.inner;
  contactShadow(T, 2.3, 1.7, 0.55);
  [[-0.62, 0.3], [0.62, 0.3], [-0.62, -0.3], [0.62, -0.3]].forEach(([wx, wz]) => {
    cyl(0.07, 0.07, 0.05, M.black, T, [wx, 0.07, wz], [0, 0, PI / 2]);
    cyl(0.03, 0.03, 0.06, M.steelDark, T, [wx, 0.07, wz], [0, 0, PI / 2], 16);
    box(0.08, 0.08, 0.02, M.tankDark, T, [wx, 0.11, wz + (wz > 0 ? 0.035 : -0.035)]);
  });
  [-0.3, 0.3].forEach(z => box(1.55, 0.1, 0.1, M.tankDark, T, [0, 0.19, z]));
  box(1.44, 0.04, 0.84, M.tankDark, T, [0, 0.26, 0]);
  rbox(1.4, 1.22, 0.8, 0.02, M.tankPaint, T, [0, 0.89, 0]);
  rbox(1.52, 0.045, 0.92, 0.012, M.tankPaint, T, [0, 1.5225, 0]);
  rbox(1.506, 0.012, 0.906, 0.004, M.rubber, T, [0, 1.549, 0]); // cork-rubber gasket under the cover

  // corrugated cooling fins on all four walls
  const finFB = new RoundedBoxGeometry(0.012, 1.02, 0.2, 2, 0.005);
  const finLR = new RoundedBoxGeometry(0.18, 1.02, 0.012, 2, 0.005);
  const fb: { p: V3 }[] = [];
  for (let i = 0; i < 25; i++) { const x = -0.62 + i * (1.24 / 24); fb.push({ p: [x, 0.89, 0.5] }, { p: [x, 0.89, -0.5] }); }
  instanced(finFB, M.tankPaint, T, fb);
  const lr: { p: V3 }[] = [];
  for (let i = 0; i < 13; i++) {
    const z = -0.3 + i * 0.05;
    lr.push({ p: [-0.79, 0.89, z] });
    if (i < 4 || i > 8) lr.push({ p: [0.79, 0.89, z] }); // gap for rating plate + valve
  }
  instanced(finLR, M.tankPaint, T, lr);
  // fin header strips (top and bottom welds)
  [0.37, 1.41].forEach(y => {
    box(1.28, 0.025, 0.22, M.tankPaint, T, [0, y, 0.5]);
    box(1.28, 0.025, 0.22, M.tankPaint, T, [0, y, -0.5]);
  });

  // flange bolts
  const bolts: { p: V3 }[] = [];
  for (let i = 0; i < 14; i++) { const x = -0.7 + i * (1.4 / 13); bolts.push({ p: [x, 1.555, 0.43] }, { p: [x, 1.555, -0.43] }); }
  for (let i = 1; i < 8; i++) { const z = -0.43 + i * (0.86 / 8); bolts.push({ p: [0.73, 1.555, z] }, { p: [-0.73, 1.555, z] }); }
  instanced(new THREE.CylinderGeometry(0.011, 0.011, 0.022, 6), M.steelDark, T, bolts);

  // lifting lugs, rating plate, drain valve, earthing pad
  [[-0.75, 0.42], [0.75, 0.42], [-0.75, -0.42], [0.75, -0.42]].forEach(([lx, lz]) => {
    const lug = rbox(0.08, 0.12, 0.022, 0.008, M.tankPaint, T, [lx, 1.47, lz]);
    lug.rotation.y = lx > 0 ? PI / 2 : -PI / 2;
  });
  box(0.012, 0.2, 0.26, M.tankDark, T, [0.706, 1.02, 0]);
  plane(0.24, 0.18, new THREE.MeshStandardMaterial({ map: ratingPlate(), metalness: 0.55, roughness: 0.4 }), T, [0.713, 1.02, 0], [0, PI / 2, 0]);
  cyl(0.028, 0.028, 0.1, M.brass, T, [0.75, 0.42, 0], [0, 0, PI / 2], 20);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 24), M.red);
  wheel.position.set(0.81, 0.42, 0); wheel.rotation.y = PI / 2; wheel.castShadow = true; T.add(wheel);
  box(0.012, 0.06, 0.1, M.copper, T, [-0.706, 0.42, 0.3]);
  box(0.006, 0.62, 0.03, M.copper, T, [-0.709, 0.68, 0.36]); // earthing strip
  // oil temperature indicator on the end wall
  cyl(0.055, 0.055, 0.04, M.black, T, [0.74, 1.3, 0.2], [0, 0, PI / 2], 28);
  plane(0.085, 0.085, new THREE.MeshStandardMaterial({ map: dialTex(), roughness: 0.2 }), T, [0.761, 1.3, 0.2], [0, PI / 2, 0]);
  cyl(0.006, 0.006, 0.2, M.steelDark, T, [0.72, 1.4, 0.2], undefined, 8);

  /* ---------- core (CRGO, three-limb, stepped section) ---------- */
  const core = makePart(root), C = core.inner;
  const steps: [number, number][] = [[0.15, 0.09], [0.125, 0.13], [0.085, 0.155]];
  LIMB_X.forEach(x => steps.forEach(([w, d]) => box(w, 0.8, d, M.core, C, [x, 0.89, 0])));
  [0.415, 1.365].forEach(y => steps.forEach(([w, d], i) => box(1.03 - i * 0.03, w, d, M.core, C, [0, y, 0])));
  // clamp frames, tie rods, feet
  [0.415, 1.365].forEach(y => [0.094, -0.094].forEach(z => {
    rbox(1.18, 0.17, 0.03, 0.006, M.clamp, C, [0, y, z]);
    [-0.5, -0.22, 0.22, 0.5].forEach(x => cyl(0.012, 0.012, 0.05, M.steelDark, C, [x, y, z], [PI / 2, 0, 0], 8));
  }));
  [-0.57, 0.57].forEach(x => [0.1, -0.1].forEach(z => cyl(0.011, 0.011, 1.0, M.steelDark, C, [x, 0.89, z], undefined, 10)));
  [-0.45, 0.45].forEach(x => box(0.2, 0.05, 0.3, M.clamp, C, [x, 0.31, 0]));

  /* ---------- LV windings: copper foil ---------- */
  const lv = makePart(root), L = lv.inner;
  LIMB_X.forEach(x => {
    lathe([[0.1, 0], [0.14, 0], [0.14, 0.74], [0.1, 0.74], [0.1, 0]], M.copper, L, [x, 0.52, 0], 64);
    [0.52, 1.26].forEach(y => cyl(0.145, 0.145, 0.016, M.pressboard, L, [x, y, 0], undefined, 48));
    box(0.04, 0.2, 0.008, M.copper, L, [x + 0.05, 1.36, 0.135]);
  });

  /* ---------- HV windings: disc coils with spacer sticks ---------- */
  const hv = makePart(root), H = hv.inner;
  const discs = 16, ht = 0.7, dh = ht / discs, ri = 0.155, ro = 0.205;
  const prof: [number, number][] = [[ri, 0], [ro - 0.006, 0]];
  for (let i = 0; i < discs; i++) {
    const y0 = i * dh;
    prof.push([ro, y0 + 0.004], [ro, y0 + dh - 0.007], [ro - 0.008, y0 + dh - 0.002], [ro - 0.008, y0 + dh]);
  }
  prof.push([ri, ht], [ri, 0]);
  const stickGeo = new THREE.BoxGeometry(0.014, ht + 0.02, 0.016);
  LIMB_X.forEach(x => {
    lathe(prof, M.enamel, H, [x, 0.54, 0], 72);
    const sticks: { p: V3; r: V3 }[] = [];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * PI * 2;
      sticks.push({ p: [x + Math.cos(a) * (ro + 0.002), 0.54 + ht / 2, Math.sin(a) * (ro + 0.002)], r: [0, -a, 0] });
    }
    instanced(stickGeo, M.pressboard, H, sticks);
  });
  // delta interconnects across the top, wrapped in paper insulation
  [[-0.22, 0.17], [0.22, 0.17]].forEach(([x, z]) => cyl(0.012, 0.012, 0.44, M.pressboard, H, [x, 1.28, z], [0, 0, PI / 2], 12));
  LIMB_X.forEach(x => cyl(0.01, 0.01, 0.06, M.copper, H, [x, 1.27, 0.17], undefined, 10));

  /* ---------- cover, bushings, conservator ---------- */
  const cover = makePart(root), V = cover.inner;
  rbox(1.5, 0.035, 0.9, 0.01, M.tankPaint, V, [0, 1.5625, 0]);
  const coverBolts: { p: V3 }[] = [];
  for (let i = 0; i < 14; i++) { const x = -0.7 + i * (1.4 / 13); coverBolts.push({ p: [x, 1.588, 0.425] }, { p: [x, 1.588, -0.425] }); }
  for (let i = 1; i < 8; i++) { const z = -0.425 + i * (0.85 / 8); coverBolts.push({ p: [0.725, 1.588, z] }, { p: [-0.725, 1.588, z] }); }
  instanced(new THREE.CylinderGeometry(0.013, 0.013, 0.014, 6), M.steelDark, V, coverBolts);
  const hvProfile: [number, number][] = [[0, 0], [0.05, 0], [0.05, 0.03]];
  for (let i = 0; i < 6; i++) { const y = 0.04 + i * 0.052; hvProfile.push([0.05, y], [0.088, y + 0.014], [0.086, y + 0.022], [0.048, y + 0.04]); }
  hvProfile.push([0.042, 0.36], [0, 0.36]);
  const hvTops: THREE.Vector3[] = [];
  LIMB_X.forEach(x => {
    cyl(0.078, 0.082, 0.03, M.steelDark, V, [x, 1.595, HV_Z], undefined, 24);
    lathe(hvProfile, M.porcelain, V, [x, 1.61, HV_Z], 40);
    cyl(0.036, 0.04, 0.045, M.steelDark, V, [x, 1.99, HV_Z], undefined, 20);
    cyl(0.012, 0.012, 0.07, M.brass, V, [x, 2.045, HV_Z], undefined, 12);
    box(0.045, 0.03, 0.03, M.brass, V, [x, 2.07, HV_Z]);
    hvTops.push(new THREE.Vector3(x, 2.085, HV_Z));
    // arcing horns: one from the cap, one from the flange, with a gap between the tips
    cyl(0.006, 0.006, 0.17, M.steelDark, V, [x + 0.07, 1.96, HV_Z], [0, 0, -0.75], 8);
    cyl(0.006, 0.006, 0.15, M.steelDark, V, [x + 0.075, 1.67, HV_Z], [0, 0, 0.7], 8);
  });
  const lvProfile: [number, number][] = [[0, 0], [0.045, 0], [0.045, 0.02]];
  for (let i = 0; i < 3; i++) { const y = 0.03 + i * 0.045; lvProfile.push([0.045, y], [0.066, y + 0.012], [0.064, y + 0.018], [0.043, y + 0.032]); }
  lvProfile.push([0.036, 0.18], [0, 0.18]);
  const lvTops: THREE.Vector3[] = [];
  LV_X.forEach((x, i) => {
    cyl(0.06, 0.064, 0.025, M.steelDark, V, [x, 1.592, LV_Z], undefined, 24);
    lathe(lvProfile, M.porcelain, V, [x, 1.605, LV_Z], 36);
    cyl(0.016, 0.016, 0.06, M.brass, V, [x, 1.81, LV_Z], undefined, 12);
    box(0.05, 0.075, 0.012, i === 3 ? M.brass : M.copper, V, [x, 1.86, LV_Z]);
    if (i < 3) lvTops.push(new THREE.Vector3(x, 1.9, LV_Z));
  });
  // conservator drum on brackets, Buchholz pipe, breather, oil gauge
  const CZ = -0.43, CY = 2.03;
  cyl(0.14, 0.14, 0.95, M.tankPaint, V, [-0.05, CY, CZ], [0, 0, PI / 2], 40);
  [-0.525, 0.425].forEach(x => cyl(0.146, 0.146, 0.02, M.tankDark, V, [-0.05 + (x > 0 ? 0.475 : -0.475), CY, CZ], [0, 0, PI / 2], 40));
  [-0.33, 0.23].forEach(x => {
    box(0.04, 0.34, 0.05, M.tankDark, V, [x, 1.74, CZ]);
    box(0.12, 0.02, 0.1, M.tankDark, V, [x, 1.59, CZ]);
  });
  cyl(0.024, 0.024, 0.3, M.tankPaint, V, [0.22, 1.73, -0.33], undefined, 16);
  box(0.1, 0.08, 0.08, M.tankDark, V, [0.22, 1.74, -0.33]);
  cyl(0.012, 0.012, 0.12, M.steelDark, V, [-0.58, CY, CZ], [0, 0, PI / 2], 10);
  cyl(0.012, 0.012, 0.18, M.steelDark, V, [-0.64, CY - 0.09, CZ], undefined, 10);
  cyl(0.036, 0.036, 0.15, M.glass, V, [-0.64, CY - 0.26, CZ], undefined, 20);
  cyl(0.03, 0.03, 0.13, M.silica, V, [-0.64, CY - 0.26, CZ], undefined, 16);
  cyl(0.04, 0.04, 0.02, M.steelDark, V, [-0.64, CY - 0.18, CZ], undefined, 20);
  cyl(0.04, 0.04, 0.02, M.steelDark, V, [-0.64, CY - 0.34, CZ], undefined, 20);
  cyl(0.055, 0.055, 0.018, M.white, V, [0.435, CY, CZ], [0, 0, PI / 2], 28);
  box(0.004, 0.045, 0.006, M.red, V, [0.446, CY + 0.012, CZ], [0.6, 0, 0]);
  // off-circuit tap switch and pressure relief valve
  cyl(0.05, 0.05, 0.06, M.tankDark, V, [0.6, 1.61, 0.32], undefined, 24);
  box(0.12, 0.022, 0.03, M.black, V, [0.6, 1.65, 0.32]);
  cyl(0.034, 0.034, 0.05, M.tankDark, V, [-0.6, 1.605, 0.32], undefined, 20);
  cyl(0.04, 0.04, 0.012, M.yellow, V, [-0.6, 1.635, 0.32], undefined, 20);

  return {
    root,
    parts: { tank, core, lv, hv, cover },
    hvTops, lvTops,
    anchors: {
      tank: new THREE.Vector3(-0.6, 1.3, 0.6),
      cover: new THREE.Vector3(0.44, 2.09, HV_Z),
      hv: new THREE.Vector3(0.44 + ro, 1.05, 0),
      lv: new THREE.Vector3(0.44 + 0.14, 0.62, 0.04),
      core: new THREE.Vector3(-0.5, 1.45, 0.09),
    },
  };
}

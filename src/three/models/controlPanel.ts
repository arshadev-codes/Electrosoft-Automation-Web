import * as THREE from 'three';
import { box, rbox, cyl, instanced, plane, group, makeCanvas, canvasTexture, contactShadow, glowSprite, type V3 } from '../kit';
import type { Mats } from '../materials';
import { dangerTex, labelTex, louvres, meterTex, seams, swingHandle } from './testBench';
import { mergeStatic } from '../optimize';

/*
 * Two-section Electrosoft MCC: power section (incomer, R-Y-B-N busbars, MCCB feeders) on the left,
 * control section (PLC, VFD, contactors, MCBs on an orange plate) on the right, behind two doors.
 * Local space: origin at floor centre, +Z = front, units ≈ metres.
 */

const PI = Math.PI;
const BRAND = '#0B5BD3';
const W = 1.7, H = 2.2, D = 0.6, BASE = 0.1;
const FZ = D / 2; // front face

function nameplate() {
  const { c, x } = makeCanvas(640, 104);
  x.fillStyle = '#E9EAE6'; x.fillRect(0, 0, 640, 104);
  x.fillStyle = BRAND;
  x.beginPath(); x.moveTo(52, 14); x.lineTo(24, 54); x.lineTo(40, 54); x.lineTo(34, 90); x.lineTo(66, 46); x.lineTo(50, 46); x.closePath(); x.fill();
  x.fillStyle = '#16181C'; x.font = '800 46px Arial'; x.textBaseline = 'middle'; x.fillText('ELECTROSOFT', 84, 42);
  x.fillStyle = '#5B616B'; x.font = '700 19px Arial'; x.fillText('MOTOR CONTROL CENTRE · MCC-01', 86, 80);
  return canvasTexture(c);
}

/** Door HMI: drive status and live readings, redrawn a few times a second. */
function createHMI() {
  const { c, x } = makeCanvas(512, 320);
  const tex = canvasTexture(c);
  const vals = [['415', 'V'], ['49.9', 'Hz'], ['62', 'A']];
  let last = -1;
  function draw(t: number) {
    const tick = Math.floor(t * 4);
    if (tick === last) return;
    last = tick;
    x.fillStyle = '#0A0D13'; x.fillRect(0, 0, 512, 320);
    x.fillStyle = BRAND; x.fillRect(0, 0, 512, 48);
    x.fillStyle = '#fff'; x.font = '700 22px Arial'; x.textBaseline = 'middle'; x.fillText('ELECTROSOFT · MCC-01', 18, 25);
    x.fillStyle = '#30D158'; x.beginPath(); x.arc(430, 25, 7, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = '700 18px Arial'; x.fillText('RUN', 446, 25);
    // motor bars: four drives, loads drifting
    for (let i = 0; i < 4; i++) {
      const y = 76 + i * 38, v = 0.55 + 0.3 * Math.sin(t * 0.8 + i * 1.7);
      x.fillStyle = '#7F8A9C'; x.font = '600 15px Arial'; x.fillText(`M${i + 1}`, 18, y + 10);
      x.fillStyle = '#151A23'; x.fillRect(60, y, 420, 20);
      x.fillStyle = i === 2 ? '#FFB000' : '#3D86FF'; x.fillRect(60, y, 420 * v, 20);
    }
    vals.forEach(([v, u], i) => {
      const bx = 14 + i * 166;
      x.fillStyle = '#151A23'; x.fillRect(bx, 240, 154, 64);
      x.fillStyle = '#7F8A9C'; x.font = '600 14px Arial'; x.fillText(u, bx + 12, 258);
      x.fillStyle = '#fff'; x.font = '700 26px Arial'; x.fillText(v, bx + 12, 286);
    });
    tex.needsUpdate = true;
  }
  draw(0);
  return { tex, draw };
}

/** A door hinged on its outer edge. `side` -1 = left door (hinge at -W/2), 1 = right door. */
function door(root: THREE.Object3D, M: Mats, side: -1 | 1) {
  const pivot = group(root, [side * W / 2, 0, FZ]);
  const face = group(pivot); // door content, in pivot space: the door runs from 0 toward the centre
  const dw = W / 2 - 0.01, cx = -side * dw / 2;
  rbox(dw, H - BASE - 0.04, 0.025, 0.008, M.benchPaint, face, [cx, BASE + (H - BASE) / 2, 0.0125]);
  seams(face, M.plinth, cx, BASE + (H - BASE) / 2, dw - 0.08, H - BASE - 0.12, 0.026);
  swingHandle(face, M, cx - side * (dw / 2 - 0.07), 1.12, 0.025);
  louvres(face, M, [[cx, 0.24]], 7, dw - 0.3, 0.026);
  return { pivot, face, cx, z: 0.026 };
}

export function buildControlPanel(M: Mats, parent: THREE.Object3D) {
  const root = group(parent);

  /* ---------- cabinet body ---------- */
  const body = group(root);
  contactShadow(body, 2.5, 1.3, 0.55);
  box(W, BASE, D, M.plinth, body, [0, BASE / 2, 0]);
  rbox(W, H - BASE, 0.02, 0.006, M.benchPaint, body, [0, BASE + (H - BASE) / 2, -D / 2 + 0.01]);
  [-1, 1].forEach(s => rbox(0.02, H - BASE, D, 0.006, M.benchPaint, body, [s * (W / 2 - 0.01), BASE + (H - BASE) / 2, 0]));
  rbox(W, 0.02, D, 0.006, M.benchPaint, body, [0, H - 0.01, 0]);
  rbox(0.02, H - BASE, D - 0.04, 0.006, M.benchPaint, body, [0, BASE + (H - BASE) / 2, -0.02]); // section divider
  [-0.55, 0.55].forEach(dx => {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 20), M.steelDark);
    eye.position.set(dx, H + 0.045, 0); eye.castShadow = true; body.add(eye);
  });
  // gland plate cut-outs on the roof, cable entry
  for (let i = 0; i < 5; i++) cyl(0.022, 0.026, 0.03, M.black, body, [-0.6 + i * 0.12, H + 0.012, -0.12], undefined, 14);

  /* ---------- power section (left): incomer, busbars, feeders ---------- */
  const inner = group(root);
  const LX = -W / 4, BZ = -D / 2 + 0.04;
  box(W / 2 - 0.08, H - 0.3, 0.012, M.steel, inner, [LX, H / 2 + 0.05, BZ]);
  rbox(0.36, 0.38, 0.24, 0.012, M.black, inner, [LX - 0.12, 1.82, BZ + 0.13]); // ACB incomer
  rbox(0.24, 0.12, 0.02, 0.006, M.grey, inner, [LX - 0.12, 1.88, BZ + 0.255]);
  cyl(0.03, 0.03, 0.03, M.red, inner, [LX - 0.04, 1.74, BZ + 0.26], [PI / 2, 0, 0], 16);
  cyl(0.03, 0.03, 0.03, M.ledG, inner, [LX - 0.2, 1.74, BZ + 0.26], [PI / 2, 0, 0], 16);
  // R Y B N main busbars, run through both sections
  [1.5, 1.42, 1.34, 1.26].forEach((y, i) => {
    box(W - 0.1, 0.055, 0.012, M.copper, inner, [0, y, BZ + 0.06]);
    box(0.02, 0.055, 0.014, [M.lampR, M.lampY, M.lampB, M.black][i], inner, [-W / 2 + 0.1, y, BZ + 0.067]);
  });
  [-0.6, -0.2, 0.2, 0.6].forEach(dx => box(0.05, 0.32, 0.08, M.clampRed, inner, [dx, 1.38, BZ + 0.03]));
  [-0.22, -0.14, -0.06].forEach(dx => box(0.03, 0.26, 0.01, M.copper, inner, [LX + dx, 1.65, BZ + 0.05]));
  // two rows of MCCB feeders
  [1.0, 0.68].forEach(y => {
    for (let i = 0; i < 3; i++) {
      const fx = LX - 0.25 + i * 0.25;
      rbox(0.17, 0.25, 0.14, 0.01, M.black, inner, [fx, y, BZ + 0.08]);
      box(0.045, 0.075, 0.03, M.grey, inner, [fx, y + 0.02, BZ + 0.165]);
    }
  });
  box(W / 2 - 0.12, 0.06, 0.07, M.duct, inner, [LX, 0.42, BZ + 0.05]);
  for (let i = 0; i < 16; i++) box(0.035, 0.1, 0.07, i % 6 === 5 ? M.termE : M.termG, inner, [LX - 0.3 + i * 0.04, 0.28, BZ + 0.05]);

  /* ---------- control section (right): PLC, VFD, contactors, MCBs ---------- */
  const RX = W / 4;
  box(W / 2 - 0.08, H - 0.3, 0.012, M.plate, inner, [RX, H / 2 + 0.05, BZ]);
  [1.86, 1.12, 0.84, 0.56].forEach(y => box(W / 2 - 0.16, 0.035, 0.008, M.rail, inner, [RX, y, BZ + 0.012]));
  [1.98, 1.0, 0.7].forEach(y => box(W / 2 - 0.12, 0.05, 0.06, M.duct, inner, [RX, y, BZ + 0.036]));
  // PLC rack with I/O cards and status LEDs
  const leds: { p: V3 }[] = [], ledsO: { p: V3 }[] = [];
  for (let i = 0; i < 8; i++) {
    const x = RX - 0.3 + i * 0.065;
    box(0.06, 0.17, 0.1, i === 0 ? M.grey : M.module, inner, [x, 1.86, BZ + 0.06]);
    for (let k = 0; k < 4; k++) (k === 3 && i % 2 ? ledsO : leds).push({ p: [x - 0.015, 1.91 - k * 0.018, BZ + 0.111] });
  }
  instanced(new THREE.BoxGeometry(0.008, 0.008, 0.004), M.ledG, inner, leds);
  instanced(new THREE.BoxGeometry(0.008, 0.008, 0.004), M.ledO, inner, ledsO);
  // VFD with its keypad screen
  rbox(0.2, 0.36, 0.16, 0.012, M.module, inner, [RX + 0.25, 1.46, BZ + 0.09]);
  plane(0.1, 0.05, new THREE.MeshBasicMaterial({ map: meterTex('48.6', 'Hz', '#30D158'), toneMapped: false }), inner, [RX + 0.25, 1.55, BZ + 0.171]);
  for (let k = 0; k < 6; k++) box(0.026, 0.016, 0.008, M.black, inner, [RX + 0.21 + (k % 3) * 0.04, 1.47 - Math.floor(k / 3) * 0.03, BZ + 0.172]);
  // contactors + overload relays
  for (let i = 0; i < 5; i++) {
    const x = RX - 0.32 + i * 0.1;
    box(0.085, 0.13, 0.11, M.grey, inner, [x, 1.12, BZ + 0.067]);
    box(0.05, 0.035, 0.012, M.black, inner, [x, 1.14, BZ + 0.128]);
    box(0.085, 0.06, 0.09, M.black, inner, [x, 1.02, BZ + 0.057]);
  }
  // MCB row and terminals
  for (let i = 0; i < 14; i++) {
    const x = RX - 0.33 + i * 0.05;
    box(0.045, 0.09, 0.075, M.white, inner, [x, 0.84, BZ + 0.05]);
    box(0.014, 0.025, 0.02, i % 5 === 0 ? M.red : M.black, inner, [x, 0.85, BZ + 0.095]);
  }
  for (let i = 0; i < 18; i++) box(0.022, 0.085, 0.075, i % 3 === 2 ? M.white : M.termB, inner, [RX - 0.3 + i * 0.034, 0.56, BZ + 0.05]);

  /* ---------- doors ---------- */
  const left = door(root, M, -1), right = door(root, M, 1);
  // left door: analogue meters, R Y B lamps, selector, danger plate
  const L = left.face, lz = left.z, lc = left.cx;
  [-0.16, 0.06].forEach(dx => {
    box(0.15, 0.15, 0.02, M.black, L, [lc + dx, 1.78, lz + 0.01]);
    plane(0.13, 0.13, M.white, L, [lc + dx, 1.78, lz + 0.021]);
    box(0.004, 0.06, 0.002, M.red, L, [lc + dx + 0.012, 1.78, lz + 0.023], [0, 0, -0.7]);
  });
  plane(0.17, 0.026, new THREE.MeshStandardMaterial({ map: labelTex('INCOMER'), roughness: 0.35 }), L, [lc - 0.05, 1.92, lz + 0.002]);
  const lampGlows: THREE.Sprite[] = [];
  [M.lampR, M.lampY, M.lampB].forEach((m, i) => {
    const lx = lc - 0.16 + i * 0.1;
    cyl(0.03, 0.03, 0.02, M.black, L, [lx, 1.56, lz + 0.01], [PI / 2, 0, 0], 20);
    cyl(0.022, 0.022, 0.022, m, L, [lx, 1.56, lz + 0.025], [PI / 2, 0, 0], 20);
    lampGlows.push(glowSprite(L, [0xff453a, 0xffd60a, 0x0a84ff][i], 0.17, [lx, 1.56, lz + 0.05], 0.75));
  });
  cyl(0.045, 0.045, 0.03, M.black, L, [lc + 0.18, 1.56, lz + 0.015], [PI / 2, 0, 0], 24);
  box(0.016, 0.07, 0.03, M.white, L, [lc + 0.18, 1.56, lz + 0.035], [0, 0, 0.5]);
  plane(0.16, 0.12, new THREE.MeshStandardMaterial({ map: dangerTex(), roughness: 0.4 }), L, [lc, 1.32, lz + 0.002]);
  // right door: nameplate, drive HMI, push buttons
  const R = right.face, rz = right.z, rc = right.cx;
  plane(0.62, 0.1, new THREE.MeshStandardMaterial({ map: nameplate(), roughness: 0.4, metalness: 0.3 }), R, [rc, 1.98, rz + 0.002]);
  const hmi = createHMI();
  rbox(0.42, 0.28, 0.03, 0.012, M.black, R, [rc, 1.7, rz + 0.012]);
  plane(0.38, 0.24, new THREE.MeshBasicMaterial({ map: hmi.tex, toneMapped: false }), R, [rc, 1.7, rz + 0.028]);
  const hmiGlow = glowSprite(R, 0x3d86ff, 0.8, [rc, 1.7, rz + 0.06], 0.16);
  [M.ledG, M.red, M.ledG, M.red, M.lampY].forEach((m, i) => {
    const bx = rc - 0.2 + i * 0.1;
    cyl(0.026, 0.026, 0.014, M.black, R, [bx, 1.44, rz + 0.007], [PI / 2, 0, 0], 20);
    cyl(0.02, 0.02, 0.016, m, R, [bx, 1.44, rz + 0.02], [PI / 2, 0, 0], 20);
  });
  cyl(0.05, 0.05, 0.012, M.yellow, R, [rc + 0.12, 1.24, rz + 0.006], [PI / 2, 0, 0], 28);
  cyl(0.04, 0.03, 0.035, M.red, R, [rc + 0.12, 1.24, rz + 0.026], [PI / 2, 0, 0], 28);

  // bake each rigid group into a few draw calls
  [body, inner, left.face, right.face].forEach(g => mergeStatic(g));

  return {
    root,
    anchors: {
      busbars: new THREE.Vector3(-0.55, 1.5, BZ + 0.07),
      plc: new THREE.Vector3(RX - 0.1, 1.95, BZ + 0.11),
      door: new THREE.Vector3(W / 2 - 0.05, 0.6, FZ + 0.03),
    },
    /** open: 0 = doors shut, 1 = swung wide. */
    update(t: number, open: number) {
      const a = open * 1.55; // stops short of flat so the door instruments stay in view
      left.pivot.rotation.y = -a;
      right.pivot.rotation.y = a;
      hmi.draw(t);
      hmiGlow.material.opacity = 0.14 + 0.04 * Math.sin(t * 3);
      lampGlows.forEach((g, i) => { g.material.opacity = 0.65 + 0.15 * Math.sin(t * 2 + i); });
    },
  };
}

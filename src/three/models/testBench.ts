import * as THREE from 'three';
import { box, rbox, cyl, instanced, plane, group, mesh, makeCanvas, canvasTexture, contactShadow, glowSprite, type V3 } from '../kit';
import type { Mats } from '../materials';
import { makePart } from './transformer';

/*
 * Electrosoft transformer test bench: sloped control desk + upper meter panel
 * with the X'mer Prime™ HMI, PLC/RIO plate inside, and a power panel beside it.
 * Local space: origin at floor centre, +Z = operator side, units ≈ metres.
 */

const PI = Math.PI;
const BRAND = '#0B5BD3';

// TODO: CONFIRM — tests list is still [CONFIRM] in CONTENT.md; names reused from the prototype.
const TESTS = ['Winding resistance', 'Ratio & vector group', 'No-load loss', 'Load loss & impedance', 'Induced over-voltage', 'Report generated'];

/** Extrudes a side profile given as (z, y) pairs across the bench width (X). */
function sideExtrude(profile: [number, number][], width: number) {
  const s = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
  g.translate(0, 0, -width / 2);
  g.rotateY(PI / 2);
  return g;
}

function nameplate() {
  const { c, x } = makeCanvas(640, 104);
  x.fillStyle = '#E9EAE6'; x.fillRect(0, 0, 640, 104);
  x.fillStyle = BRAND;
  x.beginPath(); x.moveTo(52, 14); x.lineTo(24, 54); x.lineTo(40, 54); x.lineTo(34, 90); x.lineTo(66, 46); x.lineTo(50, 46); x.closePath(); x.fill();
  x.fillStyle = '#16181C'; x.font = '800 46px Arial'; x.textBaseline = 'middle'; x.fillText('ELECTROSOFT', 84, 42);
  x.fillStyle = '#5B616B'; x.font = '700 19px Arial'; x.fillText('TRANSFORMER TEST BENCH', 86, 80);
  return canvasTexture(c);
}

function dangerTex() {
  const { c, x } = makeCanvas(256, 192);
  x.fillStyle = '#F4F4F0'; x.fillRect(0, 0, 256, 192);
  x.fillStyle = '#D3271F'; x.fillRect(0, 0, 256, 52);
  x.fillStyle = '#fff'; x.font = '800 36px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DANGER', 128, 28);
  x.fillStyle = '#D3271F';
  x.beginPath(); x.moveTo(140, 66); x.lineTo(98, 128); x.lineTo(124, 128); x.lineTo(112, 178); x.lineTo(160, 112); x.lineTo(134, 112); x.closePath(); x.fill();
  return canvasTexture(c);
}

const METER_LABELS = ['VOLTAGE', 'HV VOLTAGE', 'FREQUENCY', 'POWER FACTOR', 'CURRENT', 'POWER'];

/** Engraved traffolyte label: white letters cut through black. */
function labelTex(text: string) {
  const { c, x } = makeCanvas(256, 40);
  x.fillStyle = '#16181C'; x.fillRect(0, 0, 256, 40);
  x.fillStyle = '#F2F2EE'; x.font = '700 22px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 21);
  return canvasTexture(c);
}

/** Recessed door gap drawn as a thin dark rectangle on a panel face. */
function seams(parent: THREE.Object3D, mat: THREE.Material, cx: number, cy: number, w: number, h: number, z: number) {
  const t = 0.005;
  box(w, t, t, mat, parent, [cx, cy + h / 2, z]);
  box(w, t, t, mat, parent, [cx, cy - h / 2, z]);
  box(t, h, t, mat, parent, [cx - w / 2, cy, z]);
  box(t, h, t, mat, parent, [cx + w / 2, cy, z]);
}

/** Panel swing handle: escutcheon plate, lock barrel, lever. */
function swingHandle(parent: THREE.Object3D, M: Mats, x: number, y: number, z: number) {
  rbox(0.034, 0.13, 0.012, 0.005, M.black, parent, [x, y, z + 0.006]);
  cyl(0.009, 0.009, 0.014, M.steelDark, parent, [x, y + 0.042, z + 0.014], [PI / 2, 0, 0], 12);
  rbox(0.018, 0.085, 0.016, 0.006, M.black, parent, [x, y - 0.012, z + 0.02]);
}

/** Pressed ventilation louvres: angled lips over dark slots. */
function louvres(parent: THREE.Object3D, M: Mats, origins: [number, number][], rows: number, w: number, z: number) {
  const lips: { p: V3; r: V3 }[] = [], slots: { p: V3 }[] = [];
  origins.forEach(([x, y0]) => {
    for (let i = 0; i < rows; i++) {
      const y = y0 + i * 0.03;
      slots.push({ p: [x, y, z] });
      lips.push({ p: [x, y + 0.004, z + 0.008], r: [-0.65, 0, 0] });
    }
  });
  instanced(new THREE.BoxGeometry(w, 0.014, 0.003), M.plinth, parent, slots);
  instanced(new THREE.BoxGeometry(w, 0.018, 0.004), M.benchPaint, parent, lips);
}

function mimic() {
  const W = 1300, H = 360;
  const { c, x } = makeCanvas(W, H);
  x.fillStyle = '#DADDD8'; x.fillRect(0, 0, W, H);
  x.lineWidth = 7; x.lineCap = 'round';
  x.strokeStyle = BRAND;
  x.beginPath(); x.moveTo(60, 70); x.lineTo(1240, 70); x.stroke();
  [180, 420, 660, 900].forEach(px => { x.beginPath(); x.moveTo(px, 70); x.lineTo(px, 250); x.stroke(); });
  x.strokeStyle = '#C0261D';
  x.beginPath(); x.moveTo(1050, 70); x.lineTo(1050, 300); x.stroke();
  x.lineWidth = 5; x.strokeStyle = '#1D1F23';
  [180, 420, 660, 900].forEach(px => { x.strokeRect(px - 22, 120, 44, 44); });
  x.beginPath(); x.arc(1050, 170, 34, 0, PI * 2); x.stroke();
  x.beginPath(); x.arc(1050, 216, 34, 0, PI * 2); x.stroke();
  x.fillStyle = '#1D1F23'; x.font = '700 22px Arial';
  ['INCOMER', 'MG SET', 'DIMMER', 'CAP BANK'].forEach((t, i) => x.fillText(t, [180, 420, 660, 900][i] - 44, 300));
  x.fillText('UNIT UNDER TEST', 960, 340);
  return canvasTexture(c);
}

function meterTex(value: string, unit: string, col: string) {
  const { c, x } = makeCanvas(256, 112);
  x.fillStyle = '#0B0C0E'; x.fillRect(0, 0, 256, 112);
  x.fillStyle = col; x.font = '700 62px "Courier New", monospace'; x.textBaseline = 'middle';
  x.shadowColor = col; x.shadowBlur = 12;
  x.fillText(value, 14, 58);
  x.shadowBlur = 0; x.fillStyle = '#8A919C'; x.font = '700 20px Arial'; x.fillText(unit, 214, 90);
  return canvasTexture(c);
}

/** X'mer Prime™ HMI, redrawn each frame from the test progress. */
function createHMI() {
  const W = 960, H = 600, SCALE = 0.75; // drawn in 960×600 units onto a 720×450 canvas
  const { c, x } = makeCanvas(W * SCALE, H * SCALE);
  x.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  const tex = canvasTexture(c);
  let last = -1;
  function draw(t: number, test: number, glow: number) {
    if (t - last < 1 / 15) return; // 15 fps is plenty for a screen texture
    last = t;
    x.fillStyle = '#0A0D13'; x.fillRect(0, 0, W, H);
    x.fillStyle = BRAND; x.fillRect(0, 0, W, 64);
    x.fillStyle = '#fff'; x.font = '800 30px Arial'; x.textBaseline = 'middle';
    x.fillText("X'mer Prime™", 24, 33);
    x.font = '600 18px Arial'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('BAY 01 · FULLY AUTOMATIC', 236, 34);
    const state = test >= 1 ? 'PASS' : test > 0.02 ? 'RUNNING' : 'READY';
    const sc = state === 'PASS' ? '#30D158' : state === 'RUNNING' ? '#FFD60A' : '#9AA3B2';
    x.fillStyle = sc; x.beginPath(); x.arc(W - 150, 33, 8, 0, 7); x.fill();
    x.font = '700 20px Arial'; x.fillText(state, W - 132, 34);

    // test list
    TESTS.forEach((name, i) => {
      const y = 104 + i * 68, a = i / TESTS.length, b = (i + 1) / TESTS.length;
      const st = test >= b ? (i === TESTS.length - 1 ? 'AUTO' : 'PASS') : test >= a ? 'RUNNING' : 'QUEUED';
      const col = st === 'RUNNING' ? '#FFD60A' : st === 'QUEUED' ? '#5E6672' : '#30D158';
      x.fillStyle = '#121822'; x.fillRect(20, y - 26, 410, 56);
      x.fillStyle = col; x.fillRect(20, y - 26, 5, 56);
      x.fillStyle = '#E8ECF2'; x.font = '600 21px Arial'; x.fillText(name, 40, y + 2);
      x.fillStyle = col; x.font = '700 15px "Courier New", monospace'; x.fillText(st, 340, y + 2);
    });

    // R Y B waveform
    const gx = 452, gy = 82, gw = 488, gh = 300;
    x.fillStyle = '#0F141D'; x.fillRect(gx, gy, gw, gh);
    x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 1;
    for (let i = 0; i <= gw; i += 40) { x.beginPath(); x.moveTo(gx + i, gy); x.lineTo(gx + i, gy + gh); x.stroke(); }
    for (let j = 0; j <= gh; j += 40) { x.beginPath(); x.moveTo(gx, gy + j); x.lineTo(gx + gw, gy + j); x.stroke(); }
    const amp = 18 + glow * 100;
    ([['#FF453A', 0], ['#FFD60A', 2.094], ['#0A84FF', 4.188]] as const).forEach(([col, ph]) => {
      x.strokeStyle = col; x.lineWidth = 3.5; x.beginPath();
      for (let i = 0; i <= gw; i += 4) {
        const y = gy + gh / 2 + Math.sin(i / 46 + t * 3 + ph) * amp;
        if (i) x.lineTo(gx + i, y); else x.moveTo(gx + i, y);
      }
      x.stroke();
    });
    x.fillStyle = '#9AA3B2'; x.font = '700 16px "Courier New", monospace'; x.fillText('R  Y  B', gx + 14, gy + 22);

    // readouts
    const vals = [['VOLTAGE', (415 * (0.2 + glow * 0.8)).toFixed(1) + ' V'], ['FREQ', '50.0 Hz'], ['PF', (0.9 + glow * 0.08).toFixed(2)]];
    vals.forEach(([k, v], i) => {
      const bx = gx + i * 166;
      x.fillStyle = '#151A23'; x.fillRect(bx, 398, 156, 88);
      x.fillStyle = '#7F8A9C'; x.font = '600 15px Arial'; x.fillText(k, bx + 14, 422);
      x.fillStyle = '#fff'; x.font = '700 30px Arial'; x.fillText(v, bx + 14, 460);
    });

    // sequence progress
    x.fillStyle = '#1A212C'; x.fillRect(20, 530, W - 40, 14);
    x.fillStyle = BRAND; x.fillRect(20, 530, (W - 40) * Math.min(1, test), 14);
    x.fillStyle = '#9AA3B2'; x.font = '600 16px Arial';
    x.fillText(test >= 1 ? 'Report generated · synced to ERP' : 'Auto sequence · ' + Math.round(Math.min(1, test) * 100) + '%', 20, 568);
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

export function buildTestBench(M: Mats, parent: THREE.Object3D) {
  const root = group(parent);
  const screen = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, toneMapped: false });

  /* ---------- shell: desk, upper housing, power panel ---------- */
  const bench = makePart(root), S = bench.inner;
  box(1.5, 0.08, 0.75, M.plinth, S, [0, 0.04, 0.005]);
  mesh(sideExtrude([[0.38, 0.08], [0.38, 0.8], [-0.02, 0.98], [-0.37, 0.98], [-0.37, 0.08]], 1.5 - 0.016), M.benchPaint, S);
  contactShadow(S, 2.2, 1.3, 0.5, [0, 0.003, 0]);
  rbox(0.03, 0.94, 0.35, 0.008, M.benchPaint, S, [-0.735, 1.45, -0.195]);
  rbox(0.03, 0.94, 0.35, 0.008, M.benchPaint, S, [0.735, 1.45, -0.195]);
  rbox(1.5, 0.94, 0.03, 0.008, M.benchPaint, S, [0, 1.45, -0.355]);
  // lower doors: recessed seams, swing handles, pressed louvres
  [-0.36, 0.36].forEach(cx => seams(S, M.plinth, cx, 0.44, 0.68, 0.66, 0.389));
  [-0.09, 0.09].forEach(x => swingHandle(S, M, x, 0.56, 0.39));
  louvres(S, M, [[-0.4, 0.2], [0.4, 0.2]], 6, 0.3, 0.389);
  // insulating rubber mats where the operator stands
  const mat = new THREE.MeshStandardMaterial({ color: 0x4A4F57, roughness: 0.9 });
  rbox(1.3, 0.008, 0.5, 0.004, mat, S, [0, 0.004, 0.7]);
  rbox(0.85, 0.008, 0.42, 0.004, mat, S, [-1.28, 0.004, 0.48]);

  /* ---------- roof: canopy, cable glands, HV beacon (lifts off when exploded) ---------- */
  const roof = makePart(root), R = roof.inner;
  rbox(1.53, 0.04, 0.42, 0.01, M.benchPaint, R, [0, 1.94, -0.175]);
  rbox(1.53, 0.05, 0.03, 0.01, M.plinth, R, [0, 1.935, 0.03]);
  // HV warning beacon: red while a test is live, green when it passes
  cyl(0.05, 0.055, 0.04, M.black, R, [-0.5, 1.98, -0.2], undefined, 24);
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff2a1f, emissive: 0xff2a1f, emissiveIntensity: 0.2, roughness: 0.3, transparent: true, opacity: 0.92 });
  cyl(0.042, 0.042, 0.08, beaconMat, R, [-0.5, 2.04, -0.2], undefined, 24);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.042, 24, 12, 0, PI * 2, 0, PI / 2), beaconMat);
  dome.position.set(-0.5, 2.08, -0.2); R.add(dome);
  const beaconGlow = glowSprite(R, 0xff3b30, 0.7, [-0.5, 2.05, -0.2], 0);
  // cable gland box, where the test leads leave
  rbox(0.56, 0.08, 0.16, 0.01, M.benchPaint, R, [0.32, 2.0, -0.24]);
  const glands: V3[] = [];
  for (let i = 0; i < 6; i++) {
    const gx = 0.1 + i * 0.088;
    cyl(0.018, 0.022, 0.035, M.black, R, [gx, 2.055, -0.24], undefined, 12);
    glands.push([gx, 2.07, -0.24]);
  }

  /* ---------- power panel beside the desk: open cabinet body ---------- */
  const PX = -1.28, PZ = -0.07;
  contactShadow(S, 1.5, 1.1, 0.5, [PX, 0.003, PZ]);
  box(1.0, 0.08, 0.62, M.plinth, S, [PX, 0.04, PZ]);
  rbox(1.0, 2.1, 0.02, 0.006, M.benchPaint, S, [PX, 1.13, PZ - 0.29]);
  [-0.49, 0.49].forEach(dx => rbox(0.02, 2.1, 0.6, 0.006, M.benchPaint, S, [PX + dx, 1.13, PZ]));
  rbox(1.0, 0.02, 0.6, 0.006, M.benchPaint, S, [PX, 2.17, PZ]);
  rbox(1.0, 0.02, 0.6, 0.006, M.benchPaint, S, [PX, 0.09, PZ]);
  [-0.3, 0.3].forEach(dx => {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 8, 20), M.steelDark);
    eye.position.set(PX + dx, 2.215, PZ); eye.castShadow = true; S.add(eye);
  });
  [0.45, 1.13, 1.8].forEach(y => cyl(0.012, 0.012, 0.09, M.steelDark, S, [PX - 0.49, y, PZ + 0.3], undefined, 10));

  /* ---------- power panel internals: incomer breaker, copper busbars, feeders ---------- */
  const pInt = makePart(root), P = pInt.inner;
  box(0.9, 1.9, 0.012, M.steel, P, [PX, 1.13, PZ - 0.27]);
  rbox(0.34, 0.36, 0.22, 0.012, M.black, P, [PX - 0.16, 1.78, PZ - 0.15]); // air circuit breaker
  rbox(0.22, 0.12, 0.02, 0.006, M.grey, P, [PX - 0.16, 1.84, PZ - 0.035]);
  cyl(0.03, 0.03, 0.03, M.red, P, [PX - 0.08, 1.7, PZ - 0.03], [PI / 2, 0, 0], 16);
  cyl(0.03, 0.03, 0.03, M.ledG, P, [PX - 0.24, 1.7, PZ - 0.03], [PI / 2, 0, 0], 16);
  // R Y B N horizontal busbars on insulator supports
  [1.42, 1.34, 1.26, 1.18].forEach((y, i) => {
    box(0.8, 0.05, 0.012, M.copper, P, [PX, y, PZ - 0.17]);
    box(0.02, 0.05, 0.014, [M.lampR, M.lampY, M.lampB, M.black][i], P, [PX - 0.36, y, PZ - 0.163]);
  });
  [-0.3, 0, 0.3].forEach(dx => box(0.05, 0.3, 0.07, M.clampRed, P, [PX + dx, 1.3, PZ - 0.21]));
  // vertical risers from the incomer to the bus
  [-0.24, -0.16, -0.08].forEach(dx => box(0.03, 0.3, 0.01, M.copper, P, [PX + dx, 1.58, PZ - 0.19]));
  // outgoing MCCB feeders
  for (let i = 0; i < 4; i++) {
    const fx = PX - 0.32 + i * 0.21;
    rbox(0.16, 0.24, 0.13, 0.01, M.black, P, [fx, 0.88, PZ - 0.2]);
    box(0.04, 0.07, 0.03, M.grey, P, [fx, 0.9, PZ - 0.12]);
  }
  box(0.82, 0.06, 0.07, M.duct, P, [PX, 0.62, PZ - 0.23]);
  for (let i = 0; i < 18; i++) box(0.035, 0.1, 0.07, i % 6 === 5 ? M.termE : M.termG, P, [PX - 0.33 + i * 0.039, 0.45, PZ - 0.23]);

  /* ---------- power panel door with its meters, lamps and switches ---------- */
  const pDoor = makePart(root), PD = pDoor.inner;
  const DZ = PZ + 0.3;
  rbox(0.98, 2.06, 0.025, 0.008, M.benchPaint, PD, [PX, 1.13, DZ]);
  [-0.245, 0.245].forEach(dx => seams(PD, M.plinth, PX + dx, 1.13, 0.47, 1.98, DZ + 0.013));
  [-0.06, 0.06].forEach(dx => swingHandle(PD, M, PX + dx, 1.12, DZ + 0.013));
  louvres(PD, M, [[PX - 0.27, 0.22], [PX + 0.27, 0.22]], 8, 0.26, DZ + 0.013);
  plane(0.16, 0.12, new THREE.MeshStandardMaterial({ map: dangerTex(), roughness: 0.4 }), PD, [PX + 0.25, 1.32, DZ + 0.014]);
  [M.lampR, M.lampY, M.lampB].forEach((m, i) => {
    const lx = PX - 0.36 + i * 0.1;
    cyl(0.03, 0.03, 0.02, M.black, PD, [lx, 1.9, DZ + 0.02], [PI / 2, 0, 0], 20);
    cyl(0.022, 0.022, 0.02, m, PD, [lx, 1.9, DZ + 0.035], [PI / 2, 0, 0], 20);
    glowSprite(PD, [0xff453a, 0xffd60a, 0x0a84ff][i], 0.16, [lx, 1.9, DZ + 0.06], 0.75);
  });
  [-0.3, -0.12].forEach(dx => {
    box(0.13, 0.13, 0.02, M.black, PD, [PX + dx, 1.66, DZ + 0.02]);
    plane(0.11, 0.11, M.white, PD, [PX + dx, 1.66, DZ + 0.031]);
    box(0.004, 0.05, 0.002, M.red, PD, [PX + dx + 0.01, 1.66, DZ + 0.033], [0, 0, -0.7]);
  });
  [0.18, 0.32].forEach(dx => {
    cyl(0.045, 0.045, 0.03, M.black, PD, [PX + dx, 1.66, DZ + 0.025], [PI / 2, 0, 0], 24);
    box(0.016, 0.07, 0.03, M.white, PD, [PX + dx, 1.66, DZ + 0.045]);
  });

  /* ---------- internals: PLC, RIO, contactors, MCBs on an orange plate ---------- */
  const internals = makePart(root), I = internals.inner;
  box(1.36, 0.84, 0.012, M.plate, I, [0, 1.45, -0.333]);
  [1.72, 1.45, 1.2].forEach(y => box(1.25, 0.035, 0.008, M.rail, I, [0, y, -0.322]));
  [1.585, 1.325, 1.08].forEach(y => box(1.3, 0.05, 0.06, M.duct, I, [0, y, -0.297]));
  [-0.655, 0.655].forEach(x => box(0.05, 0.62, 0.06, M.duct, I, [x, 1.33, -0.297]));
  const leds: { p: V3 }[] = [], ledsO: { p: V3 }[] = [];
  for (let i = 0; i < 7; i++) {
    const x = -0.58 + i * 0.065;
    box(0.06, 0.17, 0.1, i === 0 ? M.grey : M.module, I, [x, 1.72, -0.272]);
    for (let k = 0; k < 4; k++) (k === 3 && i % 2 ? ledsO : leds).push({ p: [x - 0.015, 1.77 - k * 0.018, -0.221] });
  }
  box(0.11, 0.17, 0.1, M.grey, I, [-0.08, 1.72, -0.272]);
  for (let i = 0; i < 4; i++) {
    const x = 0.17 + i * 0.07;
    box(0.065, 0.15, 0.09, M.black, I, [x, 1.72, -0.277]);
    leds.push({ p: [x - 0.018, 1.76, -0.231] }, { p: [x - 0.018, 1.742, -0.231] });
  }
  box(0.09, 0.13, 0.07, M.module, I, [0.53, 1.72, -0.287]);
  instanced(new THREE.BoxGeometry(0.008, 0.008, 0.004), M.ledG, I, leds);
  instanced(new THREE.BoxGeometry(0.008, 0.008, 0.004), M.ledO, I, ledsO);
  for (let i = 0; i < 6; i++) {
    const x = -0.56 + i * 0.13;
    box(0.085, 0.12, 0.11, M.grey, I, [x, 1.45, -0.272]);
    box(0.05, 0.035, 0.012, M.black, I, [x, 1.47, -0.212]);
  }
  for (let i = 0; i < 9; i++) box(0.022, 0.085, 0.075, i % 3 === 2 ? M.white : M.termB, I, [0.32 + i * 0.03, 1.45, -0.29]);
  for (let i = 0; i < 14; i++) {
    const x = -0.6 + i * 0.05;
    box(0.045, 0.09, 0.075, M.white, I, [x, 1.2, -0.29]);
    box(0.014, 0.025, 0.02, i % 5 === 0 ? M.red : M.black, I, [x, 1.21, -0.245]);
  }

  /* ---------- fascia: HMI, meters, lamps, nameplate ---------- */
  const fascia = makePart(root), F = fascia.inner;
  box(1.44, 0.92, 0.025, M.benchPaint, F, [0, 1.45, -0.0325]);
  const hmi = createHMI();
  rbox(0.64, 0.42, 0.04, 0.015, M.black, F, [-0.3, 1.49, 0.0]);
  plane(0.6, 0.375, screen(hmi.tex), F, [-0.3, 1.49, 0.0205]);
  // cover glass: catches studio reflections over the live screen
  plane(0.6, 0.375, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.12, clearcoat: 1, envMapIntensity: 1.6 }), F, [-0.3, 1.49, 0.0215]).userData.noAO = true;
  plane(0.62, 0.1, new THREE.MeshStandardMaterial({ map: nameplate(), roughness: 0.4, metalness: 0.3 }), F, [-0.3, 1.81, -0.0185]);
  const readings: [string, string, string][] = [['415.2', 'V', '#FF3B2F'], ['11.02', 'kV', '#FF3B2F'], ['50.00', 'Hz', '#30D158'], ['0.982', 'PF', '#30D158'], ['24.61', 'A', '#FF3B2F'], ['1.248', 'kW', '#FFB000']];
  readings.forEach(([v, u, col], i) => {
    const mx = 0.2 + (i % 2) * 0.27, my = 1.74 - Math.floor(i / 2) * 0.215;
    rbox(0.23, 0.18, 0.035, 0.008, M.black, F, [mx, my, -0.0025]);
    plane(0.17, 0.026, new THREE.MeshStandardMaterial({ map: labelTex(METER_LABELS[i]), roughness: 0.35 }), F, [mx, my + 0.106, -0.0185]);
    plane(0.19, 0.083, screen(meterTex(v, u, col)), F, [mx, my + 0.025, 0.0155]);
    for (let k = 0; k < 4; k++) box(0.022, 0.014, 0.008, M.module, F, [mx - 0.06 + k * 0.04, my - 0.055, 0.018]);
  });
  [M.lampR, M.lampY, M.lampB].forEach((m, i) => {
    const lx = -0.58 + i * 0.1;
    cyl(0.03, 0.03, 0.02, M.black, F, [lx, 1.13, -0.01], [PI / 2, 0, 0], 20);
    cyl(0.022, 0.022, 0.022, m, F, [lx, 1.13, 0.005], [PI / 2, 0, 0], 20);
    glowSprite(F, [0xff453a, 0xffd60a, 0x0a84ff][i], 0.15, [lx, 1.13, 0.03], 0.75);
  });
  const screenGlow = glowSprite(F, 0x3d86ff, 1.1, [-0.3, 1.49, 0.06], 0.18);
  [-0.24, -0.1].forEach(lx => {
    cyl(0.035, 0.035, 0.025, M.black, F, [lx, 1.13, -0.008], [PI / 2, 0, 0], 24);
    box(0.012, 0.05, 0.02, M.white, F, [lx, 1.13, 0.012], [0, 0, 0.5]);
  });

  /* ---------- desk top: mimic panel, push buttons, E-stop, keyboard ---------- */
  const desk = makePart(root);
  const ang = Math.atan2(0.18, 0.4);
  const D = group(desk.inner, [0, 0.89 + Math.cos(ang) * 0.012, 0.18 + Math.sin(ang) * 0.012], [ang, 0, 0]);
  box(1.36, 0.006, 0.4, M.white, D, [0, 0.003, 0]);
  plane(1.3, 0.36, new THREE.MeshStandardMaterial({ map: mimic(), roughness: 0.25 }), D, [0, 0.0065, 0], [-PI / 2, 0, 0]);
  [M.ledG, M.red, M.ledG, M.red, M.lampY, M.ledG].forEach((m, i) => {
    const bx = -0.52 + i * 0.12;
    cyl(0.026, 0.026, 0.012, M.black, D, [bx, 0.012, -0.09], undefined, 20);
    cyl(0.02, 0.02, 0.016, m, D, [bx, 0.024, -0.09], undefined, 20);
  });
  cyl(0.05, 0.05, 0.012, M.yellow, D, [0.5, 0.012, 0.02], undefined, 28);
  cyl(0.04, 0.03, 0.035, M.red, D, [0.5, 0.034, 0.02], undefined, 28);
  cyl(0.024, 0.024, 0.02, M.black, D, [0.5, 0.012, 0.02], undefined, 20);
  rbox(0.42, 0.02, 0.13, 0.006, M.black, D, [-0.1, 0.016, 0.12]);
  const keys: { p: V3 }[] = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) keys.push({ p: [-0.29 + k * 0.028, 0.03, 0.08 + r * 0.028] });
  instanced(new THREE.BoxGeometry(0.022, 0.008, 0.022), M.module, D, keys);
  rbox(0.05, 0.02, 0.08, 0.01, M.black, D, [0.2, 0.016, 0.12]);

  return {
    root,
    parts: { bench, benchRoof: roof, benchInternals: internals, benchFascia: fascia, benchDesk: desk, panelInternals: pInt, panelDoor: pDoor },
    glands,
    anchors: {
      benchFascia: new THREE.Vector3(0.6, 1.86, 0.03),
      benchInternals: new THREE.Vector3(-0.3, 1.8, -0.22),
      panelInternals: new THREE.Vector3(PX + 0.1, 0.9, PZ - 0.13),
    },
    callouts: {
      xmer: { part: 'benchFascia' as const, v: new THREE.Vector3(-0.3, 1.72, 0.03) },
      cpri: { part: 'panelDoor' as const, v: new THREE.Vector3(PX - 0.2, 0.32, DZ + 0.015) },
    },
    update(t: number, test: number, glow: number) {
      hmi.draw(t, test, glow);
      // rotating-beacon flash while the test is live; steady green once it passes
      const live = glow > 0.05 && test < 1;
      const flash = live ? Math.pow(0.5 + 0.5 * Math.sin(t * 9), 3) : test >= 1 ? 0.55 : 0;
      const col = test >= 1 ? 0x30d158 : 0xff2a1f;
      beaconMat.color.setHex(col); beaconMat.emissive.setHex(col);
      beaconMat.emissiveIntensity = 0.2 + flash * 5;
      beaconGlow.material.color.setHex(col);
      beaconGlow.material.opacity = flash * 0.9;
      screenGlow.material.opacity = 0.14 + glow * 0.12;
    },
  };
}

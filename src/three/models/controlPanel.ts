import * as THREE from 'three';
import { box, rbox, cyl, instanced, plane, group, makeCanvas, canvasTexture, contactShadow, glowSprite, type V3 } from '../kit';
import type { Mats } from '../materials';
import { dangerTex, labelTex, louvres, seams, swingHandle } from './testBench';
import { mergeStatic } from '../optimize';

/*
 * Two-section Electrosoft MCC:
 * - Power Section (left): ACB incomer, R-Y-B-N copper busbars, MCCB motor feeders, analog voltmeter & ammeter.
 * - Control Section (right): PLC automation rack, VFD variable frequency drive, contactors, live HMI, pushbuttons.
 * - Interactive: fluctuating analog meter needles, live animated HMI with interactive motor states,
 *   clickable buttons (Start, Stop, E-Stop, Mode switch), and double-click door inspection.
 */

const PI = Math.PI;
const BRAND = '#0B5BD3';
const W = 1.7, H = 2.2, D = 0.6, BASE = 0.1;
const FZ = D / 2; // front face

/** High-res texture for analog meters (Voltmeter 0-500V, Ammeter 0-100A) */
function meterFace(title: 'VOLTS' | 'AMPS', maxVal: number) {
  const { c, x } = makeCanvas(256, 256);
  x.fillStyle = '#FAFAFA';
  x.fillRect(0, 0, 256, 256);

  // Border & dial bevel
  x.strokeStyle = '#D1D5DB';
  x.lineWidth = 6;
  x.strokeRect(6, 6, 244, 244);
  x.strokeStyle = '#E5E7EB';
  x.lineWidth = 2;
  x.strokeRect(12, 12, 232, 232);

  // Scale arc
  const cx = 128, cy = 180, radius = 115;
  const a0 = Math.PI * 1.25, a1 = Math.PI * 1.75;
  x.beginPath();
  x.arc(cx, cy, radius, a0, a1);
  x.strokeStyle = '#1F2937';
  x.lineWidth = 3.5;
  x.stroke();

  // Scale ticks & numeric values
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const angle = a0 + (a1 - a0) * (i / steps);
    const r1 = radius, r2 = i % 1 === 0 ? radius - 14 : radius - 8;
    x.beginPath();
    x.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    x.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    x.lineWidth = 3;
    x.strokeStyle = '#111827';
    x.stroke();

    const val = Math.round((maxVal / steps) * i);
    const tx = cx + Math.cos(angle) * (radius - 28);
    const ty = cy + Math.sin(angle) * (radius - 28);
    x.fillStyle = '#374151';
    x.font = 'bold 18px Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(String(val), tx, ty);
  }

  // Intermediate subdivisions
  for (let i = 0; i < steps * 2; i++) {
    if (i % 2 !== 0) {
      const angle = a0 + (a1 - a0) * (i / (steps * 2));
      x.beginPath();
      x.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      x.lineTo(cx + Math.cos(angle) * (radius - 7), cy + Math.sin(angle) * (radius - 7));
      x.lineWidth = 1.8;
      x.strokeStyle = '#6B7280';
      x.stroke();
    }
  }

  // Unit Symbol
  x.fillStyle = title === 'VOLTS' ? '#0B5BD3' : '#E5484D';
  x.font = '900 32px Arial, sans-serif';
  x.textAlign = 'center';
  x.fillText(title === 'VOLTS' ? 'V' : 'A', cx, 138);

  x.fillStyle = '#6B7280';
  x.font = '600 13px Arial, sans-serif';
  x.fillText('AC · 50 Hz', cx, 158);

  return canvasTexture(c);
}

function nameplate() {
  const { c, x } = makeCanvas(640, 104);
  x.fillStyle = '#E9EAE6';
  x.fillRect(0, 0, 640, 104);
  x.fillStyle = BRAND;
  x.beginPath();
  x.moveTo(52, 14); x.lineTo(24, 54); x.lineTo(40, 54); x.lineTo(34, 90); x.lineTo(66, 46); x.lineTo(50, 46);
  x.closePath();
  x.fill();
  x.fillStyle = '#16181C';
  x.font = '800 46px Arial, sans-serif';
  x.textBaseline = 'middle';
  x.fillText('ELECTROSOFT', 84, 42);
  x.fillStyle = '#5B616B';
  x.font = '700 19px Arial, sans-serif';
  x.fillText('MOTOR CONTROL CENTRE · MCC-01', 86, 80);
  return canvasTexture(c);
}

/**
 * Live Industrial HMI Screen:
 * Features live fluctuating motor bars, digital voltage/frequency/current readouts,
 * and responsive state switches (RUN, STANDBY, E-STOP TRIP).
 */
function createHMI() {
  const { c, x } = makeCanvas(512, 320);
  const tex = canvasTexture(c);

  const state = {
    running: true,
    tripped: false,
    autoMode: true,
    speed: 1.0,
  };

  let lastTick = -1;

  function draw(t: number) {
    const tick = Math.floor(t * 8); // 8fps canvas refresh is smooth and efficient
    if (tick === lastTick) return;
    lastTick = tick;

    // Background
    x.fillStyle = '#080B10';
    x.fillRect(0, 0, 512, 320);

    // Header bar
    x.fillStyle = state.tripped ? '#7A1316' : BRAND;
    x.fillRect(0, 0, 512, 46);

    x.fillStyle = '#fff';
    x.font = '700 20px Arial, sans-serif';
    x.textBaseline = 'middle';
    x.fillText('ELECTROSOFT · MCC-01', 18, 23);

    // Status pill
    const statusText = state.tripped ? 'TRIPPED' : state.running ? 'RUN' : 'STANDBY';
    const statusColor = state.tripped ? '#E5484D' : state.running ? '#30D158' : '#8E9BAE';
    x.fillStyle = statusColor;
    x.beginPath();
    x.arc(420, 23, 6.5, 0, Math.PI * 2);
    x.fill();

    x.fillStyle = '#fff';
    x.font = '700 16px Arial, sans-serif';
    x.fillText(statusText, 434, 23);

    // Mode tag
    x.fillStyle = 'rgba(255,255,255,0.2)';
    x.fillRect(296, 11, 74, 24);
    x.fillStyle = '#fff';
    x.font = '600 13px Arial, sans-serif';
    x.fillText(state.autoMode ? 'AUTO' : 'MANUAL', 304, 23);

    // Motor drives load bars (M1-M4)
    for (let i = 0; i < 4; i++) {
      const y = 68 + i * 36;
      const targetLoad = state.tripped ? 0 : state.running ? (0.55 + 0.35 * Math.sin(t * 1.1 + i * 1.8)) : 0.05;
      const pct = Math.round(targetLoad * 100);

      x.fillStyle = '#7F8A9C';
      x.font = '600 14px Arial, sans-serif';
      x.fillText(`M${i + 1}`, 16, y + 10);

      // Bar container
      x.fillStyle = '#141820';
      x.fillRect(52, y, 380, 18);

      // Bar fill
      const barColor = state.tripped ? '#E5484D' : i === 2 ? '#FFB000' : '#3D86FF';
      x.fillStyle = barColor;
      x.fillRect(52, y, 380 * targetLoad, 18);

      // Pct text
      x.fillStyle = '#9BA4B5';
      x.font = '600 12px Arial, sans-serif';
      x.fillText(`${pct}%`, 440, y + 10);
    }

    // Live Telemetry Readouts
    const vVal = state.tripped ? '0' : (414.6 + 0.8 * Math.sin(t * 3.2)).toFixed(1);
    const hzVal = state.tripped ? '0.0' : (49.95 + 0.08 * Math.sin(t * 1.5)).toFixed(2);
    const aVal = state.tripped ? '0' : state.running ? (61.4 + 2.1 * Math.sin(t * 4.1)).toFixed(1) : '2.1';
    const pfVal = state.tripped ? '0.00' : '0.99';

    const tiles = [
      ['VOLTAGE', vVal, 'V'],
      ['FREQ', hzVal, 'Hz'],
      ['CURRENT', aVal, 'A'],
      ['P. FACTOR', pfVal, 'PF'],
    ];

    tiles.forEach(([label, val, unit], i) => {
      const bx = 14 + i * 122;
      x.fillStyle = '#12161F';
      x.fillRect(bx, 222, 114, 58);

      x.fillStyle = '#7F8A9C';
      x.font = '600 11px Arial, sans-serif';
      x.fillText(`${label} (${unit})`, bx + 10, 238);

      x.fillStyle = '#FFFFFF';
      x.font = '700 20px Arial, sans-serif';
      x.fillText(val, bx + 10, 264);
    });

    // Sub-footer
    x.fillStyle = '#5A6372';
    x.font = '500 12px Arial, sans-serif';
    x.fillText(
      state.tripped
        ? 'ALERT: EMERGENCY STOP ACTIVATED · RESET TO RESUME'
        : 'INCOMER ACB: CLOSED · MODBUS / PROFINET HEALTHY · 100% FAT PASSED',
      16,
      302
    );

    tex.needsUpdate = true;
  }

  draw(0);
  return {
    tex,
    draw,
    state,
    toggleRun() {
      if (state.tripped) state.tripped = false;
      state.running = !state.running;
      lastTick = -1;
    },
    toggleEStop() {
      state.tripped = !state.tripped;
      if (state.tripped) state.running = false;
      lastTick = -1;
    },
    toggleMode() {
      state.autoMode = !state.autoMode;
      lastTick = -1;
    },
  };
}

/** A door hinged on its outer edge. `side` -1 = left door, 1 = right door. */
function door(root: THREE.Object3D, M: Mats, side: -1 | 1) {
  const pivot = group(root, [side * W / 2, 0, FZ]);
  const face = group(pivot);
  const dw = W / 2 - 0.01, cx = -side * dw / 2;
  rbox(dw, H - BASE - 0.04, 0.025, 0.008, M.benchPaint, face, [cx, BASE + (H - BASE) / 2, 0.0125]);
  seams(face, M.plinth, cx, BASE + (H - BASE) / 2, dw - 0.08, H - BASE - 0.12, 0.026);
  swingHandle(face, M, cx - side * (dw / 2 - 0.07), 1.12, 0.025);
  louvres(face, M, [[cx, 0.24]], 7, dw - 0.3, 0.026);
  return { pivot, face, cx, z: 0.026 };
}

export function buildControlPanel(M: Mats, parent: THREE.Object3D) {
  const root = group(parent);

  /* ---------- Cabinet body ---------- */
  const body = group(root);
  contactShadow(body, 2.5, 1.3, 0.55);
  box(W, BASE, D, M.plinth, body, [0, BASE / 2, 0]);
  rbox(W, H - BASE, 0.02, 0.006, M.benchPaint, body, [0, BASE + (H - BASE) / 2, -D / 2 + 0.01]);
  [-1, 1].forEach(s => rbox(0.02, H - BASE, D, 0.006, M.benchPaint, body, [s * (W / 2 - 0.01), BASE + (H - BASE) / 2, 0]));
  rbox(W, 0.02, D, 0.006, M.benchPaint, body, [0, H - 0.01, 0]);
  rbox(0.02, H - BASE, D - 0.04, 0.006, M.benchPaint, body, [0, BASE + (H - BASE) / 2, -0.02]);
  [-0.55, 0.55].forEach(dx => {
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 20), M.steelDark);
    eye.position.set(dx, H + 0.045, 0); eye.castShadow = true; body.add(eye);
  });
  for (let i = 0; i < 5; i++) cyl(0.022, 0.026, 0.03, M.black, body, [-0.6 + i * 0.12, H + 0.012, -0.12], undefined, 14);

  /* ---------- Power section (left): ACB incomer, busbars, feeders ---------- */
  const inner = group(root);
  const LX = -W / 4, BZ = -D / 2 + 0.04;
  box(W / 2 - 0.08, H - 0.3, 0.012, M.steel, inner, [LX, H / 2 + 0.05, BZ]);
  rbox(0.36, 0.38, 0.24, 0.012, M.black, inner, [LX - 0.12, 1.82, BZ + 0.13]); // ACB Incomer
  rbox(0.24, 0.12, 0.02, 0.006, M.grey, inner, [LX - 0.12, 1.88, BZ + 0.255]);
  cyl(0.03, 0.03, 0.03, M.red, inner, [LX - 0.04, 1.74, BZ + 0.26], [PI / 2, 0, 0], 16);
  cyl(0.03, 0.03, 0.03, M.ledG, inner, [LX - 0.2, 1.74, BZ + 0.26], [PI / 2, 0, 0], 16);

  // R Y B N Main Busbars
  [1.5, 1.42, 1.34, 1.26].forEach((y, i) => {
    box(W - 0.1, 0.055, 0.012, M.copper, inner, [0, y, BZ + 0.06]);
    box(0.02, 0.055, 0.014, [M.lampR, M.lampY, M.lampB, M.black][i], inner, [-W / 2 + 0.1, y, BZ + 0.067]);
  });
  [-0.6, -0.2, 0.2, 0.6].forEach(dx => box(0.05, 0.32, 0.08, M.clampRed, inner, [dx, 1.38, BZ + 0.03]));
  [-0.22, -0.14, -0.06].forEach(dx => box(0.03, 0.26, 0.01, M.copper, inner, [LX + dx, 1.65, BZ + 0.05]));

  // MCCB Feeders
  [1.0, 0.68].forEach(y => {
    for (let i = 0; i < 3; i++) {
      const fx = LX - 0.25 + i * 0.25;
      rbox(0.17, 0.25, 0.14, 0.01, M.black, inner, [fx, y, BZ + 0.08]);
      box(0.045, 0.075, 0.03, M.grey, inner, [fx, y + 0.02, BZ + 0.165]);
    }
  });
  box(W / 2 - 0.12, 0.06, 0.07, M.duct, inner, [LX, 0.42, BZ + 0.05]);
  for (let i = 0; i < 16; i++) box(0.035, 0.1, 0.07, i % 6 === 5 ? M.termE : M.termG, inner, [LX - 0.3 + i * 0.04, 0.28, BZ + 0.05]);

  /* ---------- Control section (right): PLC, VFD, contactors ---------- */
  const RX = W / 4;
  box(W / 2 - 0.08, H - 0.3, 0.012, M.plate, inner, [RX, H / 2 + 0.05, BZ]);
  [1.86, 1.12, 0.84, 0.56].forEach(y => box(W / 2 - 0.16, 0.035, 0.008, M.rail, inner, [RX, y, BZ + 0.012]));
  [1.98, 1.0, 0.7].forEach(y => box(W / 2 - 0.12, 0.05, 0.06, M.duct, inner, [RX, y, BZ + 0.036]));

  // PLC Rack
  const leds: { p: V3 }[] = [], ledsO: { p: V3 }[] = [];
  for (let i = 0; i < 8; i++) {
    const x = RX - 0.3 + i * 0.065;
    box(0.06, 0.17, 0.1, i === 0 ? M.grey : M.module, inner, [x, 1.86, BZ + 0.06]);
    for (let k = 0; k < 4; k++) (k === 3 && i % 2 ? ledsO : leds).push({ p: [x - 0.015, 1.91 - k * 0.018, BZ + 0.111] });
  }
  instanced(new THREE.BoxGeometry(0.008, 0.008, 0.004), M.ledG, inner, leds);
  instanced(new THREE.BoxGeometry(0.008, 0.008, 0.004), M.ledO, inner, ledsO);

  // VFD with keypad
  rbox(0.2, 0.36, 0.16, 0.012, M.module, inner, [RX + 0.25, 1.46, BZ + 0.09]);
  const vfdTex = makeCanvas(128, 64);
  vfdTex.x.fillStyle = '#0F1A12'; vfdTex.x.fillRect(0, 0, 128, 64);
  vfdTex.x.fillStyle = '#30D158'; vfdTex.x.font = 'bold 22px monospace'; vfdTex.x.fillText('50.0 Hz', 14, 40);
  plane(0.1, 0.05, new THREE.MeshBasicMaterial({ map: canvasTexture(vfdTex.c), toneMapped: false }), inner, [RX + 0.25, 1.55, BZ + 0.171]);
  for (let k = 0; k < 6; k++) box(0.026, 0.016, 0.008, M.black, inner, [RX + 0.21 + (k % 3) * 0.04, 1.47 - Math.floor(k / 3) * 0.03, BZ + 0.172]);

  // Contactors + Relays
  for (let i = 0; i < 5; i++) {
    const x = RX - 0.32 + i * 0.1;
    box(0.085, 0.13, 0.11, M.grey, inner, [x, 1.12, BZ + 0.067]);
    box(0.05, 0.035, 0.012, M.black, inner, [x, 1.14, BZ + 0.128]);
    box(0.085, 0.06, 0.09, M.black, inner, [x, 1.02, BZ + 0.057]);
  }

  // MCBs
  for (let i = 0; i < 14; i++) {
    const x = RX - 0.33 + i * 0.05;
    box(0.045, 0.09, 0.075, M.white, inner, [x, 0.84, BZ + 0.05]);
    box(0.014, 0.025, 0.02, i % 5 === 0 ? M.red : M.black, inner, [x, 0.85, BZ + 0.095]);
  }
  for (let i = 0; i < 18; i++) box(0.022, 0.085, 0.075, i % 3 === 2 ? M.white : M.termB, inner, [RX - 0.3 + i * 0.034, 0.56, BZ + 0.05]);

  /* ---------- Doors (Interactive) ---------- */
  const left = door(root, M, -1), right = door(root, M, 1);
  const L = left.face, lz = left.z, lc = left.cx;
  const R = right.face, rz = right.z, rc = right.cx;

  // Left Door: Analog Voltmeter & Ammeter (with dynamic fluctuating needles!)
  const voltTex = meterFace('VOLTS', 500);
  const ampTex = meterFace('AMPS', 100);

  // Voltmeter (left meter)
  box(0.15, 0.15, 0.02, M.black, L, [lc - 0.16, 1.78, lz + 0.01]);
  plane(0.13, 0.13, new THREE.MeshBasicMaterial({ map: voltTex }), L, [lc - 0.16, 1.78, lz + 0.021]);
  const voltNeedlePivot = group(L, [lc - 0.16, 1.74, lz + 0.023]);
  box(0.003, 0.06, 0.002, M.red, voltNeedlePivot, [0, 0.03, 0]);
  cyl(0.008, 0.008, 0.004, M.black, voltNeedlePivot, [0, 0, 0.002], [PI / 2, 0, 0], 16);

  // Ammeter (right meter)
  box(0.15, 0.15, 0.02, M.black, L, [lc + 0.06, 1.78, lz + 0.01]);
  plane(0.13, 0.13, new THREE.MeshBasicMaterial({ map: ampTex }), L, [lc + 0.06, 1.78, lz + 0.021]);
  const ampNeedlePivot = group(L, [lc + 0.06, 1.74, lz + 0.023]);
  box(0.003, 0.06, 0.002, M.red, ampNeedlePivot, [0, 0.03, 0]);
  cyl(0.008, 0.008, 0.004, M.black, ampNeedlePivot, [0, 0, 0.002], [PI / 2, 0, 0], 16);

  plane(0.17, 0.026, new THREE.MeshStandardMaterial({ map: labelTex('INCOMER 415V'), roughness: 0.35 }), L, [lc - 0.05, 1.92, lz + 0.002]);

  // Indicator Lamps
  const lampGlows: THREE.Sprite[] = [];
  [M.lampR, M.lampY, M.lampB].forEach((m, i) => {
    const lx = lc - 0.16 + i * 0.1;
    cyl(0.03, 0.03, 0.02, M.black, L, [lx, 1.56, lz + 0.01], [PI / 2, 0, 0], 20);
    cyl(0.022, 0.022, 0.022, m, L, [lx, 1.56, lz + 0.025], [PI / 2, 0, 0], 20);
    lampGlows.push(glowSprite(L, [0xff453a, 0xffd60a, 0x0a84ff][i], 0.17, [lx, 1.56, lz + 0.05], 0.75));
  });

  // Selector Switch (Auto / Manual)
  const selectorGroup = group(L, [lc + 0.18, 1.56, lz + 0.015]);
  cyl(0.045, 0.045, 0.03, M.black, selectorGroup, [0, 0, 0], [PI / 2, 0, 0], 24);
  const selectorKnob = box(0.016, 0.07, 0.03, M.white, selectorGroup, [0, 0, 0.02], [0, 0, 0.5]);
  selectorKnob.userData = { interactive: 'selector' };

  plane(0.16, 0.12, new THREE.MeshStandardMaterial({ map: dangerTex(), roughness: 0.4 }), L, [lc, 1.32, lz + 0.002]);

  // Right Door: Nameplate, HMI, Pushbuttons
  plane(0.62, 0.1, new THREE.MeshStandardMaterial({ map: nameplate(), roughness: 0.4, metalness: 0.3 }), R, [rc, 1.98, rz + 0.002]);

  const hmi = createHMI();
  rbox(0.42, 0.28, 0.03, 0.012, M.black, R, [rc, 1.7, rz + 0.012]);
  const hmiMesh = plane(0.38, 0.24, new THREE.MeshBasicMaterial({ map: hmi.tex, toneMapped: false }), R, [rc, 1.7, rz + 0.028]);
  hmiMesh.userData = { interactive: 'hmi' };

  const hmiGlow = glowSprite(R, 0x3d86ff, 0.8, [rc, 1.7, rz + 0.06], 0.16);

  // Interactive Push Buttons on Right Door Fascia
  // Button 0: Start (Green), Button 1: Stop (Red), Button 2: Auto Run (Green), Button 3: Fault Reset (Yellow), Button 4: Trip (Red)
  const interactiveButtons: { mesh: THREE.Mesh; type: string }[] = [];
  const btnDefs = [
    { m: M.ledG, type: 'start', label: 'START' },
    { m: M.red, type: 'stop', label: 'STOP' },
    { m: M.ledG, type: 'start', label: 'AUTO RUN' },
    { m: M.lampY, type: 'reset', label: 'RESET' },
    { m: M.red, type: 'stop', label: 'TRIP TEST' },
  ];

  btnDefs.forEach((b, i) => {
    const bx = rc - 0.2 + i * 0.1;
    cyl(0.026, 0.026, 0.014, M.black, R, [bx, 1.44, rz + 0.007], [PI / 2, 0, 0], 20);
    const btn = cyl(0.02, 0.02, 0.016, b.m, R, [bx, 1.44, rz + 0.02], [PI / 2, 0, 0], 20);
    btn.userData = { interactive: b.type, baseZ: rz + 0.02 };
    interactiveButtons.push({ mesh: btn, type: b.type });
  });

  // Emergency Stop Button
  cyl(0.05, 0.05, 0.012, M.yellow, R, [rc + 0.12, 1.24, rz + 0.006], [PI / 2, 0, 0], 28);
  const eStopBtn = cyl(0.04, 0.03, 0.035, M.red, R, [rc + 0.12, 1.24, rz + 0.026], [PI / 2, 0, 0], 28);
  eStopBtn.userData = { interactive: 'estop', baseZ: rz + 0.026 };
  interactiveButtons.push({ mesh: eStopBtn, type: 'estop' });

  // Bake static elements for high performance
  [body, inner, L, R].forEach(g => mergeStatic(g));

  return {
    root,
    hmi,
    doors: { left, right },
    interactiveObjects: [
      hmiMesh,
      selectorKnob,
      ...interactiveButtons.map(b => b.mesh),
      left.pivot,
      right.pivot,
    ],
    anchors: {
      incomer: new THREE.Vector3(lc - 0.12, 1.82, lz + 0.05),
      meters: new THREE.Vector3(lc - 0.05, 1.78, lz + 0.05),
      hmi: new THREE.Vector3(rc, 1.7, rz + 0.05),
      buttons: new THREE.Vector3(rc, 1.44, rz + 0.05),
      busbars: new THREE.Vector3(-0.55, 1.5, BZ + 0.07),
      plc: new THREE.Vector3(RX - 0.1, 1.95, BZ + 0.11),
      vfd: new THREE.Vector3(RX + 0.25, 1.46, BZ + 0.15),
      door: new THREE.Vector3(W / 2 - 0.05, 0.6, FZ + 0.03),
    },
    triggerAction(type: string) {
      if (type === 'start') {
        hmi.state.running = true;
        hmi.state.tripped = false;
      } else if (type === 'stop') {
        hmi.state.running = false;
      } else if (type === 'estop') {
        hmi.toggleEStop();
      } else if (type === 'selector') {
        hmi.toggleMode();
        selectorKnob.rotation.z = hmi.state.autoMode ? 0.5 : -0.5;
      } else if (type === 'hmi') {
        hmi.toggleRun();
      }
    },
    /** open: 0 = doors shut, 1 = swung wide */
    update(t: number, open: number) {
      const a = open * 1.55;
      left.pivot.rotation.y = -a;
      right.pivot.rotation.y = a;

      // Analog Meter Needle Fluctuations
      // Voltmeter: fluctuates around 415V (approx -0.42 rad) with small mains hum
      const vHum = Math.sin(t * 12) * 0.022 + Math.sin(t * 31.4) * 0.008 + (Math.sin(t * 1.8) * 0.015);
      const targetVoltAngle = hmi.state.tripped ? 0.78 : -0.42 + vHum;
      voltNeedlePivot.rotation.z = targetVoltAngle;

      // Ammeter: fluctuates with motor load (~62A in RUN, near 0 in STANDBY/TRIP)
      let targetAmpAngle = 0.78; // 0 Amperes at the zero mark
      if (hmi.state.running && !hmi.state.tripped) {
        const aHum = Math.sin(t * 8.2) * 0.035 + Math.sin(t * 24.1) * 0.015 + (Math.sin(t * 2.3) * 0.02);
        targetAmpAngle = -0.15 + aHum; // ~62A load mark
      }
      ampNeedlePivot.rotation.z = targetAmpAngle;

      // Redraw Live HMI
      hmi.draw(t);

      // Glow pulses
      hmiGlow.material.opacity = (hmi.state.tripped ? 0.28 : 0.14) + 0.04 * Math.sin(t * 4);
      hmiGlow.material.color.setHex(hmi.state.tripped ? 0xff3b30 : 0x3d86ff);

      lampGlows.forEach((g, i) => {
        g.material.opacity = hmi.state.tripped && i === 1 ? (Math.sin(t * 10) > 0 ? 0.9 : 0.1) : 0.65 + 0.15 * Math.sin(t * 2 + i);
      });
    },
  };
}

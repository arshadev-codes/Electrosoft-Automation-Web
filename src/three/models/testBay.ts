import * as THREE from 'three';
import type { Mats } from '../materials';
import type { SceneModel } from '../types';
import { makeCanvas, canvasTexture } from '../kit';
import { STUDIO } from '../../look';
import { buildTransformer } from './transformer';
import { buildTestBench } from './testBench';
import { buildLeads } from './leads';
import { mergeStatic } from '../optimize';

// floor patch in root space (metres): x from FX0, z from FZ0, PX_PER_M canvas pixels per metre
const FW = 8.4, FD = 5.2, FX0 = -4.6, FZ0 = -2.6, PX_PER_M = 180;

/** Epoxy test-bay floor: joints, hazard border around the unit under test, painted lettering. */
function bayFloor(xfX: number, xfZ: number) {
  const W = Math.round(FW * PX_PER_M), H = Math.round(FD * PX_PER_M);
  const px = (x: number) => (x - FX0) * PX_PER_M, pz = (z: number) => (z - FZ0) * PX_PER_M;
  const { c, x } = makeCanvas(W, H);
  x.fillStyle = STUDIO.floor; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    const g = 200 + Math.random() * 40;
    x.fillStyle = `rgba(${g},${g},${g + 4},.5)`;
    x.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
  x.strokeStyle = STUDIO.joint; x.lineWidth = 2;
  for (let m = Math.ceil(FX0 / 1.5) * 1.5; m < FX0 + FW; m += 1.5) { x.beginPath(); x.moveTo(px(m), 0); x.lineTo(px(m), H); x.stroke(); }
  for (let m = Math.ceil(FZ0 / 1.5) * 1.5; m < FZ0 + FD; m += 1.5) { x.beginPath(); x.moveTo(0, pz(m)); x.lineTo(W, pz(m)); x.stroke(); }

  // yellow/black hazard border around the transformer test zone
  const x0 = px(xfX - 1.15), x1 = px(xfX + 1.15), z0 = pz(xfZ - 0.95), z1 = pz(xfZ + 0.95), bw = 0.11 * PX_PER_M;
  const stripes = makeCanvas(40, 40);
  stripes.x.fillStyle = '#F2C200'; stripes.x.fillRect(0, 0, 40, 40);
  stripes.x.fillStyle = '#1B1C1F';
  stripes.x.beginPath(); stripes.x.moveTo(0, 0); stripes.x.lineTo(20, 0); stripes.x.lineTo(40, 20); stripes.x.lineTo(40, 40); stripes.x.closePath(); stripes.x.fill();
  stripes.x.beginPath(); stripes.x.moveTo(0, 20); stripes.x.lineTo(20, 40); stripes.x.lineTo(0, 40); stripes.x.closePath(); stripes.x.fill();
  x.fillStyle = x.createPattern(stripes.c, 'repeat')!;
  x.fillRect(x0, z0, x1 - x0, bw); x.fillRect(x0, z1 - bw, x1 - x0, bw);
  x.fillRect(x0, z0, bw, z1 - z0); x.fillRect(x1 - bw, z0, bw, z1 - z0);
  // test pad under the transformer
  x.fillStyle = 'rgba(70,78,88,.14)'; x.fillRect(x0 + bw * 2, z0 + bw * 2, x1 - x0 - bw * 4, z1 - z0 - bw * 4);
  // painted lettering in front of the zone
  x.fillStyle = 'rgba(214,170,0,.9)'; x.font = `800 ${Math.round(0.17 * PX_PER_M)}px Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('HV TEST AREA', (x0 + x1) / 2, z1 + 0.24 * PX_PER_M);
  // walkway line from the operator position
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 0.05 * PX_PER_M; x.setLineDash([0.3 * PX_PER_M, 0.18 * PX_PER_M]);
  x.beginPath(); x.moveTo(px(FX0 + 0.5), pz(1.45)); x.lineTo(x1, pz(1.45)); x.stroke();

  // fade the patch into the page background
  const a = makeCanvas(256, 160);
  const g = a.x.createRadialGradient(128, 80, 10, 128, 80, 128);
  g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#ddd'); g.addColorStop(1, '#000');
  a.x.setTransform(1, 0, 0, 0.62, 0, 30); a.x.fillStyle = g; a.x.fillRect(0, -50, 256, 260);

  const map = canvasTexture(c); map.anisotropy = 8;
  const mat = new THREE.MeshLambertMaterial({ map, alphaMap: new THREE.CanvasTexture(a.c), transparent: true, depthWrite: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FW, FD), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(FX0 + FW / 2, -0.002, FZ0 + FD / 2);
  floor.renderOrder = -3;
  return floor;
}

/** Procedural test bay: bench on the left angled toward the transformer on the right. */
export function buildTestBay(M: Mats): SceneModel {
  const root = new THREE.Group();

  const xf = buildTransformer(M, root);
  xf.root.position.set(1.15, 0, 0.05);

  const bench = buildTestBench(M, root);
  bench.root.position.set(-1.3, 0, -0.5);
  bench.root.rotation.y = 0.28;

  root.add(bayFloor(1.15, 0.05));

  root.updateMatrixWorld(true);
  const toRoot = (v: THREE.Vector3, from: THREE.Object3D) => root.worldToLocal(from.localToWorld(v.clone()));
  const coverInner = xf.parts.cover.inner;
  const ends = [...xf.hvTops, ...xf.lvTops].map(v => toRoot(v, coverInner));
  const starts = bench.glands.map(g => toRoot(new THREE.Vector3(...g), bench.parts.benchRoof.inner));
  const leads = buildLeads(M, root, starts, ends);

  const parts = { ...xf.parts, ...bench.parts, leads: leads.leads };
  Object.values(parts).forEach(p => mergeStatic(p.inner));

  return {
    root,
    parts,
    anchors: { ...xf.anchors, ...bench.anchors, leads: leads.anchor },
    callouts: { mva: { part: 'tank', v: new THREE.Vector3(0.78, 1.56, 0.42) }, ...bench.callouts },
    update(t, dt, s) {
      bench.update(t, s.test, s.glow);
      leads.update(dt, s.glow);
      M.copper.emissiveIntensity = s.glow * 0.18 * (0.8 + 0.2 * Math.sin(t * 6));
      M.ledG.emissiveIntensity = 0.9 + 0.5 * Math.sin(t * 5);
    },
  };
}

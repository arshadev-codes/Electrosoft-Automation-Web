import * as THREE from 'three';
import { mesh, box, makeCanvas } from '../kit';
import type { Mats } from '../materials';
import { makePart } from './transformer';

/*
 * Test leads from the bench roof glands to the transformer bushings.
 * Each lead is a rubber tube with a phase-coloured sleeve near the clamp and an
 * additive "current" overlay whose stripes scroll while a test runs.
 */

function stripeAlpha() {
  const { c, x } = makeCanvas(64, 4);
  const g = x.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, '#000'); g.addColorStop(0.4, '#000'); g.addColorStop(0.5, '#fff'); g.addColorStop(0.6, '#000'); g.addColorStop(1, '#000');
  x.fillStyle = g; x.fillRect(0, 0, 64, 4);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 1);
  return t;
}

/** starts/ends are in the leads group's parent space. */
export function buildLeads(M: Mats, parent: THREE.Object3D, starts: THREE.Vector3[], ends: THREE.Vector3[]) {
  const leads = makePart(parent), G = leads.inner;
  const alpha = stripeAlpha();
  const flows: THREE.MeshBasicMaterial[] = [];
  const phase = [M.sleeveR, M.sleeveY, M.sleeveB];
  const phaseHex = [0xFF453A, 0xFFD60A, 0x0A84FF];
  let anchor = new THREE.Vector3();

  ends.forEach((e, i) => {
    const s = starts[i], hvLead = i < 3, p = i % 3;
    const top = Math.max(s.y, e.y) + (hvLead ? 0.55 : 0.32) + p * 0.04;
    const curve = new THREE.CatmullRomCurve3([
      s.clone(),
      s.clone().add(new THREE.Vector3(0, 0.22, 0)),
      new THREE.Vector3(THREE.MathUtils.lerp(s.x, e.x, 0.45), top, THREE.MathUtils.lerp(s.z, e.z, 0.45)),
      e.clone().add(new THREE.Vector3(0, 0.3, 0)),
      e.clone().add(new THREE.Vector3(0, 0.06, 0)),
    ], false, 'catmullrom', 0.4);
    const r = hvLead ? 0.017 : 0.013;
    mesh(new THREE.TubeGeometry(curve, 120, r, 10, false), M.rubber, G);

    const flow = new THREE.MeshBasicMaterial({ color: phaseHex[p], alphaMap: alpha, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const fm = mesh(new THREE.TubeGeometry(curve, 120, r * 1.25, 10, false), flow, G);
    fm.castShadow = false; fm.receiveShadow = false; fm.userData.noAO = true;
    flows.push(flow);

    // sleeve + clamp at the bushing end
    const sleeve = new THREE.CatmullRomCurve3([0.86, 0.9, 0.94].map(u => curve.getPointAt(u)));
    mesh(new THREE.TubeGeometry(sleeve, 12, r * 1.35, 12, false), phase[p], G);
    const clamp = box(0.05, 0.05, 0.034, M.clampRed, G, [e.x, e.y + 0.035, e.z]);
    clamp.lookAt(curve.getPointAt(0.97));
    box(0.06, 0.012, 0.022, M.brass, G, [e.x, e.y + 0.005, e.z]);
    if (i === 1) anchor = curve.getPointAt(0.5);
  });

  return {
    leads,
    anchor,
    update(dt: number, glow: number) {
      alpha.offset.x -= dt * 1.6;
      flows.forEach(f => { f.opacity = glow * 0.75; });
      phase.forEach(m => { m.emissiveIntensity = glow * 1.1; });
    },
  };
}

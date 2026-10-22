import * as THREE from 'three';
import { mesh, box } from '../kit';
import type { Mats } from '../materials';
import { makePart } from './transformer';

/*
 * Test leads from the bench roof glands to the transformer bushings. Heavy rubber cables: each
 * rises out of its gland, sags under its own weight across the gap, and climbs to its terminal
 * clamp from the side, with a phase-coloured sleeve near the clamp that glows while a test runs.
 */

const UP = new THREE.Vector3(0, 1, 0);

/** starts/ends are in the leads group's parent space. */
export function buildLeads(M: Mats, parent: THREE.Object3D, starts: THREE.Vector3[], ends: THREE.Vector3[]) {
  const leads = makePart(parent), G = leads.inner;
  const phase = [M.sleeveR, M.sleeveY, M.sleeveB];
  let anchor = new THREE.Vector3();

  ends.forEach((e, i) => {
    const s = starts[i], hvLead = i < 3, p = i % 3;
    const r = hvLead ? 0.013 : 0.011;
    const toward = new THREE.Vector3(e.x - s.x, 0, e.z - s.z).normalize();
    // over the gland lip, then a catenary-like sag across the gap (the leads are pulled fairly taut, so the
    // slack clears the tank and fins), then down into the clamp from the bench side
    const a = s.clone().addScaledVector(UP, 0.16).addScaledVector(toward, 0.12);
    const b = e.clone().addScaledVector(UP, 0.1).addScaledVector(toward, -0.26);
    const sag = (hvLead ? 0.24 : 0.3) + p * 0.05;
    const pts = [s.clone(), s.clone().addScaledVector(UP, 0.08), a];
    for (let k = 1; k < 7; k++) {
      const u = k / 7;
      pts.push(new THREE.Vector3().lerpVectors(a, b, u).addScaledVector(UP, -sag * 4 * u * (1 - u)));
    }
    pts.push(b, e.clone().addScaledVector(UP, 0.06).addScaledVector(toward, -0.1), e.clone());
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    mesh(new THREE.TubeGeometry(curve, 180, r, 12, false), M.rubber, G);

    // sleeve + clamp at the bushing end
    const sleeve = new THREE.CatmullRomCurve3([0.87, 0.91, 0.95].map(u => curve.getPointAt(u)));
    mesh(new THREE.TubeGeometry(sleeve, 12, r * 1.35, 12, false), phase[p], G);
    const clamp = box(0.05, 0.05, 0.034, M.clampRed, G, [e.x, e.y + 0.035, e.z]);
    clamp.lookAt(curve.getPointAt(0.97));
    box(0.06, 0.012, 0.022, M.brass, G, [e.x, e.y + 0.005, e.z]);
    if (i === 1) anchor = curve.getPointAt(0.45);
  });

  return {
    leads,
    anchor,
    update(glow: number) {
      phase.forEach(m => { m.emissiveIntensity = glow * 0.5; });
    },
  };
}

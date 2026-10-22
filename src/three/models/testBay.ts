import * as THREE from 'three';
import type { Mats } from '../materials';
import type { SceneModel } from '../types';
import { buildTransformer } from './transformer';
import { buildTestBench } from './testBench';
import { buildLeads } from './leads';
import { mergeStatic } from '../optimize';

/** Procedural test bay: bench on the left angled toward the transformer on the right, standing on the page itself. */
export function buildTestBay(M: Mats): SceneModel {
  const root = new THREE.Group();

  const xf = buildTransformer(M, root);
  xf.root.position.set(1.15, 0, 0.05);

  const bench = buildTestBench(M, root);
  bench.root.position.set(-1.3, 0, -0.5);
  bench.root.rotation.y = 0.28;

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
    // the rating callout hangs below the transformer's front-right foot, clear of the bushings and leads
    callouts: { mva: { part: 'tank', v: new THREE.Vector3(0.62, 0.16, 0.62) }, ...bench.callouts },
    update(t, _dt, s) {
      bench.update(t, s.test, s.glow);
      leads.update(s.glow);
      M.copper.emissiveIntensity = s.glow * 0.18 * (0.8 + 0.2 * Math.sin(t * 6));
      M.ledG.emissiveIntensity = 0.9 + 0.5 * Math.sin(t * 5);
    },
  };
}

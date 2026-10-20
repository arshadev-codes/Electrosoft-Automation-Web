import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Mats } from './materials';
import { PART_KEYS, type Part, type PartKey, type SceneModel } from './types';
import { buildTestBay } from './models/testBay';

/*
 * GLB slot. Drop a real CAD export at public/models/test-bench.glb and it replaces
 * the procedural bay with no animation changes. The GLB needs:
 *   - one node per part, named exactly as PART_KEYS in types.ts (tank, core, lv, hv,
 *     cover, bench, benchInternals, benchFascia, benchDesk, leads), laid out assembled,
 *     floor at y = 0, roughly the same size and placement as the procedural bay;
 *   - optional empties named tag_<part> for label anchors (else the part's top is used).
 * Explode offsets come from EXPLODE in types.ts.
 */
const GLB_URL = '/models/test-bench.glb';

async function tryGlb(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(GLB_URL);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // dev servers answer missing files with index.html; only accept real binary glTF
    const magic = new TextDecoder().decode(new Uint8Array(buf, 0, 4));
    return magic === 'glTF' ? buf : null;
  } catch {
    return null;
  }
}

function fromGlb(scene: THREE.Object3D): SceneModel {
  const parts: Partial<Record<PartKey, Part>> = {};
  const anchors: Partial<Record<PartKey, THREE.Vector3>> = {};
  scene.updateMatrixWorld(true);
  PART_KEYS.forEach(key => {
    const node = scene.getObjectByName(key);
    if (!node || !node.parent) return;
    const outer = new THREE.Group(), inner = new THREE.Group();
    node.parent.add(outer); outer.add(inner); inner.add(node);
    parts[key] = { outer, inner };
    const tag = scene.getObjectByName('tag_' + key);
    if (tag) {
      anchors[key] = inner.worldToLocal(tag.getWorldPosition(new THREE.Vector3()));
    } else {
      const b = new THREE.Box3().setFromObject(node);
      anchors[key] = inner.worldToLocal(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, b.max.z));
    }
  });
  scene.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root: scene, parts, anchors, callouts: {}, update() {} };
}

export async function loadModel(M: Mats): Promise<SceneModel> {
  const buf = await tryGlb();
  if (buf) {
    try {
      const gltf = await new GLTFLoader().parseAsync(buf, '/models/');
      return fromGlb(gltf.scene);
    } catch (e) {
      console.warn('[PanelScene] GLB failed to parse, using procedural model', e);
    }
  }
  return buildTestBay(M);
}

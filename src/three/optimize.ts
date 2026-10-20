import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP_ATTRS = ['position', 'normal', 'uv'];

/**
 * Bakes every plain mesh under `group` into one mesh per material (and shadow / render-order / AO
 * flags), in the group's local space. The bench and transformer are built from hundreds of small
 * parts that never move relative to their layer, so this cuts draw calls by an order of magnitude
 * for the main, shadow and AO passes alike. Instanced meshes, sprites and userData.keep are left alone.
 */
export function mergeStatic(group: THREE.Object3D) {
  group.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const m4 = new THREE.Matrix4();
  type Bucket = { mat: THREE.Material; src: THREE.Mesh; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] };
  const buckets = new Map<string, Bucket>();

  group.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || Array.isArray(m.material) || m.userData.keep) return;
    const key = [m.material.uuid, m.castShadow, m.receiveShadow, m.renderOrder, !!m.userData.noAO].join('|');
    let b = buckets.get(key);
    if (!b) { b = { mat: m.material, src: m, geos: [], meshes: [] }; buckets.set(key, b); }
    b.meshes.push(m);
  });

  buckets.forEach(b => {
    if (b.meshes.length < 2) return; // nothing to gain
    b.meshes.forEach(m => {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      Object.keys(g.attributes).forEach(name => { if (!KEEP_ATTRS.includes(name)) g.deleteAttribute(name); });
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.clearGroups();
      g.applyMatrix4(m4.multiplyMatrices(toLocal, m.matrixWorld));
      b.geos.push(g);
    });
    const merged = mergeGeometries(b.geos, false);
    b.geos.forEach(g => g.dispose());
    if (!merged) return;
    b.meshes.forEach(m => { m.removeFromParent(); m.geometry.dispose(); });
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.src.castShadow; mesh.receiveShadow = b.src.receiveShadow;
    mesh.renderOrder = b.src.renderOrder; mesh.userData.noAO = !!b.src.userData.noAO;
    group.add(mesh);
  });
}

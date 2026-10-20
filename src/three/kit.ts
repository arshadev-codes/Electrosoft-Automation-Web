import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type V3 = [number, number, number];

/** Adds obj to parent, applies position/rotation and turns on shadows for every mesh inside. */
export function add<T extends THREE.Object3D>(parent: THREE.Object3D, obj: T, pos?: V3, rot?: V3): T {
  if (pos) obj.position.set(pos[0], pos[1], pos[2]);
  if (rot) obj.rotation.set(rot[0], rot[1], rot[2]);
  obj.traverse(o => {
    if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  parent.add(obj);
  return obj;
}

export const group = (parent: THREE.Object3D, pos?: V3, rot?: V3) => add(parent, new THREE.Group(), pos, rot);

export const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, pos?: V3, rot?: V3) =>
  add(parent, new THREE.Mesh(geo, mat), pos, rot);

export const box = (w: number, h: number, d: number, mat: THREE.Material, parent: THREE.Object3D, pos?: V3, rot?: V3) =>
  mesh(new THREE.BoxGeometry(w, h, d), mat, parent, pos, rot);

export const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material, parent: THREE.Object3D, pos?: V3, rot?: V3) =>
  mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat, parent, pos, rot);

/** Cylinder along Y. Pass rot [PI/2,0,0] for Z, [0,0,PI/2] for X. */
export const cyl = (rTop: number, rBot: number, h: number, mat: THREE.Material, parent: THREE.Object3D, pos?: V3, rot?: V3, seg = 32) =>
  mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat, parent, pos, rot);

/** Revolves a (radius, y) profile around Y. */
export const lathe = (profile: [number, number][], mat: THREE.Material, parent: THREE.Object3D, pos?: V3, seg = 48) =>
  mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat, parent, pos);

/** Many copies of one geometry in a single draw call. */
export function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, transforms: { p: V3; r?: V3; s?: V3 }[]) {
  const im = new THREE.InstancedMesh(geo, mat, transforms.length);
  const o = new THREE.Object3D();
  transforms.forEach((t, i) => {
    o.position.set(t.p[0], t.p[1], t.p[2]);
    o.rotation.set(t.r?.[0] ?? 0, t.r?.[1] ?? 0, t.r?.[2] ?? 0);
    o.scale.set(t.s?.[0] ?? 1, t.s?.[1] ?? 1, t.s?.[2] ?? 1);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  });
  im.instanceMatrix.needsUpdate = true;
  return add(parent, im);
}

/** A flat plane facing +Z (rotate to face elsewhere). */
export const plane = (w: number, h: number, mat: THREE.Material, parent: THREE.Object3D, pos?: V3, rot?: V3) => {
  const m = mesh(new THREE.PlaneGeometry(w, h), mat, parent, pos, rot);
  m.castShadow = false;
  return m;
};

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, x: c.getContext('2d')! };
}

export function canvasTexture(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let blobAlpha: THREE.Texture | null = null;
/** Soft ambient-occlusion pool on the floor under an object (cheap contact shadow). */
export function contactShadow(parent: THREE.Object3D, w: number, d: number, opacity = 0.45, pos: V3 = [0, 0.003, 0]) {
  if (!blobAlpha || !blobAlpha.image) {
    const { c, x } = makeCanvas(128, 128);
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, '#fff'); g.addColorStop(0.55, '#888'); g.addColorStop(1, '#000');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    blobAlpha = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0x0b0d12, alphaMap: blobAlpha, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(pos[0], pos[1], pos[2]);
  m.renderOrder = -1;
  m.userData.noAO = true;
  parent.add(m);
  return m;
}

let glowMap: THREE.Texture | null = null;
/** Additive light bloom for lamps, beacons and screens (a cheap stand-in for post-process bloom). */
export function glowSprite(parent: THREE.Object3D, color: number, size: number, pos: V3, opacity = 0.8) {
  if (!glowMap) {
    const { c, x } = makeCanvas(128, 128);
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.55)');
    g.addColorStop(0.45, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    glowMap = new THREE.CanvasTexture(c);
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color, opacity, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  sp.scale.setScalar(size);
  sp.position.set(pos[0], pos[1], pos[2]);
  parent.add(sp);
  return sp;
}

/** Frees every geometry, material and texture under root. */
export function disposeTree(root: THREE.Object3D) {
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
    mats.forEach(mat => {
      Object.values(mat).forEach(v => { if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose(); });
      mat.dispose();
    });
  });
}

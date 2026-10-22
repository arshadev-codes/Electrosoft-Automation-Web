import * as THREE from 'three';
import { makeCanvas } from './kit';

/* ---------- procedural surface maps (no image downloads) ---------- */

function dataTex(c: HTMLCanvasElement, rx: number, ry: number) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

/** Soft multi-octave noise: powder-coat orange peel, cast surfaces. */
function noiseCanvas(size = 256) {
  const { c, x } = makeCanvas(size, size);
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  ([[16, 0.5], [64, 0.35], [256, 0.25]] as const).forEach(([n, a]) => {
    const { c: s, x: sx } = makeCanvas(n, n);
    const img = sx.createImageData(n, n);
    for (let p = 0; p < n * n; p++) {
      const v = 70 + Math.random() * 116;
      img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = v;
      img.data[p * 4 + 3] = 255;
    }
    sx.putImageData(img, 0, 0);
    x.globalAlpha = a; x.imageSmoothingEnabled = true;
    x.drawImage(s, 0, 0, size, size);
  });
  return c;
}

/** Long horizontal streaks: brushed stainless, rolled sheet. */
function brushedCanvas(size = 256) {
  const { c, x } = makeCanvas(size, size);
  x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i++) {
    const g = 90 + Math.random() * 90;
    x.strokeStyle = `rgba(${g},${g},${g},.35)`;
    x.lineWidth = Math.random() < 0.85 ? 1 : 2;
    const y = Math.random() * size, s = Math.random() * size;
    x.beginPath(); x.moveTo(s - 200, y); x.lineTo(s + 60 + Math.random() * 380, y); x.stroke();
  }
  return c;
}

/** Fine parallel lines: CRGO lamination stack, copper foil turns. */
function stripeCanvas(size = 512, pitch = 4) {
  const { c, x } = makeCanvas(size, size);
  for (let y = 0; y < size; y += pitch) {
    const g = 120 + Math.random() * 70;
    x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(0, y, size, pitch - 1);
    x.fillStyle = 'rgb(40,40,40)'; x.fillRect(0, y + pitch - 1, size, 1);
  }
  return c;
}

/** Weathering over a painted surface: clean at the top, dust and faint oil runs toward the floor. */
function grimeCanvas(bottom: [number, number, number], runs: number) {
  const { c, x } = makeCanvas(128, 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.62, '#f6f5f3');
  g.addColorStop(1, `rgb(${bottom.join(',')})`);
  x.fillStyle = g; x.fillRect(0, 0, 128, 512);
  for (let i = 0; i < runs; i++) {
    const sx = Math.random() * 128, sy = 120 + Math.random() * 260, len = 60 + Math.random() * 200;
    const rg = x.createLinearGradient(0, sy, 0, sy + len);
    rg.addColorStop(0, 'rgba(90,80,64,0)'); rg.addColorStop(0.3, 'rgba(90,80,64,.10)'); rg.addColorStop(1, 'rgba(90,80,64,0)');
    x.fillStyle = rg; x.fillRect(sx, sy, 1 + Math.random() * 2.5, len);
  }
  for (let i = 0; i < 900; i++) {
    const y = 512 - Math.pow(Math.random(), 2) * 300;
    x.fillStyle = `rgba(70,64,56,${0.04 + Math.random() * 0.08})`;
    x.fillRect(Math.random() * 128, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- materials ---------- */

export function createMaterials() {
  const peelC = noiseCanvas(), brushC = brushedCanvas(), lamC = stripeCanvas(256, 3), foilC = stripeCanvas(256, 4);
  const peel = (r: number) => dataTex(peelC, r, r);
  const brushed = dataTex(brushC, 2, 2);
  const lam = dataTex(lamC, 1, 3);
  const foil = dataTex(foilC, 1, 6);
  lam.rotation = Math.PI / 2;

  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  const phys = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p);
  const glow = (c: number, i = 1.2) => std({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.35 });

  return {
    // transformer: satin admiralty-grey enamel on the tank
    tankPaint: phys({ map: grimeCanvas([186, 180, 170], 40), color: 0x8A9299, roughness: 0.42, metalness: 0.12, clearcoat: 0.3, clearcoatRoughness: 0.45, bumpMap: peel(4), bumpScale: 0.5 }),
    // cooling fins: vertex colours shade each fin from dark at the tank wall to light at its edge,
    // so the channels between fins read deep even without ambient occlusion (weak GPUs skip it)
    fin: phys({ color: 0x8A9299, roughness: 0.52, metalness: 0.12, clearcoat: 0.12, clearcoatRoughness: 0.45, vertexColors: true, bumpMap: peel(4), bumpScale: 0.4 }),
    finCavity: std({ color: 0x353A40, roughness: 0.8, metalness: 0.1 }),
    tankDark: std({ color: 0x4A5056, roughness: 0.5, metalness: 0.2, bumpMap: peel(2), bumpScale: 0.4 }),
    // bench: RAL 7035 light grey, the standard for Indian panel shops
    benchPaint: std({ map: grimeCanvas([206, 206, 200], 5), color: 0xD4D8D3, roughness: 0.36, metalness: 0.04, bumpMap: peel(3), bumpScale: 0.45 }),
    plinth: std({ color: 0x24272C, roughness: 0.7 }),
    plate: std({ color: 0xDD7A30, roughness: 0.5, metalness: 0.1, bumpMap: peel(3), bumpScale: 0.4 }),
    steel: std({ color: 0xC9CED3, roughness: 0.32, metalness: 0.92, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.25 }),
    steelDark: std({ color: 0x8A9097, roughness: 0.4, metalness: 0.85, roughnessMap: brushed }),
    // active part
    core: std({ color: 0x7B8189, roughness: 0.36, metalness: 0.78, bumpMap: lam, bumpScale: 1.2, roughnessMap: lam }),
    clamp: std({ color: 0x3A4047, roughness: 0.5, metalness: 0.3, bumpMap: peel(2), bumpScale: 0.4 }),
    copper: std({ color: 0xC97C46, roughness: 0.3, metalness: 1, bumpMap: foil, bumpScale: 0.9, emissive: 0xff6a10, emissiveIntensity: 0 }),
    enamel: phys({ color: 0x93491F, roughness: 0.34, metalness: 0.65, clearcoat: 0.9, clearcoatRoughness: 0.15 }),
    pressboard: std({ color: 0xC8A46A, roughness: 0.85, bumpMap: peel(6), bumpScale: 0.6 }),
    porcelain: phys({ color: 0x4E2615, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 }),
    brass: std({ color: 0xCFA650, roughness: 0.28, metalness: 1 }),
    rubber: std({ color: 0x17181B, roughness: 0.78 }),
    glass: phys({ color: 0xE8F2FF, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1 }),
    silica: std({ color: 0xEE8A22, roughness: 0.7 }),
    // electrical parts
    black: std({ color: 0x1D1F23, roughness: 0.42 }),
    module: std({ color: 0x2C3036, roughness: 0.45, metalness: 0.2 }),
    grey: std({ color: 0x8E939B, roughness: 0.5 }),
    duct: std({ color: 0x9EA3AB, roughness: 0.62 }),
    white: std({ color: 0xEDEDEA, roughness: 0.48 }),
    rail: std({ color: 0xC9CDD3, roughness: 0.25, metalness: 0.9 }),
    termG: std({ color: 0x9AA0A8, roughness: 0.5 }),
    termB: std({ color: 0x2B6FD6, roughness: 0.5 }),
    termE: std({ color: 0x3E9B4F, roughness: 0.5 }),
    yellow: std({ color: 0xF2C200, roughness: 0.42 }),
    red: std({ color: 0xD3271F, roughness: 0.3, emissive: 0x400000, emissiveIntensity: 0.5 }),
    ledG: glow(0x30D158),
    ledO: glow(0xFF9F0A, 1),
    lampR: glow(0xFF453A, 2.8),
    lampY: glow(0xFFD60A, 2.2),
    lampB: glow(0x0A84FF, 3.2),
    // test-lead sleeves; emissive pulses while a test runs
    sleeveR: std({ color: 0xD8261C, emissive: 0xFF2A1F, emissiveIntensity: 0, roughness: 0.55 }),
    sleeveY: std({ color: 0xE8B800, emissive: 0xFFC400, emissiveIntensity: 0, roughness: 0.55 }),
    sleeveB: std({ color: 0x1662D6, emissive: 0x0A6CFF, emissiveIntensity: 0, roughness: 0.55 }),
    clampRed: std({ color: 0xC4221A, roughness: 0.35 }),
  };
}

export type Mats = ReturnType<typeof createMaterials>;

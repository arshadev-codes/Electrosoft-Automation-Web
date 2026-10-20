import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { disposeTree, makeCanvas } from './kit';
import { STUDIO } from '../look';

const BRAND = 0x0B5BD3;
export const FLOOR_Y = -1.15;
// Poly Haven "Studio Small 09" (CC0, polyhaven.com): real softbox reflections on paint, porcelain, copper
const HDRI_URL = '/env/studio.hdr';

/** Ambient occlusion that ignores glow sprites and helper overlays (userData.noAO). */
class StudioAO extends GTAOPass {
  scale = 0.5; // AO buffers at half resolution; the denoiser hides the difference
  setSize(width: number, height: number) {
    super.setSize(Math.max(1, Math.round(width * this.scale)), Math.max(1, Math.round(height * this.scale)));
  }
  overrideVisibility() {
    const cache = (this as unknown as { _visibilityCache: Map<THREE.Object3D, boolean> })._visibilityCache;
    this.scene.traverse(o => {
      cache.set(o, o.visible);
      if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite || o.userData.noAO) o.visible = false;
    });
  }
}


/** Faint single-line diagram of the test bay, painted large on the back wall. */
function blueprintTex() {
  const { c, x } = makeCanvas(2048, 900);
  const ink = 'rgba(11,91,211,.55)';
  x.strokeStyle = ink; x.fillStyle = ink;
  x.lineWidth = 2;
  for (let gx = 0; gx <= 2048; gx += 64) { x.globalAlpha = 0.25; x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, 900); x.stroke(); }
  for (let gy = 0; gy <= 900; gy += 64) { x.beginPath(); x.moveTo(0, gy); x.lineTo(2048, gy); x.stroke(); }
  x.globalAlpha = 1; x.lineWidth = 6; x.lineCap = 'round';
  const bus = 300;
  x.beginPath(); x.moveTo(140, bus); x.lineTo(1900, bus); x.stroke();
  const node = (cx: number, label: string, draw: () => void) => {
    x.beginPath(); x.moveTo(cx, bus); x.lineTo(cx, bus + 120); x.stroke();
    draw();
    x.font = '700 30px "JetBrains Mono", monospace'; x.textAlign = 'center';
    x.fillText(label, cx, bus + 330);
  };
  node(330, 'INCOMER', () => { x.strokeRect(300, bus + 120, 60, 60); x.beginPath(); x.moveTo(300, bus + 180); x.lineTo(360, bus + 120); x.stroke(); });
  node(720, 'MG SET', () => { x.beginPath(); x.arc(720, bus + 170, 50, 0, Math.PI * 2); x.stroke(); x.font = '700 40px Arial'; x.textAlign = 'center'; x.fillText('G', 720, bus + 184); });
  node(1110, 'TEST BENCH', () => { x.strokeRect(1060, bus + 120, 100, 80); x.beginPath(); x.moveTo(1075, bus + 175); x.quadraticCurveTo(1110, bus + 120, 1145, bus + 175); x.stroke(); });
  node(1500, 'UNIT UNDER TEST', () => { x.beginPath(); x.arc(1500, bus + 150, 40, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(1500, bus + 205, 40, 0, Math.PI * 2); x.stroke(); });
  x.font = '800 44px "JetBrains Mono", monospace'; x.textAlign = 'left';
  x.fillText('TEST BAY 01', 140, 150);
  x.font = '600 26px "JetBrains Mono", monospace';
  x.fillText("X'MER PRIME\u2122 \u00b7 FULLY AUTOMATIC", 140, 200);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/**
 * Seamless photo-studio cyclorama: the floor sweeps up into a curved wall all round the bay,
 * with haze for depth, a soft brand glow and the bay blueprint on the back wall.
 */
function buildStudio(scene: THREE.Scene) {
  scene.fog = new THREE.Fog(STUDIO.haze, STUDIO.fogNear, STUDIO.fogFar);
  // profile from wall top down the cove to the centre, so lathe normals face inward
  const R = 26, cove = 6, H = 18, prof: THREE.Vector2[] = [new THREE.Vector2(R, H), new THREE.Vector2(R, cove)];
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    prof.push(new THREE.Vector2(R - cove + Math.cos(a) * cove, cove - Math.sin(a) * cove));
  }
  prof.push(new THREE.Vector2(0.01, 0));
  // matte Lambert: the backdrop fills the screen, so it must be cheap to shade
  const cyc = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshLambertMaterial({ color: STUDIO.wall }));
  cyc.position.y = FLOOR_Y - 0.004;
  scene.add(cyc);
  // shadows only where the equipment stands, not across the whole studio
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.ShadowMaterial({ opacity: 0.24 }));
  shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = FLOOR_Y + 0.0005; shadowDisc.receiveShadow = true; shadowDisc.renderOrder = -2;
  scene.add(shadowDisc);

  // soft brand-blue light pooled on the back wall, behind the bench
  const glowC = makeCanvas(256, 256);
  const g = glowC.x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, `rgba(61,134,255,${STUDIO.glow})`); g.addColorStop(0.5, 'rgba(61,134,255,.16)'); g.addColorStop(1, 'rgba(61,134,255,0)');
  glowC.x.fillStyle = g; glowC.x.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowC.c), transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  glow.position.set(2.5, FLOOR_Y + 3.6, -20.5); glow.userData.noAO = true;
  scene.add(glow);

  const print = new THREE.Mesh(new THREE.PlaneGeometry(13, 5.7), new THREE.MeshBasicMaterial({ map: blueprintTex(), transparent: true, opacity: STUDIO.print, depthWrite: false }));
  // sits above and behind the equipment in the hero shot, clear of the headline
  print.position.set(4, FLOOR_Y + 4.6, -20.2); print.userData.noAO = true;
  scene.add(print);

  // spotlight look: a bright pool of light on the floor under the equipment, edges fall into haze
  if (STUDIO.pool > 0) {
    const poolC = makeCanvas(256, 256);
    const pg = poolC.x.createRadialGradient(128, 128, 0, 128, 128, 128);
    pg.addColorStop(0, `rgba(255,255,255,${STUDIO.pool})`); pg.addColorStop(0.55, `rgba(255,255,255,${STUDIO.pool * 0.45})`); pg.addColorStop(1, 'rgba(255,255,255,0)');
    poolC.x.fillStyle = pg; poolC.x.fillRect(0, 0, 256, 256);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(13, 8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(poolC.c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, FLOOR_Y + 0.001, 0.2); pool.renderOrder = -2; pool.userData.noAO = true;
    scene.add(pool);
  }
}

/** Bloom computed at half resolution: the glow is soft anyway, and it costs a quarter as much. */
class HalfBloom extends UnrealBloomPass {
  setSize(width: number, height: number) {
    super.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }
}

/** Integrated / mobile GPUs get a lighter pipeline from the first frame. */
function isWeakGpu(renderer: THREE.WebGLRenderer) {
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  return /intel|mali|adreno|powervr|swiftshader|llvmpipe|basic render/i.test(name) || (navigator.hardwareConcurrency || 8) <= 4;
}

/**
 * OutputPass for a transparent canvas: the buffer holds premultiplied colour, so tone mapping and the
 * sRGB curve must run on straight colour or soft edges (the floor fade) come out as bright halos.
 * Near-zero alpha (pure bloom light over the page) is left additive.
 */
function premultipliedOutput() {
  const pass = new OutputPass();
  pass.material.fragmentShader = pass.material.fragmentShader
    .replace('gl_FragColor = texture2D( tDiffuse, vUv );', `gl_FragColor = texture2D( tDiffuse, vUv );
      float pa = gl_FragColor.a;
      bool straight = pa > 0.02;
      if ( straight ) gl_FragColor.rgb /= pa;`)
    .replace(/}\s*$/, `  if ( straight ) gl_FragColor.rgb *= pa;
    }`);
  pass.material.needsUpdate = true;
  return pass;
}

/**
 * Renderer + studio: captured HDRI lighting, soft key light with shadows, and a post chain of
 * MSAA → ambient occlusion → bloom (lamps, screens, beacon) → tone mapping.
 * Quality steps down automatically on slow GPUs.
 */
export function createWorld(canvas: HTMLCanvasElement) {
  // antialias on the canvas itself for the direct (no post-processing) path used on weak GPUs
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const weak = isWeakGpu(renderer);
  let dpr = Math.min(window.devicePixelRatio || 1, weak ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral keeps paint and copper colours true, like a product photo
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = STUDIO.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCF + radius: soft edges without VSM's extra blur passes
  renderer.shadowMap.autoUpdate = false; // redrawn only while something moves (see markShadows)

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 60);

  // instant fallback reflections, replaced by the captured studio once it loads
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  let envRT = pmrem.fromScene(room, 0.04);
  disposeTree(room);
  scene.environment = envRT.texture;
  scene.environmentIntensity = STUDIO.env;
  let disposed = false;
  new RGBELoader().loadAsync(HDRI_URL).then(hdr => {
    if (disposed) { hdr.dispose(); return; }
    const rt = pmrem.fromEquirectangular(hdr);
    hdr.dispose();
    envRT.dispose(); envRT = rt;
    scene.environment = rt.texture;
    scene.environmentIntensity = STUDIO.env;
    scene.environmentRotation.set(0, -0.9, 0); // big softbox high front-left, like the key light
  }).catch(() => { /* keep the generated room */ });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb4bac4, 0.25));
  // big soft key from above-front, cool brand rim from behind, warm low fill
  const key = new THREE.DirectionalLight(0xfff8f0, STUDIO.key);
  key.position.set(3.5, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(weak ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 2, far: 24 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(BRAND, STUDIO.rim); rim.position.set(-7, 5, -7); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffeedd, 0.3); fill.position.set(-5, 1.5, 7); scene.add(fill);

  buildStudio(scene);

  /* ---------- post-processing ---------- */
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new StudioAO(scene, camera, 1, 1);
  ao.updateGtaoMaterial({ radius: 0.32, distanceExponent: 1.6, thickness: 1.2, scale: 1.25, samples: 12 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  ao.blendIntensity = 1;
  composer.addPass(ao);
  // high threshold: only emissive lamps, LEDs and the beacon bloom, never lit paint
  const bloom = new HalfBloom(new THREE.Vector2(1, 1), 0.5, 0.45, 1.6);
  // add glow to colour only; keep the canvas alpha so the CSS hero background shows through
  Object.assign(bloom.blendMaterial, {
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  composer.addPass(bloom);
  composer.addPass(premultipliedOutput());

  let w = 1, h = 1;
  function setSize(width: number, height: number) {
    w = width; h = height;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  /* ---------- quality levels: 2 = AO + bloom, 1 = bloom, 0 = direct render, no post (weak GPUs) ---------- */
  // measured on Intel UHD: direct ≈ 13 ms/frame, post chain ≈ 27 ms/frame at 1905×911
  let level = weak ? 0 : 2;
  const apply = () => {
    ao.enabled = level >= 2;
    bloom.enabled = level >= 1;
    if (level === 0 && dpr > 1.25) { dpr = 1.25; renderer.setPixelRatio(dpr); setSize(w, h); }
  };
  apply();
  // watch real frame times and step down if the GPU still struggles
  let samples = 0, sum = 0;
  function sample(dt: number) {
    if (level === 0 || dt <= 0 || dt > 0.25) return; // ignore tab switches and throttled frames
    sum += dt; samples++;
    if (samples < 45) return;
    const avg = sum / samples; samples = 0; sum = 0;
    if (avg > 0.021) { level--; apply(); }
  }

  /** Call when anything that casts a shadow moved this frame. */
  function markShadows() { renderer.shadowMap.needsUpdate = true; }

  function render(dt: number) {
    if (level === 0) renderer.render(scene, camera);
    else composer.render(dt);
    sample(dt);
  }

  function dispose() {
    disposed = true;
    disposeTree(scene);
    envRT.dispose(); pmrem.dispose();
    ao.dispose(); bloom.dispose(); composer.dispose(); target.dispose();
    renderer.dispose();
  }

  return { renderer, scene, camera, setSize, render, markShadows, dispose };
}

export type World = ReturnType<typeof createWorld>;

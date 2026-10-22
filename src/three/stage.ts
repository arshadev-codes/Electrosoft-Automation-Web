import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { disposeTree, GLOW_FADE } from './kit';
import { STUDIO } from '../look';

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


/**
 * No walls: the canvas stays transparent so the page colour is the backdrop. A shadow catcher
 * takes the key light's shadow, and haze in the page colour fades the far parts of wide shots.
 */
function buildStudio(scene: THREE.Scene) {
  scene.fog = new THREE.Fog(STUDIO.page, STUDIO.fogNear, STUDIO.fogFar);
  const catcher = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.ShadowMaterial({ opacity: STUDIO.shadow }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = FLOOR_Y + 0.0005; catcher.receiveShadow = true; catcher.renderOrder = -2;
  catcher.userData.noAO = true;
  scene.add(catcher);
}

/* ---------- ground occlusion: a cheap stand-in for ambient occlusion ---------- */

const gao = { floor: { value: FLOOR_Y }, reach: { value: 1.25 }, min: { value: 0.3 } };

/**
 * Ambient and reflected light fade toward the floor, the way a studio's light is blocked near the
 * ground. Weak GPUs skip the AO pass, and without this everything is lit evenly top to bottom and
 * reads as CG. Patches every lit material under root once; exploded parts lifted clear of the
 * floor brighten on their own.
 */
export function shadeGround(root: THREE.Object3D) {
  root.traverse(o => {
    const m = (o as THREE.Mesh).material;
    (Array.isArray(m) ? m : m ? [m] : []).forEach(mat => {
      if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial || mat.userData.gao) return;
      mat.userData.gao = true;
      mat.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, { gaoFloor: gao.floor, gaoReach: gao.reach, gaoMin: gao.min });
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>
            varying float vGaoY;`)
          .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
            {
              vec4 gaoP = vec4( transformed, 1.0 );
              #ifdef USE_INSTANCING
                gaoP = instanceMatrix * gaoP;
              #endif
              vGaoY = ( modelMatrix * gaoP ).y;
            }`);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
            varying float vGaoY;
            uniform float gaoFloor, gaoReach, gaoMin;`)
          .replace('#include <aomap_fragment>', `#include <aomap_fragment>
            float gaoK = mix( gaoMin, 1.0, smoothstep( 0.0, gaoReach, vGaoY - gaoFloor ) );
            reflectedLight.indirectDiffuse *= gaoK;
            reflectedLight.indirectSpecular *= mix( 0.45, 1.0, gaoK );
            reflectedLight.directDiffuse *= mix( 0.8, 1.0, gaoK );`);
      };
      mat.needsUpdate = true;
    });
  });
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
  renderer.toneMapping = STUDIO.tone === 'agx' ? THREE.AgXToneMapping : STUDIO.tone === 'aces' ? THREE.ACESFilmicToneMapping : THREE.NeutralToneMapping;
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

  scene.add(new THREE.HemisphereLight(0xffffff, 0xc4c9d0, 0.3));
  // big soft key from above-front, neutral rim from behind to separate the edges from the page, warm low fill
  const key = new THREE.DirectionalLight(0xfff8f0, STUDIO.key);
  key.position.set(3.5, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(weak ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 2, far: 24 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8eef8, STUDIO.rim); rim.position.set(-7, 5, -7); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffeedd, STUDIO.fill); fill.position.set(-5, 1.5, 7); scene.add(fill);

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
  // dev only: ?q=0|1|2 pins a quality level, to compare looks and frame costs on one machine
  const forced = import.meta.env.DEV ? new URLSearchParams(location.search).get('q') : null;
  let level = forced !== null ? +forced : weak ? 0 : 2;
  const apply = () => {
    ao.enabled = level >= 2;
    bloom.enabled = level >= 1;
    if (level === 0 && dpr > 1.25) { dpr = 1.25; renderer.setPixelRatio(dpr); setSize(w, h); }
  };
  apply();
  // watch real frame times and step down if the GPU still struggles
  let samples = 0, sum = 0;
  function sample(dt: number) {
    if (level === 0 || forced !== null || dt <= 0 || dt > 0.25) return; // ignore tab switches and throttled frames
    sum += dt; samples++;
    if (samples < 45) return;
    const avg = sum / samples; samples = 0; sum = 0;
    if (avg > 0.021) { level--; apply(); }
  }

  /**
   * Scroll transitions: 0 = clear air, 1 = everything at `focus` (the camera's distance to its subject)
   * has dissolved into the page colour. Nearer parts go last, so the scene recedes rather than fades.
   */
  function setHaze(h: number, focus: number) {
    const fog = scene.fog as THREE.Fog;
    fog.near = STUDIO.fogNear * (1 - h);
    fog.far = STUDIO.fogFar + (focus * 1.02 - STUDIO.fogFar) * h;
    GLOW_FADE.value = (1 - h) * (1 - h);
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

  return { renderer, scene, camera, setSize, render, markShadows, setHaze, dispose };
}

export type World = ReturnType<typeof createWorld>;

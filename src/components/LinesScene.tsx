import { useLayoutEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { createWorld, FLOOR_Y, type World } from '../three/stage';
import { createMaterials } from '../three/materials';
import { glowSprite } from '../three/kit';
import { mergeStatic } from '../three/optimize';
import { buildControlPanel } from '../three/models/controlPanel';
import { buildTransformer } from '../three/models/transformer';
import { lines } from '../sections/linesMotion';

const TT_H = 0.07;                 // turntable deck height
const SCAN_LO = FLOOR_Y + TT_H - 0.02, SCAN_HI = FLOOR_Y + TT_H + 2.5;
const FOCUS_Y = FLOOR_Y + 1.15;

/** Every material under root clips against `plane` (world space), shadows included. */
function clipTo(root: THREE.Object3D, plane: THREE.Plane) {
  root.traverse(o => {
    const m = (o as THREE.Mesh).material;
    (Array.isArray(m) ? m : m ? [m] : []).forEach(mat => { mat.clippingPlanes = [plane]; mat.clipShadows = true; });
  });
}

function turntable(parent: THREE.Object3D) {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.68, TT_H, 96), new THREE.MeshStandardMaterial({ color: 0x1D2026, roughness: 0.32, metalness: 0.6 }));
  deck.position.y = TT_H / 2; deck.receiveShadow = true; deck.castShadow = true;
  g.add(deck);
  // brand light ring set into the deck; bright enough for the bloom pass to catch
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3d86ff).multiplyScalar(2.4), toneMapped: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.53, 128), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = TT_H + 0.001; ring.userData.noAO = true;
  g.add(ring);
  // index ticks around the rim, so the turn reads
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.004, 0.07), new THREE.MeshBasicMaterial({ color: 0x8a94a6 }), 72);
  const o = new THREE.Object3D();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    o.position.set(Math.sin(a) * 1.59, TT_H + 0.002, Math.cos(a) * 1.59); o.rotation.set(0, a, 0); o.updateMatrix();
    ticks.setMatrixAt(i, o.matrix);
  }
  ticks.userData.noAO = true;
  g.add(ticks);
  parent.add(g);
  return g;
}

/** The scanner: a bright ring and a faint disc of light that sweep up through the model. */
function scanner(parent: THREE.Object3D) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.32, 1.4, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3d86ff).multiplyScalar(3), toneMapped: false, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.32, 96), new THREE.MeshBasicMaterial({ color: 0x3d86ff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  disc.rotation.x = -Math.PI / 2;
  g.add(ring, disc);
  g.traverse(o => { o.userData.noAO = true; });
  g.visible = false;
  parent.add(g);
  return g;
}

/**
 * 1.4 Two business lines: an Electrosoft MCC on a turntable that a scan ring rebuilds into a
 * transformer under test. Lazy-loaded by Lines; the scroll story is in linesMotion.ts.
 */
export default function LinesScene({ sectionRef }: { sectionRef: RefObject<HTMLElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current, canvas = canvasRef.current;
    if (!section || !canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { S } = lines;
    const cam = { r: S.r, theta: S.theta, phi: S.phi, off: S.off };
    const pointer = { x: 0, ex: 0 };
    const callouts = [...section.querySelectorAll<HTMLElement>('.lx-callouts .callout')];
    const tmp = new THREE.Vector3(), target = new THREE.Vector3(), centre = new THREE.Vector3();
    let world: World | null = null, raf = 0, visible = true, disposed = false, ready = false, last = performance.now();
    let lastSig = NaN, lastMove = 0, odd = false, gapMid = 0;
    let ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
    let frame: (now: number) => void = () => {};

    const onPointer = (e: PointerEvent) => { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; };
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true });

    const init = async () => {
      try {
        world = createWorld(canvas);
      } catch {
        canvas.style.display = 'none';
        section.querySelector('.lx-fallback')?.removeAttribute('hidden');
        return;
      }
      const { renderer, scene, camera } = world;
      renderer.localClippingEnabled = true;
      const copies = [...section.querySelectorAll<HTMLElement>('.lx-copy')], hud = section.querySelector<HTMLElement>('.lx-hud');
      const resize = () => {
        world!.setSize(section.clientWidth, section.clientHeight);
        const top = Math.max(0, ...copies.map(c => c.offsetTop + c.offsetHeight)), bottom = hud ? hud.offsetTop : section.clientHeight;
        gapMid = (top + bottom) / 2;
      };
      resize();
      ro = new ResizeObserver(resize); ro.observe(section);
      io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(section);

      await new Promise(r => setTimeout(r, 0));
      // two material sets: each model clips against its own side of the scan plane
      const MA = createMaterials(), MB = createMaterials();
      const stageRoot = new THREE.Group(); stageRoot.position.y = FLOOR_Y; scene.add(stageRoot);
      const table = turntable(stageRoot);
      const panel = buildControlPanel(MA, table); panel.root.position.y = TT_H;
      const xf = buildTransformer(MB, table); xf.root.position.y = TT_H;
      // bushing lights, R Y B, on while the transformer is under test
      const phase = [0xff453a, 0xffd60a, 0x0a84ff];
      const bushGlow = xf.hvTops.slice(0, 3).map((v, i) => {
        const sp = glowSprite(xf.parts.cover.inner, phase[i], 0.42, [v.x, v.y + 0.05, v.z], 0);
        sp.userData.noAO = true;
        return sp;
      });
      Object.values(xf.parts).forEach(p => mergeStatic(p.inner));
      const keepAbove = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), keepBelow = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
      clipTo(panel.root, keepAbove); clipTo(xf.root, keepBelow);
      const scan = scanner(stageRoot);

      const anchors: { obj: THREE.Object3D; v: THREE.Vector3; set: 'a' | 'b' }[] = [
        { obj: panel.root, v: panel.anchors.busbars, set: 'a' },
        { obj: panel.root, v: panel.anchors.plc, set: 'a' },
        { obj: panel.root, v: panel.anchors.door, set: 'a' },
        { obj: xf.parts.tank.inner, v: xf.anchors.tank, set: 'b' },
        { obj: xf.parts.cover.inner, v: xf.anchors.cover, set: 'b' },
        { obj: xf.parts.hv.inner, v: xf.anchors.hv, set: 'b' },
      ];

      camera.position.set(0, 2, 14); camera.lookAt(0, 0, 0);
      await new Promise(r => setTimeout(r, 0));
      try { await renderer.compileAsync(scene, camera); } catch { /* compiles on first render */ }
      if (disposed) return;

      frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now;
        if (!visible || !ready || !world) return;
        const t = now / 1000, w = section.clientWidth, h = section.clientHeight;

        const sig = S.spin * 3 + S.open * 5 + S.scan * 7 + S.glow + S.off + S.theta + S.r;
        if (sig !== lastSig) { lastSig = sig; lastMove = now; }
        odd = !odd;
        if (now - lastMove > 600 && Math.abs(pointer.x - pointer.ex) < 0.01 && odd) return; // at rest, 30 fps

        const k = 1 - Math.exp(-dt * 6), kp = 1 - Math.exp(-dt * 2.5);
        pointer.ex += (pointer.x - pointer.ex) * kp;
        cam.r += (S.r - cam.r) * k; cam.theta += (S.theta + pointer.ex * 0.05 - cam.theta) * k;
        cam.phi += (S.phi - cam.phi) * k; cam.off += (S.off - cam.off) * k;

        // phones / portrait: centre the model, pull back to fit, drop it below the copy
        const narrow = w < 760 || w < h;
        const r = cam.r * (narrow ? Math.max(1.3, 0.75 / (w / h)) : 1), off = narrow ? 0 : cam.off;
        const cx = Math.cos(cam.theta), sx = Math.sin(cam.theta);
        const lift = narrow ? (gapMid - h / 2) * (2 * r * Math.tan(Math.PI / 12)) / h : 0;
        target.set(-cx * off, FOCUS_Y + lift, sx * off);
        camera.position.set(target.x + r * sx * Math.cos(cam.phi), target.y + r * Math.sin(cam.phi), target.z + r * cx * Math.cos(cam.phi));
        camera.lookAt(target);

        table.rotation.y = S.spin;
        panel.update(t, S.open);
        const y = SCAN_LO + (SCAN_HI - SCAN_LO) * S.scan, morphing = S.scan > 0.001 && S.scan < 0.999;
        keepAbove.constant = -y; keepBelow.constant = y;
        panel.root.visible = S.scan < 0.999; xf.root.visible = S.scan > 0.001;
        // AO ignores clipping, so the half-hidden models skip it while the scan runs
        panel.root.userData.noAO = xf.root.userData.noAO = morphing;
        scan.visible = morphing; scan.position.y = y - FLOOR_Y;
        const edge = Math.min(1, S.scan * 12, (1 - S.scan) * 12);
        scan.children.forEach(c => { ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = c === scan.children[0] ? edge : edge * 0.1; });

        const live = S.glow * (0.82 + 0.18 * Math.sin(t * 7));
        MB.copper.emissiveIntensity = live * 0.3;
        bushGlow.forEach((sp, i) => { sp.material.opacity = S.glow * (0.7 + 0.3 * Math.sin(t * 6 + i * 2.1)); });

        if (now - lastMove < 700) world.markShadows(); // shadows only redraw while something moves
        world.render(rawDt);

        // spec callouts follow their anchors; hidden when the anchor turns away from the camera
        centre.set(0, FOCUS_Y, 0);
        callouts.forEach((el, i) => {
          const a = anchors[i];
          const amt = a.set === 'a' ? S.callA : S.callB, idx = a.set === 'a' ? i : i - 3;
          const o = Math.max(0, Math.min(1, amt * 3 - idx * 0.6));
          let pos: { x: number; y: number } | null = null;
          if (o > 0.001 && a.obj.visible !== false) {
            a.obj.localToWorld(tmp.copy(a.v));
            const facing = (tmp.x - centre.x) * (camera.position.x - centre.x) + (tmp.z - centre.z) * (camera.position.z - centre.z);
            if (facing > -0.6) {
              tmp.project(camera);
              if (tmp.z < 1) pos = { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h };
            }
          }
          el.style.opacity = pos ? String(o) : '0';
          el.style.visibility = pos && o > 0 ? 'visible' : 'hidden';
          if (pos) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        });
      };

      // warm-up frame, then reveal
      world.markShadows(); world.render(0);
      ready = true;
      canvas.classList.add('ready');
      raf = requestAnimationFrame(frame);
    };

    const start = window.setTimeout(() => { void init(); }, 0);
    return () => {
      disposed = true;
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      ro?.disconnect(); io?.disconnect();
      callouts.forEach(el => { el.style.opacity = '0'; el.style.visibility = 'hidden'; });
      world?.dispose();
    };
  }, [sectionRef]);

  return <canvas className="lx-gl" ref={canvasRef} aria-hidden="true" />;
}

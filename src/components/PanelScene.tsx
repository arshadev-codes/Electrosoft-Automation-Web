import { useLayoutEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createWorld, FLOOR_Y, type World } from '../three/stage';
import { createMaterials } from '../three/materials';
import { loadModel } from '../three/loadModel';
import { disposeTree } from '../three/kit';
import { ASSEMBLY, BENCH_PARTS, EXPLODE, PART_KEYS, TAGS, type PartKey, type SceneModel } from '../three/types';
import { hero, type Cam } from '../sections/heroMotion';

gsap.registerPlugin(ScrollTrigger);
// dev only: lets browser automation inspect timelines (e.g. disable lag smoothing in throttled tabs)
if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger });

/**
 * Hero 3D test bay. Lazy-loaded by Hero. The scroll story lives in heroMotion.ts and
 * only moves numbers; this component renders those numbers every frame.
 */
export default function PanelScene({ stageRef }: { stageRef: RefObject<HTMLElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current, tagsEl = tagsRef.current;
    if (!stage || !canvas || !tagsEl) return;
    const q = (s: string) => stage.querySelector<HTMLElement>(s);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { S } = hero;

    const intro = { r: reduce ? 0 : 6, theta: reduce ? 0 : -0.5 }; // load-in camera offset
    const cam: Cam = { r: S.r + intro.r, theta: S.theta + intro.theta, phi: S.phi, fx: S.fx, fy: S.fy, fz: S.fz, off: S.off }; // eased camera actually rendered
    const pointer = { x: 0, y: 0, ex: 0, ey: 0 };
    const ctx = gsap.context(() => {}, stage);
    const tags: { el: HTMLDivElement; key: PartKey; flip: boolean; bench: boolean; gi: number }[] = [];
    const callouts = [...stage.querySelectorAll<HTMLElement>('.callout')];
    const tmp = new THREE.Vector3(), target = new THREE.Vector3();
    let world: World | null = null, model: SceneModel | null = null;
    let raf = 0, visible = true, disposed = false, ready = false, last = performance.now();
    let lastSig = NaN, lastMove = 0, odd = false;
    let gapMid = 0; // phones: vertical middle of the free band between the copy and the HUD (px)
    let ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;

    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true });

    const project = (part: PartKey, v: THREE.Vector3, w: number, h: number) => {
      const p = model!.parts[part];
      if (!p) return null;
      tmp.copy(v); p.inner.localToWorld(tmp); tmp.project(world!.camera);
      return tmp.z < 1 ? { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h } : null;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now;
      if (!visible || !ready || !model || !world) return;
      const { camera } = world;
      const t = now / 1000, w = stage.clientWidth, h = stage.clientHeight;

      // what moved? parts (scroll explode + load-in drop) and the camera target
      let sig = intro.r * 7 + S.r + S.theta * 3 + S.fx + S.fy;
      PART_KEYS.forEach((key, i) => { const p = model!.parts[key]; sig += hero.E[key].v * (i + 1) + (p ? p.outer.position.y * (i + 2) : 0); });
      const partsMoved = sig !== lastSig;
      if (partsMoved) { lastSig = sig; lastMove = now; }
      // at rest the bay only has screens and lamps animating: 30 fps is plenty and halves GPU load
      const resting = now - lastMove > 600 && Math.abs(pointer.x - pointer.ex) < 0.01;
      odd = !odd;
      if (resting && odd) return;

      // ease the rendered camera toward the scroll/intro target, plus a slight cursor follow
      const k = 1 - Math.exp(-dt * 7.5), kp = 1 - Math.exp(-dt * 2.5);
      pointer.ex += (pointer.x - pointer.ex) * kp; pointer.ey += (pointer.y - pointer.ey) * kp;
      cam.r += (S.r + intro.r - cam.r) * k;
      cam.theta += (S.theta + S.spin + intro.theta + pointer.ex * 0.06 - cam.theta) * k;
      cam.phi += (S.phi + pointer.ey * 0.025 - cam.phi) * k;
      cam.fx += (S.fx - cam.fx) * k; cam.fy += (S.fy - cam.fy) * k; cam.fz += (S.fz - cam.fz) * k;
      cam.off += (S.off - cam.off) * k;

      // aim so the focus sits `off` right of centre; phones / portrait centre it, pull back until
      // the whole bay fits the width, and drop it into the space below the copy
      const narrow = w < 760 || w < h;
      const r = cam.r * (narrow ? Math.max(1.7, 1.15 / (w / h)) : 1), off = narrow ? 0 : cam.off;
      const cx = Math.cos(cam.theta), sx = Math.sin(cam.theta);
      // raise the aim by (gap middle − screen middle) in world units, so the bay sits in that band (fov 30°)
      const lift = narrow ? (gapMid - h / 2) * (2 * r * Math.tan(Math.PI / 12)) / h : 0;
      target.set(cam.fx - cx * off, cam.fy + lift, cam.fz + sx * off);
      camera.position.set(target.x + r * sx * Math.cos(cam.phi), target.y + r * Math.sin(cam.phi), target.z + r * cx * Math.cos(cam.phi));
      camera.lookAt(target);

      PART_KEYS.forEach(key => {
        const p = model!.parts[key], [ex, ey, ez] = EXPLODE[key], v = hero.E[key].v;
        if (p) p.inner.position.set(ex * v, ey * v, ez * v);
      });
      model.update(t, dt, S);
      if (partsMoved) world.markShadows();
      world.render(rawDt);

      tags.forEach(tg => {
        const a = model!.anchors[tg.key];
        // each group's labels show in its own exploded shot, staggered one after another
        const group = tg.bench ? 1 - S.labelSplit : S.labelSplit;
        const op = Math.max(0, Math.min(1, (S.labels * group) * 5 - tg.gi * 0.7));
        const pos = a && op > 0 ? project(tg.key, a, w, h) : null;
        tg.el.style.opacity = pos ? String(op) : '0';
        // hidden glass costs nothing; transparent glass still re-blurs the canvas every frame
        tg.el.style.visibility = pos ? 'visible' : 'hidden';
        if (pos) {
          tg.el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
          // phones: put the label on whichever side of its pin has room
          tg.el.classList.toggle('flip', narrow ? pos.x > w / 2 : tg.flip);
        }
      });
      const cop = S.callouts * S.calloutIn;
      callouts.forEach((el, i) => {
        const c = model!.callouts[el.dataset.id ?? ''];
        const pos = c && cop > 0.001 ? project(c.part, c.v, w, h) : null;
        // stagger each card's fade so they arrive one after another
        const o = Math.max(0, Math.min(1, cop * 3 - i * 0.6));
        el.style.opacity = pos ? String(o) : '0';
        el.style.visibility = pos && o > 0 ? 'visible' : 'hidden';
        if (pos) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      });
    };

    // Heavy GPU/CPU work is split across tasks so the page stays responsive while it builds.
    const nextTask = () => new Promise<void>(r => setTimeout(r, 0));
    const init = async () => {
      if (disposed) return;
      try {
        world = createWorld(canvas);
      } catch {
        canvas.style.display = 'none';
        q('#fallback')?.removeAttribute('hidden');
        stage.dispatchEvent(new Event('scene:ready'));
        return;
      }
      const { renderer, scene, camera } = world;
      const copy = q('.hero-copy'), hud = q('.hud');
      const resize = () => {
        world!.setSize(stage.clientWidth, stage.clientHeight);
        // layout offsets, not rects: the scroll story moves the copy, the bay should stay put
        const top = copy ? copy.offsetTop + copy.offsetHeight : 0, bottom = hud ? hud.offsetTop : stage.clientHeight;
        gapMid = (top + bottom) / 2;
      };
      resize();
      ro = new ResizeObserver(resize); ro.observe(stage); if (copy) ro.observe(copy);
      io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(stage);

      // each heavy step runs in its own task so the page never freezes for long
      await nextTask();
      const mats = createMaterials();
      await nextTask();
      const m = await loadModel(mats);
      if (disposed) { disposeTree(m.root); return; }
      model = m;
      m.root.position.y = FLOOR_Y;
      scene.add(m.root);
      camera.position.set(0, 2, 14); camera.lookAt(0, 0, 0);
      await nextTask();
      try { await renderer.compileAsync(scene, camera); } catch { /* falls back to compile on first render */ }
      if (disposed) return;
      // hidden warm-up frame: uploads textures and builds shadow + post shaders before anything is visible
      await nextTask();
      world.markShadows();
      world.render(0);
      await nextTask();
      if (disposed) return;

      TAGS.forEach((t, i) => {
        const el = document.createElement('div');
        el.className = 'tag' + (t.flip ? ' flip' : '');
        el.innerHTML = `<i class="pin"></i><div class="lbl"><small>LAYER ${i + 1}</small><b>${t.name}</b><span>${t.sub}</span></div>`;
        tagsEl.appendChild(el);
        const bench = BENCH_PARTS.includes(t.part);
        tags.push({ el, key: t.part, flip: !!t.flip, bench, gi: tags.filter(x => x.bench === bench).length });
      });

      if (!reduce) {
        ctx.add(() => {
          // load-in: parts drop into place bottom-up while the camera dollies in, then callouts arrive
          ASSEMBLY.forEach((k, i) => {
            const p = m.parts[k];
            if (!p) return;
            gsap.from(p.outer.position, { y: 3.2 + i * 0.22, duration: 1.6, delay: i * 0.075, ease: 'expo.out' });
            gsap.from(p.outer.rotation, { x: -0.3, y: 0.25, duration: 1.6, delay: i * 0.075, ease: 'expo.out' });
          });
          gsap.to(intro, { r: 0, theta: 0, duration: 2.6, ease: 'expo.out' });
          gsap.to(S, { calloutIn: 1, duration: 1.4, delay: 1.5, ease: 'power2.out' });
        });
      } else {
        S.calloutIn = 1;
      }
      ready = true;
      if (import.meta.env.DEV) Object.assign(window, { __world: world });
      canvas.classList.add('ready');
      stage.dispatchEvent(new Event('scene:ready')); // Hero reveals the headline in the same frame
    };

    raf = requestAnimationFrame(frame);
    const ric = (cb: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 200 }) : window.setTimeout(cb, 0));
    // start right after first paint; the headline waits for us, so there is nothing to protect
    const startTimer = window.setTimeout(() => ric(() => { void init(); }), 0);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      ro?.disconnect(); io?.disconnect();
      ctx.revert();
      tagsEl.innerHTML = '';
      callouts.forEach(el => { el.style.opacity = '0'; });
      world?.dispose();
    };
  }, [stageRef]);

  return (
    <>
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div className="tags" ref={tagsRef} />
    </>
  );
}

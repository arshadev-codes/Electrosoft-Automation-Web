import { useLayoutEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { createWorld, FLOOR_Y, shadeGround, type World } from '../three/stage';
import { createMaterials } from '../three/materials';
import { glowSprite } from '../three/kit';
import { mergeStatic } from '../three/optimize';
import { buildTransformer } from '../three/models/transformer';
import { ts } from '../pages/testingSolutionsMotion';

const FOCUS_Y = FLOOR_Y + 1.0;
const PHASE = [0xff453a, 0xffd60a, 0x0a84ff]; // R Y B

/**
 * /transformer-testing hero: one distribution transformer under test, standing on the page.
 * Bushings glow R Y B while a test runs; the camera drifts slowly and follows the cursor a little.
 * Lazy-loaded by TestingSolutions; ts.haze / ts.glow come from testingSolutionsMotion.ts.
 */
export default function XfmrScene({ sectionRef }: { sectionRef: RefObject<HTMLElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    // may mount in the same commit as the page (chunk cached), before the section ref is attached
    const canvas = canvasRef.current, section = sectionRef.current ?? canvas?.closest<HTMLElement>('section') ?? null;
    if (!section || !canvas) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cam = { r: reduce ? 7 : 9.5, theta: reduce ? 0.55 : 1.05 };
    const pointer = { x: 0, y: 0, ex: 0, ey: 0 };
    const target = new THREE.Vector3();
    let world: World | null = null, raf = 0, visible = true, disposed = false, ready = false;
    let last = performance.now(), born = 0, gapMid = 0, odd = false;
    let ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
    let frame: (now: number) => void = () => {};

    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true });

    const init = async () => {
      try {
        world = createWorld(canvas);
      } catch {
        canvas.style.display = 'none';
        section.dispatchEvent(new Event('scene:ready'));
        return;
      }
      const { renderer, scene, camera } = world;
      const copy = section.querySelector<HTMLElement>('.ts-copy'), hud = section.querySelector<HTMLElement>('.ts-hud');
      const resize = () => {
        world!.setSize(section.clientWidth, section.clientHeight);
        const top = copy ? copy.offsetTop + copy.offsetHeight : 0, bottom = hud ? hud.offsetTop : section.clientHeight;
        gapMid = (top + bottom) / 2;
      };
      resize();
      ro = new ResizeObserver(resize); ro.observe(section);
      io = new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; }); io.observe(section);

      await new Promise(r => setTimeout(r, 0));
      const M = createMaterials();
      const root = new THREE.Group(); root.position.y = FLOOR_Y; root.rotation.y = -0.18; scene.add(root);
      const xf = buildTransformer(M, root);
      Object.values(xf.parts).forEach(p => mergeStatic(p.inner));
      const glows = xf.hvTops.slice(0, 3).map((v, i) => {
        const sp = glowSprite(xf.parts.cover.inner, PHASE[i], 0.42, [v.x, v.y + 0.05, v.z], 0);
        sp.userData.noAO = true;
        return sp;
      });
      shadeGround(root);

      camera.position.set(0, 2, 12); camera.lookAt(0, FOCUS_Y, 0);
      await new Promise(r => setTimeout(r, 0));
      try { await renderer.compileAsync(scene, camera); } catch { /* compiles on first render */ }
      if (disposed) return;

      frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now;
        if (!visible || !ready || !world) return;
        // nothing casts a moving shadow, so the quiet drift can run at 30 fps
        odd = !odd;
        if (odd && now - born > 2400) return;
        const t = now / 1000, w = section.clientWidth, h = section.clientHeight;

        // load-in dolly, then a slow drift around the unit plus a little cursor follow
        const k = 1 - Math.exp(-dt * 1.6), kp = 1 - Math.exp(-dt * 2.5);
        pointer.ex += (pointer.x - pointer.ex) * kp; pointer.ey += (pointer.y - pointer.ey) * kp;
        cam.r += (7 - cam.r) * k; cam.theta += (0.55 - cam.theta) * k;
        const drift = reduce ? 0 : Math.sin(t * 0.16) * 0.22;
        const theta = cam.theta + drift + pointer.ex * 0.08, phi = 0.13 + pointer.ey * 0.03;

        // phones / portrait: centre it, pull back to fit, drop it into the band below the copy
        const narrow = w < 760 || w < h;
        const r = cam.r * (narrow ? Math.max(1.25, 0.8 / (w / h)) : 1), off = narrow ? 0 : 1.25;
        const cx = Math.cos(theta), sx = Math.sin(theta);
        const lift = narrow ? (gapMid - h / 2) * (2 * r * Math.tan(Math.PI / 12)) / h : 0;
        target.set(-cx * off, FOCUS_Y + lift, sx * off);
        camera.position.set(target.x + r * sx * Math.cos(phi), target.y + r * Math.sin(phi), target.z + r * cx * Math.cos(phi));
        camera.lookAt(target);

        const live = ts.glow * (0.82 + 0.18 * Math.sin(t * 7));
        M.copper.emissiveIntensity = live * 0.3;
        glows.forEach((sp, i) => { sp.material.opacity = ts.glow * (0.7 + 0.3 * Math.sin(t * 6 + i * 2.1)); });

        world.setHaze(Math.max(ts.hazeIn, ts.hazeOut), cam.r);
        world.render(rawDt);
      };

      world.markShadows(); world.render(0);
      ready = true; born = performance.now();
      canvas.classList.add('ready');
      section.dispatchEvent(new Event('scene:ready'));
      raf = requestAnimationFrame(frame);
    };

    const start = window.setTimeout(() => { void init(); }, 0);
    return () => {
      disposed = true;
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      ro?.disconnect(); io?.disconnect();
      world?.dispose();
    };
  }, [sectionRef]);

  return <canvas className="ts-gl" ref={canvasRef} aria-hidden="true" />;
}

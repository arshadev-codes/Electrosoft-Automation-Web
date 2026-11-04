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
const BASE_TURN = -0.18;       // the unit's resting angle on the page
const RAD_PER_PX = 0.0105;     // a ~600 px drag is one full turn
const KEY_STEP = Math.PI / 12; // ← → turn it 15°

/**
 * /transformer-testing hero: one distribution transformer under test, standing on the page.
 * Bushings glow R Y B while a test runs. It stands still: the visitor turns it on its base by dragging
 * (a flick carries on and slows), or with ← → on the "Drag to turn" readout, which shows the angle.
 * Lazy-loaded by TestingSolutions; ts.haze / ts.glow come from testingSolutionsMotion.ts.
 */
export default function XfmrScene({ sectionRef }: { sectionRef: RefObject<HTMLElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null), dialRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // may mount in the same commit as the page (chunk cached), before the section ref is attached
    const canvas = canvasRef.current, dial = dialRef.current;
    const section = sectionRef.current ?? canvas?.closest<HTMLElement>('section') ?? null;
    if (!section || !canvas || !dial) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cam = { r: reduce ? 7 : 9.5, theta: reduce ? 0.55 : 1.05 };
    // turntable: a = where the visitor has put it, shown = where it is drawn (eases to a), v = flick speed (rad/s)
    const turn = { a: 0, shown: 0, v: 0, drag: -1, x: 0, t: 0 };
    const target = new THREE.Vector3(), base = new THREE.Vector3();
    let world: World | null = null, raf = 0, visible = true, disposed = false, ready = false;
    let last = performance.now(), born = 0, odd = false, shownDeg = -1, dialX = -1, dialY = -1;
    let ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
    let frame: (now: number) => void = () => {};
    // phone framing: the free band (px), and the solved camera distance factor and height (world units)
    const band = { top: 0, bottom: 0 }, fit = { k: 1.25, lift: 0 };
    let fitDirty = true, frameNarrow: (w: number, h: number) => void = () => {};
    const deg = dial.querySelector('em'), ring = dial.querySelector<HTMLElement>('.ts-turn-ring');

    // drag to turn: the empty part of the hero is the handle; on touch, vertical swipes still scroll the page
    const onDown = (e: PointerEvent) => {
      if (!ready || e.button !== 0) return;
      if (e.pointerType === 'mouse') e.preventDefault(); // no text selection while dragging
      turn.drag = e.pointerId; turn.x = e.clientX; turn.t = e.timeStamp; turn.v = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      canvas.classList.add('grabbing'); dial.classList.add('used');
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== turn.drag) return;
      // the release was missed (window lost focus mid-drag): a plain hover must never turn it
      if (e.pointerType === 'mouse' && e.buttons === 0) { onUp(e); return; }
      const da = (e.clientX - turn.x) * RAD_PER_PX, dt = Math.max(0.008, (e.timeStamp - turn.t) / 1000);
      turn.a += da;
      turn.v = turn.v * 0.5 + (da / dt) * 0.5;
      turn.x = e.clientX; turn.t = e.timeStamp;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== turn.drag) return;
      turn.drag = -1;
      canvas.classList.remove('grabbing');
      // held still before letting go, or reduced motion: it stops where it was put
      turn.v = reduce || e.timeStamp - turn.t > 90 ? 0 : Math.max(-10, Math.min(10, turn.v));
    };
    const onKey = (e: KeyboardEvent) => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? KEY_STEP : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -KEY_STEP
        : e.key === 'PageUp' ? Math.PI / 2 : e.key === 'PageDown' ? -Math.PI / 2 : 0;
      if (e.key === 'Home') turn.a = Math.round(turn.a / (Math.PI * 2)) * Math.PI * 2; // back to the front
      else if (step) turn.a += step;
      else return;
      e.preventDefault();
      turn.v = 0; dial.classList.add('used');
      if (reduce) turn.shown = turn.a;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('lostpointercapture', onUp);
    dial.addEventListener('pointerdown', onDown); // the readout is a handle too (the canvas takes the capture)
    dial.addEventListener('keydown', onKey);

    const init = async () => {
      try {
        world = createWorld(canvas);
      } catch {
        canvas.style.display = 'none'; dial.hidden = true;
        section.dispatchEvent(new Event('scene:ready'));
        return;
      }
      const { renderer, scene, camera } = world;
      const copy = section.querySelector<HTMLElement>('.ts-copy'), hud = section.querySelector<HTMLElement>('.ts-hud');
      const resize = () => {
        world!.setSize(section.clientWidth, section.clientHeight);
        // phones: the free band between the copy and the test list, where the unit has to fit
        band.top = copy ? copy.offsetTop + copy.offsetHeight : 0;
        band.bottom = hud ? hud.offsetTop : section.clientHeight;
        fitDirty = true; dialX = -1; // re-frame, re-place the readout
      };
      resize();
      ro = new ResizeObserver(resize); ro.observe(section);
      if (copy) ro.observe(copy);
      if (hud) ro.observe(hud);
      io = new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; }); io.observe(section);

      await new Promise(r => setTimeout(r, 0));
      const M = createMaterials();
      const root = new THREE.Group(); root.position.y = FLOOR_Y; root.rotation.y = BASE_TURN; scene.add(root);
      const xf = buildTransformer(M, root);
      Object.values(xf.parts).forEach(p => mergeStatic(p.inner));
      const glows = xf.hvTops.slice(0, 3).map((v, i) => {
        const sp = glowSprite(xf.parts.cover.inner, PHASE[i], 0.42, [v.x, v.y + 0.05, v.z], 0);
        sp.userData.noAO = true;
        return sp;
      });
      shadeGround(root);

      // the unit's reach as a cylinder round its turning axis, so the phone framing holds at every angle
      // (the contact shadow and the bushing glows are flagged noAO and don't count)
      const reach = { y0: Infinity, y1: -Infinity, r: 0 }, bb = new THREE.Box3();
      root.updateMatrixWorld(true);
      root.traverse(o => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || m.userData.noAO) return;
        bb.setFromObject(m);
        if (bb.isEmpty()) return;
        reach.y0 = Math.min(reach.y0, bb.min.y); reach.y1 = Math.max(reach.y1, bb.max.y);
        for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) reach.r = Math.max(reach.r, Math.hypot(x, z));
      });
      const rim: THREE.Vector3[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        for (const y of [reach.y0, reach.y1]) rim.push(new THREE.Vector3(Math.cos(a) * reach.r, y, Math.sin(a) * reach.r));
      }
      // phones / portrait: solve the camera distance and height (at the settled pose) that put the whole
      // turning circle in the band between the copy and the test list, with room under it for the readout
      const probe = camera.clone(), pv = new THREE.Vector3();
      frameNarrow = (w: number, h: number) => {
        // the readout overlaps the turning circle's front edge, so it only needs a little extra room
        const top = band.top + 10, bottom = band.bottom - 30, bh = Math.max(110, bottom - top), bw = w - 32;
        probe.aspect = w / h; probe.updateProjectionMatrix();
        const sx = Math.sin(0.55) * Math.cos(0.13), sy = Math.sin(0.13), sz = Math.cos(0.55) * Math.cos(0.13);
        const perPx = 2 * Math.tan(THREE.MathUtils.degToRad(probe.fov / 2)) / h;
        let r = 9, lift = 0;
        const bounds = () => {
          probe.position.set(r * sx, FOCUS_Y + lift + r * sy, r * sz);
          probe.lookAt(0, FOCUS_Y + lift, 0); probe.updateMatrixWorld();
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const p of rim) {
            pv.copy(p).project(probe);
            const x = (pv.x + 1) / 2 * w, y = (1 - pv.y) / 2 * h;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          }
          return { w: x1 - x0, h: y1 - y0, mid: (y0 + y1) / 2 };
        };
        for (let i = 0; i < 6; i++) {
          const s = bounds();
          r = Math.max(6.3, r * Math.max(s.h / bh, s.w / bw)); // never closer than a little inside the desktop shot
          lift += ((top + bottom) / 2 - bounds().mid) * r * perPx;
        }
        fit.k = r / 7; fit.lift = lift;
      };

      camera.position.set(0, 2, 12); camera.lookAt(0, FOCUS_Y, 0);
      await new Promise(r => setTimeout(r, 0));
      try { await renderer.compileAsync(scene, camera); } catch { /* compiles on first render */ }
      if (disposed) return;

      frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now;
        if (!visible || !ready || !world) return;

        // turntable: a flick carries on and slows; the drawn angle follows the hand a touch softly.
        // Real elapsed time (not the clamped dt), so a slow GPU never plays the spin in slow motion.
        const tdt = Math.min(0.25, rawDt);
        if (turn.drag < 0 && turn.v) {
          turn.a += (turn.v / 3) * (1 - Math.exp(-tdt * 3)); // exact for v decaying at e^(-3t)
          turn.v *= Math.exp(-tdt * 3);
          if (Math.abs(turn.v) < 0.03) turn.v = 0;
        }
        const gap = turn.a - turn.shown, turning = Math.abs(gap) > 1e-4;
        turn.shown = turning ? turn.shown + gap * (1 - Math.exp(-tdt * (turn.drag < 0 && !turn.v ? 9 : 22))) : turn.a;

        // a still scene runs at 30 fps once it has settled; a turning one gets every frame
        odd = !odd;
        if (odd && !turning && now - born > 2400) return;
        const w = section.clientWidth, h = section.clientHeight;

        // load-in dolly, then the camera holds: only the visitor turns the unit
        const k = 1 - Math.exp(-dt * 1.6);
        const settling = Math.abs(7 - cam.r) > 1e-3 || Math.abs(0.55 - cam.theta) > 1e-4;
        cam.r += (7 - cam.r) * k; cam.theta += (0.55 - cam.theta) * k;
        const theta = cam.theta, phi = 0.13;

        // phones / portrait: centred, framed into the band below the copy (frameNarrow)
        const narrow = w < 760 || w < h;
        if (narrow && fitDirty) { frameNarrow(w, h); fitDirty = false; }
        const r = cam.r * (narrow ? fit.k : 1), off = narrow ? 0 : 1.25;
        const cx = Math.cos(theta), sx = Math.sin(theta);
        const lift = narrow ? fit.lift : 0;
        target.set(-cx * off, FOCUS_Y + lift, sx * off);
        camera.position.set(target.x + r * sx * Math.cos(phi), target.y + r * Math.sin(phi), target.z + r * cx * Math.cos(phi));
        camera.lookAt(target);

        if (turning) {
          root.rotation.y = BASE_TURN + turn.shown;
          world.markShadows(); // the shadow turns with it
        }
        const d = Math.round(((turn.shown % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * 180 / Math.PI) % 360;
        if (d !== shownDeg) {
          shownDeg = d;
          if (deg) deg.textContent = `${String(d).padStart(3, '0')}°`;
          ring?.style.setProperty('--a', `${d}deg`);
          dial.setAttribute('aria-valuenow', String(d));
          dial.setAttribute('aria-valuetext', `${d} degrees`);
        }
        // the readout sits on the floor just in front of the unit, clear of the test list
        if (settling || dialX < 0) {
          camera.updateMatrixWorld();
          base.set(0, FLOOR_Y, 0.95).project(camera);
          const x = Math.round((base.x + 1) / 2 * w), y = Math.round((1 - base.y) / 2 * h + 18);
          const floor = (hud ? hud.offsetTop : h) - dial.offsetHeight - 14;
          const nx = Math.max(dial.offsetWidth / 2 + 16, Math.min(w - dial.offsetWidth / 2 - 16, x)), ny = Math.min(y, floor);
          if (nx !== dialX || ny !== dialY) { dialX = nx; dialY = ny; dial.style.transform = `translate(${nx}px, ${ny}px) translateX(-50%)`; }
        }

        const t = now / 1000;
        const live = ts.glow * (0.82 + 0.18 * Math.sin(t * 7));
        M.copper.emissiveIntensity = live * 0.3;
        glows.forEach((sp, i) => { sp.material.opacity = ts.glow * (0.7 + 0.3 * Math.sin(t * 6 + i * 2.1)); });

        world.setHaze(Math.max(ts.hazeIn, ts.hazeOut), cam.r);
        world.render(rawDt);
      };

      world.markShadows(); world.render(0);
      ready = true; born = performance.now();
      canvas.classList.add('ready'); dial.classList.add('ready');
      section.dispatchEvent(new Event('scene:ready'));
      raf = requestAnimationFrame(frame);
    };

    const start = window.setTimeout(() => { void init(); }, 0);
    return () => {
      disposed = true;
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('lostpointercapture', onUp);
      dial.removeEventListener('pointerdown', onDown);
      dial.removeEventListener('keydown', onKey);
      ro?.disconnect(); io?.disconnect();
      world?.dispose();
    };
  }, [sectionRef]);

  return (
    <>
      <canvas className="ts-gl" ref={canvasRef} aria-hidden="true" />
      {/* the turntable's readout: also the keyboard control (← → 15°, PgUp/PgDn 90°, Home to the front) */}
      <div className="ts-turn" ref={dialRef} role="slider" tabIndex={0} aria-label="Turn the transformer"
        aria-valuemin={0} aria-valuemax={359} aria-orientation="horizontal">
        <i className="ts-turn-ring" aria-hidden="true"><b /></i>
        <span>Drag to turn</span>
        <em className="mono" aria-hidden="true">000°</em>
      </div>
    </>
  );
}

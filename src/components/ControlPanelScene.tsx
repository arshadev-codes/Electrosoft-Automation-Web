import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { createWorld, FLOOR_Y, shadeGround, type World } from '../three/stage';
import { createMaterials } from '../three/materials';
import { buildControlPanel } from '../three/models/controlPanel';
import { panelTs } from '../pages/panelMotion';

const FOCUS_Y = FLOOR_Y + 0.95; // centered on the scaled panel
const BASE_TURN = -0.32;        // initial angle showing front fascia + depth
const RAD_PER_PX = 0.009;       // drag sensitivity
const KEY_STEP = Math.PI / 12;  // 15° per arrow key

interface ControlPanelSceneProps {
  sectionRef: RefObject<HTMLElement>;
  doorOpen?: boolean;
  onToggleDoor?: () => void;
}

export interface PartLabel {
  name: string;
  sub: string;
  pos: [number, number, number];
}

const PART_LABELS: PartLabel[] = [
  { name: 'Analog Telemetry', sub: 'Voltmeter 415V · Ammeter 62A', pos: [-0.48, 1.88, 0.35] },
  { name: 'Smart HMI Touchscreen', sub: '4-Drive Diagnostics & Modbus Sync', pos: [0.42, 1.76, 0.35] },
  { name: 'Pushbutton Station', sub: 'Start · Stop · Emergency Stop', pos: [0.42, 1.34, 0.35] },
  { name: 'Air Circuit Breaker (ACB)', sub: 'Incomer 4000A with Microprocessor Trip', pos: [-0.48, 1.62, -0.15] },
  { name: 'Main Copper Busbars', sub: 'Electrolytic TPN Busbars · 65 kA 1s STC', pos: [0, 1.35, -0.18] },
  { name: 'PLC Automation Rack', sub: 'CPU & High-Speed Optical I/O Cards', pos: [0.38, 1.88, -0.15] },
  { name: 'VFD Inverter Drive', sub: 'Dynamic Torque & Speed Controller', pos: [0.62, 1.45, -0.15] },
];

/**
 * Hero 3D scene for /panel landing page:
 * - High-detail Electrosoft MCC-01 Control Panel
 * - Decreased footprint (scaled down by 15% for balanced proportions)
 * - Fluctuating analog voltmeter and ammeter needles
 * - Live animated HMI with motor loads & digital telemetry
 * - Interactive buttons (Start, Stop, E-Stop, Mode selector)
 * - Double-click on panel doors to toggle open / inspect
 * - Inspection part labels overlay
 */
export default function ControlPanelScene({
  sectionRef,
  doorOpen: externalDoorOpen,
  onToggleDoor: externalOnToggleDoor,
}: ControlPanelSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const doorBtnRef = useRef<HTMLButtonElement>(null);

  const [internalDoor, setInternalDoor] = useState(false);
  const isDoorOpen = externalDoorOpen !== undefined ? externalDoorOpen : internalDoor;
  const toggleDoor = externalOnToggleDoor ?? (() => setInternalDoor(v => !v));

  const [showLabels, setShowLabels] = useState(false);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const doorTargetRef = useRef(isDoorOpen ? 1 : 0);
  doorTargetRef.current = isDoorOpen ? 1 : 0;

  useLayoutEffect(() => {
    const canvas = canvasRef.current, dial = dialRef.current;
    const section = sectionRef.current ?? canvas?.closest<HTMLElement>('section') ?? null;
    if (!section || !canvas || !dial) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Set camera distance further back so the panel sits with comfortable padding
    const cam = { r: reduce ? 6.4 : 8.0, theta: reduce ? 0.38 : 0.82 };

    const turn = { a: 0, shown: 0, v: 0, drag: -1, x: 0, t: 0, moved: false };
    const door = { current: doorTargetRef.current };
    const target = new THREE.Vector3(), base = new THREE.Vector3();

    let world: World | null = null, raf = 0, visible = true, disposed = false, ready = false;
    let last = performance.now(), born = 0, odd = false, shownDeg = -1, dialX = -1, dialY = -1;
    let ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
    let frame: (now: number) => void = () => {};
    let onCanvasDblClick: (e: MouseEvent) => void = () => {};
    let onCanvasClick: (e: MouseEvent) => void = () => {};
    let onCanvasPointerMove: (e: MouseEvent) => void = () => {};

    const band = { top: 0, bottom: 0 }, fit = { k: 1.25, lift: 0 };
    let fitDirty = true, frameNarrow: (w: number, h: number) => void = () => {};

    const deg = dial.querySelector('em'), ring = dial.querySelector<HTMLElement>('.ts-turn-ring');

    const onDown = (e: PointerEvent) => {
      if (!ready || e.button !== 0) return;
      if (e.pointerType === 'mouse') e.preventDefault();
      turn.drag = e.pointerId;
      turn.x = e.clientX;
      turn.t = e.timeStamp;
      turn.v = 0;
      turn.moved = false;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      canvas.classList.add('grabbing');
      dial.classList.add('used');
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== turn.drag) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { onUp(e); return; }
      const dx = e.clientX - turn.x;
      if (Math.abs(dx) > 3) turn.moved = true;
      const da = dx * RAD_PER_PX;
      const dt = Math.max(0.008, (e.timeStamp - turn.t) / 1000);
      turn.a += da;
      turn.v = turn.v * 0.5 + (da / dt) * 0.5;
      turn.x = e.clientX;
      turn.t = e.timeStamp;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== turn.drag) return;
      turn.drag = -1;
      canvas.classList.remove('grabbing');
      turn.v = reduce || e.timeStamp - turn.t > 90 ? 0 : Math.max(-10, Math.min(10, turn.v));
    };

    const onKey = (e: KeyboardEvent) => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? KEY_STEP : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -KEY_STEP
        : e.key === 'PageUp' ? Math.PI / 2 : e.key === 'PageDown' ? -Math.PI / 2 : 0;
      if (e.key === 'Home') turn.a = Math.round(turn.a / (Math.PI * 2)) * Math.PI * 2;
      else if (step) turn.a += step;
      else return;
      e.preventDefault();
      turn.v = 0;
      dial.classList.add('used');
      if (reduce) turn.shown = turn.a;
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('lostpointercapture', onUp);
    dial.addEventListener('pointerdown', onDown);
    dial.addEventListener('keydown', onKey);

    const init = async () => {
      try {
        world = createWorld(canvas);
      } catch {
        canvas.style.display = 'none';
        dial.hidden = true;
        section.dispatchEvent(new Event('scene:ready'));
        return;
      }

      const { renderer, scene, camera } = world;
      const copy = section.querySelector<HTMLElement>('.ts-copy');
      const hud = section.querySelector<HTMLElement>('.ts-hud');

      const resize = () => {
        world!.setSize(section.clientWidth, section.clientHeight);
        band.top = copy ? copy.offsetTop + copy.offsetHeight : 0;
        band.bottom = hud ? hud.offsetTop : section.clientHeight;
        fitDirty = true;
        dialX = -1;
      };

      resize();
      ro = new ResizeObserver(resize);
      ro.observe(section);
      if (copy) ro.observe(copy);
      if (hud) ro.observe(hud);

      io = new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; });
      io.observe(section);

      await new Promise(r => setTimeout(r, 0));

      const M = createMaterials();
      const root = new THREE.Group();
      root.position.y = FLOOR_Y;
      root.rotation.y = BASE_TURN;
      // Decreased scale of the control panel (85% size) so it frames gracefully without dominating
      root.scale.setScalar(0.85);
      scene.add(root);

      // Balanced lighting
      const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
      fillLight.position.set(4, 5, 6);
      scene.add(fillLight);
      const ambLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambLight);

      // Build control panel
      const panel = buildControlPanel(M, root);
      shadeGround(root);

      // Raycasting setup for interactive buttons and double-click door toggle
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Double-click on canvas opens/closes the panel doors
      onCanvasDblClick = (e: MouseEvent) => {
        e.preventDefault();
        toggleDoor();
        setActiveNotice(isDoorOpen ? 'Doors closed' : 'Doors opened for inspection');
        setTimeout(() => setActiveNotice(null), 2400);
      };
      canvas.addEventListener('dblclick', onCanvasDblClick);

      // Single-click on interactive buttons/switches/HMI
      onCanvasClick = (e: MouseEvent) => {
        if (turn.moved) return; // ignore drag release
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const hits = raycaster.intersectObjects(panel.interactiveObjects, true);
        if (hits.length > 0) {
          let targetObj: THREE.Object3D | null = hits[0].object;
          while (targetObj && !targetObj.userData?.interactive && targetObj !== root) {
            targetObj = targetObj.parent;
          }
          const act = targetObj?.userData?.interactive;
          if (act) {
            panel.triggerAction(act);
            if (act === 'start') setActiveNotice('HMI Command: MOTORS RUNNING');
            else if (act === 'stop') setActiveNotice('HMI Command: MOTORS STANDBY');
            else if (act === 'estop') setActiveNotice('SAFETY: EMERGENCY STOP ACTIVATED');
            else if (act === 'selector') setActiveNotice('Mode Switched: AUTO / MANUAL');
            else if (act === 'hmi') setActiveNotice('HMI Screen Toggled');
            setTimeout(() => setActiveNotice(null), 2500);
          }
        }
      };
      canvas.addEventListener('click', onCanvasClick);

      // Cursor pointer styling on interactive hover
      onCanvasPointerMove = (e: MouseEvent) => {
        if (turn.drag >= 0) return;
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(panel.interactiveObjects, true);
        canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
      };
      canvas.addEventListener('mousemove', onCanvasPointerMove);

      const reach = { y0: FLOOR_Y, y1: FLOOR_Y + 1.9, r: 1.15 };
      const rim: THREE.Vector3[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        for (const y of [reach.y0, reach.y1]) rim.push(new THREE.Vector3(Math.cos(a) * reach.r, y, Math.sin(a) * reach.r));
      }

      const probe = camera.clone(), pv = new THREE.Vector3();
      frameNarrow = (w: number, h: number) => {
        const top = band.top + 10, bottom = band.bottom - 30, bh = Math.max(110, bottom - top), bw = w - 32;
        probe.aspect = w / h;
        probe.updateProjectionMatrix();
        const sx = Math.sin(0.45) * Math.cos(0.12), sy = Math.sin(0.12), sz = Math.cos(0.45) * Math.cos(0.12);
        const perPx = 2 * Math.tan(THREE.MathUtils.degToRad(probe.fov / 2)) / h;
        let r = 8.8, lift = 0;

        const bounds = () => {
          probe.position.set(r * sx, FOCUS_Y + lift + r * sy, r * sz);
          probe.lookAt(0, FOCUS_Y + lift, 0);
          probe.updateMatrixWorld();
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const p of rim) {
            pv.copy(p).project(probe);
            const x = ((pv.x + 1) / 2) * w, y = ((1 - pv.y) / 2) * h;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          }
          return { w: x1 - x0, h: y1 - y0, mid: (y0 + y1) / 2 };
        };

        for (let i = 0; i < 6; i++) {
          const s = bounds();
          r = Math.max(5.8, r * Math.max(s.h / bh, s.w / bw));
          lift += ((top + bottom) / 2 - bounds().mid) * r * perPx;
        }
        fit.k = r / 6.5;
        fit.lift = lift;
      };

      camera.position.set(0, 2, 11);
      camera.lookAt(0, FOCUS_Y, 0);

      await new Promise(r => setTimeout(r, 0));
      try { await renderer.compileAsync(scene, camera); } catch { /* warm cache */ }
      if (disposed) return;

      frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt);
        last = now;
        if (!visible || !ready || !world) return;

        // Turntable flick physics
        const tdt = Math.min(0.25, rawDt);
        if (turn.drag < 0 && turn.v) {
          turn.a += (turn.v / 3) * (1 - Math.exp(-tdt * 3));
          turn.v *= Math.exp(-tdt * 3);
          if (Math.abs(turn.v) < 0.03) turn.v = 0;
        }

        const gap = turn.a - turn.shown;
        const turning = Math.abs(gap) > 1e-4;
        turn.shown = turning ? turn.shown + gap * (1 - Math.exp(-tdt * (turn.drag < 0 && !turn.v ? 9 : 22))) : turn.a;

        // Smooth door animation
        const targetDoor = doorTargetRef.current;
        const doorDiff = targetDoor - door.current;
        const doorMoving = Math.abs(doorDiff) > 0.001;
        if (doorMoving) {
          door.current += doorDiff * (1 - Math.exp(-dt * 6.5));
          if (Math.abs(targetDoor - door.current) < 0.001) door.current = targetDoor;
        }

        // Run animations on the control panel (fluctuating meters, HMI updates, lamp glows)
        const t = now / 1000;
        panel.update(t, door.current);

        odd = !odd;
        if (odd && !turning && !doorMoving && now - born > 2400) return;

        const w = section.clientWidth, h = section.clientHeight;

        // Intro dolly camera easing (sits at 6.3m distance for balanced framing)
        const k = 1 - Math.exp(-dt * 1.6);
        const settling = Math.abs(6.3 - cam.r) > 1e-3 || Math.abs(0.38 - cam.theta) > 1e-4;
        cam.r += (6.3 - cam.r) * k;
        cam.theta += (0.38 - cam.theta) * k;
        const theta = cam.theta, phi = 0.12;

        const narrow = w < 760 || w < h;
        if (narrow && fitDirty) { frameNarrow(w, h); fitDirty = false; }
        const r = cam.r * (narrow ? fit.k : 1), off = narrow ? 0 : 1.05;
        const cx = Math.cos(theta), sx = Math.sin(theta);
        const lift = narrow ? fit.lift : 0;

        target.set(-cx * off, FOCUS_Y + lift, sx * off);
        camera.position.set(
          target.x + r * sx * Math.cos(phi),
          target.y + r * Math.sin(phi),
          target.z + r * cx * Math.cos(phi)
        );
        camera.lookAt(target);

        if (turning) {
          root.rotation.y = BASE_TURN + turn.shown;
          world.markShadows();
        }

        const d = Math.round((((turn.shown % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * 180) / Math.PI) % 360;
        if (d !== shownDeg) {
          shownDeg = d;
          if (deg) deg.textContent = `${String(d).padStart(3, '0')}°`;
          ring?.style.setProperty('--a', `${d}deg`);
          dial.setAttribute('aria-valuenow', String(d));
          dial.setAttribute('aria-valuetext', `${d} degrees`);
        }

        if (settling || dialX < 0) {
          camera.updateMatrixWorld();
          base.set(0, FLOOR_Y, 0.95).project(camera);
          const px = Math.round(((base.x + 1) / 2) * w);
          const py = Math.round(((1 - base.y) / 2) * h + 18);
          const floor = (hud ? hud.offsetTop : h) - dial.offsetHeight - 14;
          const nx = Math.max(dial.offsetWidth / 2 + 16, Math.min(w - dial.offsetWidth / 2 - 16, px));
          const ny = Math.min(py, floor);
          if (nx !== dialX || ny !== dialY) {
            dialX = nx;
            dialY = ny;
            dial.style.transform = `translate(${nx}px, ${ny}px) translateX(-50%)`;
          }
        }

        world.setHaze(Math.max(0, Math.min(1, panelTs.hazeOut * 0.8)), cam.r);
        world.render(rawDt);
      };

      world.markShadows();
      world.render(0);
      ready = true;
      born = performance.now();
      canvas.classList.add('ready');
      dial.classList.add('ready');
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
      canvas.removeEventListener('dblclick', onCanvasDblClick);
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mousemove', onCanvasPointerMove);
      dial.removeEventListener('pointerdown', onDown);
      dial.removeEventListener('keydown', onKey);
      ro?.disconnect();
      io?.disconnect();
      world?.dispose();
    };
  }, [sectionRef]);

  return (
    <>
      <canvas className="ts-gl" ref={canvasRef} aria-label="3D Control Panel: Double-click to open doors, click buttons to interact" />

      {/* Floating Action Notice for Interactive Feedback */}
      {activeNotice && (
        <div className="panel-live-notice" role="status" aria-live="polite">
          <span className="p-dot" />
          <span>{activeNotice}</span>
        </div>
      )}

      {/* Part Inspection Labels Overlay */}
      {showLabels && (
        <div className="panel-labels-overlay" aria-label="Control panel components">
          {PART_LABELS.map((p, i) => (
            <div key={i} className="panel-tag">
              <span className="p-num">0{i + 1}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{p.sub}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 360° Turntable degree readout + keyboard control */}
      <div
        className="ts-turn"
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="Turn the electrical control panel"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-orientation="horizontal"
      >
        <i className="ts-turn-ring" aria-hidden="true"><b /></i>
        <span>Drag · Dbl-click doors</span>
        <em className="mono" aria-hidden="true">000°</em>

        {/* Door Inspection Toggle Button */}
        <button
          ref={doorBtnRef}
          type="button"
          className={`panel-door-btn${isDoorOpen ? ' is-open' : ''}`}
          onClick={e => {
            e.stopPropagation();
            toggleDoor();
          }}
          aria-label={isDoorOpen ? "Close panel doors" : "Inspect panel internals"}
        >
          <span className="p-dot" />
          <span>{isDoorOpen ? 'Doors Open' : 'Inspect Internals'}</span>
        </button>

        {/* Part Labels Toggle Button */}
        <button
          type="button"
          className={`panel-door-btn panel-tags-btn${showLabels ? ' is-open' : ''}`}
          onClick={e => {
            e.stopPropagation();
            setShowLabels(v => !v);
          }}
          aria-label="Toggle part labels"
        >
          <span>{showLabels ? 'Hide Labels' : 'Part Labels'}</span>
        </button>
      </div>
    </>
  );
}

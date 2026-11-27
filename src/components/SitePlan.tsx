import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import sitePlanRaw from '../data/site-plan.json';
import { MAP } from '../data/site';
import './site-plan.css';

gsap.registerPlugin(ScrollTrigger);

interface RoadItem {
  cls: 'major' | 'minor' | 'path';
  name?: string;
  pts: [number, number][];
}

interface WaterItem {
  kind: 'line' | 'poly';
  name?: string;
  pts: [number, number][];
}

interface BuildingItem {
  isSite?: boolean;
  pts: [number, number][];
}

interface SitePlanData {
  meta: {
    lat: number;
    lng: number;
    radiusM: number;
    generatedAt: string;
    attribution: string;
  };
  roads: RoadItem[];
  rails: { pts: [number, number][] }[];
  water: WaterItem[];
  landuse: { pts: [number, number][] }[];
  buildings: BuildingItem[];
}

const DATA = sitePlanRaw as unknown as SitePlanData;
const EARTH_R = 6378137;
const DEG2RAD = Math.PI / 180;
const COS_LAT = Math.cos(DATA.meta.lat * DEG2RAD);

// SVG coordinate bounds: 1 unit = 1 real metre around site origin (0, 0)
const VB_W = 1040;
const VB_H = 780;
const VB_X = -VB_W / 2;
const VB_Y = -VB_H / 2;

const toPath = (pts: [number, number][], close = false) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join('') + (close ? 'Z' : '');

function xyToLatLng(x: number, y: number): [number, number] {
  const lat = DATA.meta.lat + (-y / (EARTH_R * COS_LAT)) / DEG2RAD;
  const lng = DATA.meta.lng + (x / (EARTH_R * COS_LAT)) / DEG2RAD;
  return [lat, lng];
}

function distToSegment(px: number, py: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - a[0], py - a[1]);
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / lenSq));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

export interface SitePlanProps {
  addressLines?: string[];
  companyName?: string;
}

export default function SitePlan({
  companyName = 'Electrosoft Automation Pvt. Ltd.',
  addressLines = ['S7-1/2, Jai Mata Di Compound,', 'Bhiwandi Road, Kalher,', 'Dist. Thane – 421 302'],
}: SitePlanProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });
  const [cam, setCam] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [nearest, setNearest] = useState<{ road: RoadItem; px: number; py: number } | null>(null);

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panStartRef = useRef({ cx: 0, cy: 0, x: 0, y: 0, pinchDist: 0, pinchZoom: 1 });

  // Pre-build SVG path strings once
  const paths = useMemo(() => ({
    landuse: DATA.landuse.map(l => toPath(l.pts, true)),
    waterPoly: DATA.water.filter(w => w.kind === 'poly').map(w => toPath(w.pts, true)),
    waterLine: DATA.water.filter(w => w.kind === 'line').map(w => toPath(w.pts, false)),
    rails: DATA.rails.map(r => toPath(r.pts, false)),
    buildings: DATA.buildings.map(b => ({ isSite: !!b.isSite, d: toPath(b.pts, true) })),
    major: DATA.roads.filter(r => r.cls === 'major').map(r => toPath(r.pts, false)),
    minor: DATA.roads.filter(r => r.cls === 'minor').map(r => toPath(r.pts, false)),
    path: DATA.roads.filter(r => r.cls === 'path').map(r => toPath(r.pts, false)),
  }), []);

  // Scroll-triggered engineering drawing entrance (one ScrollTrigger, play once)
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const majorEls = gsap.utils.toArray<SVGPathElement>('.sp-road.major', wrap);
      const minorEls = gsap.utils.toArray<SVGPathElement>('.sp-road.minor', wrap);
      const bldgEls = gsap.utils.toArray<SVGPathElement>('.sp-bldg', wrap);
      const gridEl = wrap.querySelector('.sp-grid-mask');
      const pinEl = wrap.querySelector('.sp-pin-group');
      const pulseEl = wrap.querySelector('.sp-pin-ring');

      majorEls.forEach(p => {
        const len = p.getTotalLength?.() || 400;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      minorEls.forEach(p => {
        const len = p.getTotalLength?.() || 250;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: 'top 82%',
          once: true,
        },
      });

      if (gridEl) {
        tl.fromTo(gridEl, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'expo.out' }, 0);
      }
      if (majorEls.length) {
        tl.to(majorEls, { strokeDashoffset: 0, duration: 0.9, stagger: 0.015, ease: 'expo.out', clearProps: 'strokeDasharray,strokeDashoffset' }, 0.08);
      }
      if (minorEls.length) {
        tl.to(minorEls, { strokeDashoffset: 0, duration: 0.75, stagger: 0.004, ease: 'expo.out', clearProps: 'strokeDasharray,strokeDashoffset' }, 0.3);
      }
      if (bldgEls.length) {
        tl.fromTo(bldgEls, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.004, ease: 'expo.out' }, 0.55);
      }
      if (pinEl) {
        tl.fromTo(pinEl, { y: -18, opacity: 0, scale: 0.7 }, { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: 'expo.out' }, 0.75);
      }
      if (pulseEl) {
        gsap.fromTo(
          pulseEl,
          { scale: 0.5, opacity: 0.85 },
          { scale: 2.6, opacity: 0, duration: 2.1, ease: 'expo.out', repeat: -1, delay: 1.2 }
        );
      }
    }, wrap);

    return () => ctx.revert();
  }, []);

  const applyCam = useCallback((next: { x: number; y: number; zoom: number }) => {
    const z = Math.max(0.65, Math.min(4, next.zoom));
    const maxPan = 420 * z;
    const clamped = {
      x: Math.max(-maxPan, Math.min(maxPan, next.x)),
      y: Math.max(-maxPan, Math.min(maxPan, next.y)),
      zoom: z,
    };
    camRef.current = clamped;
    setCam(clamped);
  }, []);

  const zoomBy = (factor: number) => {
    const targetZoom = Math.max(0.65, Math.min(4, camRef.current.zoom * factor));
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      applyCam({ ...camRef.current, zoom: targetZoom });
      return;
    }
    const obj = { ...camRef.current };
    gsap.to(obj, {
      zoom: targetZoom,
      duration: 0.35,
      ease: 'expo.out',
      onUpdate: () => applyCam(obj),
    });
  };

  const resetToSite = () => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      applyCam({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const obj = { ...camRef.current };
    gsap.to(obj, {
      x: 0,
      y: 0,
      zoom: 1,
      duration: 0.6,
      ease: 'expo.out',
      onUpdate: () => applyCam(obj),
    });
  };

  const updatePointerReadout = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Convert screen coords to SVG viewBox coords, then invert camera transform
    const vx = VB_X + ((clientX - rect.left) / rect.width) * VB_W;
    const vy = VB_Y + ((clientY - rect.top) / rect.height) * VB_H;
    const mx = (vx - camRef.current.x) / camRef.current.zoom;
    const my = (vy - camRef.current.y) / camRef.current.zoom;

    const [lat, lng] = xyToLatLng(mx, my);
    setCoord({ lat, lng });

    // Find nearest named/visible road within 35m
    let bestRoad: RoadItem | null = null;
    let bestD = 35 / camRef.current.zoom;
    for (const r of DATA.roads) {
      if (camRef.current.zoom < 1 && r.cls !== 'major') continue;
      for (let i = 0; i < r.pts.length - 1; i++) {
        const d = distToSegment(mx, my, r.pts[i], r.pts[i + 1]);
        if (d < bestD) {
          bestD = d;
          bestRoad = r;
        }
      }
    }
    setNearest(bestRoad ? { road: bestRoad, px: clientX - rect.left, py: clientY - rect.top } : null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      setIsPanning(true);
      panStartRef.current = { ...panStartRef.current, cx: e.clientX, cy: e.clientY, x: camRef.current.x, y: camRef.current.y };
      if (e.pointerType !== 'touch') {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      }
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      panStartRef.current.pinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      panStartRef.current.pinchZoom = camRef.current.zoom;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerReadout(e.clientX, e.clientY);
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    if (!rect?.width) return;

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (panStartRef.current.pinchDist > 0) {
        applyCam({ ...camRef.current, zoom: panStartRef.current.pinchZoom * (dist / panStartRef.current.pinchDist) });
      }
      return;
    }

    if (isPanning && pointersRef.current.size === 1) {
      const scaleX = VB_W / rect.width;
      const scaleY = VB_H / rect.height;
      const dx = (e.clientX - panStartRef.current.cx) * scaleX;
      const dy = (e.clientY - panStartRef.current.cy) * scaleY;
      applyCam({ ...camRef.current, x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) setIsPanning(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  // Scale bar calculation in real metres
  const scaleBar = useMemo(() => {
    const targetM = cam.zoom >= 2 ? 100 : cam.zoom >= 1.2 ? 150 : 200;
    // 1 metre = 1 SVG unit; viewport width is VB_W SVG units
    const widthPct = (targetM * cam.zoom) / VB_W;
    return { label: `${targetM} m`, widthPx: Math.round(Math.max(44, Math.min(130, widthPct * 440))) };
  }, [cam.zoom]);

  const lodLow = cam.zoom < 1;

  return (
    <div className="sp-wrap" ref={wrapRef}>
      <div className="sp-stage">
        <div
          className={`sp-viewport${isPanning ? ' is-panning' : ''}${lodLow ? ' is-lod-low' : ''}`}
          role="img"
          aria-label={`Engineering site plan map of ${companyName} at ${addressLines.join(' ')} (${DATA.meta.lat.toFixed(5)} N, ${DATA.meta.lng.toFixed(5)} E)`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => { setCoord(null); setNearest(null); }}
        >
        <span className="sp-reg tl" aria-hidden="true" />
        <span className="sp-reg tr" aria-hidden="true" />
        <span className="sp-reg bl" aria-hidden="true" />
        <span className="sp-reg br" aria-hidden="true" />

        <svg ref={svgRef} className="sp-svg" viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="sp-grid-40" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" className="sp-grid-fine" />
            </pattern>
            <pattern id="sp-grid-200" width="200" height="200" patternUnits="userSpaceOnUse">
              <rect width="200" height="200" fill="url(#sp-grid-40)" />
              <path d="M200 0H0V200" className="sp-grid-major" />
            </pattern>
            <pattern id="sp-water-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" className="sp-water-hatch-line" />
            </pattern>
          </defs>

          {/* Drafting Grid */}
          <g className="sp-grid-mask">
            <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill="url(#sp-grid-200)" />
          </g>

          {/* Pan & Zoom Transform Group */}
          <g transform={`translate(${cam.x.toFixed(1)}, ${cam.y.toFixed(1)}) scale(${cam.zoom.toFixed(3)})`}>
            {paths.landuse.map((d, i) => <path key={`lu-${i}`} d={d} className="sp-landuse" />)}
            {paths.waterPoly.map((d, i) => <path key={`wp-${i}`} d={d} className="sp-water-poly" />)}
            {paths.waterLine.map((d, i) => <path key={`wl-${i}`} d={d} className="sp-water-line" />)}

            {paths.rails.map((d, i) => (
              <g key={`rl-${i}`}>
                <path d={d} className="sp-rail-base" />
                <path d={d} className="sp-rail-ties" />
              </g>
            ))}

            {paths.buildings.map((b, i) => (
              <path key={`b-${i}`} d={b.d} className={`sp-bldg${b.isSite ? ' is-site' : ''}`} />
            ))}

            {paths.path.map((d, i) => <path key={`rp-${i}`} d={d} className="sp-road path" />)}
            {paths.minor.map((d, i) => <path key={`rm-${i}`} d={d} className="sp-road minor" />)}
            {paths.major.map((d, i) => <path key={`rj-${i}`} d={d} className="sp-road major" />)}

            {nearest && <path d={toPath(nearest.road.pts, false)} className="sp-road-hi" />}

            {/* 250 m & 500 m Dimension Rings + Leader Lines */}
            <circle cx="0" cy="0" r="250" className="sp-dim-ring" />
            <circle cx="0" cy="0" r="500" className="sp-dim-ring" />
            <path d="M177 -177 L218 -218 H266" className="sp-dim-leader" />
            <text x="270" y="-215" className="sp-dim-lbl">250 m</text>
            <path d="M354 -354 L390 -390 H438" className="sp-dim-leader" />
            <text x="442" y="-387" className="sp-dim-lbl">500 m</text>

            {/* Site Pin */}
            <g className="sp-pin-group">
              <circle cx="0" cy="0" r="14" className="sp-pin-ring" />
              <circle cx="0" cy="0" r="6" className="sp-pin-dot" />
              <text x="14" y="-6" className="sp-pin-label">Electrosoft Works</text>
              <text x="14" y="8" className="sp-pin-sub">Kalher · Thane</text>
            </g>
          </g>

          {/* Frame Border, Ticks & Grid References (A-D, 1-4) */}
          <rect x={VB_X + 18} y={VB_Y + 18} width={VB_W - 36} height={VB_H - 36} className="sp-frame-border" />
          {['A', 'B', 'C', 'D'].map((lbl, i) => {
            const tx = VB_X + 18 + ((VB_W - 36) / 4) * (i + 0.5);
            return (
              <g key={lbl}>
                <line x1={tx} y1={VB_Y + 18} x2={tx} y2={VB_Y + 25} className="sp-tick" />
                <text x={tx} y={VB_Y + 10} className="sp-ref-lbl">{lbl}</text>
              </g>
            );
          })}
          {['1', '2', '3', '4'].map((lbl, i) => {
            const ty = VB_Y + 18 + ((VB_H - 36) / 4) * (i + 0.5);
            return (
              <g key={lbl}>
                <line x1={VB_X + 18} y1={ty} x2={VB_X + 25} y2={ty} className="sp-tick" />
                <text x={VB_X + 9} y={ty} className="sp-ref-lbl">{lbl}</text>
              </g>
            );
          })}
        </svg>

        {/* Blueprint Lens Coordinate Readout */}
        <div className="sp-coord-hud" aria-hidden="true">
          {coord
            ? `N ${coord.lat.toFixed(5)}°  E ${coord.lng.toFixed(5)}°`
            : `N ${DATA.meta.lat.toFixed(5)}°  E ${DATA.meta.lng.toFixed(5)}°`}
        </div>

        {/* Nearest Road Hover Label */}
        {nearest?.road.name && (
          <div className="sp-hover-road" style={{ left: nearest.px, top: nearest.py }}>
            {nearest.road.name}
          </div>
        )}

        {/* North Arrow */}
        <div className="sp-compass" aria-hidden="true">
          <svg className="sp-north-svg" viewBox="0 0 18 22">
            <path d="M9 20V3M4 9l5-6 5 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sp-north-txt">N</span>
        </div>

        {/* Keyboard-operable Zoom & Reset Controls */}
        <div className="sp-controls">
          <button type="button" className="sp-ctrl-btn" aria-label="Zoom in site plan" onClick={() => zoomBy(1.35)}>+</button>
          <button type="button" className="sp-ctrl-btn" aria-label="Zoom out site plan" onClick={() => zoomBy(0.74)}>−</button>
          <button type="button" className="sp-ctrl-btn sp-reset-btn" aria-label="Reset map to site pin" onClick={resetToSite}>Reset to site</button>
        </div>

          {/* Dynamic Scale Bar */}
          <div className="sp-scale-bar" aria-hidden="true">
            <div className="sp-scale-line" style={{ width: `${scaleBar.widthPx}px` }} />
            <span className="sp-scale-lbl">{scaleBar.label}</span>
          </div>
        </div>

        {/* Floating Glass Card (docks to bottom on mobile) */}
        <div className="sp-glass-card">
          <div className="sp-card-title">{companyName}</div>
          <address className="sp-card-addr">
            {addressLines.map(line => (
              <span key={line} style={{ display: 'block' }}>{line}</span>
            ))}
          </address>
          <div className="sp-card-actions">
            <a className="pill" href={MAP} target="_blank" rel="noopener noreferrer">
              Open in Maps &rsaquo;
            </a>
          </div>
        </div>
      </div>

      {/* Ruled Title Block + OSM Attribution */}
      <div className="sp-title-block">
        <div className="sp-tb-cells">
          <span className="sp-tb-cell">Sheet <b>SP-01 · Kalher Works</b></span>
          <span className="sp-tb-cell">Scale <b>1:{Math.round(5000 / cam.zoom)}</b></span>
          <span className="sp-tb-cell">Date <b>{DATA.meta.generatedAt}</b></span>
          <span className="sp-tb-cell"><b>Rev A</b></span>
        </div>
        <span className="sp-attribution">{DATA.meta.attribution}</span>
      </div>
    </div>
  );
}

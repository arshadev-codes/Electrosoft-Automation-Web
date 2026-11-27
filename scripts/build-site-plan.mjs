#!/usr/bin/env node
/**
 * Build-time generator for src/data/site-plan.json
 * Queries OpenStreetMap Overpass API around Electrosoft Automation Pvt. Ltd. (Kalher),
 * projects coordinates via Web Mercator (1 unit = 1 real metre, origin at site),
 * simplifies geometries using Douglas-Peucker, and writes compact JSON (< 150 KB).
 *
 * Usage:
 *   node scripts/build-site-plan.mjs [--radius=600]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'site-plan.json');

const SITE_LAT = 19.2428957;
const SITE_LNG = 73.0136609;
const EARTH_RADIUS = 6378137;

const argRadius = process.argv.find(a => a.startsWith('--radius='));
const RADIUS_M = argRadius ? Math.max(200, Math.min(3000, Number(argRadius.split('=')[1]) || 600)) : 600;

// Web Mercator projection centered at (SITE_LAT, SITE_LNG) in real metres (SVG Y-down)
const DEG2RAD = Math.PI / 180;
const COS_LAT = Math.cos(SITE_LAT * DEG2RAD);
function toMercatorXY(lat, lng) {
  const x0 = EARTH_RADIUS * SITE_LNG * DEG2RAD;
  const y0 = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (SITE_LAT * DEG2RAD) / 2));
  const x = (EARTH_RADIUS * lng * DEG2RAD - x0) * COS_LAT;
  const y = -(EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * DEG2RAD) / 2)) - y0) * COS_LAT;
  return [x, y];
}

// Douglas-Peucker polyline/polygon simplification
function perpDist(pt, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(pt[0] - a[0], pt[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / lenSq));
  return Math.hypot(pt[0] - (a[0] + t * dx), pt[1] - (a[1] + t * dy));
}

function simplifyDP(pts, tol) {
  if (pts.length <= 2) return pts;
  let maxD = 0;
  let idx = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpDist(pts[i], pts[0], pts[end]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol) {
    const left = simplifyDP(pts.slice(0, idx + 1), tol);
    const right = simplifyDP(pts.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [pts[0], pts[end]];
}

const roundPt = ([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10];

function pointInPoly(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function classifyRoad(hw) {
  if (['motorway', 'trunk', 'primary', 'secondary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link'].includes(hw)) {
    return 'major';
  }
  if (['tertiary', 'tertiary_link', 'unclassified', 'residential', 'service', 'living_street', 'road'].includes(hw)) {
    return 'minor';
  }
  return 'path';
}

// Compute bounding box slightly wider than RADIUS_M (+15%) so edge features don't clip prematurely
const queryR = RADIUS_M * 1.15;
const dLat = (queryR / 110700);
const dLng = (queryR / (111320 * COS_LAT));
const S = (SITE_LAT - dLat).toFixed(6);
const W = (SITE_LNG - dLng).toFixed(6);
const N = (SITE_LAT + dLat).toFixed(6);
const E = (SITE_LNG + dLng).toFixed(6);

const query = `
[out:json][timeout:30];
(
  way["highway"](${S},${W},${N},${E});
  way["railway"](${S},${W},${N},${E});
  way["waterway"](${S},${W},${N},${E});
  way["natural"="water"](${S},${W},${N},${E});
  way["building"](${S},${W},${N},${E});
  way["landuse"="industrial"](${S},${W},${N},${E});
);
out body;
>;
out skel qt;
`.trim();

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function fetchOverpass() {
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      console.log(`Querying ${url} (radius=${RADIUS_M}m)...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.warn(`Failed on ${url}: ${err.message}`);
    }
  }
  throw lastErr;
}

async function main() {
  const osm = await fetchOverpass();
  const nodes = new Map();
  for (const el of osm.elements) {
    if (el.type === 'node') {
      nodes.set(el.id, toMercatorXY(el.lat, el.lon));
    }
  }

  const roads = [];
  const rails = [];
  const water = [];
  const landuse = [];
  const buildings = [];

  for (const el of osm.elements) {
    if (el.type !== 'way' || !el.nodes?.length) continue;
    const rawPts = el.nodes.map(id => nodes.get(id)).filter(Boolean);
    if (rawPts.length < 2) continue;

    // Skip features completely outside view bounds
    const inBounds = rawPts.some(([x, y]) => Math.abs(x) <= queryR && Math.abs(y) <= queryR);
    if (!inBounds) continue;

    const tags = el.tags || {};
    if (tags.highway) {
      const pts = simplifyDP(rawPts, 1.5).map(roundPt);
      if (pts.length >= 2) {
        const entry = { cls: classifyRoad(tags.highway), pts };
        if (tags.name) entry.name = tags.name;
        roads.push(entry);
      }
    } else if (tags.railway) {
      const pts = simplifyDP(rawPts, 2.0).map(roundPt);
      if (pts.length >= 2) rails.push({ pts });
    } else if (tags.natural === 'water') {
      const pts = simplifyDP(rawPts, 2.5).map(roundPt);
      if (pts.length >= 3) water.push({ kind: 'poly', ...(tags.name ? { name: tags.name } : {}), pts });
    } else if (tags.waterway) {
      const pts = simplifyDP(rawPts, 2.0).map(roundPt);
      if (pts.length >= 2) water.push({ kind: 'line', ...(tags.name ? { name: tags.name } : {}), pts });
    } else if (tags.landuse === 'industrial') {
      const pts = simplifyDP(rawPts, 3.0).map(roundPt);
      if (pts.length >= 3) landuse.push({ pts });
    } else if (tags.building) {
      const pts = simplifyDP(rawPts, 1.2).map(roundPt);
      if (pts.length >= 3) buildings.push({ pts });
    }
  }

  // Identify the Electrosoft site building (contains origin [0,0] or nearest within 35m)
  let siteIdx = buildings.findIndex(b => pointInPoly([0, 0], b.pts));
  if (siteIdx === -1 && buildings.length > 0) {
    let bestD = 35;
    buildings.forEach((b, idx) => {
      const cx = b.pts.reduce((s, p) => s + p[0], 0) / b.pts.length;
      const cy = b.pts.reduce((s, p) => s + p[1], 0) / b.pts.length;
      const d = Math.hypot(cx, cy);
      if (d < bestD) {
        bestD = d;
        siteIdx = idx;
      }
    });
  }
  if (siteIdx !== -1) {
    buildings[siteIdx].isSite = true;
  }

  const out = {
    meta: {
      lat: SITE_LAT,
      lng: SITE_LNG,
      radiusM: RADIUS_M,
      generatedAt: new Date().toISOString().slice(0, 10),
      attribution: '© OpenStreetMap contributors',
    },
    roads,
    rails,
    water,
    landuse,
    buildings,
  };

  let json = JSON.stringify(out);
  // Ensure under 150 KB
  if (Buffer.byteLength(json, 'utf8') > 148000) {
    out.buildings = out.buildings.filter(b => b.isSite || b.pts.some(([x, y]) => Math.hypot(x, y) <= RADIUS_M * 0.95));
    json = JSON.stringify(out);
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, json, 'utf8');
  const kb = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(1);
  console.log(`Wrote ${OUT_FILE} (${kb} KB) — ${roads.length} roads, ${buildings.length} buildings, ${water.length} water, ${rails.length} rails, ${landuse.length} industrial`);
}

main().catch(err => {
  console.error('Failed to build site plan:', err);
  process.exit(1);
});

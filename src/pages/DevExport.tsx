import { useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createMaterials } from '../three/materials';
import { disposeTree } from '../three/kit';
import { buildControlPanel } from '../three/models/controlPanel';
import { buildTransformer } from '../three/models/transformer';
import { buildTestBay } from '../three/models/testBay';

/*
 * Dev only (/dev/export): builds each code-made model and saves it as a .glb in exports/,
 * so the models can be opened in Windows 3D Viewer or any glTF viewer.
 */
const MODELS: [string, () => THREE.Object3D][] = [
  ['electrosoft-mcc.glb', () => { const g = new THREE.Group(); const p = buildControlPanel(createMaterials(), g); p.update(0, 0.6); return g; }],
  ['transformer.glb', () => { const g = new THREE.Group(); buildTransformer(createMaterials(), g); return g; }],
  ['test-bay.glb', () => buildTestBay(createMaterials()).root],
];

export default function DevExport() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true); setLog([]);
    const exporter = new GLTFExporter();
    for (const [name, build] of MODELS) {
      const root = build();
      root.updateMatrixWorld(true);
      // glow sprites are a screen-space effect; they don't survive export, so drop them
      const sprites: THREE.Object3D[] = [];
      root.traverse(o => { if ((o as THREE.Sprite).isSprite) sprites.push(o); });
      sprites.forEach(s => s.removeFromParent());
      const glb = await exporter.parseAsync(root, { binary: true, maxTextureSize: 1024 }) as ArrayBuffer;
      const res = await fetch(`/__export?name=${name}`, { method: 'POST', body: glb });
      setLog(l => [...l, `${name}: ${(glb.byteLength / 1024).toFixed(0)} KB, ${res.ok ? 'saved to exports/' : 'failed'}`]);
      disposeTree(root);
    }
    setBusy(false);
  };

  return (
    <main style={{ padding: '140px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32 }}>Export 3D models</h1>
      <p style={{ margin: '12px 0 20px' }}>Saves each code-built model as a .glb file in the project's exports/ folder.</p>
      <button className="pill" type="button" onClick={run} disabled={busy}>{busy ? 'Exporting…' : 'Export'}</button>
      <ul id="export-log" style={{ marginTop: 24 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </main>
  );
}

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';

gsap.registerPlugin(ScrollTrigger);

// CONTENT.md · Home §8 Clients (32). Logos from the old site (electrosoftindia.com/img/clients-logos), trimmed to WebP.
const CLIENTS: [string, string][] = [
  ['godrej', 'Godrej'], ['crompton-greaves', 'Crompton Greaves'], ['reliance-industries', 'Reliance Industries'], ['indian-oil', 'Indian Oil'],
  ['thane-mahanagar', 'Thane Mahanagar Palika'], ['aditya-birla', 'Aditya Birla Group'], ['air-india', 'Air India'], ['areva', 'Areva'],
  ['barc', 'BARC'], ['chemtrols', 'Chemtrols'], ['dnp-infrastructures', 'DNP Infrastructures'],
  // TODO: CONFIRM — CONTENT.md says "Emirates"; the old site's logo is Emirates Transformer & Switchgear
  ['emirates', 'Emirates Transformer & Switchgear'],
  ['esselworld', 'Essel World'],
  // TODO: CONFIRM — CONTENT.md says "Europoxy"; the old site's europoxy.png shows Global Transformers and Switchgears Fzco
  ['europoxy', 'Global Transformers and Switchgears'],
  ['evio', 'Evio'], ['fuchs', 'FUCHS'], ['fuji-electric', 'Fuji Electric'], ['gail-india-limited', 'GAIL India'],
  ['gammon-skanska', 'Gammon Skanska'], ['hind-rectifiers', 'Hind Rectifiers'], ['indiabulls', 'Indiabulls'], ['jsw', 'JSW'],
  ['kdmc', 'Kalyan Dombivali Municipal Corporation'], ['lupin-pharmaceuticals', 'Lupin Pharmaceuticals'], ['municipal-corporation-gurugram', 'Municipal Corporation of Gurugram'],
  ['prolific', 'Prolific'], ['ramky', 'Ramky'], ['rexel', 'Rexel'], ['rotomotive', 'Rotomotive'], ['siyarams', "Siyaram's"], ['sudhir', 'Sudhir'], ['vijai-marine', 'Vijai Marine'],
];

// mostly-white logos: darkened so they read on the white plates
const LIGHT = ['lupin-pharmaceuticals'];
// very wide wordmarks get a wider plate so they stay legible
const WIDE = ['air-india', 'emirates', 'europoxy', 'hind-rectifiers', 'indiabulls', 'siyarams', 'vijai-marine'];
const ROWS = [CLIENTS.slice(0, 16), CLIENTS.slice(16)];
const SPEED = 34; // px per second at rest

/*
 * 1.9 Clients: every logo in its own colours, mounted on a small nameplate, on two rows drifting in
 * opposite directions. Scrolling quickens them, and a hovered row stops so a logo can be read. Each
 * row holds its logos twice so the loop never shows a seam; the copies are hidden from assistive
 * tech. Reduced motion: both rows sit still, wrapped and centred.
 */
export default function Clients() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.cl-inner', { exit: false }); // the footer follows; nothing to leave into

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('is-still'); return; }
    const rows = [...el.querySelectorAll<HTMLElement>('.cl-row')].map(row => ({
      row, track: row.querySelector<HTMLElement>('.cl-track')!, dir: Number(row.dataset.dir), x: 0, w: 0, v: SPEED, held: false,
    }));
    const measure = () => rows.forEach(r => { r.w = r.track.scrollWidth / 2; r.x = r.dir > 0 ? -r.w : 0; });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const unhold = rows.map(r => {
      const on = () => { r.held = true; }, off = () => { r.held = false; };
      r.row.addEventListener('pointerenter', on);
      r.row.addEventListener('pointerleave', off);
      return () => { r.row.removeEventListener('pointerenter', on); r.row.removeEventListener('pointerleave', off); };
    });

    let live = false, rush = 0;
    const st = ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onToggle: s => { live = s.isActive; },
      onUpdate: s => { rush = Math.min(600, Math.abs(s.getVelocity()) * 0.25); },
    });
    const tick = (_t: number, ms: number) => {
      if (!live) return;
      const dt = Math.min(0.05, ms / 1000);
      rush *= Math.exp(-dt * 3); // the scroll boost dies away
      rows.forEach(r => {
        const target = r.held ? 0 : SPEED + rush;
        r.v += (target - r.v) * (1 - Math.exp(-dt * 6));
        r.x += r.dir * r.v * dt;
        if (r.x <= -r.w) r.x += r.w;
        if (r.x > 0) r.x -= r.w;
        r.track.style.transform = `translate3d(${r.x.toFixed(2)}px, 0, 0)`;
      });
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); st.kill(); ro.disconnect(); unhold.forEach(u => u()); };
  }, []);

  return (
    <section id="clients" ref={ref} aria-labelledby="clients-h">
      <div className="cl-inner">
        <div className="cl-wrap">
          <div className="cl-head sec-head">
            <h2 id="clients-h">Trusted where failure isn't an option.</h2>
            <p><b>80%+</b> of our business comes from repeat customers.</p>
          </div>
        </div>
        <div className="cl-rows">
          {ROWS.map((row, r) => (
            <div className="cl-row" key={r} data-dir={r ? 1 : -1}>
              <ul className="cl-track">
                {[...row, ...row].map(([file, name], i) => {
                  const copy = i >= row.length;
                  const cls = [WIDE.includes(file) && 'wide', LIGHT.includes(file) && 'light'].filter(Boolean).join(' ');
                  return (
                    <li key={i} className={cls || undefined} aria-hidden={copy || undefined}>
                      <img src={`/img/clients/${file}.webp`} alt={copy ? '' : name} title={name} loading="lazy" decoding="async" draggable={false} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

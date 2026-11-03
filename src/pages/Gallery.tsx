import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { CATS, PHOTOS, PLACES, type Photo, type Place } from '../data/gallery';
import { createGalleryMotion, revealNew } from './galleryMotion';
import { holdScroll } from '../hooks/useSmoothScroll';
import { Arrow, FeederCta } from '../components/ui';

gsap.registerPlugin(Flip);

const catName = (id: string) => CATS.find(c => c.id === id)?.name ?? '';
const label = (p: Photo) => p.place === 'products' ? p.cats.map(catName).join(' · ') : p.place === 'office' ? 'Office' : 'Workshop';

/**
 * The inspection viewer: the chosen photo grows out of its print into a light, full-screen viewer
 * with its caption, a count, arrows, keyboard (← → Esc) and swipe.
 */
function Viewer({ list, at, from, onGo, onClose }: { list: Photo[]; at: number; from: DOMRect | null; onGo: (i: number) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null), img = useRef<HTMLImageElement>(null), first = useRef(true);
  const p = list[at];
  const product = p.place === 'products' ? CATS.find(c => c.id === p.cats[0]) : undefined;

  // open: grow out of the thumbnail; later photos slide in
  useLayoutEffect(() => {
    const el = img.current, root = box.current;
    if (!el || !root) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (first.current) {
      first.current = false;
      gsap.fromTo(root, { '--fade': 0 }, { '--fade': 1, duration: reduce ? 0 : 0.45, ease: 'power2.out' });
      const to = el.getBoundingClientRect();
      if (from && !reduce && to.width) {
        gsap.fromTo(el, {
          x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2),
          scale: Math.max(from.width / to.width, from.height / to.height),
        }, { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
      }
      gsap.fromTo(root.querySelectorAll('.vw-ui'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: reduce ? 0 : 0.25, stagger: 0.05, ease: 'power2.out' });
    } else if (!reduce) {
      gsap.fromTo(el, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' });
    }
  }, [at, from]);

  const go = useCallback((d: number) => onGo((at + d + list.length) % list.length), [at, list.length, onGo]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [go, onClose]);
  useEffect(() => { box.current?.querySelector<HTMLButtonElement>('.vw-close')?.focus(); }, []);

  // swipe
  const sx = useRef<number | null>(null);
  return (
    <div className="vw" ref={box} role="dialog" aria-modal="true" aria-label={`${p.name}, photo ${at + 1} of ${list.length}`}
      onPointerDown={e => { sx.current = e.clientX; }}
      onPointerUp={e => { if (sx.current !== null && Math.abs(e.clientX - sx.current) > 50) go(e.clientX < sx.current ? 1 : -1); sx.current = null; }}>
      <button type="button" className="vw-bg" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="vw-top vw-ui">
        <span className="mono">{String(at + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
        <button type="button" className="vw-close" onClick={onClose}>Close<span aria-hidden="true">Esc</span></button>
      </div>
      <figure className="vw-fig">
        <img ref={img} key={p.id} src={p.src} alt={`${p.name} by Electrosoft`} width={p.w} height={p.h} draggable={false} />
        <i className="vw-marks" aria-hidden="true" />
      </figure>
      <div className="vw-bot vw-ui">
        <button type="button" className="vw-arrow" aria-label="Previous photo" onClick={() => go(-1)}><Arrow /></button>
        <div className="vw-cap">
          <b>{p.name}</b>
          <span>{label(p)}</span>
          {product && <Link to={`/products#${product.product}`} onClick={onClose}>See {product.name}<Arrow /></Link>}
        </div>
        <button type="button" className="vw-arrow next" aria-label="Next photo" onClick={() => go(1)}><Arrow /></button>
      </div>
    </div>
  );
}

/*
 * 6 · Gallery: the office, the workshop and the panels, as prints. Tabs pick the place, chips pick the
 * product; the prints rearrange (Flip), each opens like a camera shutter as it arrives, and a print
 * opens into the inspection viewer. Motion: galleryMotion.ts.
 */
export default function Gallery() {
  const ref = useRef<HTMLElement>(null), grid = useRef<HTMLDivElement>(null), tabs = useRef<HTMLDivElement>(null);
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [place, setPlace] = useState<'all' | Place>('all');
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<{ at: number; from: DOMRect | null } | null>(null);
  const flip = useRef<Flip.FlipState | null>(null);

  const shown = (p: Photo) => (place === 'all' || p.place === place) && (!cat || p.cats.includes(cat));
  const list = PHOTOS.filter(shown);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => createGalleryMotion(el, reduce), el);
    return () => ctx.revert();
  }, [reduce]);

  // filter changes: the prints move to their new places, newcomers open, leavers fold away
  useLayoutEffect(() => {
    const state = flip.current;
    flip.current = null;
    if (!state || !grid.current) return;
    if (reduce) return;
    Flip.from(state, {
      targets: grid.current.querySelectorAll('.gl-item'), duration: 0.7, ease: 'expo.inOut', absolute: true, nested: true,
      onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }),
      onLeave: els => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power2.in' }),
      onComplete: () => revealNew(grid.current!),
    });
  }, [place, cat, reduce]);

  // glide the tab highlight
  useLayoutEffect(() => {
    const box = tabs.current, on = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!box || !on) return;
    box.style.setProperty('--x', `${on.offsetLeft}px`);
    box.style.setProperty('--w', `${on.offsetWidth}px`);
  }, [place]);

  useEffect(() => {
    const before = document.title;
    document.title = 'Gallery — Electrosoft Automation';
    return () => { document.title = before; };
  }, []);

  // the viewer holds the page still
  useEffect(() => {
    if (!open) return;
    holdScroll(true);
    document.documentElement.style.overflow = 'hidden';
    return () => { holdScroll(false); document.documentElement.style.overflow = ''; };
  }, [open !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const capture = () => { if (grid.current) flip.current = Flip.getState(grid.current.querySelectorAll('.gl-item')); };
  const pickPlace = (p: 'all' | Place) => { if (p === place) return; capture(); setPlace(p); if (p === 'office' || p === 'workshop') setCat(null); };
  const pickCat = (c: string | null) => { if (c === cat) return; capture(); setCat(c); if (c && place !== 'products' && place !== 'all') setPlace('products'); };
  const count = (p: 'all' | Place) => PHOTOS.filter(x => p === 'all' || x.place === p).length;
  const lastFocus = useRef<HTMLElement | null>(null);
  const close = useCallback(() => { setOpen(null); requestAnimationFrame(() => lastFocus.current?.focus()); }, []);
  const goTo = useCallback((at: number) => setOpen(o => o && { at, from: o.from }), []);

  return (
    <main className="gl" ref={ref}>
      <section className="gl-hero gut" aria-labelledby="gl-h">
        <div className="wrap">
          <h1 className="gl-h1" id="gl-h"><span className="ln"><span>Inside the works.</span></span></h1>
          <p className="gl-lede">The design office, the workshop, and the panels that leave it. Tap a photo to look closer.</p>
          <div className="gl-tabs" ref={tabs} role="group" aria-label="Show photos of">
            <i className="pj-glide" aria-hidden="true" />
            {PLACES.map(t => (
              <button key={t.id} type="button" aria-pressed={t.id === place} onClick={() => pickPlace(t.id)}>
                {t.name}<span className="mono">{count(t.id)}</span>
              </button>
            ))}
          </div>
          <div className={`gl-chips${place === 'office' || place === 'workshop' ? ' off' : ''}`} role="group" aria-label="Product">
            <button type="button" aria-pressed={cat === null} onClick={() => pickCat(null)}>All products</button>
            {CATS.map(c => <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => pickCat(c.id)}>{c.name}</button>)}
          </div>
        </div>
      </section>

      <section className="gl-wall gut" aria-label={`${list.length} photos`}>
        <div className="wrap">
          <div className="gl-grid" ref={grid}>
            {PHOTOS.map(p => {
              const i = list.indexOf(p);
              return (
                <figure key={p.id} className={`gl-item${p.place !== 'products' ? ' collage' : ''}${i < 0 ? ' gone' : ''}`} aria-hidden={i < 0} style={{ '--ar': `${p.w} / ${p.h}` } as CSSProperties}>
                  <button type="button" tabIndex={i < 0 ? -1 : 0} aria-label={`Open ${p.name}`}
                    onClick={e => { lastFocus.current = e.currentTarget; setOpen({ at: i, from: e.currentTarget.querySelector('img')!.getBoundingClientRect() }); }}>
                    <span className="gl-shot"><img src={p.src} alt="" width={p.w} height={p.h} loading="lazy" decoding="async" draggable={false} /></span>
                  </button>
                  <figcaption><b>{p.name}</b><span className="mono">{label(p)}</span></figcaption>
                </figure>
              );
            })}
          </div>
          {list.length === 0 && <p className="gl-none">No photos for this one yet.</p>}
        </div>
      </section>

      <FeederCta id="gl-cta-h" tag="Your panel">
        <Link className="pill" to="/contact">Get a Quote<Arrow /></Link>
        <Link className="line-btn" to="/products">See all products</Link>
      </FeederCta>

      {open && list[open.at] && <Viewer list={list} at={open.at} from={open.from} onGo={goTo} onClose={close} />}
    </main>
  );
}

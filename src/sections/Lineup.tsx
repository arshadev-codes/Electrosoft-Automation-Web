import { useLayoutEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCinematic } from '../hooks/useCinematic';

gsap.registerPlugin(ScrollTrigger);

// CONTENT.md · Products — five featured here; the full 12 live on /products. Photos: public/img/products (old site).
const FEATURED = [
  { id: 'plc-scada', cat: 'Automation', name: 'PLC / SCADA',
    text: 'Complete plant automation: PLC panels, programming, SCADA and support from a team with 20+ years of experience.',
    points: ['SCADA on WinCC, Citect, Wonderware, FactoryTalk', 'Strong data acquisition', 'Full control and monitoring'] },
  { id: 'mcc', cat: 'Motors', name: 'MCC', text: 'Motor protection, distribution and industrial communication in one package.', points: ['20+ year life cycle'] },
  { id: 'apfc', cat: 'Energy', name: 'SmartAPFC', text: 'Fully automatic power factor correction, achieving unity power factor.', points: ['8 levels of protection'] },
  { id: 'vfd', cat: 'Energy', name: 'VFD Panels', text: 'Match motor speed to load and cut energy cost.', points: ['Built to your application'] },
  { id: 'pcc', cat: 'Power', name: 'PCC', text: 'Heavy-duty power control centres with special bus-bar and wiring expertise.', points: ['CPRI approved 65kA · IP65'] },
];

// the card tilts a little toward the mouse; the photo drifts the other way
const tilt = (e: PointerEvent<HTMLElement>) => {
  if (e.pointerType !== 'mouse') return;
  const b = e.currentTarget.querySelector<HTMLElement>('.lu-body')!, r = b.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  b.style.setProperty('--ry', `${x * 4}deg`); b.style.setProperty('--rx', `${-y * 4}deg`);
  b.style.setProperty('--mx', `${x * -10}px`); b.style.setProperty('--my', `${y * -8}px`);
};
const untilt = (e: PointerEvent<HTMLElement>) => {
  const b = e.currentTarget.querySelector<HTMLElement>('.lu-body')!;
  ['--ry', '--rx', '--mx', '--my'].forEach(v => b.style.removeProperty(v));
};

export default function Lineup() {
  const ref = useRef<HTMLElement>(null);
  useCinematic(ref, '.wrap', { enter: false }); // the cards deal in on their own way in

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const grid = el.querySelector<HTMLElement>('.lu-grid')!;
    const cards = gsap.utils.toArray<HTMLElement>('.lu-card', el);
    // card centre → grid centre, so the deck can start stacked in the middle (layout offsets ignore the animation's transforms)
    const toCentre = (c: HTMLElement) => ({
      x: grid.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2),
      y: grid.clientHeight / 2 - (c.offsetTop + c.offsetHeight / 2),
    });
    // each card's photo rises into it, then its text slides in
    const fillIn = (tl: gsap.core.Timeline, c: HTMLElement, at: number) => tl
      .fromTo(c.querySelector('.lu-shot'), { yPercent: 45, scale: 0.82, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, ease: 'power3.out', duration: 0.9 }, at + 0.25)
      .fromTo(c.querySelectorAll('.lu-txt > *'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, ease: 'power3.out', duration: 0.6, stagger: 0.05 }, at + 0.3);

    const ctx = gsap.context(() => {
      // fromTo everywhere: StrictMode runs this twice in dev, and a plain from() would read the half-hidden state as its end
      gsap.fromTo('.lu-head .ln > span', { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 78%' } });
      gsap.fromTo('.lu-head p', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 78%' } });

      const mm = gsap.matchMedia();
      // desktop: the five cards start as a tilted deck in the middle and deal out into the grid, driven by scroll
      mm.add('(min-width: 1001px)', () => {
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: grid, start: 'top 92%', end: 'top 28%', scrub: 1, invalidateOnRefresh: true },
        });
        cards.forEach((c, i) => {
          tl.fromTo(c,
            { x: () => toCentre(c).x * 0.9, y: () => toCentre(c).y * 0.9 + 120, rotateX: 32, rotateY: () => (toCentre(c).x > 0 ? -1 : 1) * 18, rotate: (i - 2) * 3.5, scale: 0.7, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 60%' },
            { x: 0, y: 0, rotateX: 0, rotateY: 0, rotate: 0, scale: 1, opacity: 1, duration: 1, immediateRender: true }, i * 0.14);
          fillIn(tl, c, i * 0.14);
        });
      });
      // tablet / phone: each card tilts up from below as it arrives
      mm.add('(max-width: 1000px)', () => {
        cards.forEach(c => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: c, start: 'top 98%', end: 'top 60%', scrub: 1 } });
          tl.fromTo(c, { y: 90, rotateX: 26, scale: 0.9, opacity: 0, transformPerspective: 1000, transformOrigin: '50% 100%' }, { y: 0, rotateX: 0, scale: 1, opacity: 1, duration: 1 }, 0);
          fillIn(tl, c, 0);
        });
      });

      gsap.fromTo('.lu-more', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.lu-more', start: 'top 94%' } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section id="lineup" ref={ref} className="gut" aria-labelledby="lineup-h">
      <div className="wrap">
        <div className="lu-head sec-head">
          <h2 id="lineup-h"><span className="ln"><span>Every panel your</span></span><span className="ln"><span>plant runs on.</span></span></h2>
          <p>Five of our ten panel types, each one 100% tested before dispatch.</p>
        </div>

        <div className="lu-grid">
          {FEATURED.map((p, i) => (
            <Link key={p.id} className={`lu-card${i === 0 ? ' big' : ''}`} to={`/products#${p.id}`} onPointerMove={tilt} onPointerLeave={untilt} style={{ '--i': i } as CSSProperties}>
              <div className="lu-body">
                <div className="lu-txt">
                  <span className="lu-chip"><i />{p.cat}</span>
                  <h3>{p.name}</h3>
                  <p>{p.text}</p>
                  <ul className="lu-pts">{p.points.map(pt => <li key={pt}>{pt}</li>)}</ul>
                  <span className="lu-go" aria-hidden="true">→</span>
                </div>
                <div className="lu-shot">
                  <img src={`/img/products/${p.id}.webp`} alt={`${p.name} panel built by Electrosoft`} loading="lazy" decoding="async" draggable={false} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="lu-more">
          <p><b>10 panel types and 2 services</b>, from PLC / SCADA to turnkey projects.</p>
          <Link className="pill" to="/products">View all products</Link>
        </div>
      </div>
    </section>
  );
}

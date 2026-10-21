import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const NAV = [
  ['About', '/about'],
  ['Products', '/products'],
  ['Testing Solutions', '/transformer-testing'],
  ['Projects', '/projects'],
  ['Gallery', '/gallery'],
  ['Contact', '/contact'],
] as const;

export default function Header() {
  const barRef = useRef<HTMLDivElement>(null), hdrRef = useRef<HTMLElement>(null), navRef = useRef<HTMLElement>(null), hiRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const hdr = hdrRef.current!;
    const ctx = gsap.context(() => {
      gsap.to(barRef.current, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
      // firm up once the page moves; slip away while reading down, come back on the way up
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: s => {
          const y = s.scroll();
          hdr.classList.toggle('is-scrolled', y > 24);
          hdr.classList.toggle('is-hidden', y > 400 && s.direction === 1 && !hdr.classList.contains('is-open'));
        },
      });
    });
    return () => ctx.revert();
  }, []);

  // close the phone menu on navigation and on Escape
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // one highlight pill glides to whichever link the pointer is over
  const glide = (e: MouseEvent<HTMLElement>) => {
    const a = (e.target as HTMLElement).closest('a'), hi = hiRef.current, nav = navRef.current;
    if (!a || !hi || !nav) return;
    hi.style.width = `${a.offsetWidth}px`;
    hi.style.transform = `translateX(${a.offsetLeft}px)`;
    hi.classList.add('on');
  };
  const rest = () => hiRef.current?.classList.remove('on');

  return (
    <header className={`hdr gut${open ? ' is-open' : ''}`} ref={hdrRef}>
      <div className="wrap">
        <Link className="logo" to="/" aria-label="Electrosoft home">
          <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="#0B5BD3" /></svg>
          ELECTROSOFT
        </Link>
        <nav className="nav" aria-label="Main" ref={navRef} onMouseOver={glide} onMouseLeave={rest}>
          <span className="nav-hi" ref={hiRef} aria-hidden="true" />
          {NAV.map(([label, to]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <div className="hdr-ctas">
          <Link className="ghost" to="/track">Track Order</Link>
          <Link className="pill" to="/contact">Get a Quote</Link>
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
            <i /><i />
          </button>
        </div>
        <div className="progress" ref={barRef} aria-hidden="true" />
      </div>

      <div className="menu" id="menu" hidden={!open}>
        <nav aria-label="Main">
          {NAV.map(([label, to], i) => <NavLink key={to} to={to} style={{ animationDelay: `${i * 35}ms` }}>{label}</NavLink>)}
        </nav>
        <div className="menu-ctas">
          <Link className="menu-track" to="/track">Track your order</Link>
          <Link className="pill" to="/contact">Get a Quote</Link>
        </div>
      </div>
    </header>
  );
}

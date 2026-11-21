import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Nav items per section. The cross-link to the other section is added automatically.
const TESTING_NAV = [
  ['About', '/about'],
  ['Products', '/products'],
  ['Projects', '/projects'],
  ['Gallery', '/gallery'],
  ['Contact', '/contact'],
] as const;

const PANEL_NAV = [
  ['About', '/panel/about'],
  ['Products', '/panel/products'],
  ['Projects', '/panel/projects'],
  ['Gallery', '/panel/gallery'],
  ['Contact', '/panel/contact'],
] as const;

interface HeaderProps {
  /** '/panel' for the panels section, '' (default) for the testing section. */
  basePath?: string;
}

export default function Header({ basePath = '' }: HeaderProps) {
  const hdrRef = useRef<HTMLElement>(null), navRef = useRef<HTMLElement>(null), hiRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isPanel = basePath === '/panel';
  const logoTo = isPanel ? '/panel' : '/';
  const NAV = isPanel ? PANEL_NAV : TESTING_NAV;

  useLayoutEffect(() => {
    const hdr = hdrRef.current!;
    const ctx = gsap.context(() => {
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
        {/* Logo: / for testing, /panel for panels */}
        <Link className="logo" to={logoTo} aria-label={isPanel ? "Electrosoft Panels home" : "Electrosoft home"}>
          <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="#0B5BD3" /></svg>
          ELECTROSOFT
        </Link>
        <nav className="nav" aria-label="Main" ref={navRef} onMouseOver={glide} onMouseLeave={rest}>
          <span className="nav-hi" ref={hiRef} aria-hidden="true" />
          {NAV.map(([label, to]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        
        </nav>
        <div className="hdr-ctas">
          <Link className="ghost" to="/track">Track Order</Link>
          {isPanel
            ? <Link className="pill" to="/">Explore Testing</Link>
            : <Link className="pill" to="/panel">Explore Panels</Link>
          }
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
            <i /><i />
          </button>
        </div>
      </div>

      <div className="menu" id="menu" hidden={!open}>
        <nav aria-label="Main">
          {NAV.map(([label, to], i) => <NavLink key={to} to={to} style={{ animationDelay: `${i * 35}ms` }}>{label}</NavLink>)}
         
        </nav>
        <div className="menu-ctas">
          <Link className="menu-track" to="/track">Track your order</Link>
          {isPanel
            ? <Link className="pill" to="/">Explore Testing</Link>
            : <Link className="pill" to="/panel">Explore Panels</Link>
          }
        </div>
      </div>
    </header>
  );
}

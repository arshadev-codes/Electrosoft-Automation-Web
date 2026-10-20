import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(barRef.current, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <header className="hdr gut">
        <div className="wrap">
          <Link className="logo" to="/" aria-label="Electrosoft home">
            <svg viewBox="0 0 16 22" aria-hidden="true"><path d="M10 0L0 13h6l-2 9 12-14H9z" fill="#0B5BD3" /></svg>
            ELECTROSOFT
          </Link>
          <nav className="nav" aria-label="Main">
            {NAV.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}
          </nav>
          <div className="hdr-ctas">
            <Link className="ghost" to="/track">Track Order</Link>
            <Link className="pill" to="/contact">Get a Quote</Link>
          </div>
        </div>
      </header>
      <div className="progress" ref={barRef} />
    </>
  );
}

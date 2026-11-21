import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useSectionPath } from '../hooks/useSectionPath';

/**
 * BlueprintSwitchButton — Floating blueprint button in bottom right corner.
 * Perfectly blended with Electrosoft's Apple-style engineering aesthetic:
 * - Frosted glass card with 16px radius, subtle blueprint grid, and layered shadows
 * - Viewfinder corner brackets that spring outward with GSAP on hover
 * - Matches the redirect arrow icon from design reference (media_1795180399417_024380c9.png)
 * - Custom technical SVGs for Panels & Automation and Transformer Testing
 * - Magnetic pointer tracking and light sheen sweep
 */
export default function BlueprintSwitchButton() {
  const { isPanel } = useSectionPath();
  const btnRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const corners = el.querySelectorAll('.bp-c');
    const arrow = el.querySelector('.bp-ext-ico');
    const iconBadge = el.querySelector('.bp-icon-badge');
    const sheen = el.querySelector('.bp-sheen');

    // Hover animation timeline
    const tl = gsap.timeline({ paused: true, defaults: { duration: 0.38, ease: 'back.out(2)' } });
    tl.to(corners, {
      x: i => [-4, 4, -4, 4][i],
      y: i => [-4, -4, 4, 4][i],
    }, 0);
    tl.to(arrow, { x: 2.5, y: -2.5, scale: 1.08 }, 0);
    tl.to(iconBadge, { scale: 1.06, rotate: isPanel ? -3 : 3, ease: 'power2.out' }, 0);
    tl.to(el, { y: -3, duration: 0.3, ease: 'power2.out' }, 0);
    tl.fromTo(sheen, { x: '-120%', opacity: 0 }, { x: '240%', opacity: 0.65, duration: 0.7, ease: 'power2.inOut' }, 0);

    const onEnter = () => tl.play();
    const onLeave = () => tl.reverse();

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    // Subtle magnetic cursor pull on desktop
    let cleanupMagnetic = () => { };
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
      const onPointerMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.16);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.22);
      };
      const onPointerLeave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerleave', onPointerLeave);
      cleanupMagnetic = () => {
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerleave', onPointerLeave);
      };
    }

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      cleanupMagnetic();
      tl.kill();
    };
  }, [isPanel]);

  const targetUrl = isPanel ? '/' : '/panel';
  const label = isPanel ? 'Transformer Testing' : 'Panels & Automation';
  const sub = isPanel ? 'Testing bay suite' : 'Control panels & VFDs';
  const ariaLabel = isPanel
    ? 'Switch to Transformer Testing section'
    : 'Switch to Panels & Automation section';

  return (
    <Link
      ref={btnRef}
      to={targetUrl}
      className="bp-float"
      aria-label={ariaLabel}
      title={`${label} — ${sub}`}
    >
      {/* Light sheen effect */}
      <span className="bp-sheen" aria-hidden="true" />

      {/* Corners version viewfinder brackets */}
      <span className="bp-c tl" aria-hidden="true" />
      <span className="bp-c tr" aria-hidden="true" />
      <span className="bp-c bl" aria-hidden="true" />
      <span className="bp-c br" aria-hidden="true" />

      {/* Left technical icon badge */}
      <div className="bp-icon-badge" aria-hidden="true">
        {isPanel ? (
          // Transformer Testing icon with core coils & bushings
          <svg
            className="bp-main-ico"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3.5" y="6" width="17" height="13.5" rx="2.5" />
            <line x1="3.5" y1="12" x2="20.5" y2="12" strokeDasharray="2 2" />
            <path d="M7 2.5v3.5M12 1.5v4.5M17 2.5v3.5" />
            <circle cx="7" cy="2.5" r="1" fill="currentColor" />
            <circle cx="12" cy="1.5" r="1" fill="currentColor" />
            <circle cx="17" cy="2.5" r="1" fill="currentColor" />
          </svg>
        ) : (
          // Electrical Control Panel & Switchgear cabinet icon
          <svg
            className="bp-main-ico"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3.5" y="3" width="17" height="18" rx="2.5" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" />
            <circle cx="16.5" cy="7.5" r="1.25" fill="currentColor" />
            <line x1="6.5" y1="12.5" x2="9.5" y2="12.5" />
            <line x1="14.5" y1="12.5" x2="17.5" y2="12.5" />
            <line x1="6.5" y1="16.5" x2="9.5" y2="16.5" />
            <line x1="14.5" y1="16.5" x2="17.5" y2="16.5" />
          </svg>
        )}
      </div>

      {/* Middle typography block */}
      <div className="bp-copy">
        <span className="bp-eyebrow mono">
          <i className="bp-pulse-dot" aria-hidden="true" />
          {isPanel ? 'TESTING SUITE' : 'PANELS & AUTOMATION'}
        </span>
        <span className="bp-title">{label}</span>
      </div>

      {/* Right redirect arrow badge matching user-uploaded Image 2 */}
      <div className="bp-action-badge" aria-hidden="true">
        <svg
          className="bp-ext-ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </div>
    </Link>
  );
}

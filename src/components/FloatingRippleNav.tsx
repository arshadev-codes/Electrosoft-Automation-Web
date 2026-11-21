import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSectionPath } from '../hooks/useSectionPath';

gsap.registerPlugin(ScrollTrigger);

/**
 * FloatingRippleNav — Premium floating navigation pill with "E. Ripple"
 * - On page load: flies in from right with physical squash & stretch bounce
 * - 100% distortion-free animated moving border beam hugging the rounded perimeter
 * - Synchronized tactile double-beat heartbeat on the arrow button + dual expanding ripples
 * - Animated radar halo ring on the green status dot
 * - Silky smooth dual-layer rolling ticker (odometer text animation)
 * - Instant fluid spring swap to target text on hover
 * - Diagonal arrow push + sheen sweep + micro-interactions
 * - Navbar-synced scroll-hide via ScrollTrigger
 * - Zero browser tooltip popups
 */
const PHRASES = ['Need a Quote?', 'Get a Quote →'] as const;

export default function FloatingRippleNav() {
  const { isPanel } = useSectionPath();
  const pillRef = useRef<HTMLAnchorElement>(null);
  const rollerRef = useRef<HTMLSpanElement>(null);
  const goRef = useRef<HTMLSpanElement>(null);
  const leftIcoRef = useRef<HTMLSpanElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const spinnerRef = useRef<HTMLSpanElement>(null);

  const targetUrl = isPanel ? '/panel/contact' : '/contact';
  const ariaLabel = 'Get a Quote — Electrosoft';

  useLayoutEffect(() => {
    const el = pillRef.current;
    const roller = rollerRef.current;
    const goBtn = goRef.current;
    const leftIco = leftIcoRef.current;
    const sheen = sheenRef.current;
    const spinner = spinnerRef.current;
    if (!el || !roller || !goBtn) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion fallback
    if (reduce) {
      gsap.set(roller, { y: -20 });
      return;
    }

    const ripples = el.querySelectorAll<HTMLElement>('.fl-ripple');
    const arrow = el.querySelector<HTMLElement>('.fl-go svg');
    const halo = el.querySelector<HTMLElement>('.fl-halo');

    // =========================================================================
    // 1. PAGE LOAD ENTRANCE: FROM RIGHT WITH SQUASH & STRETCH
    // =========================================================================
    gsap.set(el, {
      x: 140,
      opacity: 0,
      scaleX: 1.35,
      scaleY: 0.75,
      transformOrigin: 'right center',
    });

    const entranceTl = gsap.timeline({ delay: 0.35 });
    entranceTl
      .to(el, {
        x: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out',
      })
      .to(
        el,
        {
          scaleX: 0.86,
          scaleY: 1.15,
          duration: 0.18,
          ease: 'power2.inOut',
        },
        '-=0.12'
      )
      .to(el, {
        scaleX: 1.07,
        scaleY: 0.94,
        duration: 0.2,
        ease: 'power1.out',
      })
      .to(el, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.45,
        ease: 'elastic.out(1.2, 0.4)',
        onComplete: () => {
          // Clear inline transform & opacity so CSS .is-hidden can control hide/reveal smoothly
          gsap.set(el, { clearProps: 'transform,opacity' });
        },
      });

    // =========================================================================
    // 2. CONTINUOUSLY ANIMATED MOVING BORDER BEAM (DISTORTION-FREE)
    // =========================================================================
    let beamTween: gsap.core.Tween | null = null;
    if (spinner) {
      beamTween = gsap.to(spinner, {
        rotate: 360,
        duration: 3.5,
        repeat: -1,
        ease: 'none',
      });
    }

    // =========================================================================
    // 3. TACTILE DOUBLE-BEAT HEARTBEAT + RIPPLE PULSE (E. Ripple)
    // =========================================================================
    const beatTl = gsap.timeline({ repeat: -1, repeatDelay: 1.1 });

    // Beat 1: Button scales up, first ripple & halo pulse outward
    beatTl
      .to(goBtn, { scale: 1.09, duration: 0.12, ease: 'power2.out' }, 0)
      .fromTo(
        ripples[0],
        { scale: 1, opacity: 0.8 },
        { scale: 2.6, opacity: 0, duration: 0.85, ease: 'power2.out' },
        0
      );

    if (halo) {
      beatTl.fromTo(
        halo,
        { scale: 1, opacity: 0.65 },
        { scale: 2.5, opacity: 0, duration: 0.85, ease: 'power2.out' },
        0
      );
    }

    // Beat 1 recoil
    beatTl.to(goBtn, { scale: 1, duration: 0.13, ease: 'power2.in' }, 0.12);

    // Beat 2: Second pulse
    beatTl
      .to(goBtn, { scale: 1.09, duration: 0.12, ease: 'power2.out' }, 0.25)
      .fromTo(
        ripples[1],
        { scale: 1, opacity: 0.8 },
        { scale: 2.6, opacity: 0, duration: 0.85, ease: 'power2.out' },
        0.25
      )
      // Elastic spring back to rest
      .to(goBtn, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.45)' }, 0.37);

    // =========================================================================
    // 4. DUAL-LAYER ROLLING TICKER ANIMATION (ODOMETER EFFECT)
    // =========================================================================
    let isHovered = false;
    let autoCycleTween: gsap.core.Timeline | null = null;

    const startAutoCycle = () => {
      autoCycleTween = gsap.timeline({ repeat: -1 });
      // Hold phrase 1 ("Looking for Panels?")
      autoCycleTween.to({}, { duration: 2.6 });
      // Roll up to phrase 2 ("Explore Panels →")
      autoCycleTween.to(roller, {
        y: -20,
        duration: 0.45,
        ease: 'power3.inOut',
      });
      // Hold phrase 2
      autoCycleTween.to({}, { duration: 3.0 });
      // Roll back to phrase 1
      autoCycleTween.to(roller, {
        y: 0,
        duration: 0.45,
        ease: 'power3.inOut',
      });
    };

    startAutoCycle();

    // =========================================================================
    // 5. SCROLL-TRIGGERED HIDE / REVEAL (HIDE ON SCROLL DOWN)
    // =========================================================================
    const updateScrollHide = (y: number, direction: number) => {
      // Hide immediately when scrolling down past 60px; reveal on scroll up or at top
      const hide = y > 60 && direction === 1;
      el.classList.toggle('is-hidden', hide);
    };

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: self => {
        updateScrollHide(self.scroll(), self.direction);
      },
    });

    let lastScrollY = window.scrollY;
    const onNativeScroll = () => {
      const currentY = window.scrollY;
      const dir = currentY >= lastScrollY ? 1 : -1;
      updateScrollHide(currentY, dir);
      lastScrollY = currentY;
    };
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    // =========================================================================
    // 6. RICH GSAP HOVER INTERACTIONS
    // =========================================================================
    const onEnter = () => {
      isHovered = true;
      autoCycleTween?.pause();

      // Accelerate the border beam on hover
      beamTween?.timeScale(1.8);

      // Immediate spring roll to phrase 2 ("Explore Panels →")
      gsap.to(roller, {
        y: -20,
        duration: 0.35,
        ease: 'back.out(1.8)',
        overwrite: true,
      });

      // Sheen reflection sweep across frosted glass
      if (sheen) {
        gsap.fromTo(
          sheen,
          { x: '-120%', opacity: 0 },
          { x: '240%', opacity: 0.65, duration: 0.65, ease: 'power2.inOut' }
        );
      }

      // Arrow diagonal spring leap
      if (arrow) {
        gsap.to(arrow, { x: 3, y: -3, scale: 1.15, duration: 0.3, ease: 'back.out(2)' });
      }

      // Left icon dynamic spring tilt & scale
      if (leftIco) {
        gsap.to(leftIco, { scale: 1.12, rotate: 6, duration: 0.3, ease: 'back.out(2)' });
      }
    };

    const onLeave = () => {
      isHovered = false;

      // Reset border beam speed
      beamTween?.timeScale(1);

      if (arrow) {
        gsap.to(arrow, { x: 0, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' });
      }
      if (leftIco) {
        gsap.to(leftIco, { scale: 1, rotate: 0, duration: 0.25, ease: 'power2.out' });
      }

      // After 1.6s of inactivity, smoothly resume rolling ticker
      gsap.delayedCall(1.6, () => {
        if (!isHovered && autoCycleTween) {
          gsap.to(roller, {
            y: 0,
            duration: 0.45,
            ease: 'power3.inOut',
            onComplete: () => {
              autoCycleTween?.restart();
            },
          });
        }
      });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('scroll', onNativeScroll);
      entranceTl.kill();
      beamTween?.kill();
      beatTl.kill();
      autoCycleTween?.kill();
      st.kill();
    };
  }, [targetUrl]);

  return (
    <Link
      ref={pillRef}
      to={targetUrl}
      className="fl-pill"
      aria-label={ariaLabel}
    >
      {/* Distortion-free Moving Border Beam Track */}
      <span className="fl-beam-track" aria-hidden="true">
        <span className="fl-beam-spinner" ref={spinnerRef} />
      </span>

      {/* Light sheen streak that sweeps across on hover */}
      <span className="fl-sheen" ref={sheenRef} aria-hidden="true" />

      {/* Left Technical Icon Badge with radar halo ring */}
      <span className="fl-ico-badge" ref={leftIcoRef} aria-hidden="true">
        <span className="fl-halo" />
        <span className="fl-live-dot" />
        <svg
          className="fl-ico-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </span>

      {/* Middle Label with Dual-Layer Rolling Ticker */}
      <span className="fl-lbl">
        <span className="fl-roller" ref={rollerRef}>
          <span className="fl-line fl-line-1">{PHRASES[0]}</span>
          <span className="fl-line fl-line-2">{PHRASES[1]}</span>
        </span>
      </span>

      {/* Right Circular Action Button with Tactile Double-Beat Ripples */}
      <span className="fl-go" ref={goRef} aria-hidden="true">
        <span className="fl-ripple" />
        <span className="fl-ripple" />
        <svg viewBox="0 0 24 24">
          <path d="M7 17L17 7" />
          <path d="M8 7h9v9" />
        </svg>
      </span>
    </Link>
  );
}

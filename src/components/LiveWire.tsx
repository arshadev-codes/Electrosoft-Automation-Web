import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const PHASES = ['#FF453A', '#E5B800', '#0A84FF']; // R Y B; blue drawn last, so a still page reads as one blue line

/*
 * Reading progress as a live conductor along the top of the screen. At rest it is one blue hairline up to
 * how far you have read; scroll and it carries load: the line splits into the three phases, R Y B, whose
 * swing grows with the scroll speed and settles back into one line when the page stops. A spark rides its head.
 */
export default function LiveWire() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current, cx = cv?.getContext('2d');
    if (!cv || !cx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const H = 16, TOP = 2; // css px: the still line sits 2px from the top; under load it drops by its swing so the phases fit
    let w = 0, dpr = 1, lastY = scrollY, amp = 0, ph = 0, drawn = '';

    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth;
      cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = `${w}px`; cv.style.height = `${H}px`;
      drawn = '';
    };
    size();
    addEventListener('resize', size);

    const tick = (_t: number, dt: number) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = scrollY, p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      const vel = Math.abs(y - lastY) / Math.max(dt, 1) * 1000; // px/s
      lastY = y;
      const target = reduce ? 0 : Math.min(1, vel / 1700);
      amp += (target - amp) * (target > amp ? 0.22 : 0.06);
      if (amp < 0.004) amp = 0;
      ph += (dt / 1000) * (3 + amp * 14);
      const X = p * w, key = `${X.toFixed(1)}|${amp.toFixed(3)}`;
      if (key === drawn && amp === 0) return; // a still page: nothing to redraw
      drawn = key;

      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, w, H);
      if (X < 1) return;
      const A = amp * 6, L = 54;
      cx.lineWidth = 1.6; cx.lineCap = 'round'; cx.lineJoin = 'round';
      PHASES.forEach((col, k) => {
        cx.beginPath();
        for (let x = 0; x <= X; x += 3) {
          // the swing fades in from the left edge and pinches back to one point at the head
          const env = Math.min(1, x / 90) * Math.min(1, (X - x) / 70);
          const yy = TOP + A + A * env * Math.sin((x / L) * Math.PI * 2 - ph + (k * Math.PI * 2) / 3);
          if (x === 0) cx.moveTo(x, yy); else cx.lineTo(x, yy);
        }
        cx.lineTo(X, TOP + A);
        cx.strokeStyle = col;
        cx.globalAlpha = k === 2 ? 0.9 : Math.min(0.9, amp * 2.2);
        cx.stroke();
      });
      // the spark at the head
      cx.globalAlpha = 1;
      const gy = TOP + A;
      const g = cx.createRadialGradient(X, gy, 0, X, gy, 7 + amp * 6);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.3, 'rgba(61,134,255,.75)'); g.addColorStop(1, 'rgba(61,134,255,0)');
      cx.fillStyle = g;
      cx.fillRect(X - 14, 0, 28, H);
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); removeEventListener('resize', size); };
  }, []);

  return <canvas className="livewire" ref={ref} aria-hidden="true" />;
}

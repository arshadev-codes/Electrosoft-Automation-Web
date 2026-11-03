import { gsap } from 'gsap';
import { magnetic } from '../hooks/magnetic';

/*
 * /contact motion: the headline rises and a light runs across it; the form slides up as a sheet, the
 * details and the location card follow; the map's road draws itself and the pin drops in. The circuit
 * itself is CSS (breakers close as the fields fill). Reduced motion: everything in place.
 */
export function createContactMotion(root: HTMLElement, reduce: boolean) {
  if (reduce) return;
  const $ = (s: string) => gsap.utils.toArray<Element>(s, root);
  gsap.timeline({ delay: 0.1 })
    .fromTo($('.ct-h1 .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out' }, 0)
    .fromTo($('.ct-h1 .ln > span'), { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.6, ease: 'power2.inOut' }, 0.7)
    .fromTo($('.ct-lede'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
    .fromTo($('.ct-form'), { opacity: 0, y: 40, rotate: -0.6 }, { opacity: 1, y: 0, rotate: 0, duration: 1, ease: 'expo.out', clearProps: 'transform' }, 0.3)
    .fromTo($('.ct-ways li'), { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out' }, 0.45)
    .fromTo($('.ct-map'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.6)
    .fromTo($('.ct-map .road, .ct-map .road-edge'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.8)
    .fromTo($('.ct-map .road-mid'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.6)
    .fromTo($('.ct-map .pin-g'), { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'bounce.out' }, 1.6);
  return magnetic(root.querySelector<HTMLElement>('.ct-go'));
}

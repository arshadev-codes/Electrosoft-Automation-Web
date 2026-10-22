/**
 * 3D look: the page is the studio. Canvases are transparent, so the equipment stands on the page
 * colour itself, grounded by real shadows, like a product shot on a seamless sweep. Colours are
 * hex numbers (three.js); `page` must match --bg in theme.css.
 */
export const STUDIO = {
  page: 0xF4F5F7,
  fogNear: 17, fogFar: 62, // far parts of wide shots melt into the page
  // AgX: a filmic curve with photographic highlight roll-off; a strong key over a lower ambient
  // gives every face its own light level, the way a single softbox does
  env: 0.6, exposure: 1.35, key: 3.2, rim: 0.65, fill: 0.35,
  shadow: 0.2, // key-light shadow on the page
  tone: 'agx' as 'neutral' | 'agx' | 'aces',
};

// dev only: ?look={"key":3} overrides any of these, to compare lighting on one frame
if (import.meta.env.DEV) {
  try { Object.assign(STUDIO, JSON.parse(new URLSearchParams(location.search).get('look') || '{}')); } catch { /* ignore */ }
}

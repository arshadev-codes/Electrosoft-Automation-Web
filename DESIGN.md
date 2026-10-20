# DESIGN.md — Electrosoft Website

Reference: `reference/prototype.html` (approved look). Open it in a browser before building anything.
When in doubt, match the prototype.

## Direction
Light, Apple-style product site with a futuristic 3D/scroll layer.
Big confident type, lots of space, one strong brand color, real 3D and scroll-driven motion.
One dark band (Testing Suite) for contrast.

## Colors
```css
:root{
  --bg:#F4F5F7;       /* page */
  --paper:#FFFFFF;    /* cards, light bands */
  --ink:#0E1116;      /* text */
  --muted:#5B616B;    /* secondary text */
  --faint:#A3A7AF;    /* tickers, unfilled words */
  --line:#DCDFE4;     /* borders */
  --brand:#0B5BD3;    /* TODO: replace with logo color */
  --brand-2:#3D86FF;  /* brand on dark */
  --night:#06080D;    /* dark band */
  --night-2:#10141C;
  --night-line:#232A36;
  --night-muted:#9AA3B2;
  --r:#FF453A; --y:#FFD60A; --b:#0A84FF; /* R Y B phase colors */
  --ok:#30D158;       /* PASS / running */
}
```

## Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400..800&family=Manrope:wght@400..800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```
- Display: Sora, weight 700 (600 for small headings), letter-spacing -0.03 to -0.04em. Geometric and smooth: clean futuristic, not heavy.
- Body: Manrope 17px, line-height 1.55
- Labels/data: JetBrains Mono, 12px, uppercase, letter-spacing .16em

## Type scale
- H1 clamp(36px, 4vw, 62px) for long headlines (prototype used up to 112px for short ones) · H2 clamp(40px, 5.6vw, 80px) · H3 30px · body 17px · label 12px

## 3D studio
- "Spotlight" studio: the hero 3D sits in a seamless mid-grey cyclorama (floor curving into the wall) with a pool of light on the equipment, soft haze and a vignette toward the edges, contact shadows, a faint brand-blue glow and a faint test-bay blueprint on the back wall. Lighting: Poly Haven "Studio Small 09" HDRI (CC0) + soft key light. Settings live in `src/look.ts`.
- Performance budget: static meshes are merged per layer; weak GPUs render without post-processing; glass over the 3D uses no backdrop blur except captions, tags and callouts.
- Menu: floating glass capsule, not a full-width bar.

## Layout
- Max width 1240px, side gutter ≥16px
- Sections: generous vertical padding (90–200px)
- Sticky blurred header (60px) + 2px brand scroll-progress bar

## Components
- Pill button (brand fill, fully rounded) · ghost link ("Explore ›")
- Product card: 30px radius, light fill, mini cabinet art, lifts on hover
- Stat: huge number + small brand unit (`%+`, `kA`, `MVA`)
- Liquid glass (Apple-style) for every card floating over 3D: step captions, label tags, spec callouts, live chip. Mostly clear tint, `backdrop-filter` blur + saturate, bright top rim and inner glow, soft shadow; static cards also lens the backdrop with the `#liquid-glass` SVG filter (Chromium)
- 3D label tag: liquid glass, mono layer number, bold name
- App window (X'mer Prime): dark frame, traffic-light dots, live canvas

## Motion (Three.js + GSAP ScrollTrigger)
- **Hero:** 3D panel assembles on load → pinned scroll: camera orbits, door opens, 7 layers explode, labels appear
- **Text:** headline lines rise from a mask on load; big statements fill word by word on scroll
- **Numbers:** count up when entering view
- **Lineup:** pinned section, cards move sideways with scroll
- **Panels/windows:** scale/tilt up into place while scrolling
- **Tickers:** two client rows moving opposite directions
- **CTA:** magnetic button, moving light streaks
- Easing: `expo.out` for entrances, `scrub: 1` for scroll-linked
- Everything readable without animation; respect `prefers-reduced-motion`

## Rules
- One accent color only (brand). R/Y/B and green only for electrical meaning.
- No invented facts — numbers and names come from CONTENT.md.
- Every new page should reuse this motion vocabulary — don't invent new effect styles per page.
- Mobile: 3D still runs (camera pulls back), sideways scroll still works, text stacks.

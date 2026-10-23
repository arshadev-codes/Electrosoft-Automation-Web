# DESIGN.md — Electrosoft Website

Reference: `reference/prototype.html` (approved look). Open it in a browser before building anything.
When in doubt, match the prototype.

## Direction
Light, Apple-style product site with a futuristic 3D/scroll layer.
Confident but moderate type, lots of space, one strong brand color, real 3D and scroll-driven motion.

**One sheet (2026-10-22).** The whole page is one continuous sheet of paper (`--bg`). Sections never get their own
background colour or top/bottom borders; they are separated by space (`--sy`) and alignment. The 3D canvases are
transparent, so the equipment stands on that same sheet. Only two breaks are meant to be felt: the blueprint grid
surfacing (masked, no edges) in Testing, and the footer's ruled title block. No dark bands anywhere.

## Colors
```css
:root{
  --bg:#F4F5F7;       /* the sheet: every section, and the 3D backdrop (STUDIO.page in src/look.ts) */
  --paper:#FFFFFF;    /* raised objects only: cards, menu, title block. Never a section background */
  --ink:#0E1116;      /* text */
  --ink-2:#2E333B;    /* body text on cards */
  --muted:#5B616B;    /* secondary text */
  --faint:#A3A7AF;
  --line:#DCDFE4;     /* hairlines */
  --brand:#0B5BD3;    /* TODO: replace with logo color */
  --brand-2:#3D86FF;
  --r:#FF453A; --y:#FFD60A; --b:#0A84FF; /* R Y B phase colors */
  --ok:#30D158;       /* PASS / running */
}
```

## Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400..800&family=Manrope:wght@400..800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```
- Display: Sora, weight 600, letter-spacing -0.03 to -0.04em. Geometric and smooth: clean futuristic, not heavy.
- Body: Manrope 17px, line-height 1.55
- Data only (readings, rating plates, HUD counters): JetBrains Mono 12px, sentence case. No all-caps mono labels or eyebrows.

## Type scale
- H1 clamp(36px, 3.7vw, 54px) · every section H2 `--h2` clamp(30px, 3.1vw, 44px) with the shared `.sec-head` (heading left, one supporting line right) · H3 22–34px · body 17px · stats clamp(44px, 4.4vw, 64px)

## 3D studio
- "Page" studio: no walls or floor art. The canvas is transparent, so the equipment stands on the page colour like a product shot on a seamless sweep: a shadow catcher takes the key light's shadow, contact shadows ground each unit, and haze in the page colour fades far parts. A soft white light pool (CSS) sits behind the equipment. Neutral rim light, no brand-blue tint. Lighting: Poly Haven "Studio Small 09" HDRI (CC0) + soft key light. Settings live in `src/look.ts`.
- Realism without post-processing (Intel/mobile GPUs skip AO, which costs ~3× the frame time there): AgX tone mapping with a strong key over low ambient, a ground-occlusion shader (`shadeGround` in stage.ts) that dims ambient light toward the floor, fins shaded dark at the root over a dark cavity, satin powder-coat paint, test leads that sag under their own weight (never arc upward).
- Dev only: `?q=0|1|2` pins a render quality level, `?look={"key":3}` overrides any STUDIO value.
- Performance budget: static meshes are merged per layer; weak GPUs render without post-processing; glass over the 3D uses no backdrop blur except captions, tags and callouts.
- Menu: floating glass capsule, not a full-width bar.

## Layout
- Max width 1240px, side gutter ≥16px
- Sections: one rhythm, `--sy` clamp(96px, 13vh, 160px) top and bottom
- Everything aligns to the content column; things over full-bleed 3D use `--edge`
- Floating glass header capsule, same width as the content column, links on its true centre; 2px progress hairline

## Components
- Pill button (brand fill, fully rounded) · ghost link ("Explore ›")
- Product card: 30px radius, light fill, mini cabinet art, lifts on hover
- Stat: huge number + small brand unit (`%+`, `kA`, `MVA`)
- Glass for every card floating over 3D (step captions, layer tags, spec callouts): white at 80%, 12px blur, hairline ring, soft shadow. One recipe in theme.css. Callouts flip to the pin's left near the screen edge
- Cards: white paper, 24px radius, hairline ring + one soft lift shadow (`--hair`, `--lift`)
- Footer: a ruled title block (address + certs · products · downloads) on white, like an engineering drawing's
- 3D label tag: liquid glass, mono layer number, bold name
- App window (X'mer Prime): dark frame, traffic-light dots, live canvas

## Motion (Three.js + GSAP ScrollTrigger)
- **Page change: scan sweep** (PageTransition.tsx). A sheet of drafting paper rises behind a glowing brand line, names the destination, the route swaps underneath, then the sheet sweeps away. A page that needs a moment (the 3D hero) calls `holdReveal(promise)` and the sheet waits for it (1.8 s max). Same-page hash links just scroll.
- **Products page: the switchboard.** The hero is a single-line diagram whose feeders are the index; below, a busbar fills with current as you scroll and every product is a feeder whose breaker closes as it arrives, while its photo scans from a blueprint ghost into colour.
- **Cinematic grammar: the paper haze.** Everything arrives out of the page colour and leaves back into it, scrubbed to scroll like a camera move. 3D scenes: the camera cranes back while fog in the page colour dissolves the equipment (`world.setHaze`); the turntable also rises out of it on the way in. DOM sections: `useCinematic` lifts content out of a soft blur as it arrives and sinks it as it leaves, only in the outer part of the screen so readable content is always sharp. Lineup skips the entry (its cards deal in); Clients skips the exit (the footer follows).
- **Hero:** 3D panel assembles on load → pinned scroll: camera orbits, door opens, 7 layers explode, labels appear
- **Text:** headline lines rise from a mask on load; big statements fill word by word on scroll
- **Numbers:** count up when entering view
- **Lineup:** pinned section, cards move sideways with scroll
- **Panels/windows:** scale/tilt up into place while scrolling
- **Tickers:** two client rows moving opposite directions; logos in colour on white nameplates (two screw heads), speed rises with scroll velocity, a hovered row stops
- **Laptop (Report section):** CSS 3D, not three.js: the lid hinges on the deck, the screen UI is real DOM laid out at 1280×800 and scaled; lifted cards live in the lid's 3D space so they really leave the screen
- **CTA:** magnetic button, moving light streaks
- Easing: `expo.out` for entrances, `scrub: 1` for scroll-linked
- Everything readable without animation; respect `prefers-reduced-motion`

## Rules
- One accent color only (brand). R/Y/B and green only for electrical meaning.
- No invented facts — numbers and names come from CONTENT.md.
- Every new page should reuse this motion vocabulary — don't invent new effect styles per page.
- Mobile: 3D still runs (camera pulls back), sideways scroll still works, text stacks.

# Electrosoft Automation — Company Website

Redesign of electrosoftindia.com: all existing content, new futuristic light design with 3D and scroll motion.

## Read before every task
- PLAN.md — every page and section with status. Source of truth for what's done and what's next.
- CONTENT.md — all copy, numbers, products, projects, clients. Never invent facts.
- DESIGN.md — colors, fonts, components, motion rules.
- reference/prototype.html — the approved design. Port from it; match it.

## How to work
- Build one section at a time, in PLAN.md order unless I say otherwise.
- After a section works, show me, then mark it 🟢 in PLAN.md with a short note.
- Never build a section marked ❓ — ask me the open question first.
- If something in CONTENT.md is marked [CONFIRM], use the draft and leave `// TODO: CONFIRM`.
- Keep the 3D scene in its own component (`src/components/PanelScene.tsx`) and lazy-load it.

## Stack
React + Vite + TypeScript, react-router-dom, three, gsap (ScrollTrigger).
Styles: src/styles/theme.css with DESIGN.md tokens. Images: public/img/.

## Commands
- npm run dev — local preview
- npm run build — production build

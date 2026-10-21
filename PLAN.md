# PLAN.md — Electrosoft Website Tracker

One file to see what's done, what's left, and what you still need to decide.
Claude Code updates this file after every section it builds.

## Legend
- ✅ **Designed** — exists in `reference/prototype.html`, needs porting to React
- 🟢 **Built** — done in the real project (Claude Code ticks these)
- 🟡 **Partial** — designed but missing something (see note)
- ⬜ **Not started**
- ❓ **Decide** — needs your decision or company info before building

Content for every section: `CONTENT.md`. Look and motion rules: `DESIGN.md`.

---

## 0. Project setup
| Item | Status | Note |
|---|---|---|
| Vite + React + TypeScript project | ⬜ | |
| Fonts, theme tokens (`src/styles/theme.css`) | ⬜ | From DESIGN.md |
| Three.js + GSAP + ScrollTrigger installed | ⬜ | `npm i three gsap` |
| Router (Home, About, Products, Testing, Projects, Gallery, Contact) | ⬜ | `react-router-dom` |
| Images copied from old site into `public/img/` | ⬜ | Products, gallery, projects, client logos, certificates |
| Header (sticky, blur) + scroll progress bar | ✅ | |
| Footer (full: contact, product links, downloads, certs) | 🟡 | Prototype footer is one line; full version per CONTENT.md |

---

## 1. HOME (`/`)
| # | Section | Status | What's in it / what's missing |
|---|---|---|---|
| 1.1 | **3D Exploded Hero** | 🟢 | Panel assembles on load, opens + explodes into 7 layers on scroll, labels, captions, HUD |
| 1.2 | Proof numbers (1989 · 80%+ · 65kA · 160 MVA) | 🟢 | Count-up on scroll |
| 1.3 | Statement (word fill) | ⛔ | Dropped at your request (too big, generic) |
| 1.4 | **Two business lines** (Panels / Testing Systems) | 🟢 | Pinned 3D turntable: MCC opens, scan ring rebuilds it as a transformer under test; copy + spec callouts per line (`LinesScene.tsx`, `linesMotion.ts`) |
| 1.5 | Product lineup | 🟢 | 5 featured products as a bento with real photos; full range on /products |
| 1.6 | Testing Suite | 🟢 | Light blueprint cutaway of a transformer; 5 test hotspots on the parts they check, pinned step-through, each links to /transformer-testing#<test> (test names TODO: CONFIRM) |
| 1.7 | **Why Electrosoft** (Quality · Delivery · Pricing · Tracking) | ⬜ | |
| 1.8 | **Featured projects** (MSEDCL, Tata Power, MCG, MCGM) | ⬜ | |
| 1.9 | Clients (tickers) | 🟡 | Names as text — swap for the 32 real logos |
| 1.10 | **Certifications & downloads** | 🟡 | Only cert chips in CTA — needs download list (7 PDFs + brochure) |
| 1.11 | **Track order** (project ID input) | ⬜ | ❓ Is tracking still used? |
| 1.12 | Contact CTA ("Let's build yours.") | ✅ | |

❓ Decide for Home:
- [ ] Keep all 12 sections, or drop some to keep it tight? (Suggested drop/merge: 1.7 into 1.2)
- [ ] Hero headline: "Power, engineered layer by layer." — keep or change?
- [ ] Brand color: send logo / hex (currently `#0B5BD3` blue)

---

## 2. PRODUCTS (`/products`)
| # | Section | Status | Note |
|---|---|---|---|
| 2.1 | Page hero | ⬜ | |
| 2.2 | Category filter (Automation · Power · Motors · Energy · Control · Service) | ⬜ | |
| 2.3 | Product detail blocks ×10 (photo, description, 3 key points) | ⬜ | Text ready in CONTENT.md |
| 2.4 | Services ×2 (Assembly & Wiring, Turnkey) | ⬜ | |
| 2.5 | "Request a quote for this product" CTA | ⬜ | |

❓ Decide: one long page with anchors, or a separate page per product?

---

## 3. TESTING SOLUTIONS (`/transformer-testing`)
| # | Section | Status | Note |
|---|---|---|---|
| 3.1 | Hero (Transformer Testing Suite + brochure button) | ⬜ | Could reuse 3D engine with a test-bench model |
| 3.2 | Three systems: Fully Auto · Semi Auto · Manual | 🟡 | Short version on Home; needs full detail |
| 3.3 | X'mer Prime™ software features | 🟡 | Window designed; feature list missing |
| 3.4 | **Tests supported + standards** | ❓ | Need list from company (IEC 60076 / IS 2026?) |
| 3.5 | Projects: MSEDCL, Tata Power, Crompton Greaves, Nucon | ⬜ | Full specs in CONTENT.md |
| 3.6 | Reactor & motor test benches | ❓ | Old site doesn't mention them — add? |

---

## 4. PROJECTS (`/projects`)
| # | Section | Status | Note |
|---|---|---|---|
| 4.1 | Hero | ⬜ | |
| 4.2 | Filter: All · Panels & Automation · Testing Systems | ⬜ | |
| 4.3 | Project cards ×8 (4 panel + 4 testing) | ⬜ | Photos exist on old site |
| 4.4 | Newer projects | ❓ | Ask company |

---

## 5. ABOUT (`/about`)
| # | Section | Status | Note |
|---|---|---|---|
| 5.1 | Story since 1989 | ⬜ | |
| 5.2 | How we work (process steps) | ❓ | Steps are in an image on old site — confirm |
| 5.3 | Infrastructure (office + workshop photos) | ⬜ | |
| 5.4 | Certifications | ⬜ | |
| 5.5 | Leadership / team | ❓ | Include or not? |

---

## 6. GALLERY (`/gallery`)
| # | Section | Status | Note |
|---|---|---|---|
| 6.1 | Tabs: Office · Workshop · Products | ⬜ | |
| 6.2 | Product filter (11 categories) | ⬜ | |
| 6.3 | Masonry grid + lightbox | ⬜ | ~22 images from old site |

---

## 7. CONTACT (`/contact`)
| # | Section | Status | Note |
|---|---|---|---|
| 7.1 | Quote form (Name, Company, Phone, Email, Requirement, Message) | ⬜ | ❓ Where do submissions go? (email service / WhatsApp / backend) |
| 7.2 | Address, phone, email | ⬜ | |
| 7.3 | Map | ⬜ | |
| 7.4 | Working hours | ❓ | |

---

## 8. Other
| Item | Status | Note |
|---|---|---|
| Track Order page/modal | ❓ | Depends on 1.11 decision |
| Privacy Policy | ⬜ | Copy from old site |
| 404 page | ⬜ | |
| Mobile check (every page at 390px) | ⬜ | |
| SEO: titles, meta, OG image | ⬜ | |
| Performance: 3D loads lazily, Lighthouse 90+ | ⬜ | |
| Deploy (domain electrosoftindia.com) | ⬜ | |

---

## Waiting on company
1. Logo file / brand colors
2. Real product photos (white or dark background)
3. Tests list + standards for testing systems
4. How-we-work steps
5. Newer projects
6. Is order tracking still used?
7. Where should quote-form submissions go?

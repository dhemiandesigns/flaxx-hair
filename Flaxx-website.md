# Flaxx Website — Continuity Record

> **Mandatory rule for every editor (human or AI):** If you make any change to this codebase — a bug fix, a copy update, a new product, a design tweak, a structural change, a deployment change, or a configuration change — you must update `Flaxx-website.md` before you commit or hand off the work. Record what changed, why it changed, what was verified, and what remains. A website change is not complete until this continuity record is current.

`Flaxx-website.md` is the canonical cross-chat handoff file. Every contributor must read it before editing and update it before finishing, whether the work was performed locally, in Codex, ChatGPT, Claude, GitHub, or another approved environment.

---

## What this is

Static HTML/CSS/JS website for **Flaxx Beauty Inc.** — a hair brand within the KRST (Kingdom Resource Stewardship) business ecosystem, founded by Demilade Adeniyi.

The website is a **product prototype** built to demonstrate the brand experience, the transparency/verification model, and the product catalogue ahead of launch. It is not yet connected to a live commerce backend.

**Live draft URL (ChatGPT-hosted):** `flaxx-hair-garden-draft.demidhemian.chatgpt.site`
**GitHub repo:** `github.com/dhemiandesigns/flaxx-hair`

---

## Platform context — read this before touching anything

Flaxx is **not on Shopify**. It does not use any third-party commerce platform. Flaxx runs on the **Creator's Framework** — a proprietary three-layer app (Creation / Formation / Dashboard) built by Demilade Adeniyi. Any references to Shopify, WooCommerce, or generic e-commerce platforms are wrong and should be removed.

The website you are looking at is a **front-end prototype only**. Backend integration with the Creator's Framework is a future phase.

---

## File structure

```
website-draft/
├── index.html          — single-page app shell; all views are rendered here
├── app.js              — all product data, routing logic, rendering functions
├── styles.css          — all styles (minified single file)
├── refinements.css     — additional style overrides (loaded separately)
├── assets/             — images, icons, logo SVG
├── dist/               — copy of the above; keep in sync with the source files
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── refinements.css
└── Flaxx-website.md    — mandatory continuity record
```

**Important:** `dist/` must always mirror the source. When you edit `app.js` or `styles.css`, copy the updated file into `dist/` as well. They are kept in sync manually.

---

## Brand and design rules

- **Typeface:** Aeonik — the only typeface used across the entire site. No substitutions.
- **Colours:**
  - Black `#0A0A0A` — primary text, backgrounds
  - Gold `#A87E18` — accent, verification highlights
  - Cream `#F7F3EE` — soft background
  - Stone `#7A6E62` — muted text, secondary labels
  - White `#FFFFFF` — light surfaces
  - Amber `#92400E` — Grade 2 warning states (reserved)
- **Design principle:** The website must stay minimal and clean. Grade badges, verification labels, and quality data should not clutter the product page. Grade information lives inside the Verification accordion — not as standalone page elements.

---

## Product catalogue (current state)

All products live in the `products` array in `app.js` (line 2 onward).

| Product | Status | Batch | Tag shown |
|---|---|---|---|
| Shade Comfort | Released | FH-20261025-001 | `G3` |
| Maya Silk | Pending | — | `Verification pending` |
| Amara Curl | Pending | — | `Verification pending` |
| Elise Copper | Pending | — | `Verification pending` |

**Shade Comfort** is the only product with a released batch record. It is Grade 3 under the conformance model (see below).

---

## The Flaxx Grade / Conformance Model

**This is the most important concept to understand before editing any quality or verification content.**

The grade is **not a product tier**. It is a **conformance score** — how closely a batch matches the approved benchmark for that product.

| Grade | Meaning | Action |
|---|---|---|
| Grade 4 | Exemplary — exceeds benchmark | Ships; supplier eligible for premium recognition |
| Grade 3 | Target — meets benchmark | Ships at standard price (this is what every order aims for) |
| Grade 2 | Below target — conditional | Option A: return to supplier at their cost. Option B: sell at disclosed discount (supplier absorbs 60% of markdown, Flaxx 40%) |
| Grade 1 | Rejected — never ships | 100% supplier cost; batch is destroyed or returned |

**Approved Benchmark:** The first inspected and approved batch of a product sets the reference. All subsequent batches are graded against it. The benchmark record lives in the Flaxx Specification Record (internal document, not in this codebase).

**Critical vs Secondary criteria:**
- Critical (burn test, cuticle alignment, weight, length): Grade 1 on any single criterion = immediate batch rejection regardless of other scores
- Secondary (shedding, tangle, colour): Grade 2 possible on these without an automatic reject

**Supplier escalation:** 2 consecutive Grade 2 batches = formal review. 3 consecutive = potential termination (30-day notice).

### Grade thresholds per criterion (Shade Comfort reference)

| Criterion | Grade 4 | Grade 3 | Grade 2 | Grade 1 |
|---|---|---|---|---|
| Shedding | 0–1 strands | 2–5 strands | 6–10 strands | 11+ strands |
| Weight | ±3% of benchmark | ±8% | ±12% | >±12% |
| Length | ±3% of stated | ±8% | ±12% | >±12% |

---

## Verification panel (UX)

The verification detail lives **only** inside the `<details>` accordion under "Verification" on the product page. It does **not** appear as a separate section on the product page above the fold.

**Product card badge:** Shows only the grade code (e.g. `G3`) as a small square chip — top-left of the card image. It must not be large or distracting.

**Inside the verification panel, a released batch shows:**
- Grade code + one-line meaning
- Inspection date
- Released date
- Criteria list with exact measurements (so customers can see the numbers, not just pass/fail)
- Release status pill

**Grade 2 disclosure rule:** If a batch is Grade 2 and released under Option B, the verification panel must clearly show which criterion fell short and by how much. This is a transparency commitment — not optional.

---

## Views / routing

The site is a single-page app. Views are shown/hidden by adding/removing the `active` class. Routing is handled by `data-route` attributes on buttons and the `navigate()` function in `app.js`.

| Route key | View shown |
|---|---|
| `home` | Hero + product grid + editorial sections |
| `shop` | Full product collection |
| `product` | Individual product page (set by `data-product-index`) |
| `verify` | "What verified means" editorial page |
| `fit` | "Find your fit" page |
| `garden` | Flaxx Garden (community/waitlist) |

---

## What has been built (as of October 2026)

- Full single-page site with all views
- Product grid with 4 products
- Product detail page with gallery, options, accordion details, and verification panel
- Verification record panel (batch data, criteria, release status)
- Grade conformance model implemented for Shade Comfort (Grade 3)
- "What verified means" editorial page
- Cart drawer (UI only — no backend)
- Dark mode toggle
- Mobile-responsive layout
- `Flaxx-website.md` continuity record (this file)

---

## What is not yet built / known gaps

- [ ] Backend connection to Creator's Framework (commerce, orders, auth)
- [ ] Batch records for Maya Silk, Amara Curl, Elise Copper
- [ ] Actual product images (current images are placeholder/prototype assets)
- [ ] Checkout flow (UI shell exists in cart drawer but no payment integration)
- [ ] "Find your fit" page — content placeholder only
- [ ] Flaxx Garden page — email capture form (UI exists, no backend)
- [ ] Grade 2 disclosure UI (amber warning state) — defined in spec, not yet triggered
- [ ] GitHub Pages deployment setup

---

## How to deploy

This is a static site. Any static host works (GitHub Pages, Netlify, Vercel, etc.).

**To deploy via GitHub Pages:**
1. Go to the repo Settings → Pages
2. Set source to `main` branch, root `/` (or `/dist` if serving from dist)
3. The site will be live at `https://dhemiandesigns.github.io/flaxx-hair`

**To deploy the ChatGPT-hosted version:** Update the code in the ChatGPT canvas project and republish. Note: the ChatGPT-hosted version and this repo may diverge — this repo is the source of truth.

---

## Key documents (outside this repo)

These documents live in the KRST Formation Framework (F-series), not in this codebase:

- **FH-QS v2.0** — Flaxx Hair Quality Standard (conformance model, grade thresholds, inspection protocol, supplier disposition terms)
- **F1 Identity Expression Record** — Flaxx Brand Strategy document
- **F2 Spring Forecast** — Investor-grade financial model for Flaxx Beauty Inc.
- **F3 First Steward Standard** — Quality document home within the KRST framework

---

## Continuity log

| Date | Editor | What changed | What's next |
|---|---|---|---|
| Oct 2026 | ChatGPT | Initial website prototype built | — |
| Oct 2026 | Claude (Cowork) | Grade model rebuilt — conformance not tier. Shade Comfort updated to Grade 3. Batch criteria updated with measurements. `.verified-badge` restyled to compact chip. Continuity record created. | Batch records for remaining 3 products; GitHub Pages setup; Creator's Framework backend integration |
| 8 Oct 2026 | Codex | Prepared the complete current local website for the canonical `dhemiandesigns/flaxx-hair` repository; renamed the continuity record to `Flaxx-website.md`; made its update mandatory before every commit or handoff; verified all six backend policy tests. | Push the prepared commit; configure the chosen deployment route; continue recording every later website change here. |

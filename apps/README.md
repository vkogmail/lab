# Lab apps

Each folder is a standalone experiment. Portfolio copy and demo URLs live in **`lab.card.json`** (fed to [vincentkoopmans.nl](https://vincentkoopmans.nl) via root `lab-cards.json`).

## README rules (public GitHub)

`apps/{slug}/README.md` is for **people cloning the repo to read or run the code**. Write for that audience — not for your portfolio deploy workflow.

**Include**

- One-line description of what the code does
- **`## Run`** (or `## Run in Figma` / `## Run in Framer`) with `npm install` and the dev command
- Optional **`## Layout`** or **`## How it works`** — paths to the interesting source files

**Do not put in app READMEs**

- Vercel deploy URLs or “deploys to …”
- `preview:landing`, marketing-page, or iframe landing instructions
- Portfolio screenshot workflows (`showcase/`, `LAB-SHOWCASE.md`, `build-lab.mjs`)
- “Originally for vincentkoopmans.nl” / portfolio extraction notes
- Long anonymization essays (one short line is enough if names are placeholders)

Portfolio metadata, hero images, and showcase capture stay **local** (`LAB-SHOWCASE.md`, `apps/{slug}/showcase/` — gitignored on push).

## Landing shell vs source code

Public GitHub is for **experiment source**. Some files only exist to serve the live demo URL on Vercel — cloners can ignore them.

| Kind | Examples | On public GitHub? |
|------|----------|-------------------|
| **Plugin source** | `code.js`, `ui.html`, `manifest.json`, `src/` | Yes — start here |
| **Web demo source** | `main.js`, `public/js/app.js`, `src/` | Yes |
| **Marketing landing** | `index.html` / `landing.html`, `public/hero.jpg` inside app dirs | **No** — generated at build; source in [`apps/_landing/`](../_landing/) |
| **Lab chrome** | `public/brand/*` | Yes (vendored) — shared header/theme on live demos |
| **Portfolio ops** | `showcase/`, `publish/` | No — local only |

**Figma / Framer plugins:** load `manifest.json` in the host app. Landing HTML is built from `apps/_landing/` on deploy.

**Web demos:** experiment logic is in `main.js`, `src/`, or `public/js/` — not in `_landing/`.

**Change landing copy or hero:** edit `apps/_landing/content/{slug}.json` and `apps/_landing/heroes/{slug}.jpg`, push, redeploy.

**New app:** copy [`README.template.md`](./README.template.md) → `apps/{slug}/README.md`, then fill in. `npm run build:cards` fails if README breaks these rules.

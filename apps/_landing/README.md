# Plugin landing deploy bundle

Marketing pages for **Figma / Framer plugin demos** on Vercel. Kept outside `apps/{slug}/` so those folders stay plugin source only.

| Path | Role |
|------|------|
| `shell.html` | HTML template |
| `build-plugin-landing.mjs` | Run from app dir on `prebuild`; writes `index.html` or `landing.html` |
| `content/{slug}.json` | Landing copy (headline, aside bullets, modal sections) |
| `heroes/{slug}.jpg` | Hero photo copied into `public/hero.jpg` at build time |

Generated inside each plugin app (gitignored): `index.html` / `landing.html`, `public/hero.jpg`.

Vercel runs `npm run build` → `prebuild` → landing builder → Vite → `dist/`.

Edit copy or hero here, push, redeploy — plugin folders (`code.js`, `ui.html`, `src/`) stay unchanged.

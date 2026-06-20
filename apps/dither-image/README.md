# Dither image

Theme-aware ordered dithering: rebuilds a photo as a Bayer 4×4 dot grid that recolors with `data-theme` (light/dark).

## Run

```bash
npm install
npm run dev
```

## Layout

| File | Role |
|------|------|
| `main.js` | Canvas pipeline: offscreen processing, main canvas render |
| `index.html` | Demo page |
| `style.css` | Layout and theme hooks |

Recalculates dot density on window resize. No framework — Canvas API + Vite.

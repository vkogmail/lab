# Background shade

Extracts a dominant hue from an image and builds a perceptually balanced OKLCH color scale, exposed as CSS design tokens.

## Run

```bash
npm install
npm run dev:all
```

- `npm run dev` — Express server with live reload (`server.js`, port 3000 by default)
- `npm run tokens:watch` — rebuild Style Dictionary output when token JSON changes

Or run them separately: `npm run dev` and `npm run tokens`.

## Layout

```
public/
├── js/app.js           # UI and image upload flow
├── lib/colorManager.js # OKLCH scale generation
├── styles/tokens.css   # Generated CSS variables
└── tokens/             # Style Dictionary source JSON
server.js               # Express static server + API
sd.config.mjs           # Style Dictionary config
```

## How it works

1. Client samples the uploaded image and picks a vibrant accent (filters pure white/black/gray).
2. `colorManager.js` builds an OKLCH ramp and writes CSS custom properties.
3. Style Dictionary keeps `public/tokens/` as the source of truth; `npm run tokens` emits `public/styles/tokens.css`.

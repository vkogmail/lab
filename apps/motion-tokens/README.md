# Motion tokens

Multi-brand motion token demo: easing, duration, and delay as named tokens, with live previews (bookshelf, cards, bezier editor).

Brand names in the repo are anonymized placeholders (e.g. AeroGlobal, BrandA).

## Run

```bash
npm install
npm run dev
```

Starts Vite on the frontend and a small Express server (`src/server.ts`) for token/build helpers. Open the URL Vite prints (typically `http://localhost:5173`).

## Tokens

Source JSON lives in `src/tokens/Origin/Source/`. Regenerate TypeScript output:

```bash
npm run tokens
```

`npm run dev` watches token files and rebuilds automatically.

## Layout

| Path | Role |
|------|------|
| `src/tokens/Origin/` | Tokens Studio source JSON |
| `src/tokens/generated/` | Generated motion token module |
| `src/components/motion/` | Token provider, hooks, toggles |
| `src/components/Bookshelf.tsx` | Motion preview by audience |
| `build-tokens.js` | Style Dictionary → TS |
| `src/server.ts` | Local API for build/status checks |

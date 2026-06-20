# Framer token sync

Framer plugin that pulls Tokens Studio JSON from GitHub and maps values onto canvas layers or Framer variable collections.

## Run in Framer

```bash
npm install
npm run dev
```

Opens the plugin in Framer’s dev shell (Framer desktop required).

## Build

```bash
npm run build
npm run preview
```

Produces a static build in `dist/` for local preview outside Framer.

## Layout

| Path | Role |
|------|------|
| `src/` | Plugin UI and sync logic |
| `src/tokens/` | Sample Tokens Studio JSON |
| `src/services/github.ts` | GitHub fetch |
| `src/services/tokenNodeManager.ts` | Apply tokens to Framer nodes / variables |

# Token sync (Figma ↔ Git)

Figma plugin for two-way sync between Figma variables/styles and a Git token repo (Tokens Studio JSON).

## Run in Figma

1. `npm install`
2. In Figma: **Plugins → Development → Import plugin from manifest…** → select `manifest.json`
3. Run the plugin on a file

Plugin code: `code.js` (main) · `ui.html` (panel UI)

Before dev/build, `inline-ui-css.mjs` inlines `plugin-ui.css` into `ui.html`.

## Configure

In the plugin settings tab:

- Git provider (GitHub or Azure DevOps)
- Workspace, project, repository
- Personal access token with repo read/write

Connection settings live in `figma.clientStorage` on your machine only.

## Sync behaviour

- **Pull** — read token JSON from the configured branch; create or update Figma variable collections, modes, and styles via `$themes.json`
- **Push** — export Figma changes back to JSON and open a pull request (no direct writes to `main`)
- **Diff** — three-way compare (repo, Figma, conflicts) before apply

Typography and box-shadow composites map to native Figma text and effect styles.

## Build

```bash
npm run build
npm run preview
```

Static Vite build of the landing shell in `dist/` (plugin logic still runs inside Figma).

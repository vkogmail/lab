# Dither head — temp sandbox

**Not wired into the lab card manifest.** Local-only test bed for a 3D bust with the **same CPU dither loop as the portfolio homepage hero** (`hero-dither-cpu.js` ports `renderDither()` from `index.html`). Offscreen Three.js renders the GLB each frame; pixels run through Bayer dither + hero burst scatter behind the bust ellipse.

## Run

```bash
cd apps/dither-head-temp
npm install
npm run dev
```

Open the URL Vite prints. Drop `head.glb` in `public/models/` (gitignored) — without it the scene is empty.

## What Vincent provides

You have two paths — pick one:

| Path | You give us | Result |
|------|-------------|--------|
| **A — one photo** | Single portrait JPG (even a crop of `vincent.jpg`) | AI mesh via free HF Space or local TripoSR → GLB |
| **B — mesh** | Ready `head.glb` | Drop in folder, reload |

**Skip the iOS scan apps.** See **`LOCAL-RECON.md`** for free paths (HF Spaces = no credits, RealityScan desktop, local TripoSR).

Multi-photo photogrammetry (`CAPTURE.md`) only if you want higher fidelity later.

## Drop zones

```
public/models/head.glb     ← final mesh (gitignored — your face stays local)
public/captures/           ← raw photos while testing (gitignored)
```

## Mobile / GPU

Watch the **fps** counter bottom-right on your phone over Wi‑Fi (`vite --host`). Target ~30fps+. If it's sluggish, we'll decimate the mesh or lower pixel ratio.

## Status

**Almost done.** Homepage-style bursts + light/dark tonality match closely at ~60fps with the sculpture GLB. Remaining polish: burst strength, framing, mobile pass, optional lab card / portfolio integration.

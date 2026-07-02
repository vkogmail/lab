# Cursor-tracking 3D dither bust

A 3D bust rendered offscreen each frame, then rebuilt as 4×4 Bayer ordered dots that recolor with the lab theme. The mesh tracks your cursor with spring easing; drag to override, release to resume.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. The demo ships with a classical bust GLB in `public/models/bust.glb`.

## Layout

| Path | Role |
|------|------|
| `main.js` | Three.js scene, cursor/drag rotation, offscreen render loop |
| `hero-dither-cpu.js` | CPU Bayer dither pass (same algorithm as the portfolio homepage hero) |
| `public/models/bust.glb` | Sample mesh for the live demo |

## How it works

- WebGL renders the GLB to a low-res offscreen buffer each frame
- `readPixels` feeds the CPU dither loop (Bayer threshold + hero burst scatter on clear pixels)
- Yaw/pitch hinge at the neck; desktop pointer position drives look-at with spring lag
- Auto-rotate resumes after idle; reduced motion disables tracking and spin

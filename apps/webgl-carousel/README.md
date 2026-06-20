# WebGL carousel

WebGL carousel with warp, progressive blur, and chromatic aberration in the fragment shader. DOM cards are rasterized to textures via `modern-screenshot`.

## Run

```bash
npm install
npm run dev
```

## Layout

| File | Role |
|------|------|
| `main.js` | Carousel logic, texture upload, animation loop |
| `ogl.js` | OGL scene, meshes, shaders |
| `modern-screenshot.js` | DOM → bitmap for WebGL textures |
| `index.html` | Card markup the carousel rasterizes |

Built with Vite, OGL, and vanilla JS.

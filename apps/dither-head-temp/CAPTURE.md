# Face capture guide (for 3D reconstruction)

Yes — **photos → offline reconstruction → GLB → this demo**. The browser never builds the mesh from photos; that happens on your Mac first.

## Quick option (fastest)

Use any scanner app you already trust (Polycam, Kiri Engine, RealityScan, etc.), export **GLB**, save as:

```
public/models/head.glb
```

Reload the dev server. Done.

## Open-source option (16 photos)

If you want the VGGTFace route ([grignarder/vggtface](https://github.com/grignarder/vggtface)):

### Shoot **16 photos**

- Plain background (wall / sheet)
- Soft, even light — window light or two lamps, no harsh shadow under nose
- **Same expression** in every shot (neutral, mouth closed works best)
- Phone portrait mode off; tap to focus on eyes
- Remove glasses if they flare

### Angles (one full orbit + slight up/down)

Stand still; rotate **your head** or walk around yourself:

1. Front  
2. Front-left ~22°  
3. Front-left ~45°  
4. Left profile  
5. Back-left ~135°  
6–8. Continue around (back of head optional — hair is hard anyway)  
9. Front-right ~22°  
10. Front-right ~45°  
11. Right profile  
12. Slight chin down (front)  
13. Slight chin up (front)  
14–16. Fill gaps so every angle has overlap with neighbors  

Save as JPG/HEIC into:

```
public/captures/
```

Name them `01.jpg` … `16.jpg` if you like order.

### Reconstruct (on your Mac, not in this repo)

1. Clone + set up VGGTFace (or use Meshroom if you prefer 40+ photos)  
2. Preprocess the 16 images  
3. Export `result.ply`  
4. Blender: clean mesh → **Decimate** to ~50k–100k tris → **Export GLB**  
5. Copy to `public/models/head.glb`

## What to send back

Either:

- **`head.glb`** only (preferred), or  
- **`public/captures/`** folder (zip) if you want help running reconstruction

Your photos and GLB are **gitignored** — they won't be committed.

## Quality bar

Good enough for dither if:

- Silhouette reads as you at a glance  
- Nose/lips aren't melted  
- No huge holes in cheeks  

Halftone hides a lot — don't chase perfection.

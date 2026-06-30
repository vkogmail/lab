# Local reconstruction — no iOS apps, no HF credits

The dither demo only needs a **`head.glb`**. How you get there is up to you. Ranked by effort.

---

## 1. Free Hugging Face **Space** (browser, $0)

**Not** the Inference API (that burns credits). Use a public Space — it runs on their hardware, not yours:

| Space | Input | Export |
|-------|-------|--------|
| [TencentARC/InstantMesh](https://huggingface.co/spaces/TencentARC/InstantMesh) | 1 photo | OBJ → convert to GLB in Blender |
| [stabilityai/TripoSR](https://huggingface.co/spaces/stabilityai/TripoSR) | 1 photo | mesh download |

**Tips:**
- Use a **plain background** portrait (shoulders up). Run through [remove.bg](https://www.remove.bg) first if needed.
- Faces are not these models' strength — but **halftone dither hides a lot**.
- Export → Blender → Export GLB → save as `public/models/head.glb`

Queue times vary; still cheaper than credits.

---

## 2. One photo → TripoSR on your Mac (offline, $0)

No scan app. One JPG is enough for a **test bust** (not photogrammetry-quality).

```bash
# one-time setup (~5 GB download)
git clone https://github.com/VAST-AI-Research/TripoSR.git ~/Tools/TripoSR
cd ~/Tools/TripoSR
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade setuptools
pip install torch torchvision
pip install -r requirements.txt

# run (CPU on Mac is fine, ~30–90 s)
python run.py /path/to/portrait.jpg --output-dir ./output --bake-texture
```

Find the mesh in `output/`, convert to GLB if needed (Blender or `pip install trimesh` + `mesh.export('head.glb')`).

**Good first input:** a tight crop of `assets/vincent.jpg` from the portfolio — proves the pipeline before you shoot again.

---

## 3. RealityScan **desktop** (Epic, free)

Better than the iOS apps for photogrammetry:

1. Install [RealityScan desktop](https://www.unrealengine.com/en-US/realityscan) (Mac or Windows)
2. Transfer 30–50 phone photos via AirDrop (same orbit as CAPTURE.md)
3. Process on desktop → export OBJ/GLB
4. Drop in `public/models/head.glb`

Slower than one-photo AI, but actual geometry from real angles.

---

## 4. Meshroom (open source, patient)

Full photogrammetry. [alicevision.org](https://alicevision.org/) — drag photos in, wait, export mesh, decimate in Blender.

Best quality of the free options; worst UX.

---

## What **not** to bother with

- iOS LiDAR / scan apps with paywalled exports
- HF Inference API / endpoints (uses credits)
- VGGTFace unless you already have a CUDA machine — overkill for a dither test

---

## Drop zone (unchanged)

```
public/models/head.glb    ← only file the demo reads
```

Photos optional. **One good portrait is enough to start.**

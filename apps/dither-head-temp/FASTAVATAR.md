# FastAvatar pipeline (recommended for faces)

[FastAvatar](https://github.com/hliang2/FastAvatar) is **the right class of tool** for this: one portrait in → full-head 3D out, built for faces (unlike TripoSR/InstantMesh).

**Project page:** [hliang2.github.io/FastAvatar](https://hliang2.github.io/FastAvatar/)

---

## Can we use it? Yes, with two caveats

| | FastAvatar | Our temp demo today |
|---|-----------|---------------------|
| **Input** | ✅ 1 photo, any pose | — |
| **Run on your Mac** | ❌ Needs **CUDA 12.1+** (NVIDIA) | ✅ WebGL in browser |
| **Output** | `splats.ply` (Gaussian splats) | expects `head.glb` (triangle mesh) |

So: **inference happens elsewhere** (Colab T4, cloud GPU, or a machine with NVIDIA). The **dither viewer** can stay on your Mac once we have a file to load.

No Hugging Face credits needed if you run on [Google Colab free T4](https://colab.research.google.com) with the official repo.

---

## Workflow

### 1. You — one portrait

Same as before: plain background, shoulders up, neutral expression. Drop in `public/captures/portrait.jpg`.

### 2. Inference — Colab or CUDA machine (one-time ~10 min setup)

```bash
git clone https://github.com/hliang2/FastAvatar.git
cd FastAvatar
conda create -n fastavatar python=3.10 -y && conda activate fastavatar
pip install torch==2.1.0+cu121 torchvision==0.16.0+cu121 --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
# Download pretrained_weights/ from the link in the repo README

python scripts/inference_feedforward_no_guidance.py \
  --image /path/to/portrait.jpg \
  --encoder_checkpoint pretrained_weights/encoder_neutral_flame.pth \
  --decoder_checkpoint pretrained_weights/decoder_neutral_flame.pth \
  --dino_checkpoint pretrained_weights/dino_encoder.pth
```

Output lands in `results/…/splats.ply`.

**Optional quality bump:** `inference_feedforward_full_guidance.py` (~3 s refine on A100; slower on T4).

### 3. Bring output into the demo

Two options:

| Option | File | Demo change |
|--------|------|-------------|
| **A — splats (best quality)** | `public/models/head.ply` | Add Gaussian splat viewer + same dither post-process |
| **B — mesh (works now)** | `public/models/head.glb` | Convert splats → mesh in Blender, use current GLB loader |

Option A is the right end state (FastAvatar is meant to be viewed as splats). Option B is a quick hack if you want to test dither on mesh first.

---

## Dither still works

The Bayer pass runs on **whatever the GPU renders** — mesh or splats. We only need to swap the loader, not the shader.

---

## Things to know

- **Dataset bias** — the authors warn quality varies by demographics ([README disclaimer](https://github.com/hliang2/FastAvatar)). Test on your photo before investing in viewer work.
- **Not GLB-native** — no direct export; splats or mesh conversion required.
- **Consent** — face reconstruction; keep files local (already gitignored).

---

## What to send back

After Colab run, copy **one** of:

```
public/models/head.ply    ← preferred (splat)
public/models/head.glb    ← if you converted in Blender
```

Tell us which path you used — we'll wire the viewer accordingly.

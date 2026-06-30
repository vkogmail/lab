import * as THREE from 'three';

/**
 * Homepage hero dither — literal port of index.html renderDither inner loop.
 * `imageData` = RGBA from the WebGL bust render (replaces vincent.jpg).
 */
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) =>
    r.map((v) => (v + 0.5) / 16),
);

function hsh(x, y) {
    return Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453) % 1;
}

function smoothKeep(t) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
}

function parseInkRgb(inkCss) {
    if (typeof document !== 'undefined') {
        const tmp = document.createElement('canvas');
        tmp.width = 1;
        tmp.height = 1;
        const ctx = tmp.getContext('2d');
        ctx.fillStyle = inkCss;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
    }
    return [158, 240, 176];
}

/**
 * @param {Uint8ClampedArray} src RGBA from WebGL readRenderTargetPixels
 * @param {number} cw width
 * @param {number} ch height
 * @param {object} opts
 * @returns {Uint8ClampedArray} RGBA output (cw × ch)
 */
export function ditherHeroFrame(src, cw, ch, opts) {
    const {
        isLight = false,
        inkCss = '#9ef0b0',
        bgRgb = [12, 12, 13],
        contrast = isLight ? 1.22 : 1.25,
        dotAlpha = isLight ? 0.8 : 0.88,
        heroBurst = true,
        fcx = 0.5,
        fcy = isLight ? 0.4 : 0.36,
        frx = 0.3,
        fry = 0.34,
        bottomFade = 0,
        bottomStart = 0.1,
        bottomSoft = 0.22,
        scale = 1,
    } = opts;

    const INK = parseInkRgb(inkCss);
    const outW = cw * scale;
    const outH = ch * scale;
    const out = new Uint8ClampedArray(outW * outH * 4);

    for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
            const i = (y * cw + x) * 4;
            let g = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255;
            g = Math.min(1, Math.max(0, (g - 0.5) * contrast + 0.5));

            const ny = 1 - (y + 0.5) / ch;
            if (bottomFade > 0.001) {
                const subject = Math.min(1, Math.max(0, (g - 0.05) / 0.09));
                const t = Math.min(1, Math.max(0, (ny - bottomStart) / bottomSoft));
                const keep = smoothKeep(t);
                if (keep < 1) {
                    const gate = keep + (1 - keep) * (1 - bottomFade * subject);
                    if (hsh(x, y) > gate) {
                        for (let sy = 0; sy < scale; sy++) {
                            for (let sx = 0; sx < scale; sx++) {
                                const oi = ((y * scale + sy) * outW + (x * scale + sx)) * 4;
                                out[oi] = bgRgb[0];
                                out[oi + 1] = bgRgb[1];
                                out[oi + 2] = bgRgb[2];
                                out[oi + 3] = 255;
                            }
                        }
                        continue;
                    }
                    g *= keep + (1 - keep) * (1 - bottomFade * subject);
                }
            }

            let cov = isLight ? 1 - g : g;

            const nx = (x + 0.5) / cw;
            const ny2 = (y + 0.5) / ch;
            const ddx = (nx - fcx) / frx;
            const ddy = (ny2 - fcy) / fry;
            const faceDist = Math.sqrt(ddx * ddx + ddy * ddy);

            if (heroBurst && isLight) {
                const lwob = 0.5 + 0.5 * Math.sin(nx * 13.0 + ny2 * 7.0) * Math.cos(ny2 * 9.0 - nx * 4.0);
                const reach = 1.3 + Math.max(0, nx - fcx) * 2.4;
                const tc = Math.min(1, Math.max(0, (faceDist - 0.85) / 0.45));
                const core = 1 - smoothKeep(tc);
                const tt = Math.min(1, Math.max(0, (faceDist - 1.1) / (reach - 1.1)));
                const tail = (1 - smoothKeep(tt)) * (0.28 + 0.5 * lwob);
                cov *= Math.max(core, tail);
            }

            let ink = false;

            if (cov > B4[y % 4][x % 4]) {
                let skip = false;
                if (heroBurst) {
                    if (faceDist > 1) {
                        const rightBias = Math.max(0, nx - fcx);
                        const falloff = 0.5 + rightBias * 1.9;
                        const tv = Math.min(1, (faceDist - 1) / falloff);
                        const keep = 1 - smoothKeep(tv);
                        if (!isLight && keep < 1 && hsh(x, y) > keep) skip = true;
                    }
                    if (!skip && !isLight) {
                        const sV = y / ch;
                        if (sV > 0.84) {
                            const keepB = 1 - (sV - 0.84) / 0.16;
                            if (hsh(x, y) > keepB) skip = true;
                        }
                    }
                }
                if (!skip) ink = true;
            } else if (heroBurst && !isLight) {
                let keep = 1;
                if (faceDist > 1) {
                    const rightBias = Math.max(0, nx - fcx);
                    const falloff = 0.5 + rightBias * 1.9;
                    const tv = Math.min(1, (faceDist - 1) / falloff);
                    keep = 1 - smoothKeep(tv);
                }
                const wob = 0.5 + 0.5 * Math.sin(nx * 13.0 + ny2 * 7.0) * Math.cos(ny2 * 9.0 - nx * 4.0);
                const present = (1 - g) * keep * (0.04 + 0.24 * wob);
                if (present > B4[y % 4][x % 4]) ink = true;
            }

            const r = ink ? INK[0] : bgRgb[0];
            const gOut = ink ? INK[1] : bgRgb[1];
            const bOut = ink ? INK[2] : bgRgb[2];
            const a = ink ? Math.round(255 * dotAlpha) + Math.round(bgRgb[0] * (1 - dotAlpha)) : bgRgb[0];

            for (let sy = 0; sy < scale; sy++) {
                for (let sx = 0; sx < scale; sx++) {
                    const oi = ((y * scale + sy) * outW + (x * scale + sx)) * 4;
                    if (ink) {
                        out[oi] = Math.round(r * dotAlpha + bgRgb[0] * (1 - dotAlpha));
                        out[oi + 1] = Math.round(gOut * dotAlpha + bgRgb[1] * (1 - dotAlpha));
                        out[oi + 2] = Math.round(bOut * dotAlpha + bgRgb[2] * (1 - dotAlpha));
                    } else {
                        out[oi] = bgRgb[0];
                        out[oi + 1] = bgRgb[1];
                        out[oi + 2] = bgRgb[2];
                    }
                    out[oi + 3] = 255;
                }
            }
        }
    }

    return out;
}

export function updateSubjectBounds(object, camera) {
    if (!object) return null;
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];
    const v = new THREE.Vector3();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of corners) {
        v.copy(c).project(camera);
        if (v.z > 1) continue;
        minX = Math.min(minX, v.x * 0.5 + 0.5);
        maxX = Math.max(maxX, v.x * 0.5 + 0.5);
        minY = Math.min(minY, -v.y * 0.5 + 0.5);
        maxY = Math.max(maxY, -v.y * 0.5 + 0.5);
    }
    if (!Number.isFinite(minX)) return null;
    return {
        fcx: (minX + maxX) * 0.5,
        fcy: (minY + maxY) * 0.5,
        frx: Math.max(0.3, (maxX - minX) * 0.52),
        fry: Math.max(0.34, (maxY - minY) * 0.52),
    };
}

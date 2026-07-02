/**
 * CPU Bayer dither — shared loop for the 3D bust render path.
 * Burst uses fixed ellipse (fcx 0.40). `matchPhoto` mirrors portfolio homepage desktop.
 */

const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) =>
    r.map((v) => (v + 0.5) / 16),
);

const BURST_FCX = 0.4;
const BURST_FRX = 0.3;
const BURST_FRY = 0.34;

function burstFcy(isLight) {
    return isLight ? 0.4 : 0.36;
}

function hsh(x, y) {
    return Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453) % 1;
}

function smoothKeep(t) {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
}

function burstDist(nx, ny, isLight) {
    const ddx = (nx - BURST_FCX) / BURST_FRX;
    const ddy = (ny - burstFcy(isLight)) / BURST_FRY;
    return Math.sqrt(ddx * ddx + ddy * ddy);
}

function lightBurstHalo(nx, ny, isLight) {
    const fd = burstDist(nx, ny, isLight);
    const lwob = 0.5 + 0.5 * Math.sin(nx * 13.0 + ny * 7.0) * Math.cos(ny * 9.0 - nx * 4.0);
    const reach = 1.3 + Math.max(0, nx - BURST_FCX) * 2.4;
    const tc = Math.min(1, Math.max(0, (fd - 0.85) / 0.45));
    const core = 1 - smoothKeep(tc);
    const tt = Math.min(1, Math.max(0, (fd - 1.1) / (reach - 1.1)));
    const tail = (1 - smoothKeep(tt)) * (0.28 + 0.5 * lwob);
    return Math.max(core, tail);
}

function burstKeepOutside(nx, ny, fd) {
    if (fd <= 1) return 1;
    const rightBias = Math.max(0, nx - BURST_FCX);
    const falloff = 0.5 + rightBias * 1.9;
    const tv = Math.min(1, (fd - 1) / falloff);
    return 1 - smoothKeep(tv);
}

function isBgPixel(src, i, bgRgb, tolerance = 24) {
    const dr = src[i] - bgRgb[0];
    const dg = src[i + 1] - bgRgb[1];
    const db = src[i + 2] - bgRgb[2];
    return dr * dr + dg * dg + db * db <= tolerance * tolerance;
}

function parseInkRgb(inkCss) {
    const tmp = document.createElement('canvas');
    tmp.width = 1;
    tmp.height = 1;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = inkCss;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
}

export function ditherHeroFrame(src, cw, ch, opts) {
    const {
        isLight = false,
        inkCss = '#9ef0b0',
        bgRgb = [12, 12, 13],
        contrast = isLight ? 1.22 : 1.25,
        dotAlpha = isLight ? 0.8 : 0.88,
        heroBurst = true,
        matchPhoto = false,
        bottomFade = 0,
        bottomStart = 0.1,
        bottomSoft = 0.22,
        scale = 1,
        transparentBg = false,
        bottomCullStart = 0.84,
        bottomCullSoft = 0.16,
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
                                if (transparentBg) {
                                    out[oi + 3] = 0;
                                } else {
                                    out[oi] = bgRgb[0];
                                    out[oi + 1] = bgRgb[1];
                                    out[oi + 2] = bgRgb[2];
                                    out[oi + 3] = 255;
                                }
                            }
                        }
                        continue;
                    }
                    g *= keep + (1 - keep) * (1 - bottomFade * subject);
                }
            }

            const nx = (x + 0.5) / cw;
            const ny2 = (y + 0.5) / ch;
            const bgLike = isBgPixel(src, i, bgRgb);
            const fd = burstDist(nx, ny2, isLight);
            const halo = lightBurstHalo(nx, ny2, isLight);

            let cov = isLight ? 1 - g : g;
            if (heroBurst && isLight) {
                if (matchPhoto) {
                    cov = bgLike ? halo : cov * halo;
                } else if (bgLike) {
                    cov = halo;
                }
            }

            let ink = false;

            if (cov > B4[y % 4][x % 4]) {
                let skip = false;
                if (heroBurst) {
                    const usePhotoCull = matchPhoto || bgLike;
                    if (usePhotoCull && !isLight && fd > 1) {
                        const keep = burstKeepOutside(nx, ny2, fd);
                        if (keep < 1 && hsh(x, y) > keep) skip = true;
                    }
                    if (!skip && !isLight && (matchPhoto || bgLike)) {
                        const sV = y / ch;
                        if (bottomCullStart < 1 && sV > bottomCullStart) {
                            const keepB = 1 - (sV - bottomCullStart) / bottomCullSoft;
                            if (hsh(x, y) > keepB) skip = true;
                        }
                    }
                }
                if (!skip) ink = true;
            } else if (heroBurst && !isLight && (matchPhoto || bgLike)) {
                const keep = burstKeepOutside(nx, ny2, fd);
                const wob = 0.5 + 0.5 * Math.sin(nx * 13.0 + ny2 * 7.0) * Math.cos(ny2 * 9.0 - nx * 4.0);
                const present = (1 - g) * keep * (0.04 + 0.24 * wob);
                if (present > B4[y % 4][x % 4]) ink = true;
            }

            const r = ink ? INK[0] : bgRgb[0];
            const gOut = ink ? INK[1] : bgRgb[1];
            const bOut = ink ? INK[2] : bgRgb[2];

            for (let sy = 0; sy < scale; sy++) {
                for (let sx = 0; sx < scale; sx++) {
                    const oi = ((y * scale + sy) * outW + (x * scale + sx)) * 4;
                    if (ink) {
                        if (transparentBg) {
                            out[oi] = r;
                            out[oi + 1] = gOut;
                            out[oi + 2] = bOut;
                            out[oi + 3] = Math.round(dotAlpha * 255);
                        } else {
                            out[oi] = Math.round(r * dotAlpha + bgRgb[0] * (1 - dotAlpha));
                            out[oi + 1] = Math.round(gOut * dotAlpha + bgRgb[1] * (1 - dotAlpha));
                            out[oi + 2] = Math.round(bOut * dotAlpha + bgRgb[2] * (1 - dotAlpha));
                            out[oi + 3] = 255;
                        }
                    } else if (transparentBg) {
                        out[oi + 3] = 0;
                    } else {
                        out[oi] = bgRgb[0];
                        out[oi + 1] = bgRgb[1];
                        out[oi + 2] = bgRgb[2];
                        out[oi + 3] = 255;
                    }
                }
            }
        }
    }

    return out;
}

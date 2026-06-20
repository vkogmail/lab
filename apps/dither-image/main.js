const root = document.documentElement;
const canvas = document.getElementById('ditherCanvas');
const host = document.getElementById('ditherHost');
const algorithmSelect = document.getElementById('algorithmSelect');

const img = new Image();
img.crossOrigin = 'anonymous';
let ready = false;
let failed = false;
let algorithm = algorithmSelect.value;

function generateBayer(size) {
    if (size === 1) return [[0]];
    const half = generateBayer(size / 2);
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));
    const halfSize = size / 2;
    const offsets = [[0, 2], [3, 1]];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const qx = x >= halfSize ? 1 : 0;
            const qy = y >= halfSize ? 1 : 0;
            matrix[y][x] = 4 * half[y % halfSize][x % halfSize] + offsets[qy][qx];
        }
    }
    return matrix;
}

function normalizeBayer(matrix) {
    const n2 = matrix.length * matrix.length;
    return matrix.map((row) => row.map((v) => (v + 0.5) / n2));
}

const BAYER = {
    'bayer-4': normalizeBayer(generateBayer(4)),
    'bayer-8': normalizeBayer(generateBayer(8)),
    'bayer-16': normalizeBayer(generateBayer(16)),
};

function applyErrorDiffusion(gray, width, height, kernel) {
    const values = Float32Array.from(gray);
    const output = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const old = values[i];
            const next = old >= 0.5 ? 1 : 0;
            output[i] = next;
            const error = old - next;

            for (const [dx, dy, weight] of kernel) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    values[ny * width + nx] += error * weight;
                }
            }
        }
    }

    return output;
}

const ERROR_DIFFUSION = {
    'floyd-steinberg': [
        [1, 0, 7 / 16],
        [-1, 1, 3 / 16],
        [0, 1, 5 / 16],
        [1, 1, 1 / 16],
    ],
    atkinson: [
        [1, 0, 1 / 8],
        [2, 0, 1 / 8],
        [-1, 1, 1 / 8],
        [0, 1, 1 / 8],
        [1, 1, 1 / 8],
        [0, 2, 1 / 8],
    ],
};

img.onload = () => {
    ready = true;
    renderDither();
};
img.onerror = () => {
    failed = true;
    host.classList.add('dither-failed');
};
img.src = '/assets/sample.jpg';

function shouldDrawDot(x, y, cov, matrix) {
    if (matrix) {
        return cov > matrix[y % matrix.length][x % matrix.length];
    }
    return cov > 0.5;
}

function applyVignette(x, y, cw, ch, isLight) {
    if (isLight) {
        const dx = (x + 0.5) / cw - 0.5;
        const dy = (y + 0.5) / ch - 0.42;
        const dist = Math.sqrt(dx * dx + dy * dy * 0.8);
        const tv = Math.min(1, Math.max(0, (dist - 0.32) / 0.3));
        const keep = 1 - tv * tv * (3 - 2 * tv);
        if (keep < 1) {
            const hsh = Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453) % 1;
            if (hsh > keep) return false;
        }
    } else {
        const sV = y / ch;
        if (sV > 0.62) {
            const keep = 1 - (sV - 0.62) / 0.38;
            const hsh = Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453) % 1;
            if (hsh > keep) return false;
        }
    }
    return true;
}

function renderDither() {
    if (!ready || failed) return;

    const hb = host.getBoundingClientRect();
    if (!hb.width || !hb.height) {
        requestAnimationFrame(renderDither);
        return;
    }

    const PIXEL = hb.width < 600 ? 3 : 4;

    try {
        const isLight = root.getAttribute('data-theme') === 'light';
        const dotColor = getComputedStyle(root).getPropertyValue('--accent-text').trim();

        const tmp = document.createElement('canvas');
        tmp.width = 1;
        tmp.height = 1;
        const tctx = tmp.getContext('2d');
        tctx.fillStyle = dotColor;
        tctx.fillRect(0, 0, 1, 1);
        const ic = tctx.getImageData(0, 0, 1, 1).data;
        const INK = [ic[0], ic[1], ic[2]];

        const contrast = isLight ? 1.22 : 1.25;
        const dotAlpha = isLight ? 0.8 : 0.88;
        const hostAR = hb.width / hb.height;
        const imgAR = img.width / img.height;

        let sw, sh, sx, sy;
        if (imgAR > hostAR) {
            sh = img.height;
            sw = sh * hostAR;
            sx = (img.width - sw) * 0.5;
            sy = 0;
        } else {
            sw = img.width;
            sh = sw / hostAR;
            sx = 0;
            sy = (img.height - sh) * 0.5;
        }

        const cw = Math.max(24, Math.floor(hb.width / PIXEL));
        const ch = Math.max(24, Math.floor(hb.height / PIXEL));

        const off = document.createElement('canvas');
        off.width = cw;
        off.height = ch;
        const octx = off.getContext('2d');
        octx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
        const sd = octx.getImageData(0, 0, cw, ch).data;

        const gray = new Float32Array(cw * ch);
        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const i = (y * cw + x) * 4;
                let g = (0.299 * sd[i] + 0.587 * sd[i + 1] + 0.114 * sd[i + 2]) / 255;
                g = Math.min(1, Math.max(0, (g - 0.5) * contrast + 0.5));
                gray[y * cw + x] = isLight ? 1 - g : g;
            }
        }

        const matrix = BAYER[algorithm] || null;
        const diffused = ERROR_DIFFUSION[algorithm]
            ? applyErrorDiffusion(gray, cw, ch, ERROR_DIFFUSION[algorithm])
            : null;

        canvas.width = cw * PIXEL;
        canvas.height = ch * PIXEL;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;

        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const i = y * cw + x;
                const cov = diffused ? diffused[i] : gray[i];
                const draw = diffused
                    ? cov >= 0.5
                    : shouldDrawDot(x, y, cov, matrix);

                if (draw && applyVignette(x, y, cw, ch, isLight)) {
                    ctx.globalAlpha = dotAlpha;
                    ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
                }
            }
        }

        ctx.globalAlpha = 1;
        host.classList.remove('dither-failed');
        host.classList.add('dithered');
    } catch (e) {
        console.error(e);
        failed = true;
        host.classList.remove('dithered');
        host.classList.add('dither-failed');
    }
}

window.renderDither = renderDither;

algorithmSelect.addEventListener('change', () => {
    algorithm = algorithmSelect.value;
    renderDither();
});

let rt;
window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(renderDither, 150);
});

if (window.matchMedia('(max-width: 768px)').matches) {
    document.querySelectorAll('.settings-group').forEach((group) => group.removeAttribute('open'));
}

const ro = new ResizeObserver(() => {
    if (ready && !failed) renderDither();
});
ro.observe(host);

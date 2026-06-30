import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ditherHeroFrame, updateSubjectBounds } from './hero-dither-cpu.js';

const displayCanvas = document.getElementById('stage');
const displayCtx = displayCanvas.getContext('2d');
const statusPanel = document.getElementById('statusPanel');
const fpsEl = document.getElementById('fps');
const pixelSizeInput = document.getElementById('pixelSize');
const gridSizeSelect = document.getElementById('gridSize');
const heroBurstInput = document.getElementById('heroBurst');
const autoRotateInput = document.getElementById('autoRotate');
const bottomFadeInput = document.getElementById('bottomFade');
const bottomStartInput = document.getElementById('bottomStart');
const baseCutInput = document.getElementById('baseCut');

const MODEL_URL = '/models/head.glb';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DITHER_SCALE = 3;

const baseClipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let loadedRoot = null;
let subjectBounds = null;

const renderCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: renderCanvas, antialias: false, alpha: false });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0x0c0c0d, 1);
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0.05, 2.65);

const controls = new OrbitControls(camera, displayCanvas);
controls.enableDamping = true;
controls.target.set(0, 0.05, 0);
controls.autoRotate = !prefersReducedMotion;
controls.autoRotateSpeed = 0.6;

const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(2, 3, 4);
scene.add(keyLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
scene.add(ambientLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.65);
fillLight.position.set(0, 0.5, 3);
scene.add(fillLight);
const rim = new THREE.DirectionalLight(0x9ef0b0, 1.0);
rim.position.set(-3, 1, -2);
scene.add(rim);

const pivot = new THREE.Group();
scene.add(pivot);

let modelSource = 'placeholder';
let frameCount = 0;
let lastFpsAt = performance.now();
let cw = 24;
let ch = 24;
let readBuf = new Uint8Array(cw * ch * 4);
let flipBuf = new Uint8ClampedArray(cw * ch * 4);

function createModelLoader() {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);
    return loader;
}

function setStatus(html) {
    statusPanel.innerHTML = html;
}

function themeState() {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    const inkCss = getComputedStyle(root).getPropertyValue('--accent-text').trim() || '#9ef0b0';
    const bgCss = getComputedStyle(root).getPropertyValue('--bg').trim() || '#0c0c0d';
    renderer.setClearColor(bgCss, 1);
    keyLight.intensity = isLight ? 1.5 : 2.8;
    ambientLight.intensity = isLight ? 0.28 : 0.42;
    fillLight.intensity = isLight ? 0.35 : 0.65;
    rim.intensity = isLight ? 0.35 : 1.0;
    const tmp = document.createElement('canvas');
    tmp.width = 1;
    tmp.height = 1;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = bgCss;
    tctx.fillRect(0, 0, 1, 1);
    const bc = tctx.getImageData(0, 0, 1, 1).data;
    return {
        isLight,
        inkCss,
        bgRgb: [bc[0], bc[1], bc[2]],
        contrast: isLight ? 1.22 : 1.25,
        dotAlpha: isLight ? 0.8 : 0.88,
    };
}

function applyBaseClip(object, cutRatio) {
    if (!object) return;
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const minY = box.min.y;
    const height = Math.max(1e-6, box.max.y - box.min.y);
    baseClipPlane.constant = -(minY + height * (cutRatio / 100));
    object.traverse((child) => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
            mat.clippingPlanes = [baseClipPlane];
            mat.clipIntersection = false;
            mat.needsUpdate = true;
        });
    });
}

function fitObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 1.02 / maxDim;
    object.scale.setScalar(scale);
    object.position.y += size.y * scale * 0.04;
    pivot.add(object);
    loadedRoot = object;
    applyBaseClip(object, Number(baseCutInput.value));
    controls.target.set(0, 0.02, 0);
}

function makePlaceholderBust() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xc8c2b8, roughness: 0.55, metalness: 0.05 });
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 4), mat);
    head.scale.set(0.95, 1.15, 0.88);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.28, 24), mat);
    neck.position.y = -0.48;
    const group = new THREE.Group();
    group.add(head, neck);
    return group;
}

async function loadModel() {
    pivot.clear();
    loadedRoot = null;
    try {
        const gltf = await createModelLoader().loadAsync(MODEL_URL);
        modelSource = 'head.glb';
        fitObject(gltf.scene);
        setStatus(
            '<strong>Model:</strong> <code>head.glb</code> — homepage <code>renderDither()</code> on GLB pixels.<br>' +
            'Same loop as <code>vincent.jpg</code>, different tone source.'
        );
    } catch (err) {
        console.error('head.glb failed to load', err);
        modelSource = 'placeholder';
        fitObject(makePlaceholderBust());
        setStatus(`<strong>Placeholder</strong> — ${err?.message || err}`);
    }
}

function resize() {
    const wrap = displayCanvas.parentElement;
    const w = wrap.clientWidth;
    const h = Math.min(wrap.clientHeight, window.innerHeight * 0.72);
    if (w < 1 || h < 1) return;

    const scale = Number(pixelSizeInput.value) || DITHER_SCALE;
    cw = Math.max(24, Math.floor(w / scale));
    ch = Math.max(24, Math.floor(h / scale));

    displayCanvas.width = cw * scale;
    displayCanvas.height = ch * scale;
    displayCanvas.style.width = '100%';
    displayCanvas.style.height = `${h}px`;
    displayCtx.imageSmoothingEnabled = false;

    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();

    readBuf = new Uint8Array(cw * ch * 4);
    flipBuf = new Uint8ClampedArray(cw * ch * 4);
}

function readRenderPixels() {
    const gl = renderer.getContext();
    gl.readPixels(0, 0, cw, ch, gl.RGBA, gl.UNSIGNED_BYTE, readBuf);
    for (let y = 0; y < ch; y++) {
        const dst = y * cw * 4;
        const src = (ch - 1 - y) * cw * 4;
        flipBuf.set(readBuf.subarray(src, src + cw * 4), dst);
    }
    return flipBuf;
}

function tick(now) {
    requestAnimationFrame(tick);
    controls.update();
    subjectBounds = updateSubjectBounds(loadedRoot, camera) || subjectBounds;

    renderer.render(scene, camera);
    const src = readRenderPixels();
    const theme = themeState();
    const scale = Number(pixelSizeInput.value) || DITHER_SCALE;

    const out = ditherHeroFrame(src, cw, ch, {
        ...theme,
        heroBurst: heroBurstInput.checked,
        scale,
        bottomFade: Number(bottomFadeInput.value) / 100,
        bottomStart: Number(bottomStartInput.value) / 100,
        bottomSoft: 0.22,
        fcx: subjectBounds?.fcx ?? 0.5,
        fcy: subjectBounds ? (theme.isLight ? subjectBounds.fcy : subjectBounds.fcy - 0.02) : 0.4,
        frx: subjectBounds?.frx ?? 0.3,
        fry: subjectBounds?.fry ?? 0.34,
    });

    displayCtx.putImageData(new ImageData(out, cw * scale, ch * scale), 0, 0);

    frameCount++;
    if (now - lastFpsAt >= 500) {
        fpsEl.textContent = `${Math.round((frameCount * 1000) / (now - lastFpsAt))} fps · ${modelSource}`;
        frameCount = 0;
        lastFpsAt = now;
    }
}

pixelSizeInput.addEventListener('input', () => { resize(); });
gridSizeSelect.addEventListener('change', () => { /* bayer size fixed 4×4 like homepage */ });
heroBurstInput.addEventListener('change', () => {});
autoRotateInput.addEventListener('change', () => {
    controls.autoRotate = autoRotateInput.checked && !prefersReducedMotion;
});
bottomFadeInput.addEventListener('input', () => {});
bottomStartInput.addEventListener('input', () => {});
baseCutInput.addEventListener('input', () => {
    if (loadedRoot) applyBaseClip(loadedRoot, Number(baseCutInput.value));
});

const themeObs = new MutationObserver(() => {});
themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

window.addEventListener('resize', resize);

resize();
loadModel().then(() => requestAnimationFrame(tick));

if (prefersReducedMotion) {
    autoRotateInput.checked = false;
    autoRotateInput.disabled = true;
}

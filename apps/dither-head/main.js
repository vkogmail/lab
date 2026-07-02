import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ditherHeroFrame } from './hero-dither-cpu.js';

const MODEL_URL = '/models/bust.glb';
const BASE_CUT = 8;
const MODEL_FILL = 1.72;
const CAMERA_Z = 2.14;
const YAW_LIMIT = Math.PI * 0.34;
const PITCH_BASE = 0.07;
const PITCH_MIN = -0.24;
const PITCH_MAX = 0.22;
const AUTO_PITCH_EXTRA = 0.05;
const PITCH_PIVOT_Y = 0.2;
const FRAME_Y = 0.02;
const DRAG_YAW_SENS = 0.0045;
const DRAG_PITCH_SENS = 0.0054;
const AUTO_PHASE_SPEED = 0.0065;
const MOUSE_YAW_FACTOR = 0.82;
const MOUSE_PITCH_UP = 0.22;
const MOUSE_PITCH_DOWN = 0.12;
const TRACK_SMOOTH = 0.068;
const MOUSE_IDLE_MS = 4000;
const MOUSE_LOOK_PITCH = 0.07;
const MOUSE_ANCHOR_NUDGE_Y = 0.06;
const DITHER_SCALE = 3;

const displayCanvas = document.getElementById('stage');
const host = displayCanvas?.closest('.stage-wrap');
const displayCtx = displayCanvas.getContext('2d');
const statusPanel = document.getElementById('statusPanel');
const fpsEl = document.getElementById('fps');
const pixelSizeInput = document.getElementById('pixelSize');
const heroBurstInput = document.getElementById('heroBurst');
const mouseTrackInput = document.getElementById('mouseTrack');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMq = window.matchMedia('(max-width:768px)');

function isMobileLayout() {
    return mobileMq.matches;
}

function useMouseTrack() {
    return mouseTrackInput.checked && !isMobileLayout() && !prefersReducedMotion;
}

function ditherScale() {
    return Number(pixelSizeInput.value) || DITHER_SCALE;
}

let yaw = 0;
let pitch = PITCH_BASE;
let pitchOffset = 0;
let autoPhase = 0;
let dragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let autoRotate = !prefersReducedMotion;
let mouseTracking = false;
let lastMouseMove = 0;
let targetYaw = 0;
let targetPitch = PITCH_BASE;
let modelSource = 'loading';
let frameCount = 0;
let lastFpsAt = performance.now();

const renderCanvas = document.createElement('canvas');
renderCanvas.setAttribute('aria-hidden', 'true');
renderCanvas.style.cssText = 'position:fixed;inset:0;opacity:0;pointer-events:none;z-index:-1';
document.body.appendChild(renderCanvas);

const renderer = new THREE.WebGLRenderer({
    canvas: renderCanvas,
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0.05, CAMERA_Z);

const lightTarget = new THREE.Object3D();
lightTarget.position.set(0, 0.06, 0);
scene.add(lightTarget);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.65);
keyLight.target = lightTarget;
scene.add(keyLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.18));
const ambient = scene.children[scene.children.length - 1];
const fillLight = new THREE.DirectionalLight(0xffffff, 0.36);
fillLight.target = lightTarget;
scene.add(fillLight);
const rim = new THREE.DirectionalLight(0x9ef0b0, 1.58);
rim.target = lightTarget;
scene.add(rim);

const pivot = new THREE.Group();
pivot.rotation.x = PITCH_BASE;
scene.add(pivot);
const neckPivot = new THREE.Group();
pivot.add(neckPivot);

const baseClipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let modelRoot = null;
let modelSize = new THREE.Vector3(1, 1, 1);
let cw = 24;
let ch = 24;
let readBuf = new Uint8Array(cw * ch * 4);
let flipBuf = new Uint8ClampedArray(cw * ch * 4);

function setStatus(html) {
    statusPanel.innerHTML = html;
}

function clampYaw(a) {
    return Math.min(YAW_LIMIT, Math.max(-YAW_LIMIT, a));
}

function clampPitch(a) {
    return Math.min(PITCH_MAX, Math.max(PITCH_MIN, a));
}

function applyPivot() {
    pivot.rotation.y = yaw;
    pivot.rotation.x = pitch;
}

function syncAutoFromPose() {
    autoPhase = Math.asin(Math.max(-1, Math.min(1, yaw / YAW_LIMIT)));
    pitchOffset = pitch - PITCH_BASE - AUTO_PITCH_EXTRA * Math.abs(Math.sin(autoPhase));
    pitchOffset = Math.min(0.12, Math.max(-0.08, pitchOffset));
}

function resumeAutoRotate() {
    syncAutoFromPose();
    autoRotate = !prefersReducedMotion;
    mouseTracking = false;
}

function getLookAnchor() {
    const hb = host.getBoundingClientRect();
    return {
        x: hb.left + hb.width * 0.5,
        y: hb.top + hb.height * (0.42 + MOUSE_ANCHOR_NUDGE_Y),
        halfW: Math.max(hb.width * 0.48, 120),
        halfH: Math.max(hb.height * 0.42, 120),
    };
}

function updateMouseTargets(clientX, clientY) {
    const anchor = getLookAnchor();
    const hb = host.getBoundingClientRect();
    const nx = (clientX - anchor.x) / anchor.halfW;
    const upReach = Math.max(anchor.y - hb.top, 72);
    const downReach = Math.max(hb.bottom - anchor.y, 64);
    const dy = clientY - anchor.y;
    const pitchDelta = dy <= 0
        ? (dy / upReach) * MOUSE_PITCH_UP
        : (dy / downReach) * MOUSE_PITCH_DOWN;
    targetYaw = clampYaw(nx * YAW_LIMIT * MOUSE_YAW_FACTOR);
    targetPitch = clampPitch(MOUSE_LOOK_PITCH + pitchDelta);
}

function themeState() {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    const inkCss = getComputedStyle(root).getPropertyValue('--accent-text').trim() || '#9ef0b0';
    const bgCss = getComputedStyle(root).getPropertyValue('--bg').trim() || '#0c0c0d';
    renderer.setClearColor(bgCss, 1);
    keyLight.intensity = isLight ? 2.05 : 3.65;
    ambient.intensity = isLight ? 0.22 : 0.18;
    fillLight.intensity = isLight ? 0.2 : 0.36;
    rim.intensity = isLight ? 0.48 : 1.58;
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
        contrast: isLight ? 1.3 : 1.38,
        dotAlpha: isLight ? 0.8 : 0.88,
    };
}

function normalizeMaterials(object) {
    object.traverse((child) => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                mat.color.setHex(0xd8d2c8);
                mat.roughness = 0.58;
                mat.metalness = 0.02;
            }
            mat.side = THREE.FrontSide;
            mat.needsUpdate = true;
        });
    });
}

function applyBaseClip(object) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const minY = box.min.y;
    const height = Math.max(1e-6, box.max.y - box.min.y);
    baseClipPlane.constant = -(minY + height * (BASE_CUT / 100));
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

function applyModelTransform() {
    if (!modelRoot) return;
    const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
    const scale = MODEL_FILL / maxDim;
    modelRoot.scale.setScalar(scale);
    modelRoot.rotation.x = 0;
    const h = modelSize.y * scale;
    neckPivot.position.y = h * PITCH_PIVOT_Y;
    modelRoot.position.set(-0.04, h * (FRAME_Y - PITCH_PIVOT_Y), 0);
    applyBaseClip(modelRoot);
}

function prepareModel(object) {
    const box = new THREE.Box3().setFromObject(object);
    modelSize.copy(box.getSize(new THREE.Vector3()));
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    modelRoot = object;
    normalizeMaterials(object);
    neckPivot.add(object);
    applyModelTransform();
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

function createModelLoader() {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);
    return loader;
}

async function loadModel() {
    try {
        const gltf = await createModelLoader().loadAsync(MODEL_URL);
        neckPivot.clear();
        modelRoot = null;
        modelSource = 'bust.glb';
        prepareModel(gltf.scene);
        setStatus(
            '<strong>Move your cursor</strong> — the bust tracks it with spring easing. Drag to override, release to resume tracking.<br>' +
            'Offscreen WebGL render → 4×4 Bayer dither on CPU (~60fps).'
        );
    } catch (err) {
        console.error('bust.glb failed to load', err);
        neckPivot.clear();
        modelRoot = null;
        modelSource = 'placeholder';
        prepareModel(makePlaceholderBust());
        setStatus(`<strong>Placeholder mesh</strong> — ${err?.message || err}`);
    }
}

function mountPlaceholder() {
    modelSource = 'loading';
    prepareModel(makePlaceholderBust());
    setStatus('Loading bust…');
}

function layout() {
    const wrap = host;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 48 || h < 48) return;

    const scale = ditherScale();
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
    camera.lookAt(0, 0.04, 0);
    keyLight.position.set(2.4, 3.4, 3.6);
    fillLight.position.set(0, 0.25, 3);
    rim.position.set(-3.2, 1.3, -2.2);
    applyModelTransform();

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

function bindDrag() {
    host.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        dragging = true;
        autoRotate = false;
        mouseTracking = false;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        host.setPointerCapture(e.pointerId);
        host.classList.add('stage-dragging');
    });
    host.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        yaw = clampYaw(yaw + dx * DRAG_YAW_SENS);
        pitch = clampPitch(pitch + dy * DRAG_PITCH_SENS);
        applyPivot();
    });
    const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        host.classList.remove('stage-dragging');
        if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
        if (!prefersReducedMotion) {
            if (useMouseTrack()) {
                targetYaw = yaw;
                targetPitch = pitch;
                mouseTracking = true;
                lastMouseMove = performance.now();
            } else {
                resumeAutoRotate();
            }
        }
    };
    host.addEventListener('pointerup', endDrag);
    host.addEventListener('pointercancel', endDrag);
}

function bindMouseTrack() {
    document.addEventListener('pointermove', (e) => {
        if (dragging || !useMouseTrack()) return;
        lastMouseMove = performance.now();
        if (!mouseTracking) {
            mouseTracking = true;
            autoRotate = false;
            targetYaw = yaw;
            targetPitch = pitch;
        }
        updateMouseTargets(e.clientX, e.clientY);
    });
}

function tick(now) {
    requestAnimationFrame(tick);

    if (autoRotate && !dragging) {
        autoPhase += AUTO_PHASE_SPEED;
        const s = Math.sin(autoPhase);
        yaw = YAW_LIMIT * s;
        pitch = clampPitch(PITCH_BASE + pitchOffset + AUTO_PITCH_EXTRA * Math.abs(s));
        applyPivot();
    } else if (useMouseTrack() && mouseTracking && !dragging) {
        if (performance.now() - lastMouseMove > MOUSE_IDLE_MS) {
            resumeAutoRotate();
        } else {
            yaw += (targetYaw - yaw) * TRACK_SMOOTH;
            pitch += (targetPitch - pitch) * TRACK_SMOOTH;
            applyPivot();
        }
    }

    renderer.render(scene, camera);
    const src = readRenderPixels();
    const theme = themeState();
    const scale = ditherScale();

    const out = ditherHeroFrame(src, cw, ch, {
        ...theme,
        heroBurst: heroBurstInput.checked,
        matchPhoto: true,
        scale,
        bottomCullStart: 0.98,
        bottomCullSoft: 0.05,
    });

    displayCtx.putImageData(new ImageData(out, cw * scale, ch * scale), 0, 0);

    frameCount++;
    if (now - lastFpsAt >= 500) {
        fpsEl.textContent = `${Math.round((frameCount * 1000) / (now - lastFpsAt))} fps · ${modelSource}`;
        frameCount = 0;
        lastFpsAt = now;
    }
}

pixelSizeInput.addEventListener('input', layout);
heroBurstInput.addEventListener('change', () => {});
mouseTrackInput.addEventListener('change', () => {
    if (!useMouseTrack()) {
        mouseTracking = false;
        if (!dragging) resumeAutoRotate();
    }
});

window.addEventListener('resize', () => {
    layout();
    if (!useMouseTrack()) {
        mouseTracking = false;
        autoRotate = !prefersReducedMotion;
    }
});

mobileMq.addEventListener('change', () => {
    layout();
    mouseTracking = false;
    autoRotate = !prefersReducedMotion;
});

if (prefersReducedMotion) {
    mouseTrackInput.checked = false;
    mouseTrackInput.disabled = true;
}

layout();
bindDrag();
bindMouseTrack();
mountPlaceholder();
requestAnimationFrame(tick);
loadModel();

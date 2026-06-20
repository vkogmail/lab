import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from './ogl.js';
import * as ms from './modern-screenshot.js';

const DATA = [
    { id: '1', img: '/assets/great-gatsby.jpg', title: 'The Great Gatsby' },
    { id: '2', img: '/assets/dune.jpg', title: 'Dune' },
    { id: '3', img: '/assets/1984.jpg', title: '1984' },
    { id: '4', img: '/assets/project-hail-mary.jpg', title: 'Project Hail Mary' },
    { id: '5', img: '/assets/rebecca.jpg', title: 'Rebecca' },
];

const root = document.documentElement;
const pager = document.getElementById('czPager');
const stage = document.querySelector('.carousel-stage');
const track = document.getElementById('czTrack');
const canvas = document.getElementById('czCanvas');
const dotsEl = document.getElementById('czDots');
const prevBtn = document.getElementById('czPrev');
const nextBtn = document.getElementById('czNext');

const N = DATA.length;
const OVERFLOW_Y = 80;
let REST_WARP = 0.6;
let SPRING_K = 0.035;
let SPRING_D = 0.77;

let cur = 0;
let posPx = 0;
let targetPx = 0;
let vel = 0;
let animating = false;
let navAnim = false;
let animStart = 0;
let animEnd = 0;
let springV = 0;
let dragging = false;
let engaged = false;
let ready = false;
let trackW = 0;
let dims = { vw: 0, cardW: 0, gap: 0, side: 0 };

const composites = new Array(N).fill(null);
const images = DATA.map(d => {
    const im = new Image();
    im.src = d.img;
    return im;
});

let renderer, gl, camera, scene, mesh, program, texture, raf = 0;

const vertex = `
    attribute vec2 uv; attribute vec3 position; uniform mat4 modelViewMatrix, projectionMatrix;
    uniform float uScrollX, uTexScaleX, uBend, uCurl, uCurvePow, uDir, uMarginY, uWarp, uHoleStart, uHoleEnd;
    varying vec2 vUv; varying float vEdge;
    void main(){ vUv=vec2(uv.x*uTexScaleX+uScrollX,(uv.y-uMarginY)/(1.0-2.0*uMarginY));
      float nx=uv.x-0.5; vEdge=abs(nx)*2.0; float e=pow(vEdge,uCurvePow)*smoothstep(uHoleStart,uHoleStart+0.07,vEdge);
      vec3 p=position; p.z-=uDir*uBend*e*uWarp; p.x-=uDir*sign(nx)*uCurl*e*uWarp; p.y*=mix(1.0,(5.0-p.z)/5.0,0.82);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`;

const fragment = `
    precision highp float; uniform sampler2D uTex; uniform float uVel,uOpacity,uSplit,uAb,uAbRest,uWarp,uTime,uEdgeNoise,uCenterFade,uHoleStart,uHoleEnd,uEdgeBlur,uEdgeDesat; uniform vec3 uBg,uAccent;
    varying vec2 vUv; varying float vEdge;
    vec3 tap(float ux,float uy){ vec4 t=texture2D(uTex,vec2(fract(ux),clamp(uy,0.0,1.0))); return t.rgb; }
    float tapA(float ux,float uy){ return texture2D(uTex,vec2(fract(ux),clamp(uy,0.0,1.0))).a; }
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
      float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
    void main(){ if(vUv.y<0.0||vUv.y>1.0){ gl_FragColor=vec4(0.0); return; }
      float edgeMask=pow(vEdge,3.0);
      float nOff=(vnoise(vec2(vUv.y*5.0+uTime, uTime*0.6))-0.5)*uEdgeNoise*uWarp*edgeMask;
      float ux=vUv.x+nOff;
      float s=clamp(uVel*uSplit+sign(uVel)*vEdge*uSplit*0.4,-0.04,0.04);
      vec4 c=texture2D(uTex,vec2(fract(ux),vUv.y)); vec4 cs=texture2D(uTex,vec2(fract(ux+s),vUv.y));
      float edgeT=smoothstep(uHoleStart,1.0,vEdge);
      float blurR=edgeT*edgeT*uEdgeBlur;
      vec3 base;
      float contentA;
      if(blurR>0.0001){
        float a=hash(vUv*vec2(311.7,127.1))*6.2831853;
        mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a));
        float w0=tapA(ux,vUv.y); vec3 acc=tap(ux,vUv.y)*w0; float wsum=w0;
        for(int i=0;i<8;i++){ float ang=(float(i)+0.5)*0.7853982;
          vec2 d=R*(vec2(cos(ang),sin(ang))*vec2(1.0,1.6));
          vec2 o1=d*blurR, o2=d*(blurR*1.9);
          float w1=tapA(ux+o1.x,vUv.y+o1.y); acc+=tap(ux+o1.x,vUv.y+o1.y)*w1; wsum+=w1;
          float w2=tapA(ux+o2.x,vUv.y+o2.y)*0.55; acc+=tap(ux+o2.x,vUv.y+o2.y)*w2; wsum+=w2;
        }
        base=wsum>0.001?acc/wsum:vec3(0.0);
        contentA=min(1.0,wsum);
      } else { base=c.rgb; contentA=c.a; }
      float luma=dot(base,vec3(0.299,0.587,0.114));
      base=mix(base, vec3(luma), edgeT*uEdgeDesat);
      float edgeE=clamp(length(cs.rgb-c.rgb)+abs(cs.a-c.a),0.0,1.0);
      float amt=clamp(abs(uVel)*3.2,0.0,1.0); float rest=vEdge*vEdge*uAbRest*uWarp;
      float hole=smoothstep(uHoleStart,uHoleEnd,vEdge);
      float a=uOpacity*mix(1.0,hole,uCenterFade)*contentA;
      gl_FragColor=vec4(base+uAccent*(edgeE*amt*uAb+edgeE*rest),a); }`;

function hexVar(name) {
    let h = getComputedStyle(root).getPropertyValue(name).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return h;
}

function bgRGB() {
    const h = hexVar('--bg') || '0c0c0d';
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

function accentRGB() {
    const h = hexVar('--accent') || '9ef0b0';
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

function pageBg() {
    return getComputedStyle(root).getPropertyValue('--bg').trim() || '#0c0c0d';
}

const DPR = () => Math.min(2, window.devicePixelRatio || 1);

// Lab demo defaults — tuned to show blur, desat, chromatic edge, and peek fringing.
// Portfolio cases.html ships the same shader with most of these at 0; use ?tune to tweak live.
const FX = {
    edgeBlur: 0.014,
    edgeDesat: 1.0,
    edgeNoise: 0.04,
    split: 0.022,
    abMotion: 1.35,
    abRest: 0.22,
};

function isLite() {
    return window.innerWidth < 760 || matchMedia('(hover:none) and (pointer:coarse)').matches;
}

function fxScale() {
    return isLite() ? 0.55 : 1;
}

function applyFx() {
    if (!program) return;
    const s = fxScale();
    const t = Math.max(0, Math.min(1, (dims.vw - 760) / (1440 - 760)));
    program.uniforms.uEdgeBlur.value = FX.edgeBlur * s * (1.35 - 0.35 * t);
    program.uniforms.uEdgeDesat.value = FX.edgeDesat * (isLite() ? 0.75 : 1);
    program.uniforms.uEdgeNoise.value = FX.edgeNoise * s;
    program.uniforms.uSplit.value = FX.split * s;
    program.uniforms.uAb.value = FX.abMotion * s;
    program.uniforms.uAbRest.value = FX.abRest * s;
}

function updateDims() {
    const vw = pager.clientWidth;
    const cardW = Math.min(1160, Math.round(vw * 0.84));
    const gap = Math.min(26, Math.round(vw * 0.02));
    const side = (vw - cardW) / 2;
    track.style.setProperty('--card', cardW + 'px');
    track.style.setProperty('--cardgap', gap + 'px');
    track.style.setProperty('--side', side + 'px');
    root.style.setProperty('--cz-side', Math.round(Math.min(side, 20 + Math.max(0, vw - 1400) * 0.15)) + 'px');
    root.style.setProperty('--cz-fullside', Math.max(0, Math.round(side)) + 'px');
    dims = { vw, cardW, gap, side };
    trackW = N * (cardW + gap);
}

function stepPx() {
    return dims.cardW + dims.gap;
}

function setTrack() {
    track.style.transform = `translateX(${-(cur * stepPx())}px)`;
}

async function rasterPage(i) {
    const dpr = DPR();
    const sec = track.children[i];
    const cw = sec.offsetWidth;
    const img = images[i];
    if (img && !img.complete) await new Promise(r => { img.onload = r; img.onerror = r; });

    const snap = await ms.domToCanvas(sec, { backgroundColor: null, scale: dpr });
    composites[i] = { canvas: snap, cw: snap.width / dpr, sh: snap.height / dpr };
}

function buildStrip() {
    const dpr = DPR();
    const vh = pager.clientHeight;
    const { cardW, gap } = dims;
    const step = cardW + gap;
    trackW = N * step;

    const c = document.createElement('canvas');
    c.width = Math.round(trackW * dpr);
    c.height = Math.round(vh * dpr);
    const x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);

    for (let i = 0; i < N; i++) {
        const comp = composites[i];
        if (!comp) continue;
        const sh = comp.sh;
        const dw = Math.round(cardW * dpr);
        const dh = Math.round(sh * dpr);
        const yOff = Math.round(Math.max(0, (vh - sh) * 0.5) * dpr);
        x.drawImage(comp.canvas, 0, 0, comp.canvas.width, comp.canvas.height, Math.round(i * step * dpr), yOff, dw, dh);
    }
    texture.image = c;
    texture.needsUpdate = true;
}

function texScroll() {
    program.uniforms.uTexScaleX.value = dims.vw / trackW;
    return (posPx + dims.cardW / 2 - dims.vw / 2) / trackW;
}

function tuneForViewport() {
    if (!program) return;
    const t = Math.max(0, Math.min(1, (dims.vw - 760) / (1440 - 760)));
    program.uniforms.uBend.value = 0.6 + 0.6 * t;
    program.uniforms.uCurvePow.value = 4.0 + 4.0 * t;
    applyFx();
}

function resize() {
    updateDims();
    const w = pager.clientWidth;
    const h = pager.clientHeight + OVERFLOW_Y * 2;
    renderer.setSize(w, h);
    canvas.style.top = -OVERFLOW_Y + 'px';
    canvas.style.height = h + 'px';
    camera.perspective({ aspect: w / h });
    const worldH = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    mesh.scale.set(worldH * (w / h), worldH, 1);
    program.uniforms.uMarginY.value = OVERFLOW_Y / h;
    program.uniforms.uHoleStart.value = dims.cardW / dims.vw;
    program.uniforms.uHoleEnd.value = Math.min(0.999, (dims.cardW + dims.gap) / dims.vw);
    tuneForViewport();
}

function loop() {
    raf = requestAnimationFrame(loop);
    const prev = posPx;
    program.uniforms.uTime.value += 0.016;

    if (animating && !dragging) {
        springV += (targetPx - posPx) * SPRING_K;
        springV *= SPRING_D;
        posPx += springV;
        if (Math.abs(targetPx - posPx) < 0.4 && Math.abs(springV) < 0.4) {
            posPx = targetPx;
            finishAnim();
            return;
        }
    }

    vel += ((posPx - prev) - vel) * 0.25;
    let warp;
    if (animating && navAnim) {
        const span = (animEnd - animStart) || 1;
        let p = (posPx - animStart) / span;
        p = Math.max(0, Math.min(1, p));
        warp = REST_WARP + (1.0 - REST_WARP) * Math.sin(p * Math.PI);
    } else {
        let f = posPx / stepPx();
        f -= Math.floor(f);
        warp = REST_WARP + (1.0 - REST_WARP) * (Math.min(f, 1.0 - f) * 2.0);
    }

    program.uniforms.uWarp.value = warp;
    program.uniforms.uScrollX.value = texScroll();
    program.uniforms.uVel.value = vel * 0.02;
    renderer.render({ scene, camera });
    syncUI();
}

function finishAnim() {
    animating = false;
    navAnim = false;
    springV = 0;
    const step = stepPx();
    cur = ((Math.round(posPx / step) % N) + N) % N;
    posPx = cur * step;
    targetPx = posPx;
    setTrack();
    enterRest(true);
    syncUI();
}

function engage() {
    if (!ready) return false;
    navAnim = false;
    buildStrip();
    program.uniforms.uCenterFade.value = 0;
    canvas.classList.add('on');
    pager.style.visibility = 'hidden';
    if (!raf) loop();
    return true;
}

function enterRest(rebuild = true) {
    if (!ready) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (rebuild) buildStrip();
    posPx = cur * stepPx();
    targetPx = posPx;
    setTrack();
    program.uniforms.uCenterFade.value = 1;
    program.uniforms.uWarp.value = REST_WARP;
    program.uniforms.uVel.value = 0;
    program.uniforms.uScrollX.value = texScroll();
    canvas.classList.add('on');
    pager.style.visibility = '';
    renderer.render({ scene, camera });
}

function syncUI() {
    const c = ((Math.round(posPx / stepPx()) % N) + N) % N;
    Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('on', i === c));
}

function navTo(j) {
    j = ((j % N) + N) % N;
    let delta = ((j - cur) % N + N) % N;
    if (delta > N / 2) delta -= N;
    if (!engage()) return;
    const step = stepPx();
    animStart = posPx = cur * step;
    targetPx = animEnd = posPx + delta * step;
    springV = 0;
    navAnim = true;
    animating = true;
}

async function init() {
    const lite = isLite();

    renderer = new Renderer({ canvas, alpha: true, dpr: DPR(), antialias: true });
    gl = renderer.gl;
    camera = new Camera(gl, { fov: 32 });
    camera.position.z = 5;
    scene = new Transform();

    const geometry = new Plane(gl, { width: 1, height: 1, widthSegments: lite ? 320 : 640, heightSegments: 1 });
    texture = new Texture(gl, { generateMipmaps: false, premultiplyAlpha: false });
    program = new Program(gl, {
        vertex, fragment, transparent: true,
        uniforms: {
            uTex: { value: texture }, uScrollX: { value: 0 }, uTexScaleX: { value: 0.3 },
            uBend: { value: lite ? 0.6 : 1.2 }, uCurl: { value: 0.0 }, uCurvePow: { value: lite ? 4.0 : 8.0 }, uDir: { value: -1.0 },
            uSplit: { value: 0 }, uMarginY: { value: 0.12 }, uBg: { value: bgRGB() }, uAccent: { value: accentRGB() },
            uAb: { value: 0 }, uAbRest: { value: 0 }, uWarp: { value: 0 }, uVel: { value: 0 }, uOpacity: { value: 1 },
            uTime: { value: 0 }, uEdgeNoise: { value: 0 },
            uCenterFade: { value: 1 }, uHoleStart: { value: 0.78 }, uHoleEnd: { value: 0.86 },
            uEdgeBlur: { value: 0 }, uEdgeDesat: { value: 1 }
        }
    });
    program.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    DATA.forEach((d, i) => {
        const page = document.createElement('div');
        page.className = 'cz-page';
        page.innerHTML = `<div class="cp-hero"><img src="${d.img}" alt="${d.title}"></div>`;
        track.appendChild(page);

        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => navTo(i));
        dotsEl.appendChild(dot);
    });

    posPx = cur * stepPx();
    targetPx = posPx;
    resize();
    setTrack();
    syncUI();

    await rasterPage(cur);
    await rasterPage((cur + 1) % N);
    await rasterPage((cur - 1 + N) % N);
    ready = true;
    enterRest();

    for (let i = 0; i < N; i++) {
        if (i !== cur && i !== (cur + 1) % N && i !== (cur - 1 + N) % N) await rasterPage(i);
    }
    if (ready) enterRest();

    if (location.search.includes('tune')) buildPanel();
}

function buildPanel() {
    const U = k => ({ get: () => program.uniforms[k].value, set: v => { program.uniforms[k].value = v; }, name: k });
    const specs = [
        ['Edge noise', U('uEdgeNoise'), 0, 0.15, 0.005],
        ['Spring K', { get: () => SPRING_K, set: v => { SPRING_K = v; }, name: 'SPRING_K' }, 0.02, 0.25, 0.005],
        ['Spring damp', { get: () => SPRING_D, set: v => { SPRING_D = v; }, name: 'SPRING_D' }, 0.5, 0.95, 0.01],
        ['Rest curve', { get: () => REST_WARP, set: v => { REST_WARP = v; if (!animating && ready) { program.uniforms.uWarp.value = v; renderer.render({ scene, camera }); } }, name: 'REST_WARP' }, 0, 1.0, 0.05],
        ['Edge blur', { get: () => program.uniforms.uEdgeBlur.value, set: v => { program.uniforms.uEdgeBlur.value = v; if (!animating && ready) renderer.render({ scene, camera }); }, name: 'uEdgeBlur' }, 0, 0.04, 0.001],
        ['Edge desat', { get: () => program.uniforms.uEdgeDesat.value, set: v => { program.uniforms.uEdgeDesat.value = v; if (!animating && ready) renderer.render({ scene, camera }); }, name: 'uEdgeDesat' }, 0, 1.0, 0.05],
        ['Curve depth', U('uBend'), 0, 1.2, 0.01],
        ['Edge curl', U('uCurl'), 0, 0.3, 0.005],
        ['Curve power', U('uCurvePow'), 1, 8, 0.1],
        ['Direction', U('uDir'), -1, 1, 0.1],
        ['Aberration', U('uSplit'), 0, 0.05, 0.001],
        ['Green (motion)', U('uAb'), 0, 3, 0.05],
        ['Green (rest)', U('uAbRest'), 0, 0.6, 0.01],
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;top:72px;right:14px;z-index:9999;width:236px;padding:14px;border-radius:12px;background:rgba(18,18,20,.92);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:#eee;font:12px/1.5 ui-monospace,monospace;box-shadow:0 12px 40px rgba(0,0,0,.5)';
    specs.forEach(([label, acc, min, max, step]) => {
        const row = document.createElement('div');
        row.style.margin = '0 0 9px';
        row.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>${label}</span><span data-v>${(+acc.get()).toFixed(3)}</span></div>`;
        const r = document.createElement('input');
        r.type = 'range';
        r.min = min;
        r.max = max;
        r.step = step;
        r.value = acc.get();
        r.style.cssText = 'width:100%;accent-color:#9ef0b0';
        r.addEventListener('input', () => {
            acc.set(+r.value);
            row.querySelector('[data-v]').textContent = (+r.value).toFixed(3);
        });
        row.appendChild(r);
        wrap.appendChild(row);
    });
    const btn = document.createElement('button');
    btn.textContent = 'Copy values';
    btn.style.cssText = 'width:100%;margin-top:4px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:#9ef0b0;color:#06121f;font-weight:600;cursor:pointer';
    btn.addEventListener('click', () => {
        const o = specs.map(([, a]) => a.name + ':' + (+a.get()).toFixed(3)).join(', ');
        try { navigator.clipboard.writeText(o); } catch (_) {}
        btn.textContent = 'Copied ✓';
        setTimeout(() => { btn.textContent = 'Copy values'; }, 1200);
        console.log('[cz tune]', o);
    });
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
}

prevBtn.addEventListener('click', () => navTo(cur - 1));
nextBtn.addEventListener('click', () => navTo(cur + 1));

let sx0 = 0, sy0 = 0, startPos = 0, lastX = 0, lastT = 0, dragVel = 0;
stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.cz-bar')) return;
    dragging = true;
    engaged = false;
    sx0 = e.clientX;
    sy0 = e.clientY;
    lastX = e.clientX;
    lastT = performance.now();
    dragVel = 0;
});
stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - sx0;
    const dy = e.clientY - sy0;
    if (!engaged) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { dragging = false; return; }
        engaged = true;
        document.body.classList.add('cz-grab');
        try { stage.setPointerCapture(e.pointerId); } catch (_) {}
        if (!engage()) {
            dragging = false;
            engaged = false;
            document.body.classList.remove('cz-grab');
            return;
        }
        startPos = cur * stepPx();
        animating = false;
    }
    e.preventDefault();
    posPx = startPos - dx;
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    dragVel = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;
});
function release() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('cz-grab');
    if (!engaged) return;
    engaged = false;
    const step = stepPx();
    const here = posPx / step;
    const idx = Math.abs(dragVel) > 0.45
        ? (dragVel < 0 ? Math.floor(here) + 1 : Math.ceil(here) - 1)
        : Math.round(here);
    springV = Math.max(-60, Math.min(60, -dragVel * 16));
    targetPx = idx * step;
    animating = true;
}
stage.addEventListener('pointerup', release);
stage.addEventListener('pointercancel', release);

let wheelLock = false, wheelT;
stage.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    clearTimeout(wheelT);
    wheelT = setTimeout(() => { wheelLock = false; }, 220);
    if (wheelLock || animating) return;
    if (Math.abs(e.deltaX) > 18) {
        wheelLock = true;
        navTo(cur + (e.deltaX > 0 ? 1 : -1));
    }
}, { passive: false });

root.addEventListener('lab-theme-change', async () => {
    if (!ready) return;
    program.uniforms.uBg.value = bgRGB();
    program.uniforms.uAccent.value = accentRGB();
    canvas.classList.remove('on');
    const near = [cur, (cur + 1) % N, (cur - 1 + N) % N];
    for (const i of near) await rasterPage(i);
    if (ready) enterRest();
    for (let i = 0; i < N; i++) {
        if (!near.includes(i)) await rasterPage(i);
    }
    if (ready) enterRest();
});

let rt, rResizePending = false;
window.addEventListener('resize', () => {
    if (!rResizePending) {
        rResizePending = true;
        requestAnimationFrame(() => {
            rResizePending = false;
            updateDims();
            if (ready) {
                posPx = cur * stepPx();
                targetPx = posPx;
                setTrack();
                resize();
                enterRest();
            }
        });
    }
    clearTimeout(rt);
    rt = setTimeout(async () => {
        updateDims();
        setTrack();
        const near = [cur, (cur + 1) % N, (cur - 1 + N) % N];
        for (const i of near) await rasterPage(i);
        if (ready) {
            resize();
            enterRest();
        }
        for (let i = 0; i < N; i++) {
            if (!near.includes(i)) await rasterPage(i);
        }
        if (ready) enterRest();
    }, 220);
});

init();

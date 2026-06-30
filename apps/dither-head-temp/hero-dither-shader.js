/**
 * Hero dither — direct port of portfolio index.html renderDither().
 * The WebGL colour buffer replaces vincent.jpg as the tone source (g).
 */
import * as THREE from 'three';

export function createHeroDitherShader(bayerTexture) {
    return {
        uniforms: {
            tDiffuse: { value: null },
            tBayer: { value: bayerTexture(4) },
            resolution: { value: new THREE.Vector2(1, 1) },
            pixelSize: { value: 4 },
            bayerSize: { value: 4 },
            inkColor: { value: new THREE.Color('#9ef0b0') },
            bgColor: { value: new THREE.Color('#0c0c0d') },
            isLight: { value: 0 },
            contrast: { value: 1.25 },
            dotAlpha: { value: 0.88 },
            heroBurst: { value: 1 },
            subjectCenter: { value: new THREE.Vector2(0.5, 0.42) },
            subjectRadii: { value: new THREE.Vector2(0.30, 0.34) },
            bottomFade: { value: 0.78 },
            bottomStart: { value: 0.1 },
            bottomSoft: { value: 0.22 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform sampler2D tBayer;
            uniform vec2 resolution;
            uniform float pixelSize;
            uniform float bayerSize;
            uniform vec3 inkColor;
            uniform vec3 bgColor;
            uniform float isLight;
            uniform float contrast;
            uniform float dotAlpha;
            uniform float heroBurst;
            uniform vec2 subjectCenter;
            uniform vec2 subjectRadii;
            uniform float bottomFade;
            uniform float bottomStart;
            uniform float bottomSoft;
            varying vec2 vUv;

            float hash21(vec2 p) {
                return fract(abs(sin(dot(p + 1.0, vec2(12.9898, 78.233))) * 43758.5453);
            }

            float smoothKeep(float t) {
                t = clamp(t, 0.0, 1.0);
                return t * t * (3.0 - 2.0 * t);
            }

            float bayerAt(vec2 block) {
                vec2 bayerUv = mod(floor(block / pixelSize), bayerSize) / bayerSize;
                return texture2D(tBayer, bayerUv).r;
            }

            vec3 inkDot() {
                return mix(bgColor, inkColor, dotAlpha);
            }

            void main() {
                vec2 block = floor(gl_FragCoord.xy / pixelSize) * pixelSize + pixelSize * 0.5;
                vec2 uv = block / resolution;
                vec3 rgb = texture2D(tDiffuse, uv).rgb;

                float nx = block.x / resolution.x;
                float ny = 1.0 - block.y / resolution.y;
                float b = bayerAt(block);

                float g = dot(rgb, vec3(0.299, 0.587, 0.114));
                g = clamp((g - 0.5) * contrast + 0.5, 0.0, 1.0);

                if (bottomFade > 0.001) {
                    float subject = smoothstep(0.05, 0.14, g);
                    float t = clamp((ny - bottomStart) / bottomSoft, 0.0, 1.0);
                    float keep = smoothKeep(t);
                    if (keep < 1.0) {
                        float h = hash21(floor(block / pixelSize));
                        float gate = mix(keep, 1.0, 1.0 - bottomFade * subject);
                        if (h > gate) {
                            gl_FragColor = vec4(bgColor, 1.0);
                            return;
                        }
                        g *= mix(1.0, keep, bottomFade * subject);
                    }
                }

                float cov = isLight > 0.5 ? (1.0 - g) : g;
                float bgDist = distance(rgb, bgColor);
                bool emptyBg = bgDist < 0.028;

                float fcx = subjectCenter.x;
                float fcy = isLight > 0.5 ? subjectCenter.y : subjectCenter.y - 0.02;
                float frx = max(subjectRadii.x, 0.30);
                float fry = max(subjectRadii.y, 0.34);
                float ddx = (nx - fcx) / frx;
                float ddy = (ny - fcy) / fry;
                float faceDist = sqrt(ddx * ddx + ddy * ddy);

                if (heroBurst > 0.5 && isLight > 0.5) {
                    float lwob = 0.5 + 0.5 * sin(nx * 13.0 + ny * 7.0) * cos(ny * 9.0 - nx * 4.0);
                    float reach = 1.3 + max(0.0, nx - fcx) * 2.4;
                    float tc = clamp((faceDist - 0.85) / 0.45, 0.0, 1.0);
                    float core = 1.0 - smoothKeep(tc);
                    float tt = clamp((faceDist - 1.1) / max(0.001, reach - 1.1), 0.0, 1.0);
                    float tail = (1.0 - smoothKeep(tt)) * (0.28 + 0.5 * lwob);
                    float halo = max(core, tail);
                    cov *= halo;
                    if (emptyBg) cov = max(cov, halo * 0.32);
                }

                vec3 col = bgColor;

                if (cov > b) {
                    bool skip = false;
                    if (heroBurst > 0.5) {
                        if (faceDist > 1.0) {
                            float rightBias = max(0.0, nx - fcx);
                            float falloff = 0.50 + rightBias * 1.9;
                            float tv = min(1.0, (faceDist - 1.0) / falloff);
                            float keep = 1.0 - smoothKeep(tv);
                            if (isLight < 0.5 && keep < 1.0) {
                                float h = hash21(floor(block / pixelSize));
                                if (h > keep) skip = true;
                            }
                        }
                        if (!skip && isLight < 0.5 && ny < 0.16) {
                            float keepB = ny / 0.16;
                            float h = hash21(floor(block / pixelSize));
                            if (h > keepB) skip = true;
                        }
                    }
                    if (!skip) col = inkDot();
                } else if (heroBurst > 0.5 && isLight < 0.5) {
                    float keep = 1.0;
                    if (faceDist > 1.0) {
                        float rightBias = max(0.0, nx - fcx);
                        float falloff = 0.50 + rightBias * 1.9;
                        float tv = min(1.0, (faceDist - 1.0) / falloff);
                        keep = 1.0 - smoothKeep(tv);
                    }
                    float wob = 0.5 + 0.5 * sin(nx * 13.0 + ny * 7.0) * cos(ny * 9.0 - nx * 4.0);
                    float present = (1.0 - g) * keep * (0.04 + 0.24 * wob);
                    if (present > b) col = inkDot();
                }

                gl_FragColor = vec4(col, 1.0);
            }
        `,
    };
}

export function updateSubjectBounds(object, camera, uniforms) {
    if (!object) return;
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
        const sx = v.x * 0.5 + 0.5;
        const sy = -v.y * 0.5 + 0.5;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
    }
    if (!Number.isFinite(minX)) return;
    uniforms.subjectCenter.value.set((minX + maxX) * 0.5, (minY + maxY) * 0.5);
    uniforms.subjectRadii.value.set(
        Math.max(0.30, (maxX - minX) * 0.52),
        Math.max(0.34, (maxY - minY) * 0.52),
    );
}

export function updateThemeDither(uniforms) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    uniforms.isLight.value = isLight ? 1 : 0;
    uniforms.contrast.value = isLight ? 1.22 : 1.25;
    uniforms.dotAlpha.value = isLight ? 0.8 : 0.88;
}

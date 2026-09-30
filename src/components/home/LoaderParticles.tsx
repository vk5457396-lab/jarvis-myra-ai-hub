"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Intro visual: ~2.4k particles start as a live voice waveform, then fold into the rotating voice
 * core (the same object the hero shows), and burst toward the viewer when `leaving` turns true.
 * One small canvas, DPR capped, disposed on unmount. Reduced motion skips straight to a slow core.
 */
const VERT = /* glsl */ `
uniform float uTime; uniform float uMorph; uniform float uExit; uniform float uPx;
attribute vec3 aSphere; attribute float aT; attribute float aRand;
varying float vAlpha; varying float vHeat;

float ease(float t){ return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) / 2.0; }

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

void main(){
  // Waveform: x across, y = layered sines with a centre-weighted envelope (louder in the middle)
  float x = (aT * 2.0 - 1.0) * 3.2;
  float env = exp(-x * x * 0.35);
  float y = (sin(x * 5.0 + uTime * 7.0) * 0.55 + sin(x * 11.0 - uTime * 9.0) * 0.25) * env * (0.35 + 0.65 * abs(sin(uTime * 2.3)));
  vec3 line = vec3(x, y + (aRand - 0.5) * 0.08 * env, (aRand - 0.5) * 0.3);

  vec3 sphere = rotX(0.35) * rotY(uTime * 0.5) * (aSphere * (1.25 + 0.04 * sin(uTime * 3.0 + aRand * 6.28)));

  // Stagger the fold so particles near the centre of the wave arrive first
  float m = clamp(uMorph * 1.35 - abs(aT - 0.5) * 0.7, 0.0, 1.0);
  vec3 p = mix(line, sphere, ease(m));
  p *= 1.0 + uExit * (1.4 + aRand * 1.6);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (1.2 + aRand * 1.8) * (4.0 / -mv.z);
  vAlpha = (0.55 + 0.45 * aRand) * (1.0 - uExit);
  vHeat = mix(env, 0.6 + 0.4 * aRand, ease(m));
}`;

const FRAG = /* glsl */ `
varying float vAlpha; varying float vHeat;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  vec3 deep = vec3(0.86, 0.14, 0.16);
  vec3 hot = vec3(1.0, 0.62, 0.62);
  gl_FragColor = vec4(mix(deep, hot, vHeat), a);
}`;

export default function LoaderParticles({
  leaving,
  onFormed,
  className = "",
}: {
  leaving: boolean;
  /** Called once the core has fully formed (or WebGL is unavailable), so the intro can end. */
  onFormed?: () => void;
  className?: string;
}) {
  const onFormedRef = useRef(onFormed);
  useEffect(() => {
    onFormedRef.current = onFormed;
  }, [onFormed]);
  const host = useRef<HTMLDivElement>(null);
  const leavingRef = useRef(leaving);
  useEffect(() => {
    leavingRef.current = leaving;
  }, [leaving]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      onFormedRef.current?.(); // CSS glow behind stays as the fallback; don't hold the intro
      return;
    }
    const small = window.matchMedia("(max-width: 768px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;opacity:0;transition:opacity .35s ease";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0, 7);

    const N = small ? 1500 : 2400;
    const pos = new Float32Array(N * 3); // unused by the shader but required by three
    const sphere = new Float32Array(N * 3);
    const tArr = new Float32Array(N);
    const rand = new Float32Array(N);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const yy = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - yy * yy);
      const th = golden * i;
      sphere.set([Math.cos(th) * r, yy, Math.sin(th) * r], i * 3);
      tArr[i] = (i * 0.6180339887) % 1; // spread along the wave independent of sphere order
      rand[i] = ((i * 9301 + 49297) % 233280) / 233280; // deterministic pseudo-random
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSphere", new THREE.BufferAttribute(sphere, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(tArr, 1));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uMorph: { value: 0 }, uExit: { value: 0 }, uPx: { value: dpr * 2.2 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(geo, mat));

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = 0;
    let t = 0;
    let morph = noMotion ? 1 : 0;
    let exit = 0;
    const HOLD = 0.35; // seconds of waveform before folding
    const FOLD = 0.9;
    const SHOW_CORE = 0.35; // let the finished core be seen before the intro may end
    let formedAt = noMotion ? 0 : -1;
    let reported = false;

    renderer.setAnimationLoop((ts: number) => {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      t += dt * (noMotion ? 0.3 : 1);
      if (!noMotion && t > HOLD) morph = Math.min(1, morph + dt / FOLD);
      if (morph >= 1 && formedAt < 0) formedAt = t;
      if (!reported && formedAt >= 0 && t - formedAt >= SHOW_CORE) {
        reported = true;
        onFormedRef.current?.();
      }
      if (leavingRef.current) exit = Math.min(1, exit + dt / 0.45);
      mat.uniforms.uTime.value = t;
      mat.uniforms.uMorph.value = morph;
      mat.uniforms.uExit.value = noMotion ? 0 : exit;
      renderer.render(scene, camera);
      if (canvas.style.opacity !== "1") canvas.style.opacity = "1";
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={host} className={className} />;
}

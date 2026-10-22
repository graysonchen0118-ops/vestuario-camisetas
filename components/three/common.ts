import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export async function shirtFont() {
  const css = getComputedStyle(document.body);
  const family = (css.getPropertyValue('--font-lexend') || css.fontFamily || 'sans-serif').trim();
  try {
    await Promise.all([document.fonts.load(`800 80px ${family}`), document.fonts.load(`700 80px ${family}`)]);
  } catch {}
  return family;
}

export const isPhone = () => typeof window !== 'undefined' && window.innerWidth < 768;
export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function makeRenderer(canvas: HTMLCanvasElement, opts: { alpha?: boolean; shadows?: boolean; maxDpr?: number } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.alpha ?? true, powerPreference: 'high-performance' });
  const cap = opts.maxDpr ?? (isPhone() ? 1.5 : 2);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (opts.shadows && !isPhone()) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }
  return renderer;
}

export function studioEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene, intensity = 0.55) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = intensity;
  pmrem.dispose();
  return env;
}

/** Runs the loop only while the canvas is on screen and the tab is visible. */
export function visibleLoop(el: Element, frame: (t: number, dt: number) => void) {
  let raf = 0;
  let onScreen = true;
  let last = performance.now();
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    if (!onScreen || document.hidden) {
      last = t;
      return;
    }
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    frame(t / 1000, dt);
  };
  const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting), { rootMargin: '120px' });
  io.observe(el);
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

export function contactShadow(width = 2.2, depth = 0.7, opacity = 0.32) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(14,19,32,${opacity})`);
  grd.addColorStop(1, 'rgba(14,19,32,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, dispose: () => { tex.dispose(); mat.dispose(); mesh.geometry.dispose(); } };
}

export function disposeScene(scene: THREE.Object3D) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture && !v.userData.shared) v.dispose();
      mat.dispose();
    }
  });
}

export const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

/**
 * Drops the drawing resolution while frames are slow and raises it back when they are fast,
 * so a weak phone keeps a smooth scene and a good GPU keeps a sharp one.
 */
export function adaptivePixelRatio(renderer: THREE.WebGLRenderer, el: HTMLElement, max: number) {
  let ratio = Math.min(window.devicePixelRatio || 1, max);
  let ema = 1 / 60;
  let cooldown = 1;
  let last = performance.now();
  return () => {
    const now = performance.now();
    const dt = Math.min(1, (now - last) / 1000);
    last = now;
    ema = ema * 0.8 + dt * 0.2;
    if (cooldown > 0) {
      cooldown -= dt;
      return;
    }
    let next = ratio;
    if (ema > 1 / 28 && ratio > 0.75) next = Math.max(0.75, ratio * 0.85);
    else if (ema < 1 / 55 && ratio < max) next = Math.min(max, ratio * 1.12);
    if (next !== ratio) {
      ratio = next;
      renderer.setPixelRatio(ratio);
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      cooldown = 0.5;
    }
  };
}

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createShirt, type Kit, type Print, type ShirtHandle } from './shirt';
import { makeRenderer, studioEnvironment, visibleLoop, shirtFont, reducedMotion, contactShadow, disposeScene, damp, adaptivePixelRatio, isPhone } from './common';

type Props = {
  kit: Kit;
  print: Print | null;
  view: 'front' | 'back';
  spin: number;
  onReady?: () => void;
  onDragView?: (v: 'front' | 'back') => void;
  height?: number;
};

/** One shirt on a turntable. Dragging turns it, the print repaints live, adding to the cart spins it once. */
export default function Configurator({ kit, print, view, spin, onReady, onDragView, height }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const shirtRef = useRef<ShirtHandle | null>(null);
  const target = useRef(view === 'back' ? Math.PI : 0);
  const spinStart = useRef(-10);
  const clock = useRef(0);
  const kitRef = useRef(kit);
  const printRef = useRef(print);

  useEffect(() => {
    target.current = view === 'back' ? Math.PI : 0;
  }, [view]);

  useEffect(() => {
    printRef.current = print;
    const t = setTimeout(() => shirtRef.current?.setPrint(print), 60);
    return () => clearTimeout(t);
  }, [print]);

  useEffect(() => {
    kitRef.current = kit;
    shirtRef.current?.setKit(kit);
  }, [kit]);

  useEffect(() => {
    if (spin > 0) spinStart.current = clock.current;
  }, [spin]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let stop = () => {};
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const still = reducedMotion();
    const renderer = makeRenderer(canvas, { shadows: false });
    const scene = new THREE.Scene();
    studioEnvironment(renderer, scene, 0.55);
    const key = new THREE.DirectionalLight('#ffffff', 1.3);
    key.position.set(2.5, 3, 4);
    const back = new THREE.DirectionalLight('#ffffff', 0.9);
    back.position.set(-2, 2.5, -4);
    const rim = new THREE.DirectionalLight('#9fb3ff', 0.6);
    rim.position.set(-4, 1, 1);
    scene.add(key, back, rim);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 0.15, 4.5);
    camera.lookAt(0, 0.12, 0);
    const shadow = contactShadow(2.4, 0.8, 0.28);
    shadow.mesh.position.y = -0.95;
    scene.add(shadow.mesh);

    let angle = target.current;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    let idle = 0;

    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = dx * 0.012;
      angle += vel;
      idle = 0;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const facingBack = norm > Math.PI / 2 && norm < (Math.PI * 3) / 2;
      const base = angle - norm;
      target.current = base + (facingBack ? Math.PI : norm > Math.PI ? Math.PI * 2 : 0);
      onDragView?.(facingBack ? 'back' : 'front');
    };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.85 ? 5.4 : 4.5;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    (async () => {
      const font = await shirtFont();
      if (disposed) return;
      const shirt = createShirt(kitRef.current, printRef.current, { font, detail: 'high', anisotropy: 8 });
      shirtRef.current = shirt;
      scene.add(shirt.group);
      resize();
      renderer.render(scene, camera);
      onReady?.();
      const adapt = adaptivePixelRatio(renderer, el, isPhone() ? 1.5 : 2);
      stop = visibleLoop(el, (t, dt) => {
        adapt();
        clock.current = t;
        idle += dt;
        if (!dragging) {
          // snap towards the side being edited, with a slow breathing turn when left alone
          const breathe = still || idle < 2.5 ? 0 : Math.sin((idle - 2.5) * 0.6) * 0.32;
          const wrap = Math.round((angle - target.current) / (Math.PI * 2)) * Math.PI * 2;
          angle = damp(angle, target.current + wrap + breathe, 4, dt);
        }
        const s = t - spinStart.current;
        const spinning = s >= 0 && s < 1.2;
        const k = spinning ? 1 - Math.pow(1 - s / 1.2, 3) : 0;
        shirt.group.rotation.y = angle + (spinning ? k * Math.PI * 2 : 0);
        shirt.group.position.y = spinning ? Math.sin((s / 1.2) * Math.PI) * 0.22 : damp(shirt.group.position.y, still ? 0 : Math.sin(t * 1.2) * 0.02, 3, dt);
        shirt.group.rotation.x = -0.04;
        shadow.mesh.scale.setScalar(1 - shirt.group.position.y * 0.8);
        renderer.render(scene, camera);
      });
    })();

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      shirtRef.current?.dispose();
      shirtRef.current = null;
      shadow.dispose();
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0, height }} />;
}

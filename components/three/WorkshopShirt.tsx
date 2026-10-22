'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createShirt, type Kit, type Print, type ShirtHandle } from './shirt';
import { makeRenderer, studioEnvironment, visibleLoop, shirtFont, reducedMotion, contactShadow, disposeScene, damp, adaptivePixelRatio, isPhone } from './common';

/** The workshop sheet: the shirt as it has to leave the press, with exactly what the customer typed. */
export default function WorkshopShirt({ kit, print, flip }: { kit: Kit; print: Print | null; flip: number }) {
  const host = useRef<HTMLDivElement>(null);
  const shirtRef = useRef<ShirtHandle | null>(null);
  const flipAt = useRef(-10);
  const clock = useRef(0);
  const initial = useRef({ kit, print });

  useEffect(() => {
    shirtRef.current?.setKit(kit);
    shirtRef.current?.setPrint(print);
  }, [kit, print]);

  useEffect(() => {
    if (flip > 0) flipAt.current = clock.current;
  }, [flip]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let stop = () => {};
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const still = reducedMotion();
    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    studioEnvironment(renderer, scene, 0.6);
    const key = new THREE.DirectionalLight('#ffffff', 1.2);
    key.position.set(-2, 3, -4);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
    camera.position.set(0, 0.15, -4.6);
    camera.lookAt(0, 0.12, 0);
    const shadow = contactShadow(2.2, 0.7, 0.25);
    shadow.mesh.position.y = -0.92;
    scene.add(shadow.mesh);
    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    (async () => {
      const font = await shirtFont();
      if (disposed) return;
      const s = createShirt(initial.current.kit, initial.current.print, { font, detail: 'high' });
      shirtRef.current = s;
      scene.add(s.group);
      resize();
      let sway = 0;
      const adapt = adaptivePixelRatio(renderer, el, isPhone() ? 1.5 : 2);
      stop = visibleLoop(el, (t, dt) => {
        adapt();
        clock.current = t;
        const f = t - flipAt.current;
        const flipping = f >= 0 && f < 1;
        const turn = flipping ? (1 - Math.pow(1 - f, 3)) * Math.PI * 2 : 0;
        sway = damp(sway, still ? 0 : Math.sin(t * 0.7) * 0.3, 3, dt);
        s.group.rotation.y = sway + turn;
        s.group.position.y = flipping ? Math.sin(f * Math.PI) * 0.18 : 0;
        renderer.render(scene, camera);
      });
    })();
    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      shirtRef.current?.dispose();
      shirtRef.current = null;
      shadow.dispose();
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}

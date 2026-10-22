'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createShirt, type Kit, type ShirtHandle } from './shirt';
import { makeRenderer, studioEnvironment, shirtFont, isPhone, reducedMotion, disposeScene, damp } from './common';

/**
 * The layer behind every page: shirts and dorsal numbers float at different depths.
 * Scrolling moves the camera down through them, so near layers pass faster than far ones.
 */
export default function Backdrop({ kits, tone = 'light', density = 1 }: { kits: Kit[]; tone?: 'light' | 'panel'; density?: number }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let raf = 0;
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const phone = isPhone();
    const still = reducedMotion();
    const renderer = makeRenderer(canvas, { maxDpr: 1 });
    renderer.setPixelRatio(phone ? 0.6 : 0.75);
    const scene = new THREE.Scene();
    const bg = tone === 'panel' ? '#eef0f5' : '#f4f5f8';
    scene.fog = new THREE.Fog(bg, 6, 22);
    studioEnvironment(renderer, scene, 0.7);
    const light = new THREE.DirectionalLight('#ffffff', 1.1);
    light.position.set(3, 4, 6);
    scene.add(light);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 8);

    type Item = { obj: THREE.Object3D; speed: number; spin: THREE.Vector3; base: THREE.Vector3; kick: number };
    const items: Item[] = [];
    const shirts: ShirtHandle[] = [];
    let rnd = 11;
    const r = () => ((rnd = (rnd * 16807) % 2147483647) - 1) / 2147483646;

    const numberTexture = (n: string, color: string) => {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d')!;
      g.font = `800 200px ${getComputedStyle(document.body).getPropertyValue('--font-lexend') || 'sans-serif'}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = color;
      g.fillText(n, 128, 140);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };

    let scrollY = window.scrollY;
    let targetScroll = scrollY;
    let px = 0, py = 0;
    const onScroll = () => (targetScroll = window.scrollY);
    const onPointer = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
    };
    const onAdd = () => {
      // an item added to the cart sends the nearest shirt up with a turn
      const near = items.filter((i) => i.obj.userData.shirt).sort((a, b) => b.base.z - a.base.z)[0];
      if (near) near.kick = 1;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('vestuario:add', onAdd);
    window.addEventListener('vestuario:status', onAdd);

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();

    (async () => {
      const font = await shirtFont();
      if (disposed) return;
      const count = Math.round((phone ? 6 : 11) * density);
      for (let i = 0; i < count; i++) {
        const kit = kits[i % kits.length];
        const s = createShirt(kit, { name: '', number: String([7, 9, 10, 14, 8, 11, 4, 23][i % 8]) }, { font, detail: 'low', anisotropy: 1 });
        shirts.push(s);
        const z = -2 - r() * 12;
        const spread = 4 + -z * 0.55;
        const base = new THREE.Vector3((r() - 0.5) * spread * 2, (r() - 0.5) * 40, z);
        s.group.position.copy(base);
        s.group.scale.setScalar(0.55 + r() * 0.35);
        s.group.rotation.set(r() * 0.6 - 0.3, r() * Math.PI * 2, r() * 0.6 - 0.3);
        s.group.userData.shirt = true;
        scene.add(s.group);
        items.push({ obj: s.group, speed: 0.35 + (14 + z) * 0.05, spin: new THREE.Vector3(r() * 0.1, 0.12 + r() * 0.2, r() * 0.08), base, kick: 0 });
      }
      const accent = tone === 'panel' ? '#b8c4ff' : '#c4cefa';
      for (let i = 0; i < Math.round((phone ? 5 : 9) * density); i++) {
        const tex = numberTexture(String([1, 7, 9, 10, 14, 23, 5, 11, 3][i % 9]), i % 3 === 0 ? '#d6ff5c' : accent);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        const z = -3 - r() * 10;
        const base = new THREE.Vector3((r() - 0.5) * 14, (r() - 0.5) * 40, z);
        m.position.copy(base);
        scene.add(m);
        items.push({ obj: m, speed: 0.3 + (13 + z) * 0.05, spin: new THREE.Vector3(0, 0.25 + r() * 0.3, 0), base, kick: 0 });
      }
      let last = performance.now();
      let tick = 0;
      const hero = document.querySelector('.hero');
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (document.hidden) { last = now; return; }
        // a soft background does not need every frame, and nothing shows while an opaque hero fills the screen
        if (++tick % 2) return;
        const hr = hero?.isConnected ? hero.getBoundingClientRect() : null;
        if (hr && hr.top <= 0 && hr.bottom >= window.innerHeight) { last = now; return; }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = now / 1000;
        scrollY = damp(scrollY, targetScroll, 6, dt);
        camera.position.x = damp(camera.position.x, px * 0.8, 2, dt);
        camera.position.y = damp(camera.position.y, -py * 0.6, 2, dt);
        camera.lookAt(0, camera.position.y * 0.3, -6);
        const span = 40;
        for (const it of items) {
          let y = it.base.y + (scrollY / window.innerHeight) * 3.2 * it.speed + (still ? 0 : Math.sin(t * 0.3 + it.base.x) * 0.15);
          y = ((((y + span / 2) % span) + span) % span) - span / 2;
          it.kick = damp(it.kick, 0, 1.6, dt);
          it.obj.position.set(it.base.x, y + it.kick * 1.2, it.base.z + it.kick * 1.5);
          if (!still) {
            it.obj.rotation.y += it.spin.y * dt + it.kick * dt * 9;
            it.obj.rotation.x += it.spin.x * dt * 0.3;
          }
        }
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('vestuario:add', onAdd);
      window.removeEventListener('vestuario:status', onAdd);
      window.removeEventListener('resize', resize);
      shirts.forEach((s) => s.dispose());
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="backdrop3d" aria-hidden style={{ opacity: tone === 'panel' ? 0.36 : 0.42 }} />;
}

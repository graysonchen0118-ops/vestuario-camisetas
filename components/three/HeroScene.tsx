'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createShirt, createHanger, type Kit, type ShirtHandle } from './shirt';
import { makeRenderer, studioEnvironment, visibleLoop, shirtFont, isPhone, reducedMotion, disposeScene, damp, adaptivePixelRatio } from './common';

export type HeroShirt = { kit: Kit; name: string; number: string };

/** A locker room: shirts hanging in front of the lockers, the centre one carries the name being typed. */
export default function HeroScene({ shirts, center, onReady }: { shirts: HeroShirt[]; center: { name: string; number: string }; onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const centerRef = useRef<ShirtHandle | null>(null);
  const centerPrint = useRef(center);
  const pulse = useRef(0);

  useEffect(() => {
    centerPrint.current = center;
    const t = setTimeout(() => {
      centerRef.current?.setPrint({ name: center.name || 'TU NOMBRE', number: center.number || '10' });
      pulse.current = 1;
    }, 120);
    return () => clearTimeout(t);
  }, [center]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let stop = () => {};
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const phone = isPhone();
    const still = reducedMotion();
    const renderer = makeRenderer(canvas, { maxDpr: phone ? 1.25 : 1.5 });
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#0b1222', 7, 16);
    studioEnvironment(renderer, scene, 0.32);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    const world = new THREE.Group();
    scene.add(world);

    // lockers
    // the room is lit cheaply, the shirts get the physically based materials
    const lockerMat = new THREE.MeshLambertMaterial({ color: '#22345e' });
    const slotMat = new THREE.MeshLambertMaterial({ color: '#0d1630' });
    const plateMat = new THREE.MeshLambertMaterial({ color: '#d9def0' });
    // one draw call per kind of part: bodies, vent slots, name plates
    const lockers = new THREE.Group();
    const lockerCount = phone ? 7 : 11;
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.98, 3.4, 0.5), lockerMat, lockerCount);
    const slots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.035, 0.02), slotMat, lockerCount * 4);
    const plates = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.12, 0.02), plateMat, lockerCount);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < lockerCount; i++) {
      const x = (i - (lockerCount - 1) / 2) * 1.02;
      bodies.setMatrixAt(i, m4.makeTranslation(x, 0.3, -2.6));
      for (let v = 0; v < 4; v++) slots.setMatrixAt(i * 4 + v, m4.makeTranslation(x, 1.65 - v * 0.09, -2.34));
      plates.setMatrixAt(i, m4.makeTranslation(x, 1.2, -2.34));
    }
    lockers.add(bodies, slots, plates);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(lockerCount * 1.02, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: '#9fb3ff' }));
    strip.position.set(0, 2.05, -2.3);
    lockers.add(strip);
    world.add(lockers);

    // floor and bench
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshLambertMaterial({ color: '#141d36' }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.42;
    world.add(floor);
    const wood = new THREE.MeshLambertMaterial({ color: '#a8743f' });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(lockerCount * 0.9, 0.09, 0.5), wood);
    bench.position.set(0, -0.98, -1.85);
    world.add(bench);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.42), slotMat);
      leg.position.set(sx * lockerCount * 0.38, -1.2, -1.85);
      world.add(leg);
    }

    // lights
    const key = new THREE.DirectionalLight('#ffffff', 1.25);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    scene.add(new THREE.HemisphereLight('#9fb3ff', '#0b1222', 0.9));
    const rim = new THREE.DirectionalLight('#7f97ff', 0.9);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    const spot = new THREE.SpotLight('#fff3dd', 18, 9, 0.42, 0.6, 1.4);
    spot.position.set(0, 3.6, 1.2);
    spot.target.position.set(0, 0, -0.9);
    scene.add(spot, spot.target);

    type Hung = { group: THREE.Group; shirt: ShirtHandle; base: THREE.Vector3; phase: number; hover: number };
    const hung: Hung[] = [];

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(9, 9);
    let px = 0, py = 0;
    let scrollP = 0;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w / h > 1.25 && w > 900;
      world.position.x = wide ? Math.min(2.4, (w / h - 1.25) * 2.6 + 0.8) : 0;
      camera.position.z = wide ? 7.4 : w / h < 0.9 ? 9.2 : 7.8;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.set(px, py);
    };
    const onLeave = () => pointer.set(9, 9);
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      scrollP = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    (async () => {
      const font = await shirtFont();
      if (disposed) return;
      const n = shirts.length;
      shirts.forEach((s, i) => {
        const isCenter = i === Math.floor(n / 2);
        const print = isCenter ? { name: centerPrint.current.name || 'TU NOMBRE', number: centerPrint.current.number || '10' } : { name: s.name, number: s.number };
        const shirt = createShirt(s.kit, print, { font, detail: phone ? 'low' : 'mid', anisotropy: 4 });
        const hanger = createHanger();
        const g = new THREE.Group();
        g.add(shirt.group, hanger.group);
        const offset = i - (n - 1) / 2;
        const base = new THREE.Vector3(offset * 1.55, 0.45 + (isCenter ? 0.05 : 0), isCenter ? -0.7 : -1.35 - Math.abs(offset) * 0.12);
        g.position.copy(base);
        g.rotation.y = Math.PI + offset * 0.16;
        g.scale.setScalar(isCenter ? 1.0 : 0.86);
        g.userData.index = hung.length;
        world.add(g);
        hung.push({ group: g, shirt, base, phase: i * 1.7, hover: 0 });
        if (isCenter) centerRef.current = shirt;
      });
      resize();
      renderer.render(scene, camera);
      onReady?.();
      const adapt = adaptivePixelRatio(renderer, el, phone ? 1.25 : 1.5);
      stop = visibleLoop(el, (t, dt) => {
        adapt();
        camera.position.x = damp(camera.position.x, px * 0.55, 3, dt);
        camera.position.y = damp(camera.position.y, 0.35 + py * 0.3 + scrollP * 1.4, 3, dt);
        camera.lookAt(world.position.x * 0.55, 0.1 - scrollP * 0.4, -1.2);
        world.rotation.y = damp(world.rotation.y, -scrollP * 0.25, 4, dt);

        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(hung.map((h) => h.group), true);
        let hovered = -1;
        if (hits.length) {
          let o: THREE.Object3D | null = hits[0].object;
          while (o && o.userData.index === undefined) o = o.parent;
          hovered = (o?.userData.index as number) ?? -1;
        }
        pulse.current = damp(pulse.current, 0, 2.2, dt);
        hung.forEach((h, i) => {
          h.hover = damp(h.hover, i === hovered ? 1 : 0, 6, dt);
          const sway = still ? 0 : Math.sin(t * 0.9 + h.phase) * 0.035;
          const isCenter = h.shirt === centerRef.current;
          const spin = isCenter ? pulse.current * Math.PI * 2 : 0;
          h.group.rotation.z = sway;
          h.group.rotation.y = Math.PI + (h.base.x / 1.55) * 0.16 - h.hover * 0.55 + spin * 0.12 + (still ? 0 : Math.sin(t * 0.5 + h.phase) * 0.06);
          h.group.position.y = h.base.y + h.hover * 0.12 + (isCenter ? pulse.current * 0.15 : 0);
          h.group.position.z = h.base.z + h.hover * 0.3 - scrollP * (i % 2 ? 0.6 : 1.1);
        });
        renderer.render(scene, camera);
      });
    })();

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      hung.forEach((h) => h.shirt.dispose());
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className="hero-canvas" />;
}

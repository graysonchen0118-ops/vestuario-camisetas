import * as THREE from 'three';

export type Pattern =
  | 'plain'
  | 'stripes'
  | 'hoops'
  | 'halves'
  | 'sash'
  | 'pinstripes'
  | 'gradient'
  | 'chevron'
  | 'quarters'
  | 'sleeves';

export type Kit = {
  base: string;
  second: string;
  trim: string;
  ink: string;
  pattern: Pattern;
  crest: string;
};

export type Print = { name: string; number: string; patch?: boolean };

const MIN_X = -1.04;
const MAX_X = 1.04;
const MIN_Y = -0.7;
const MAX_Y = 1.02;
const W = MAX_X - MIN_X;
const H = MAX_Y - MIN_Y;
const TEX_W = 1024;
const TEX_H = Math.round((TEX_W * H) / W);

type P = [number, number];

function quad(a: P, c: P, b: P, n: number): P[] {
  const out: P[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}

/** Right half of the shirt, from the neck centre to the hem centre, in viewer space. */
function rightHalf(neckY: number): P[] {
  const pts: P[] = [[0, neckY]];
  let cur: P = [0, neckY];
  const seg = (c: P, b: P, n = 10) => {
    pts.push(...quad(cur, c, b, n));
    cur = b;
  };
  seg([0.15, neckY + 0.005], [0.22, 1.0], 10);
  seg([0.4, 0.985], [0.56, 0.92], 8);
  seg([0.84, 0.79], [1.02, 0.54], 12);
  seg([0.93, 0.43], [0.81, 0.3], 6);
  seg([0.66, 0.36], [0.56, 0.44], 8);
  seg([0.5, 0.15], [0.5, -0.12], 10);
  seg([0.51, -0.4], [0.55, -0.62], 10);
  seg([0.3, -0.665], [0, -0.66], 10);
  return pts;
}

export function outline(neckY: number): P[] {
  const r = rightHalf(neckY);
  const l = r
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [-x, y] as P);
  return [...r, ...l];
}

const FRONT = outline(0.82);
const BACK = outline(0.95);

function inside(poly: P[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function edgeDistance(poly: P[], x: number, y: number) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const ex = ax + dx * t - x;
    const ey = ay + dy * t - y;
    best = Math.min(best, ex * ex + ey * ey);
  }
  return Math.sqrt(best);
}

/** How far the body curves away from the viewer towards the sides. */
const curve = (x: number) => -0.11 * x * x;

const geoCache = new Map<string, THREE.BufferGeometry>();

function panel(side: 1 | -1, nx: number, ny: number) {
  const key = `${side}:${nx}:${ny}`;
  const cached = geoCache.get(key);
  if (cached) return cached;
  const poly = side === 1 ? FRONT : BACK;
  const pos: number[] = [];
  const uv: number[] = [];
  const ins: boolean[] = [];
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = MIN_X + (W * i) / nx;
      const y = MIN_Y + (H * j) / ny;
      const isIn = inside(poly, x, y);
      ins.push(isIn);
      let p = 0;
      if (isIn) {
        const d = edgeDistance(poly, x, y);
        p = 0.17 * Math.sqrt(Math.min(d / 0.34, 1));
        const lower = Math.max(0, Math.min(1, (-0.15 - y) / 0.45));
        p += 0.014 * Math.sin(x * 11 + 0.6) * lower * Math.min(d / 0.1, 1);
        p += 0.008 * Math.sin(y * 7 + x * 3) * Math.min(d / 0.1, 1);
      }
      pos.push(x, y, curve(x) + side * p);
      const u = side === 1 ? (x - MIN_X) / W : (MAX_X - x) / W;
      uv.push(u, (y - MIN_Y) / H);
    }
  }
  const idx: number[] = [];
  const row = nx + 1;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      if (!(ins[a] || ins[b] || ins[c] || ins[d])) continue;
      if (side === 1) idx.push(a, b, d, a, d, c);
      else idx.push(a, d, b, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.shared = true;
  geoCache.set(key, g);
  return g;
}

const toPx = (x: number) => ((x - MIN_X) / W) * TEX_W;
const toPy = (y: number) => ((MAX_Y - y) / H) * TEX_H;
const unit = TEX_W / W;

function tracePath(ctx: CanvasRenderingContext2D, poly: P[]) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i ? ctx.lineTo(toPx(x), toPy(y)) : ctx.moveTo(toPx(x), toPy(y))));
  ctx.closePath();
}

function drawPattern(ctx: CanvasRenderingContext2D, kit: Kit) {
  const { base, second, pattern } = kit;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = second;
  if (pattern === 'stripes') {
    const w = 0.17 * unit;
    for (let x = toPx(0) - w / 2 - 6 * 2 * w; x < TEX_W; x += 2 * w) ctx.fillRect(x, 0, w, TEX_H);
  } else if (pattern === 'pinstripes') {
    const w = 0.022 * unit;
    for (let x = toPx(0) - 20 * 0.13 * unit; x < TEX_W; x += 0.13 * unit) ctx.fillRect(x, 0, w, TEX_H);
  } else if (pattern === 'hoops') {
    const h = 0.17 * unit;
    for (let y = toPy(0.62); y < TEX_H; y += 2 * h) ctx.fillRect(0, y, TEX_W, h);
  } else if (pattern === 'halves') {
    ctx.fillRect(toPx(0), 0, TEX_W, TEX_H);
  } else if (pattern === 'quarters') {
    ctx.fillRect(toPx(0), 0, TEX_W, toPy(-0.1));
    ctx.fillRect(0, toPy(-0.1), toPx(0), TEX_H);
  } else if (pattern === 'sash') {
    ctx.save();
    ctx.translate(toPx(0), toPy(0));
    ctx.rotate(-0.72);
    ctx.fillRect(-TEX_W, -0.16 * unit, TEX_W * 2, 0.32 * unit);
    ctx.restore();
  } else if (pattern === 'gradient') {
    const g = ctx.createLinearGradient(0, toPy(0.9), 0, toPy(-0.65));
    g.addColorStop(0, base);
    g.addColorStop(1, second);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  } else if (pattern === 'chevron') {
    ctx.beginPath();
    ctx.moveTo(toPx(-1.1), toPy(0.55));
    ctx.lineTo(toPx(0), toPy(0.05));
    ctx.lineTo(toPx(1.1), toPy(0.55));
    ctx.lineTo(toPx(1.1), toPy(0.3));
    ctx.lineTo(toPx(0), toPy(-0.2));
    ctx.lineTo(toPx(-1.1), toPy(0.3));
    ctx.closePath();
    ctx.fill();
  } else if (pattern === 'sleeves') {
    ctx.fillRect(0, 0, toPx(-0.5), TEX_H);
    ctx.fillRect(toPx(0.5), 0, TEX_W, TEX_H);
  }
}

function drawTrim(ctx: CanvasRenderingContext2D, kit: Kit, neckY: number) {
  ctx.strokeStyle = kit.trim;
  ctx.lineCap = 'round';
  // cuffs
  ctx.lineWidth = 0.075 * unit;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(toPx(s * 1.02), toPy(0.54));
    ctx.lineTo(toPx(s * 0.81), toPy(0.3));
    ctx.stroke();
  }
  // collar band
  ctx.lineWidth = 0.07 * unit;
  ctx.beginPath();
  const neck = quad([0, neckY], [0.15, neckY + 0.005], [0.22, 1.0], 12);
  ctx.moveTo(toPx(-0.22), toPy(1.0));
  [...neck].reverse().forEach(([x, y]) => ctx.lineTo(toPx(-x), toPy(y)));
  neck.forEach(([x, y]) => ctx.lineTo(toPx(x), toPy(y)));
  ctx.stroke();
  // side seams, a hint of shade that sells the volume
  const g = ctx.createLinearGradient(toPx(-0.58), 0, toPx(0.58), 0);
  g.addColorStop(0, 'rgba(0,0,0,0.16)');
  g.addColorStop(0.18, 'rgba(0,0,0,0)');
  g.addColorStop(0.82, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
}

function drawCrest(ctx: CanvasRenderingContext2D, kit: Kit, font: string) {
  const cx = toPx(0.28);
  const cy = toPy(0.6);
  const s = 0.2 * unit;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(-s / 2, -s / 2);
  ctx.lineTo(s / 2, -s / 2);
  ctx.lineTo(s / 2, s * 0.05);
  ctx.quadraticCurveTo(s / 2, s * 0.45, 0, s * 0.62);
  ctx.quadraticCurveTo(-s / 2, s * 0.45, -s / 2, s * 0.05);
  ctx.closePath();
  ctx.fillStyle = kit.trim;
  ctx.fill();
  ctx.lineWidth = s * 0.08;
  ctx.strokeStyle = kit.ink === kit.trim ? kit.base : kit.ink;
  ctx.stroke();
  ctx.fillStyle = kit.ink === kit.trim ? kit.base : kit.ink;
  ctx.font = `800 ${s * 0.36}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(kit.crest, 0, s * 0.02);
  ctx.restore();
  // maker mark, a plain chevron with no brand behind it
  ctx.save();
  ctx.translate(toPx(-0.28), toPy(0.63));
  ctx.strokeStyle = kit.trim;
  ctx.lineWidth = 0.03 * unit;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.07 * unit, -0.035 * unit);
  ctx.lineTo(0, 0.035 * unit);
  ctx.lineTo(0.07 * unit, -0.035 * unit);
  ctx.stroke();
  ctx.restore();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, max: number, font: string) {
  let s = size;
  ctx.font = `${weight} ${s}px ${font}`;
  while (ctx.measureText(text).width > max && s > 10) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${font}`;
  }
  return s;
}

function drawBackPrint(ctx: CanvasRenderingContext2D, kit: Kit, print: Print, font: string) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const name = print.name.trim().toUpperCase();
  if (name) {
    ctx.save();
    try {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${0.012 * unit}px`;
    } catch {}
    fitText(ctx, name, 700, 0.135 * unit, 0.78 * unit, font);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.016 * unit;
    ctx.strokeStyle = kit.trim === kit.ink ? kit.base : kit.trim;
    ctx.strokeText(name, toPx(0), toPy(0.62));
    ctx.fillStyle = kit.ink;
    ctx.fillText(name, toPx(0), toPy(0.62));
    ctx.restore();
  }
  const num = print.number.trim();
  if (num) {
    fitText(ctx, num, 800, 0.56 * unit, 0.82 * unit, font);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.032 * unit;
    ctx.strokeStyle = kit.trim === kit.ink ? kit.base : kit.trim;
    ctx.strokeText(num, toPx(0), toPy(0.12));
    ctx.fillStyle = kit.ink;
    ctx.fillText(num, toPx(0), toPy(0.12));
  }
}

function drawPatch(ctx: CanvasRenderingContext2D) {
  // league patch on the right sleeve, seen from the front
  ctx.save();
  ctx.translate(toPx(0.76), toPy(0.66));
  ctx.rotate(0.62);
  const r = 0.085 * unit;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-r, -r * 1.2, r * 2, r * 2.4, r * 0.4);
  ctx.fill();
  ctx.fillStyle = '#d4a72c';
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b2440';
  ctx.fillRect(-r * 0.7, r * 0.55, r * 1.4, r * 0.28);
  ctx.restore();
}

export function paint(canvas: HTMLCanvasElement, kit: Kit, side: 'front' | 'back', print: Print | null, font: string) {
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, TEX_W, TEX_H);
  const poly = side === 'front' ? FRONT : BACK;
  ctx.save();
  tracePath(ctx, poly);
  ctx.clip();
  drawPattern(ctx, kit);
  drawTrim(ctx, kit, side === 'front' ? 0.82 : 0.95);
  if (side === 'front') {
    drawCrest(ctx, kit, font);
    if (print?.patch) drawPatch(ctx);
  } else if (print) {
    drawBackPrint(ctx, kit, print, font);
  }
  ctx.restore();
  return canvas;
}

let weave: THREE.CanvasTexture | null = null;
function weaveTexture() {
  if (weave) return weave;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#5a5a5a';
  for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 64; x += 8) {
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  weave = new THREE.CanvasTexture(c);
  weave.userData.shared = true;
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(26, 26);
  return weave;
}

function material(tex: THREE.Texture, detail: Detail) {
  const m =
    detail === 'high'
      ? new THREE.MeshPhysicalMaterial({ map: tex, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.82, sheen: 0.25, sheenRoughness: 0.75, sheenColor: new THREE.Color('#ffffff') })
      : new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.84 });
  if (detail !== 'low') {
    m.bumpMap = weaveTexture();
    m.bumpScale = 0.35;
  }
  return m;
}

export type ShirtHandle = {
  group: THREE.Group;
  setPrint: (p: Print | null) => void;
  setKit: (k: Kit) => void;
  dispose: () => void;
};

export type Detail = 'high' | 'mid' | 'low';

export function createShirt(kit: Kit, print: Print | null, opts: { font: string; detail?: Detail; anisotropy?: number }): ShirtHandle {
  const detail = opts.detail ?? 'high';
  const nx = detail === 'high' ? 64 : detail === 'mid' ? 44 : 28;
  const ny = detail === 'high' ? 72 : detail === 'mid' ? 50 : 32;
  const frontCanvas = document.createElement('canvas');
  const backCanvas = document.createElement('canvas');
  let current = kit;
  let currentPrint = print;
  paint(frontCanvas, kit, 'front', print, opts.font);
  paint(backCanvas, kit, 'back', print, opts.font);
  const frontTex = new THREE.CanvasTexture(frontCanvas);
  const backTex = new THREE.CanvasTexture(backCanvas);
  for (const t of [frontTex, backTex]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = opts.anisotropy ?? 4;
  }
  const frontMat = material(frontTex, detail);
  const backMat = material(backTex, detail);
  const front = new THREE.Mesh(panel(1, nx, ny), frontMat);
  const back = new THREE.Mesh(panel(-1, nx, ny), backMat);
  front.castShadow = back.castShadow = false;

  const collarMat = new THREE.MeshStandardMaterial({ color: kit.trim, roughness: 0.6 });
  const collarCurve = (neckY: number, z: number) => {
    const half = rightHalf(neckY).slice(0, 11);
    const arc = [...half.slice(1).reverse().map(([x, y]) => [-x, y] as P), ...half];
    return new THREE.CatmullRomCurve3(arc.map(([x, y]) => new THREE.Vector3(x, y, curve(x) + z)));
  };
  const collarF = new THREE.Mesh(new THREE.TubeGeometry(collarCurve(0.82, 0.012), 40, 0.024, 8, false), collarMat);
  const collarB = new THREE.Mesh(new THREE.TubeGeometry(collarCurve(0.95, -0.012), 40, 0.022, 8, false), collarMat);

  const group = new THREE.Group();
  group.add(front, back, collarF, collarB);

  const repaint = () => {
    paint(frontCanvas, current, 'front', currentPrint, opts.font);
    paint(backCanvas, current, 'back', currentPrint, opts.font);
    frontTex.needsUpdate = true;
    backTex.needsUpdate = true;
    collarMat.color.set(current.trim);
  };

  return {
    group,
    setPrint(p) {
      currentPrint = p;
      repaint();
    },
    setKit(k) {
      current = k;
      repaint();
    },
    dispose() {
      frontTex.dispose();
      backTex.dispose();
      frontMat.dispose();
      backMat.dispose();
      collarMat.dispose();
      collarF.geometry.dispose();
      collarB.geometry.dispose();
    },
  };
}

export function createHanger() {
  const metal = new THREE.MeshStandardMaterial({ color: '#c9ced8', metalness: 0.9, roughness: 0.28 });
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.018, 8, 48, Math.PI * 0.62), metal);
  bar.rotation.z = Math.PI * 0.19;
  bar.position.y = 0.42;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 24, Math.PI * 1.25), metal);
  hook.position.set(0.075, 1.14, 0);
  hook.rotation.z = -Math.PI * 0.05;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8), metal);
  stem.position.set(0, 1.08, 0);
  g.add(bar, hook, stem);
  return { group: g, dispose: () => { metal.dispose(); bar.geometry.dispose(); hook.geometry.dispose(); stem.geometry.dispose(); } };
}

export const SHIRT_BOUNDS = { minX: MIN_X, maxX: MAX_X, minY: MIN_Y, maxY: MAX_Y };

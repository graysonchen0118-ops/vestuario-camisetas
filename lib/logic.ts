import { PRODUCTS, CATEGORIES, productById, clubById, type Product, type CategorySlug } from './mock/catalog';
import { FREE_SHIPPING_FROM, SHIPPING, NOW, toMin, type Line, type Order } from './mock/sales';
import type { Settings } from './mock/ops';

export const eur = (n: number) =>
  `${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
export const fmtDate = (s: string, withTime = false) => {
  const [d, t] = s.split(' ');
  const [y, m, day] = d.split('-').map(Number);
  const base = `${day} ${MONTHS[m - 1]} ${y}`;
  return withTime && t ? `${base}, ${t}` : base;
};
export const ago = (s: string) => {
  const diff = toMin(NOW) - toMin(s);
  if (diff < 60) return `hace ${Math.max(1, Math.round(diff))} min`;
  if (diff < 1440) return `hace ${Math.round(diff / 60)} h`;
  const days = Math.round(diff / 1440);
  return days === 1 ? 'ayer' : `hace ${days} días`;
};

export const plain = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ª/g, 'a').replace(/º/g, 'o').replace(/\./g, '').trim();

export type Totals = {
  subtotal: number;
  shipping: number;
  fee: number;
  feeLabel: string;
  total: number;
  vat: number;
  base: number;
  units: number;
  freeShippingLeft: number;
};

/** One function decides the amount, and the cart, the order, the invoice, the email and the payment all read it. */
export function computeTotals(lines: Line[], settings: Settings, carrier: keyof typeof SHIPPING = 'Correos', country = 'España'): Totals {
  const subtotal = round(lines.reduce((a, l) => a + l.unit * l.qty, 0));
  const units = lines.reduce((a, l) => a + l.qty, 0);
  const shipping = lines.length === 0 ? 0 : carrier === 'Correos' && subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING[carrier].price;
  const f = settings.fee;
  const inEU = country !== 'Reino Unido' && country !== 'Suiza';
  const applies = f.enabled && lines.length > 0 && (f.scope === 'todos' || (f.scope === 'ue' ? inEU : !inEU));
  let fee = 0;
  if (applies) {
    fee = f.mode === 'pedido' ? f.amount : f.amount * new Set(lines.map((l) => tariffClass(productById(l.productId)))).size;
  }
  const total = round(subtotal + shipping + fee);
  const base = round(total / 1.21);
  return { subtotal, shipping, fee: round(fee), feeLabel: f.label, total, base, vat: round(total - base), units, freeShippingLeft: Math.max(0, round(FREE_SHIPPING_FROM - subtotal)) };
}
const round = (n: number) => Math.round(n * 100) / 100;

/** Items that share a customs heading pay once: every shirt is one heading, balls, gloves and boots are others. */
export const tariffClass = (p?: Product) => (!p ? 'otro' : p.kind === 'shirt' ? 'camisetas' : p.tags.includes('guantes') ? 'guantes' : p.tags.includes('botas') ? 'botas' : 'balones');

export const lineKey = (l: Line) => `${l.productId}|${l.size}|${l.print ? `${l.print.name}|${l.print.number}|${l.print.patch}` : ''}`;

/** Units sold inside the window: 90 days, a year, or since the product went on sale (0). */
export const soldIn = (p: Product, window: number) =>
  window === 0 ? p.soldTotal : window === 90 ? p.sold90 : Math.round(p.sold90 + (p.soldTotal - p.sold90) * 0.6);

/** Category order: pinned first in the order chosen, then the rest by units sold in the window. */
export function sortCategory(slug: CategorySlug, settings: Settings, pool: Product[] = PRODUCTS) {
  const pins = settings.pins[slug] ?? [];
  const items = pool.filter((p) => p.category === slug);
  const pinned = pins.map((id) => items.find((p) => p.id === id)).filter(Boolean) as Product[];
  const rest = items
    .filter((p) => !pins.includes(p.id))
    .sort((a, b) => soldIn(b, settings.sortWindow) - soldIn(a, settings.sortWindow) || a.id - b.id);
  return [...pinned, ...rest];
}

export const featured = (settings: Settings) => sortCategory('temporada-26-27', settings).slice(0, 8);

const SYNONYMS: Record<string, string[]> = {
  local: ['1a', 'primera', 'local', 'casa'],
  primera: ['1a', 'primera', 'local'],
  visitante: ['2a', 'segunda', 'visitante', 'fuera'],
  segunda: ['2a', 'segunda', 'visitante'],
  nino: ['infantil', 'nino', 'nina', 'junior'],
  nina: ['infantil', 'nino', 'nina'],
  ninos: ['infantil'],
  crio: ['infantil'],
  portero: ['portero', 'guardameta'],
  porteros: ['portero'],
  arquero: ['portero'],
  balon: ['balon', 'pelota'],
  pelota: ['balon', 'pelota'],
  oferta: ['25/26', 'oferta', 'rebaja', 'pasada'],
  rebajas: ['oferta', 'rebaja'],
  azul: ['azul'],
  roja: ['roja'],
  blanca: ['blanca'],
};

const COLOR_WORDS: Record<string, (p: Product) => boolean> = {
  azul: (p) => /#(1f4fbf|0b2545|123a63|1d4e89|7fb7e6|a9c6e0)/i.test(`${p.kit?.base}${p.kit?.second}`),
  roja: (p) => /#(c8102e|b3001b)/i.test(`${p.kit?.base}${p.kit?.second}`),
  rojo: (p) => /#(c8102e|b3001b)/i.test(`${p.kit?.base}${p.kit?.second}`),
  verde: (p) => /#(0b6e4f|2fbf71)/i.test(`${p.kit?.base}${p.kit?.second}`),
  blanca: (p) => /#(ffffff|f4f2ee)/i.test(`${p.kit?.base}`),
  amarilla: (p) => /#f2c200/i.test(`${p.kit?.base}`),
  negra: (p) => /#(161616|1a1a1a|2b2b2b)/i.test(`${p.kit?.base}`),
  morada: (p) => /#(4b2e83|2e1747|5b2a86|3d1b5c)/i.test(`${p.kit?.base}${p.kit?.second}`),
  naranja: (p) => /#(f28c28|ff7a1a)/i.test(`${p.kit?.base}`) || p.name.includes('naranja'),
};

const haystack = (p: Product) => {
  const club = clubById(p.clubId);
  const cat = CATEGORIES.find((c) => c.slug === p.category)!;
  return plain(`${p.name} ${club?.name ?? ''} ${club?.short ?? ''} ${cat.name} ${p.tags.join(' ')} ${p.season ?? ''}`);
};

function near(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Accent-blind, synonym-aware, one typo per word allowed. Returns products ranked by how many words matched. */
export function search(query: string, pool: Product[] = PRODUCTS) {
  const words = plain(query).split(/\s+/).filter((w) => w.length > 1 && !['de', 'la', 'el', 'del', 'para', 'un', 'una', 'camiseta', 'camisetas', 'talla'].includes(w));
  if (!words.length) return [];
  return pool
    .map((p) => {
      const h = haystack(p);
      const tokens = h.split(/[^a-z0-9/]+/);
      let score = 0;
      for (const w of words) {
        const alts = SYNONYMS[w] ?? [w];
        if (COLOR_WORDS[w]?.(p)) score += 2;
        else if (alts.some((a) => h.includes(a))) score += 2;
        else if (w.length > 4 && tokens.some((t) => t.length > 3 && near(w, t))) score += 1;
        else return { p, score: -1 };
      }
      return { p, score: score + p.sold90 / 1000 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function avgRating(productId: number, reviews: { productId: number; rating: number; status: string }[]) {
  const r = reviews.filter((x) => x.productId === productId && x.status === 'publicada');
  if (!r.length) return { avg: 0, count: 0 };
  return { avg: Math.round((r.reduce((a, b) => a + b.rating, 0) / r.length) * 10) / 10, count: r.length };
}

export const orderSubtotal = (o: Order) => round(o.lines.reduce((a, l) => a + l.unit * l.qty, 0));

export function deliveryWindow(lines: Line[], carrier: keyof typeof SHIPPING) {
  const printed = lines.some((l) => l.print && (l.print.name || l.print.number));
  const [a, b] = carrier === 'SEUR' ? [1, 2] : carrier === 'GLS' ? [4, 7] : [3, 5];
  const extra = printed ? 2 : 0;
  const start = addWorkdays(NOW.split(' ')[0], a + extra);
  const end = addWorkdays(NOW.split(' ')[0], b + extra);
  return { start, end, printed };
}

export function addWorkdays(day: string, n: number) {
  let t = toMin(`${day} 12:00`);
  let left = n;
  while (left > 0) {
    t += 1440;
    const dow = new Date(t * 60000).getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  const d = new Date(t * 60000);
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

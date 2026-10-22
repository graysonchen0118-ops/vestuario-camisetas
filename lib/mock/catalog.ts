import type { Kit } from '@/components/three/shirt';

export type CategorySlug = 'temporada-26-27' | 'temporada-25-26' | 'retro' | 'infantil' | 'entrenamiento' | 'accesorios';

export type Category = {
  slug: CategorySlug;
  name: string;
  menu: string;
  intro: string;
  photo: string;
};

export type Club = {
  id: string;
  name: string;
  short: string;
  crest: string;
  city: string;
  home: Kit;
  away: Kit;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  clubId?: string;
  category: CategorySlug;
  season?: string;
  kind: 'shirt' | 'accessory';
  kit?: Kit;
  photo?: string;
  price: number;
  compareAt?: number;
  personalizable: boolean;
  sizes: string[];
  stock: Record<string, number>;
  soldTotal: number;
  sold90: number;
  createdAt: string;
  description: string;
  details: string[];
  tags: string[];
};

export const photo = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;

export const PHOTOS = {
  graderioNoche: '1556816214-fda351e4a7fb',
  estadioLleno: '1504016798967-59a258e9386d',
  estadioNoche: '1599158150601-1417ebbaafdd',
  aficionBufanda: '1767176526443-a504b1667dbc',
  dorsal16: '1693683224122-0a8e206f248d',
  ninoDorsal11: '1693683223409-4d946f3d458e',
  ninosJugando: '1622659097509-4d56de14539e',
  planchaEstampado: '1785829414436-2f5ce9b1f658',
  serigrafia: '1773525912476-213bff96b8a4',
  pantalla: '1558705232-4e2c245163e5',
  entregaCaja: '1566576721346-d4a3b4eaeb55',
  caja: '1577705998148-6da4f3963bc8',
  tienda: '1441986300917-64674bd600d8',
  balonCesped: '1574629810360-7efbbe195018',
  botasBalon: '1511886929837-354d827aae26',
  guantes: '1760177379284-b68471fdd217',
};

export const CATEGORIES: Category[] = [
  { slug: 'temporada-26-27', name: 'Temporada 26/27', menu: 'Temporada 26/27', intro: 'Primeras y segundas equipaciones de esta temporada, todas personalizables con nombre y dorsal.', photo: PHOTOS.estadioLleno },
  { slug: 'temporada-25-26', name: 'Temporada 25/26', menu: 'Ofertas 25/26', intro: 'Las camisetas de la temporada pasada a precio rebajado, mientras queden tallas.', photo: PHOTOS.graderioNoche },
  { slug: 'retro', name: 'Retro', menu: 'Retro', intro: 'Reediciones de las camisetas que se recuerdan, con el cuello y el tejido de su época.', photo: PHOTOS.aficionBufanda },
  { slug: 'infantil', name: 'Infantil', menu: 'Infantil', intro: 'Las mismas camisetas en tallas de 4 a 13 años, con el nombre que quieran llevar.', photo: PHOTOS.ninoDorsal11 },
  { slug: 'entrenamiento', name: 'Entrenamiento y porteros', menu: 'Entrenamiento', intro: 'Camisetas de entrenamiento y de portero para jugar, no solo para la grada.', photo: PHOTOS.ninosJugando },
  { slug: 'accesorios', name: 'Balones y accesorios', menu: 'Accesorios', intro: 'Balones, guantes y botas para completar el equipo.', photo: PHOTOS.botasBalon },
];

const k = (base: string, second: string, trim: string, ink: string, pattern: Kit['pattern'], crest: string): Kit => ({ base, second, trim, ink, pattern, crest });

export const CLUBS: Club[] = [
  { id: 'almendral', name: 'Real Club Almendral', short: 'Almendral', crest: 'RCA', city: 'Almendral', home: k('#f4f2ee', '#5b2a86', '#5b2a86', '#3d1b5c', 'plain', 'RCA'), away: k('#2e1747', '#4d2a78', '#c9a227', '#c9a227', 'gradient', 'RCA') },
  { id: 'valdemora', name: 'Atlético Valdemora', short: 'Valdemora', crest: 'AV', city: 'Valdemora', home: k('#c8102e', '#ffffff', '#14213d', '#14213d', 'stripes', 'AV'), away: k('#14213d', '#1f3157', '#c8102e', '#ffffff', 'plain', 'AV') },
  { id: 'marismas', name: 'CD Marismas', short: 'Marismas', crest: 'CDM', city: 'Marismas', home: k('#0b6e4f', '#ffffff', '#0b3d2c', '#ffffff', 'hoops', 'CDM'), away: k('#ffffff', '#0b6e4f', '#0b6e4f', '#0b6e4f', 'sleeves', 'CDM') },
  { id: 'galerna', name: 'Sporting Galerna', short: 'Galerna', crest: 'SG', city: 'Galerna', home: k('#0b2545', '#8da9c4', '#ffffff', '#ffffff', 'halves', 'SG'), away: k('#a9c6e0', '#a9c6e0', '#0b2545', '#0b2545', 'plain', 'SG') },
  { id: 'costa-calma', name: 'UD Costa Calma', short: 'Costa Calma', crest: 'UCC', city: 'Costa Calma', home: k('#f2c200', '#1d4e89', '#1d4e89', '#1d4e89', 'sash', 'UCC'), away: k('#1d4e89', '#163e6e', '#f2c200', '#f2c200', 'plain', 'UCC') },
  { id: 'penarroja', name: 'CF Peñarroja', short: 'Peñarroja', crest: 'CFP', city: 'Peñarroja', home: k('#b3001b', '#1a1a1a', '#1a1a1a', '#ffffff', 'pinstripes', 'CFP'), away: k('#1a1a1a', '#b3001b', '#b3001b', '#ffffff', 'chevron', 'CFP') },
  { id: 'albarran', name: 'Racing Albarrán', short: 'Albarrán', crest: 'RA', city: 'Albarrán', home: k('#7fb7e6', '#ffffff', '#123a63', '#123a63', 'stripes', 'RA'), away: k('#123a63', '#123a63', '#7fb7e6', '#ffffff', 'plain', 'RA') },
  { id: 'puerto-azul', name: 'SD Puerto Azul', short: 'Puerto Azul', crest: 'SPA', city: 'Puerto Azul', home: k('#1f4fbf', '#1f4fbf', '#ffffff', '#ffffff', 'plain', 'SPA'), away: k('#ffffff', '#1f4fbf', '#1f4fbf', '#1f4fbf', 'chevron', 'SPA') },
  { id: 'sierra-alta', name: 'Real Sierra Alta', short: 'Sierra Alta', crest: 'RSA', city: 'Sierra Alta', home: k('#161616', '#2d2d2d', '#c9a227', '#c9a227', 'gradient', 'RSA'), away: k('#f4f2ee', '#e6dcc0', '#c9a227', '#161616', 'quarters', 'RSA') },
  { id: 'brezal', name: 'Deportivo Brezal', short: 'Brezal', crest: 'DB', city: 'Brezal', home: k('#4b2e83', '#f28c28', '#f28c28', '#ffffff', 'quarters', 'DB'), away: k('#f28c28', '#f28c28', '#4b2e83', '#4b2e83', 'plain', 'DB') },
];

export const clubById = (id?: string) => CLUBS.find((c) => c.id === id);

export const ADULT = ['S', 'M', 'L', 'XL', 'XXL'];
export const KIDS = ['4-5', '6-7', '8-9', '10-11', '12-13'];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ª/g, 'a')
    .replace(/º/g, 'o')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const stockFor = (sizes: string[], low = false) =>
  Object.fromEntries(sizes.map((s, i) => [s, low && (i === 0 || i === sizes.length - 1) ? 0 : Math.round(rnd() * (low ? 6 : 34)) + (low ? 0 : 3)]));

type Draft = Omit<Product, 'slug' | 'stock'> & { lowStock?: boolean };

const shirtDetails = ['Tejido técnico transpirable, 100 % poliéster reciclado', 'Escudo y marca termoadheridos', 'Corte regular, cuello redondo con ribete', 'Lavar del revés a 30 grados, sin secadora'];

const drafts: Draft[] = [];
let nextId = 1041;
const add = (d: Omit<Draft, 'id'>) => drafts.push({ ...d, id: nextId++ });

for (const c of CLUBS) {
  add({
    name: `Camiseta ${c.name} 1.ª equipación 26/27`,
    clubId: c.id, category: 'temporada-26-27', season: '26/27', kind: 'shirt', kit: c.home,
    price: 89.95, personalizable: true, sizes: ADULT,
    soldTotal: 0, sold90: 0, createdAt: '2026-07-14',
    description: `La primera equipación del ${c.short} para la temporada 26/27. Se puede personalizar con nombre y dorsal en la tipografía oficial del club, y con el parche de liga en la manga.`,
    details: shirtDetails, tags: ['local', 'primera', 'casa', c.short.toLowerCase()],
  });
}
for (const id of ['almendral', 'valdemora', 'marismas', 'galerna', 'costa-calma', 'puerto-azul']) {
  const c = clubById(id)!;
  add({
    name: `Camiseta ${c.name} 2.ª equipación 26/27`,
    clubId: c.id, category: 'temporada-26-27', season: '26/27', kind: 'shirt', kit: c.away,
    price: 89.95, personalizable: true, sizes: ADULT,
    soldTotal: 0, sold90: 0, createdAt: id === 'almendral' ? '2026-09-26' : '2026-08-02',
    description: `La segunda equipación del ${c.short} 26/27, la que el equipo lleva fuera de casa. Personalizable con nombre, dorsal y parche de liga.`,
    details: shirtDetails, tags: ['visitante', 'segunda', 'fuera', c.short.toLowerCase()],
  });
}
const lastSeason: [string, Kit][] = [
  ['valdemora', k('#c8102e', '#ffffff', '#c8102e', '#14213d', 'pinstripes', 'AV')],
  ['galerna', k('#0b2545', '#0b2545', '#8da9c4', '#ffffff', 'plain', 'SG')],
  ['penarroja', k('#b3001b', '#8a0015', '#ffffff', '#ffffff', 'gradient', 'CFP')],
  ['albarran', k('#ffffff', '#7fb7e6', '#7fb7e6', '#123a63', 'sash', 'RA')],
];
for (const [id, kit] of lastSeason) {
  const c = clubById(id)!;
  add({
    name: `Camiseta ${c.name} 1.ª equipación 25/26`,
    clubId: c.id, category: 'temporada-25-26', season: '25/26', kind: 'shirt', kit,
    price: 59.95, compareAt: 89.95, personalizable: true, sizes: ADULT, lowStock: true,
    soldTotal: 0, sold90: 0, createdAt: '2025-07-10',
    description: `La primera equipación del ${c.short} de la temporada 25/26. Quedan pocas tallas y se sigue personalizando con nombre y dorsal.`,
    details: shirtDetails, tags: ['local', 'oferta', 'rebaja', 'pasada', c.short.toLowerCase()],
  });
}
const retro: [string, string, Kit][] = [
  ['almendral', '1996', k('#f4f2ee', '#5b2a86', '#5b2a86', '#5b2a86', 'chevron', 'RCA')],
  ['marismas', '1989', k('#0b6e4f', '#ffffff', '#ffffff', '#0b3d2c', 'halves', 'CDM')],
  ['costa-calma', '2004', k('#f2c200', '#1d4e89', '#1d4e89', '#1d4e89', 'pinstripes', 'UCC')],
  ['brezal', '1999', k('#4b2e83', '#f28c28', '#f28c28', '#f28c28', 'sash', 'DB')],
];
for (const [id, year, kit] of retro) {
  const c = clubById(id)!;
  add({
    name: `Camiseta retro ${c.name} ${year}`,
    clubId: c.id, category: 'retro', season: year, kind: 'shirt', kit,
    price: 74.95, personalizable: true, sizes: ADULT,
    soldTotal: 0, sold90: 0, createdAt: '2025-11-20',
    description: `Reedición de la camiseta del ${c.short} de ${year}, con el corte y el cuello de entonces. Se personaliza con la tipografía que se usaba aquella temporada.`,
    details: ['Algodón y poliéster con tacto de época', 'Escudo bordado', 'Corte recto, algo más amplio que el actual', 'Lavar del revés a 30 grados'], tags: ['retro', 'clasica', 'vintage', year, c.short.toLowerCase()],
  });
}
for (const id of ['valdemora', 'marismas', 'galerna', 'puerto-azul']) {
  const c = clubById(id)!;
  add({
    name: `Camiseta infantil ${c.name} 1.ª equipación 26/27`,
    clubId: c.id, category: 'infantil', season: '26/27', kind: 'shirt', kit: c.home,
    price: 64.95, personalizable: true, sizes: KIDS,
    soldTotal: 0, sold90: 0, createdAt: '2026-07-14',
    description: `La primera equipación del ${c.short} en talla infantil. Muchos la regalan con el nombre del niño o de la niña y su número de la suerte.`,
    details: ['Tejido técnico suave, 100 % poliéster reciclado', 'Escudo termoadherido', 'Tallas por edad, mira la guía antes de elegir'], tags: ['nino', 'nina', 'ninos', 'infantil', 'junior', 'local', c.short.toLowerCase()],
  });
}
const training: [string, string, Kit][] = [
  ['almendral', 'Camiseta de entrenamiento Real Club Almendral 26/27', k('#3d1b5c', '#7a4bb0', '#f4f2ee', '#f4f2ee', 'gradient', 'RCA')],
  ['sierra-alta', 'Camiseta de entrenamiento Real Sierra Alta 26/27', k('#2b2b2b', '#c9a227', '#c9a227', '#c9a227', 'sleeves', 'RSA')],
  ['penarroja', 'Camiseta de entrenamiento CF Peñarroja 26/27', k('#e6e6e6', '#b3001b', '#b3001b', '#1a1a1a', 'chevron', 'CFP')],
  ['valdemora', 'Camiseta de portero Atlético Valdemora 26/27', k('#2fbf71', '#1c8a50', '#14213d', '#14213d', 'gradient', 'AV')],
  ['costa-calma', 'Camiseta de portero UD Costa Calma 26/27', k('#ff7a1a', '#ff7a1a', '#1d4e89', '#1d4e89', 'quarters', 'UCC')],
];
for (const [id, name, kit] of training) {
  const keeper = name.includes('portero');
  add({
    name, clubId: id, category: 'entrenamiento', season: '26/27', kind: 'shirt', kit,
    price: keeper ? 79.95 : 49.95, personalizable: keeper, sizes: ADULT,
    soldTotal: 0, sold90: 0, createdAt: '2026-08-20',
    description: keeper
      ? 'La camiseta de portero del primer equipo, con mangas largas acolchadas en los codos. Se personaliza con nombre y dorsal.'
      : 'La que lleva el primer equipo en los entrenamientos. Ligera, sin dorsal, pensada para jugar.',
    details: keeper ? ['Manga larga con acolchado en codos', 'Tejido técnico de secado rápido', 'Escudo termoadherido'] : ['Tejido ligero de secado rápido', 'Paneles de malla en la espalda', 'Corte ajustado'],
    tags: keeper ? ['portero', 'guardameta', 'arquero'] : ['entreno', 'entrenamiento', 'training'],
  });
}
const accessories: [string, string, number, string[], string, string[]][] = [
  ['Balón de partido Liga 26/27 talla 5', '1614632537190-23e4146777db', 39.95, ['5'], 'El balón oficial de la competición esta temporada, termosellado y con cámara de látex.', ['balon', 'pelota', 'futbol']],
  ['Balón de entrenamiento talla 5', '1575361204480-aadea25e6e68', 19.95, ['5'], 'Balón cosido a máquina para entrenar todos los días en hierba natural o artificial.', ['balon', 'pelota', 'entreno']],
  ['Pack de 3 balones de entrenamiento', '1551958219-acbc608c6377', 49.95, ['5'], 'Tres balones de entrenamiento con la misma presión y peso, para escuelas y equipos.', ['balon', 'pack', 'equipo']],
  ['Guantes de portero Pro', '1760177379284-b68471fdd217', 54.95, ['7', '8', '9', '10'], 'Palma de látex alemán de 4 mm y corte negativo para un agarre firme con lluvia.', ['guantes', 'portero']],
  ['Guantes de portero junior', '1632072820781-79f3a064f640', 24.95, ['5', '6', '7'], 'Guantes de portero para niños con protección de dedos y cierre de velcro.', ['guantes', 'portero', 'nino']],
  ['Botas de fútbol FG naranja', '1529900748604-07564a03e7a6', 89.95, ['39', '40', '41', '42', '43', '44'], 'Botas para césped natural con tacos cónicos y empeine de malla.', ['botas', 'tacos', 'calzado']],
];
for (const [name, ph, price, sizes, description, tags] of accessories) {
  add({
    name, category: 'accesorios', kind: 'accessory', photo: ph, price, personalizable: false, sizes,
    soldTotal: 0, sold90: 0, createdAt: '2026-03-02', description, details: [], tags,
  });
}

/** Units sold: the current season sells now, last season sold a lot once and barely sells today. */
const salesProfile = (d: Draft): [number, number] => {
  const r = rnd();
  if (d.category === 'temporada-25-26') return [Math.round(980 + r * 900), Math.round(8 + r * 30)];
  if (d.category === 'temporada-26-27') {
    const ninety = Math.round(60 + r * 240);
    return [Math.round(ninety * (1.05 + rnd() * 0.25)), ninety];
  }
  if (d.category === 'retro') return [Math.round(260 + r * 400), Math.round(25 + r * 70)];
  if (d.category === 'infantil') { const n = Math.round(40 + r * 120); return [Math.round(n * 1.2), n]; }
  if (d.category === 'entrenamiento') { const n = Math.round(15 + r * 60); return [Math.round(n * 1.4), n]; }
  const n = Math.round(10 + r * 70);
  return [Math.round(n * 3.2), n];
};

export const PRODUCTS: Product[] = drafts.map((d) => {
  const [soldTotal, sold90] = salesProfile(d);
  const { lowStock, ...rest } = d;
  return { ...rest, soldTotal, sold90, slug: `${d.id}-${slugify(d.name)}`, stock: stockFor(d.sizes, lowStock) };
});

// The new away kit of the flagship club launched four weeks ago, so it has not had time to sell yet.
PRODUCTS.find((p) => p.name.includes('Almendral 2.ª'))!.sold90 = 41;

export const productById = (id: number) => PRODUCTS.find((p) => p.id === id);
export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const productImage = (p: Product, side: 'f' | 'b' = 'f') =>
  p.kind === 'shirt' ? `/productos/${p.id}-${side}.webp` : photo(p.photo!, 720, 720);

export const PRINT_PRICE = 15;
export const PATCH_PRICE = 4.95;

export const SIZE_GUIDE = {
  adult: [
    { size: 'S', chest: 50, length: 70, height: '160 a 170' },
    { size: 'M', chest: 53, length: 72, height: '168 a 178' },
    { size: 'L', chest: 56, length: 74, height: '175 a 185' },
    { size: 'XL', chest: 59, length: 76, height: '182 a 190' },
    { size: 'XXL', chest: 62, length: 78, height: '188 a 196' },
  ],
  kids: [
    { size: '4-5', chest: 34, length: 46, height: '104 a 116' },
    { size: '6-7', chest: 37, length: 50, height: '116 a 128' },
    { size: '8-9', chest: 40, length: 54, height: '128 a 140' },
    { size: '10-11', chest: 43, length: 58, height: '140 a 152' },
    { size: '12-13', chest: 46, length: 62, height: '152 a 164' },
  ],
};

/** Size from height and weight, with a nudge for a looser fit. Mirrors the table above. */
export function recommendSize(heightCm: number, weightKg: number, fit: 'ajustada' | 'holgada', kids: boolean) {
  if (kids) {
    const order = SIZE_GUIDE.kids;
    const idx = heightCm < 116 ? 0 : heightCm < 128 ? 1 : heightCm < 140 ? 2 : heightCm < 152 ? 3 : 4;
    return order[Math.min(order.length - 1, idx + (fit === 'holgada' ? 1 : 0))].size;
  }
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  let idx = heightCm < 168 ? 0 : heightCm < 176 ? 1 : heightCm < 184 ? 2 : heightCm < 191 ? 3 : 4;
  if (bmi > 26.5) idx += 1;
  if (bmi > 30) idx += 1;
  if (bmi < 20 && idx > 0) idx -= 1;
  if (fit === 'holgada') idx += 1;
  return ADULT[Math.max(0, Math.min(ADULT.length - 1, idx))];
}

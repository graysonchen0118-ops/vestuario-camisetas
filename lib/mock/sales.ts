import { PRODUCTS, PRINT_PRICE, PATCH_PRICE, type Product } from './catalog';

/** Store time is Madrid. Every timestamp is a local 'YYYY-MM-DD HH:mm' string, so server and browser agree. */
export const NOW = '2026-10-22 11:30';
export const STAGING_COPY = '2026-10-05 09:00';

export const toMin = (s: string) => {
  const [d, t = '00:00'] = s.split(' ');
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return Date.UTC(y, m - 1, day, h, mi) / 60000;
};
export const fromMin = (n: number) => {
  const d = new Date(n * 60000);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

let seed = 20261022;
const rnd = () => {
  seed = (seed * 48271) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];

export type Customer = {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string;
  lang: 'es' | 'en' | 'fr' | 'pt' | 'it' | 'de';
  since: string;
};

export type Print = { name: string; number: string; patch: boolean };
export type Line = { productId: number; size: string; qty: number; unit: number; print?: Print };

export type OrderStatus = 'pago_aceptado' | 'en_preparacion' | 'estampado' | 'enviado' | 'entregado' | 'cancelado' | 'error_pago';

export const STATUS: Record<OrderStatus, { label: string; tone: 'info' | 'warn' | 'ok' | 'muted' | 'bad' }> = {
  pago_aceptado: { label: 'Pago aceptado', tone: 'info' },
  en_preparacion: { label: 'En preparación', tone: 'warn' },
  estampado: { label: 'Estampado', tone: 'warn' },
  enviado: { label: 'Enviado', tone: 'info' },
  entregado: { label: 'Entregado', tone: 'ok' },
  cancelado: { label: 'Cancelado', tone: 'muted' },
  error_pago: { label: 'Error en el pago', tone: 'bad' },
};
export const STATUS_FLOW: OrderStatus[] = ['pago_aceptado', 'en_preparacion', 'estampado', 'enviado', 'entregado'];

export type Order = {
  ref: string;
  id: number;
  customerId: number;
  date: string;
  status: OrderStatus;
  lines: Line[];
  carrier: 'Correos' | 'SEUR' | 'GLS';
  shipping: number;
  fee: { label: string; amount: number } | null;
  total: number;
  payment: 'Tarjeta' | 'Bizum' | 'PayPal';
  tracking?: string;
  history: { status: OrderStatus; at: string }[];
  emails: { kind: string; at: string }[];
  note?: string;
};

const FIRST = ['Javier', 'Lucía', 'Marcos', 'Carmen', 'Álvaro', 'Laura', 'Pablo', 'Marta', 'Sergio', 'Nerea', 'Diego', 'Paula', 'Iker', 'Ainhoa', 'Raúl', 'Elena', 'Hugo', 'Sara', 'Adrián', 'Irene', 'Daniel', 'Cristina', 'Jorge', 'Noelia', 'Rubén', 'Beatriz', 'Óscar', 'Andrea', 'Mario', 'Silvia', 'Víctor', 'Rocío', 'Gonzalo', 'Patricia', 'Unai', 'Alba', 'Íñigo', 'Claudia', 'Fernando', 'Inés'];
const LAST = ['García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Gil', 'Vázquez', 'Serrano', 'Ramos', 'Blanco', 'Castro', 'Ortega', 'Rubio', 'Molina', 'Delgado', 'Iglesias', 'Garrido', 'Etxeberria', 'Ferrer'];
const CITIES_ES = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao', 'Valladolid', 'Vigo', 'Gijón', 'Granada', 'Murcia', 'Palma', 'Alicante', 'Santander', 'Pamplona', 'Córdoba', 'Salamanca', 'Logroño', 'Cáceres', 'San Sebastián', 'A Coruña'];
const ABROAD: [string, string, Customer['lang'], string[], string[]][] = [
  ['Lisboa', 'Portugal', 'pt', ['João', 'Inês', 'Tiago'], ['Silva', 'Ferreira', 'Costa']],
  ['Toulouse', 'Francia', 'fr', ['Julien', 'Camille', 'Thomas'], ['Martin', 'Bernard', 'Dubois']],
  ['Lyon', 'Francia', 'fr', ['Léa', 'Hugo'], ['Moreau', 'Laurent']],
  ['Múnich', 'Alemania', 'de', ['Lukas', 'Anna'], ['Müller', 'Schmidt']],
  ['Milán', 'Italia', 'it', ['Luca', 'Giulia'], ['Rossi', 'Bianchi']],
  ['Dublín', 'Irlanda', 'en', ['Sean', 'Aoife'], ['Murphy', 'Kelly']],
];

const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n');

export const CUSTOMERS: Customer[] = Array.from({ length: 78 }, (_, i) => {
  const abroad = rnd() < 0.16;
  let name: string, city: string, country: string, lang: Customer['lang'];
  if (abroad) {
    const [c, co, l, fs, ls] = pick(ABROAD);
    name = `${pick(fs)} ${pick(ls)}`;
    city = c; country = co; lang = l;
  } else {
    name = `${pick(FIRST)} ${pick(LAST)}`;
    city = pick(CITIES_ES); country = 'España'; lang = 'es';
  }
  const [f, l] = name.split(' ');
  const domain = pick(['gmail.com', 'hotmail.com', 'yahoo.es', 'outlook.com', 'icloud.com']);
  const sinceYear = 2012 + Math.floor(rnd() * 14);
  return {
    id: 3200 + i,
    name,
    email: `${plain(f)}.${plain(l)}${rnd() < 0.4 ? Math.floor(rnd() * 90 + 10) : ''}@${domain}`,
    city, country, lang,
    since: `${sinceYear}-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`,
  };
});

export const customerById = (id: number) => CUSTOMERS.find((c) => c.id === id);

const PRINT_NAMES = ['MARTA', 'HUGO', 'PAPÁ', 'ABUELO', 'LEO', 'NORA', 'IKER', 'CARMEN', 'MATEO', 'LUCÍA', 'ÁLVARO', 'ANE', 'TXEMA', 'NACHO', 'PEÑA', 'GALLEGO', 'EL CAPI', 'MAMÁ', 'TÍO JUAN', 'BRUNO', 'VERA', 'UNAI', 'CHEMA', 'ROCÍO'];
const NUMBERS = ['7', '9', '10', '14', '8', '1', '4', '5', '11', '22', '23', '3', '19', '6', '17', '2'];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const makeRef = (r: () => number = rnd) => Array.from({ length: 9 }, () => LETTERS[Math.floor(r() * 26)]).join('');

const HOUR_WEIGHT = [3, 2, 1, 0.5, 0.3, 0.3, 0.6, 1.2, 2, 3, 4, 5, 6, 7, 6, 4.5, 4, 4.5, 5.5, 7, 8.5, 10, 9.5, 6];
const pickHour = () => {
  const total = HOUR_WEIGHT.reduce((a, b) => a + b, 0);
  let x = rnd() * total;
  for (let h = 0; h < 24; h++) if ((x -= HOUR_WEIGHT[h]) <= 0) return h;
  return 21;
};

export const SHIPPING = {
  Correos: { label: 'Correos, entrega en 3 a 5 días laborables', price: 4.95 },
  SEUR: { label: 'SEUR, entrega en 24 a 48 horas', price: 8.95 },
  GLS: { label: 'GLS internacional, 4 a 7 días laborables', price: 12.95 },
} as const;
export const FREE_SHIPPING_FROM = 100;

export const lineUnit = (p: Product, print?: Print) => p.price + (print ? (print.name || print.number ? PRINT_PRICE : 0) + (print.patch ? PATCH_PRICE : 0) : 0);

const shirts = PRODUCTS.filter((p) => p.kind === 'shirt');
const weightOf = (p: Product) => (p.category === 'temporada-25-26' ? 0.25 : 0) + p.sold90 / 60 + 0.4;

const pickProduct = () => {
  const pool = rnd() < 0.82 ? shirts : PRODUCTS;
  const total = pool.reduce((a, p) => a + weightOf(p), 0);
  let x = rnd() * total;
  for (const p of pool) if ((x -= weightOf(p)) <= 0) return p;
  return pool[0];
};

const FEE = { label: 'Tasa europea', amount: 3 };
const startMin = toMin('2026-08-08 00:00');
const nowMin = toMin(NOW);

function statusFor(ageDays: number): OrderStatus {
  if (ageDays > 9) return rnd() < 0.04 ? 'cancelado' : 'entregado';
  if (ageDays > 4) return 'enviado';
  if (ageDays > 2) return 'estampado';
  if (ageDays > 0.6) return 'en_preparacion';
  return 'pago_aceptado';
}

const genOrders: Order[] = [];
for (let i = 0; i < 168; i++) {
  const day = Math.floor(rnd() * ((nowMin - startMin) / 1440));
  let at = startMin + day * 1440 + pickHour() * 60 + Math.floor(rnd() * 60);
  if (at > nowMin - 20) at = nowMin - 20 - Math.floor(rnd() * 600);
  const customer = pick(CUSTOMERS);
  const n = rnd() < 0.72 ? 1 : rnd() < 0.8 ? 2 : 3;
  const lines: Line[] = [];
  for (let j = 0; j < n; j++) {
    const p = pickProduct();
    const size = p.sizes[Math.min(p.sizes.length - 1, Math.floor(rnd() * p.sizes.length * 0.85 + (p.sizes.length > 3 ? 0.6 : 0)))];
    const print = p.personalizable && rnd() < 0.58 ? { name: pick(PRINT_NAMES), number: pick(NUMBERS), patch: rnd() < 0.35 } : undefined;
    lines.push({ productId: p.id, size, qty: !print && rnd() < 0.12 ? 2 : 1, unit: lineUnit(p, print), print });
  }
  const sub = lines.reduce((a, l) => a + l.unit * l.qty, 0);
  const carrier: Order['carrier'] = customer.country !== 'España' ? 'GLS' : rnd() < 0.28 ? 'SEUR' : 'Correos';
  const shipping = carrier === 'Correos' && sub >= FREE_SHIPPING_FROM ? 0 : SHIPPING[carrier].price;
  const date = fromMin(at);
  const ageDays = (nowMin - at) / 1440;
  const status = statusFor(ageDays);
  const history: Order['history'] = [{ status: 'pago_aceptado', at: date }];
  if (status !== 'cancelado') {
    const steps = STATUS_FLOW.slice(1, STATUS_FLOW.indexOf(status) + 1);
    steps.forEach((s, idx) => history.push({ status: s, at: fromMin(at + (idx + 1) * (900 + Math.floor(rnd() * 1300))) }));
  } else history.push({ status: 'cancelado', at: fromMin(at + 300) });
  const shipped = history.find((h) => h.status === 'enviado');
  const emails = [{ kind: 'confirmacion', at: date }];
  if (shipped) emails.push({ kind: 'envio', at: shipped.at });
  const delivered = history.find((h) => h.status === 'entregado');
  if (delivered && toMin(delivered.at) + 7 * 1440 < nowMin) emails.push({ kind: 'opinion', at: fromMin(toMin(delivered.at) + 7 * 1440) });
  genOrders.push({
    ref: makeRef(),
    id: 0,
    customerId: customer.id,
    date,
    status,
    lines,
    carrier,
    shipping,
    fee: FEE,
    total: Math.round((sub + shipping + FEE.amount) * 100) / 100,
    payment: pick(['Tarjeta', 'Tarjeta', 'Tarjeta', 'Bizum', 'PayPal'] as const),
    tracking: shipped ? (carrier === 'Correos' ? `PQ4F${Math.floor(rnd() * 9e8 + 1e8)}ES` : carrier === 'SEUR' ? `0${Math.floor(rnd() * 9e9 + 1e9)}` : `ZG${Math.floor(rnd() * 9e9 + 1e9)}`) : undefined,
    history,
    emails,
  });
}
genOrders.sort((a, b) => toMin(a.date) - toMin(b.date));
genOrders.forEach((o, i) => (o.id = 18240 + i));
export const ORDERS: Order[] = genOrders.reverse();

export type Review = {
  id: number;
  productId: number;
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  size?: string;
  status: 'publicada' | 'pendiente' | 'oculta';
  reply?: string;
};

const REVIEW_POOL: [number, string, string][] = [
  [5, 'Perfecta para regalar', 'La pedí con el nombre de mi hijo y llegó exactamente como la escribí. La cara que puso al abrirla lo dice todo.'],
  [5, 'El estampado aguanta', 'Lleva ya varios lavados del revés a 30 grados y el dorsal está como el primer día, ni una grieta.'],
  [4, 'Pedid una talla más', 'La calidad es muy buena pero el corte es ajustado. Mido 1,80 y peso 82, con la L me queda justa, la próxima pido XL.'],
  [5, 'Llegó antes de lo previsto', 'Personalizada y todo, en cinco días la tenía en casa. Bien empaquetada y con el número bien centrado.'],
  [5, 'Igual que la del estadio', 'El tejido y el escudo son como los de la camiseta del primer equipo. El parche de liga queda muy bien en la manga.'],
  [4, 'Muy bonita, el envío algo lento', 'La camiseta es de diez, pero con Correos tardó un día más de lo que ponía. Aun así repetiría.'],
  [3, 'Bien, pero el nombre algo grande', 'Puse un nombre largo y las letras salen más pequeñas para que quepa, cosa que no sabía. Habría elegido un apodo.'],
  [5, 'Tercer pedido y siempre bien', 'Llevo años comprando aquí las camisetas de toda la familia y nunca he tenido un problema con la personalización.'],
  [5, 'La talla de la guía acierta', 'Usé la recomendación por altura y peso y me quedó como un guante. Eso me quitó la duda de pedir sin probar.'],
  [4, 'Buena calidad', 'Tejido fresco y bien cosida. Le quito una estrella porque el color es un poco más oscuro que en la foto.'],
  [5, 'Mi hija no se la quita', 'Talla 8-9 para una niña de 8 años y le queda con un poco de margen para crecer. El nombre con tilde salió perfecto.'],
  [2, 'Me equivoqué de talla', 'La camiseta está bien, pero al ser personalizada no la pude cambiar. Mirad bien la guía, el corte es más estrecho que una camiseta normal.'],
  [5, 'Retro de verdad', 'El cuello y el tejido recuerdan muchísimo a la original de aquellos años. Me la regalaron y no puedo estar más contento.'],
  [4, 'Contento con la compra', 'Todo correcto. El correo de seguimiento llegó al momento y pude ver dónde estaba el paquete.'],
  [5, 'Atención de diez', 'Escribí al chat para preguntar por el dorsal 00 y me contestaron enseguida. La camiseta, impecable.'],
  [5, 'Para el abuelo', 'Le pusimos ABUELO y el número de su año de socio. Lloró. Gracias por el cuidado con el que llegó.'],
  [3, 'Correcta', 'Cumple, aunque esperaba el tejido algo más grueso en la versión retro.'],
  [5, 'Buen precio para la temporada pasada', 'A este precio y personalizada me parece una compra estupenda. Quedaban pocas tallas, la L fue la última.'],
  [4, 'Bien de tallas', 'Normalmente uso M y la M me queda bien. La personalización tarda dos días más, ya lo avisaban.'],
  [5, 'Volveré a comprar', 'Rápido, bien hecho y con el nombre tal cual lo escribí, mayúsculas y tilde incluidas.'],
];

const reviewable = PRODUCTS.filter((p) => p.category !== 'temporada-26-27' || p.sold90 > 70);
export const REVIEWS: Review[] = [];
let reviewId = 501;
for (const p of PRODUCTS) {
  const count = p.kind === 'accessory' ? Math.floor(rnd() * 3) : reviewable.includes(p) ? 2 + Math.floor(rnd() * 5) : Math.floor(rnd() * 2);
  for (let i = 0; i < count; i++) {
    const [rating, title, body] = pick(REVIEW_POOL);
    const c = pick(CUSTOMERS.filter((x) => x.country === 'España'));
    const [f, l] = c.name.split(' ');
    const date = fromMin(nowMin - Math.floor(rnd() * 240 + 2) * 1440 - Math.floor(rnd() * 900));
    REVIEWS.push({
      id: reviewId++,
      productId: p.id,
      author: `${f} ${l[0]}.`,
      city: c.city,
      rating: p.kind === 'accessory' ? Math.max(4, rating) : rating,
      title,
      body,
      date,
      verified: rnd() < 0.86,
      size: p.kind === 'shirt' ? pick(p.sizes) : undefined,
      status: toMin(date) > nowMin - 3 * 1440 && rnd() < 0.7 ? 'pendiente' : 'publicada',
    });
  }
}
REVIEWS.sort((a, b) => toMin(b.date) - toMin(a.date));

export type CartStatus = 'pendiente' | 'recordatorio_1' | 'recordatorio_2' | 'recuperado' | 'sin_correo';
export type AbandonedCart = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  step: 'carrito' | 'datos' | 'envio' | 'pago';
  lines: Line[];
  reminders: string[];
  status: CartStatus;
  opened?: boolean;
};

export const CARTS: AbandonedCart[] = Array.from({ length: 28 }, (_, i): AbandonedCart => {
  const hasEmail = rnd() < 0.62;
  const c = pick(CUSTOMERS);
  const at = nowMin - Math.floor(rnd() * 9 * 1440) - 40;
  const p = pickProduct();
  const print = p.personalizable && rnd() < 0.55 ? { name: pick(PRINT_NAMES), number: pick(NUMBERS), patch: false } : undefined;
  const lines: Line[] = [{ productId: p.id, size: pick(p.sizes), qty: 1, unit: lineUnit(p, print), print }];
  const age = (nowMin - at) / 60;
  let status: CartStatus = 'sin_correo';
  const reminders: string[] = [];
  if (hasEmail) {
    if (age > 3) reminders.push(fromMin(at + 180));
    if (age > 24) reminders.push(fromMin(at + 1440));
    status = reminders.length === 0 ? 'pendiente' : reminders.length === 1 ? 'recordatorio_1' : 'recordatorio_2';
    if (reminders.length && rnd() < 0.24) status = 'recuperado';
  }
  return {
    id: `C${7310 + i}`,
    email: hasEmail ? c.email : null,
    name: hasEmail ? c.name : null,
    createdAt: fromMin(at),
    step: hasEmail ? pick(['datos', 'envio', 'pago'] as const) : 'carrito',
    lines,
    reminders,
    status,
    opened: reminders.length > 0 && rnd() < 0.55,
  };
}).sort((a, b) => toMin(b.createdAt) - toMin(a.createdAt));

import type { CategorySlug } from './catalog';

export type EmailTemplate = {
  id: 'confirmacion' | 'envio' | 'opinion' | 'carrito_1' | 'carrito_2';
  name: string;
  when: string;
  subject: string;
  body: string;
  updatedAt: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'confirmacion',
    name: 'Confirmación de pedido',
    when: 'Al aceptarse el pago',
    subject: 'Hemos recibido tu pedido {referencia}',
    body:
      'Hola {nombre},\n\nGracias por tu pedido, ya lo tenemos y empezamos a prepararlo.\n\n{productos}\n\nLas camisetas personalizadas pasan por el taller de estampación y salen del almacén dos días laborables después. Te escribiremos con el número de seguimiento en cuanto se vaya.\n\nComo llevan tu nombre y tu dorsal, las prendas personalizadas no admiten devolución. Si algo del resumen no cuadra, contesta a este correo hoy y lo corregimos antes de estampar.',
    updatedAt: '2026-10-14 10:12',
  },
  {
    id: 'envio',
    name: 'Pedido enviado',
    when: 'Al pasar a Enviado',
    subject: 'Tu pedido {referencia} ya va de camino',
    body:
      'Hola {nombre},\n\nTu pedido ha salido hoy con {transportista}. Puedes seguirlo con este número: {seguimiento}.\n\n{productos}\n\nSi no estás en casa, el repartidor deja aviso y puedes recogerlo en la oficina más cercana.',
    updatedAt: '2026-10-14 10:20',
  },
  {
    id: 'opinion',
    name: 'Petición de opinión',
    when: '7 días después de la entrega',
    subject: '{nombre}, qué tal te queda la camiseta',
    body:
      'Hola {nombre},\n\nHace una semana que te llegó tu pedido {referencia}. Nos ayudaría mucho saber qué tal te queda, sobre todo la talla, porque es lo que más dudas genera a quien compra sin probarse.\n\nTe lleva un minuto y aparece en la ficha con la etiqueta de compra verificada.',
    updatedAt: '2026-09-30 17:45',
  },
  {
    id: 'carrito_1',
    name: 'Recordatorio de carrito 1',
    when: '3 horas después de dejarlo',
    subject: 'Tu camiseta sigue en el carrito',
    body:
      'Hola {nombre},\n\nDejaste esto en tu carrito y lo hemos guardado tal cual, con la talla y la personalización que elegiste:\n\n{productos}\n\nEl enlace te devuelve a ese mismo carrito: {enlace_carrito}',
    updatedAt: '2026-10-16 09:05',
  },
  {
    id: 'carrito_2',
    name: 'Recordatorio de carrito 2',
    when: '24 horas después de dejarlo',
    subject: 'Guardamos tu carrito un poco más',
    body:
      'Hola {nombre},\n\nTu carrito sigue esperando. Si te frenó la talla, en la ficha tienes la guía con la recomendación por altura y peso, y el asistente te contesta al momento.\n\n{productos}\n\nVolver a mi carrito: {enlace_carrito}',
    updatedAt: '2026-10-16 09:05',
  },
];

export type UnansweredQuestion = { id: number; question: string; count: number; lastAt: string; lang: string; answer?: string };
export const UNANSWERED: UnansweredQuestion[] = [
  { id: 1, question: 'Hacéis envíos a Canarias y cuánto se paga al recibirlo', count: 14, lastAt: '2026-10-21 22:41', lang: 'es' },
  { id: 2, question: 'Se puede poner el dorsal 00', count: 9, lastAt: '2026-10-20 19:03', lang: 'es' },
  { id: 3, question: 'Las letras son de vinilo o bordadas', count: 7, lastAt: '2026-10-21 13:17', lang: 'es' },
  { id: 4, question: 'Tenéis la camiseta de portero en talla de niño', count: 6, lastAt: '2026-10-19 18:55', lang: 'es' },
  { id: 5, question: 'Puedo poner el nombre en la parte de delante', count: 5, lastAt: '2026-10-18 21:30', lang: 'es' },
  { id: 6, question: 'Do you ship to the UK and are there customs fees', count: 4, lastAt: '2026-10-17 15:12', lang: 'en' },
  { id: 7, question: 'Factura a nombre de un club con CIF', count: 4, lastAt: '2026-10-21 10:02', lang: 'es' },
  { id: 8, question: 'Se puede recoger en tienda física', count: 3, lastAt: '2026-10-16 12:44', lang: 'es' },
  { id: 9, question: 'Vous avez des tailles femme', count: 2, lastAt: '2026-10-15 20:20', lang: 'fr' },
];

export type ChatMessage = { from: 'cliente' | 'asistente' | 'persona'; text: string; products?: number[] };
export type Conversation = { id: string; startedAt: string; lang: string; topic: string; outcome: 'resuelta' | 'derivada' | 'sin_respuesta'; messages: ChatMessage[] };

export const CONVERSATIONS: Conversation[] = [
  { id: 'K-9312', startedAt: '2026-10-22 10:48', lang: 'es', topic: 'Talla', outcome: 'resuelta', messages: [
    { from: 'cliente', text: 'Mido 1,82 y peso 86, qué talla me pido de la del Valdemora' },
    { from: 'asistente', text: 'Con 182 cm y 86 kg te recomiendo la XL. El corte de esta camiseta es ajustado, y quien está entre dos tallas suele quedar mejor con la mayor.' },
    { from: 'cliente', text: 'Perfecto, gracias' },
  ] },
  { id: 'K-9309', startedAt: '2026-10-22 09:15', lang: 'es', topic: 'Estado del pedido', outcome: 'resuelta', messages: [
    { from: 'cliente', text: 'Dónde está mi pedido' },
    { from: 'asistente', text: 'Para ver tu pedido necesito la referencia de nueve letras y el correo con el que compraste. Los dos juntos, por seguridad.' },
    { from: 'cliente', text: 'La referencia está en el correo de confirmación, ahora te la paso' },
  ] },
  { id: 'K-9301', startedAt: '2026-10-21 22:41', lang: 'es', topic: 'Envíos', outcome: 'sin_respuesta', messages: [
    { from: 'cliente', text: 'Hacéis envíos a Canarias? cuánto se paga al recibirlo?' },
    { from: 'asistente', text: 'Esa todavía no la sé contestar bien. Puedo pasársela a una persona del equipo, que te responde por correo.' },
  ] },
  { id: 'K-9296', startedAt: '2026-10-21 20:02', lang: 'en', topic: 'Personalización', outcome: 'resuelta', messages: [
    { from: 'cliente', text: 'Can I print a name with an accent, like JOSÉ?' },
    { from: 'asistente', text: 'Yes. The name is printed exactly as you type it, accents included, in capital letters. Up to 12 characters.' },
  ] },
  { id: 'K-9288', startedAt: '2026-10-21 17:30', lang: 'es', topic: 'Devolución', outcome: 'derivada', messages: [
    { from: 'cliente', text: 'Me ha llegado con el nombre mal escrito' },
    { from: 'asistente', text: 'Lo siento. Esto lo revisa una persona del equipo con tu pedido delante. Te paso con ella ahora mismo.' },
    { from: 'persona', text: 'Hola, soy del equipo. Ya veo el pedido, lo reponemos esta semana con el nombre correcto.' },
  ] },
  { id: 'K-9270', startedAt: '2026-10-20 23:12', lang: 'es', topic: 'Recomendación', outcome: 'resuelta', messages: [
    { from: 'cliente', text: 'Busco una camiseta azul para regalar a un niño de 8 años' },
    { from: 'asistente', text: 'Para 8 años la talla suele ser 8-9. Estas son azules y están en talla infantil:', products: [1068, 1067] },
  ] },
  { id: 'K-9254', startedAt: '2026-10-20 19:03', lang: 'es', topic: 'Personalización', outcome: 'sin_respuesta', messages: [
    { from: 'cliente', text: 'Se puede poner el dorsal 00?' },
    { from: 'asistente', text: 'Esa todavía no la sé contestar bien. Puedo pasársela a una persona del equipo, que te responde por correo.' },
  ] },
  { id: 'K-9233', startedAt: '2026-10-19 13:40', lang: 'fr', topic: 'Livraison', outcome: 'resuelta', messages: [
    { from: 'cliente', text: 'Combien de temps pour livrer à Toulouse ?' },
    { from: 'asistente', text: 'Pour la France, GLS livre en 4 à 7 jours ouvrés. Un maillot personnalisé part 2 jours ouvrés plus tard.' },
  ] },
];

export type Escalation = { id: number; email: string; question: string; at: string; status: 'abierta' | 'respondida' };
export const ESCALATIONS: Escalation[] = [
  { id: 41, email: 'irene.navarro@gmail.com', question: 'Me ha llegado con el nombre mal escrito', at: '2026-10-21 17:31', status: 'respondida' },
  { id: 40, email: 'julien.martin@outlook.com', question: 'Je voudrais changer l\'adresse de livraison', at: '2026-10-21 11:02', status: 'abierta' },
  { id: 39, email: 'pablo.ramos71@hotmail.com', question: 'Necesito 14 camisetas iguales para un equipo de veteranos', at: '2026-10-20 18:24', status: 'abierta' },
  { id: 38, email: 'cristina.gil@yahoo.es', question: 'El paquete dice entregado pero no lo tengo', at: '2026-10-19 09:50', status: 'respondida' },
];

export type ChangeKind = 'tema' | 'modulo_propio' | 'modulo' | 'correo' | 'ajuste';
export type ChangeStatus = 'pendiente' | 'en_staging' | 'probado';
export type Change = { id: number; title: string; kind: ChangeKind; where: string; status: ChangeStatus; note?: string };

export const CHANGE_KIND: Record<ChangeKind, { label: string; travels: string }> = {
  tema: { label: 'Archivo del tema', travels: 'Sube como archivo' },
  modulo_propio: { label: 'Módulo propio', travels: 'Sube como archivo' },
  modulo: { label: 'Módulo de terceros', travels: 'Se instala y se configura igual' },
  correo: { label: 'Plantilla de correo', travels: 'Sube como archivo' },
  ajuste: { label: 'Ajuste en la base', travels: 'Se repite a mano desde la lista' },
};

export const CHANGES: Change[] = [
  { id: 1, title: 'Foto de portada de la ficha de producto', kind: 'tema', where: 'templates/catalog/_partials/product-cover-thumbnails.tpl', status: 'probado' },
  { id: 2, title: 'Nombre y dorsal visibles del carrito al correo y a la hoja de taller', kind: 'modulo_propio', where: 'Módulo de personalización, plantillas y hook de pedido', status: 'en_staging' },
  { id: 3, title: 'Checkout: el paso de envío no recalcula al cambiar de país', kind: 'tema', where: 'templates/checkout/_partials/steps/shipping.tpl', status: 'probado' },
  { id: 4, title: 'Menú superior: orden y enlaces nuevos', kind: 'ajuste', where: 'Configuración del menú en el back office', status: 'pendiente' },
  { id: 5, title: 'Destacados de la portada', kind: 'ajuste', where: 'Módulo de destacados, categoría de origen', status: 'en_staging' },
  { id: 6, title: 'Buscador: sinónimos local, visitante, niño, portero', kind: 'ajuste', where: 'Catálogo, alias de búsqueda', status: 'en_staging' },
  { id: 7, title: 'Texto del correo de confirmación', kind: 'correo', where: 'mails/es/order_conf.html y .txt', status: 'probado' },
  { id: 8, title: 'Texto del correo de pedido enviado', kind: 'correo', where: 'mails/es/shipped.html y .txt', status: 'en_staging' },
  { id: 9, title: 'Gasto fijo sumado al total del pedido', kind: 'modulo_propio', where: 'Módulo pequeño de recargo, regla de carrito', status: 'probado' },
  { id: 10, title: 'Estrellas de valoración en la ficha y en Google', kind: 'modulo', where: 'Módulo de reseñas, una sola marca de datos por ficha', status: 'en_staging' },
  { id: 11, title: 'Petición automática de opinión a pedidos antiguos', kind: 'ajuste', where: 'Configuración del módulo de reseñas', status: 'pendiente' },
  { id: 12, title: 'Módulo propio de personalización adaptado a 8.2', kind: 'modulo_propio', where: 'Overrides de Cart y Order revisados', status: 'probado' },
  { id: 13, title: 'Segundo módulo propio adaptado a 8.2', kind: 'modulo_propio', where: 'Pendiente de leer su código', status: 'pendiente' },
  { id: 14, title: 'Recordatorios de carrito abandonado', kind: 'modulo', where: 'Módulo de pago único, dos avisos sin cupón', status: 'pendiente' },
  { id: 15, title: 'Orden de categorías: fijados y ventas de 90 días', kind: 'modulo_propio', where: 'Módulo pequeño y tarea nocturna', status: 'en_staging' },
  { id: 16, title: 'Asistente conectado con clave de solo lectura', kind: 'ajuste', where: 'Webservice, permisos GET en productos y pedidos', status: 'pendiente' },
];

export const GO_LIVE_STEPS = [
  { id: 'lista', title: 'Todo cambio queda en archivos o en la lista', detail: 'Tema, módulos y correos suben como archivos. Lo poco que vive en la base se repite a mano desde la lista, nunca la base entera.' },
  { id: 'ensayo', title: 'Ensayo sobre una copia recién sacada de producción', detail: 'Se actualiza la copia de 1.7.8.11 a 8.2.8, se aplica la lista y se hace una compra de prueba. Así se sabe cuánto dura el cierre.' },
  { id: 'cierre', title: 'Mantenimiento a la hora con menos pedidos', detail: 'Tienda en mantenimiento, copia completa de archivos y base. Desde ahí no entra ningún pedido y Google lo entiende como una pausa.' },
  { id: 'repetir', title: 'Se repite el ensayo sobre la base de ese momento', detail: 'Pedido de prueba desde una IP permitida mientras los clientes ven el aviso de mantenimiento.' },
  { id: 'abrir', title: 'Se abre la tienda, o se restaura la copia', detail: 'Si todo va bien, se abre. Si algo falla, se restaura la copia y producción queda tal como estaba.' },
] as const;

export type GuideRow = { what: string; where: 'Back office' | 'FTP' | 'Técnico'; how: string };
export const GUIDE: GuideRow[] = [
  { what: 'Textos de los correos', where: 'Back office', how: 'Panel, Correos. Cambias asunto y texto y ves la vista previa con un pedido real.' },
  { what: 'Importe y nombre del gasto fijo', where: 'Back office', how: 'Panel, Envíos y tasas. Lo cambias tú, se aplica al carrito, al pedido, a la factura y al correo a la vez.' },
  { what: 'Productos fijados en cada categoría', where: 'Back office', how: 'Panel, Orden de categorías. Fijas, ordenas y el resto se ordena solo por ventas.' },
  { what: 'Productos destacados de la portada', where: 'Back office', how: 'Se toman de la categoría Temporada 26/27 con el mismo orden.' },
  { what: 'Menú superior', where: 'Back office', how: 'Módulo del menú. Añadir o quitar enlaces no toca ninguna URL.' },
  { what: 'Respuestas del asistente', where: 'Back office', how: 'Panel, Asistente. Contestas una pregunta pendiente y desde ese momento la responde sola.' },
  { what: 'Moderar y contestar opiniones', where: 'Back office', how: 'Panel, Opiniones.' },
  { what: 'Banners y fotos de portada', where: 'Back office', how: 'Constructor de páginas del tema.' },
  { what: 'Tipografía del dorsal y del nombre', where: 'FTP', how: 'Carpeta de fuentes del módulo de personalización. Mejor avisar antes, afecta a la hoja de taller.' },
  { what: 'Logotipo y favicon', where: 'Back office', how: 'Diseño, Tema y logotipo.' },
  { what: 'Plantillas HTML de los correos', where: 'FTP', how: 'mails/es. Solo si quieres cambiar el diseño, el texto se cambia desde el panel.' },
  { what: 'Campos de la personalización', where: 'Técnico', how: 'Afecta al carrito, al pedido, al correo y a la hoja de taller a la vez.' },
  { what: 'Actualizar PrestaShop o un módulo propio', where: 'Técnico', how: 'Siempre primero en staging, con copia.' },
  { what: 'Redirecciones y URLs', where: 'Técnico', how: 'Un cambio de URL sin redirección pierde la posición en Google.' },
];

export type Settings = {
  fee: { enabled: boolean; label: string; amount: number; mode: 'pedido' | 'articulo'; scope: 'todos' | 'ue' | 'fuera_ue' };
  reviews: { daysAfterDelivery: number; includeOld: boolean; monthsBack: number; autoPublishFrom: number };
  carts: { first: number; second: number; coupon: boolean };
  pins: Record<CategorySlug, number[]>;
  sortWindow: 90 | 365 | 0;
  lastSortRun: string;
  assistant: { languages: string[]; handoff: boolean; quotaUsed: number; quota: number };
};

export const DEFAULT_SETTINGS: Settings = {
  fee: { enabled: true, label: 'Tasa europea', amount: 3, mode: 'pedido', scope: 'todos' },
  reviews: { daysAfterDelivery: 7, includeOld: false, monthsBack: 12, autoPublishFrom: 4 },
  carts: { first: 3, second: 24, coupon: false },
  pins: {
    'temporada-26-27': [1051, 1041],
    'temporada-25-26': [],
    retro: [],
    infantil: [],
    entrenamiento: [],
    accesorios: [],
  },
  sortWindow: 90,
  lastSortRun: '2026-10-22 03:00',
  assistant: { languages: ['Español', 'English', 'Français', 'Português'], handoff: true, quotaUsed: 412, quota: 750 },
};

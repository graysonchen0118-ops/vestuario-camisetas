import { PRODUCTS, recommendSize, productById } from './mock/catalog';
import { STATUS, type Order, type Customer } from './mock/sales';
import type { Settings, UnansweredQuestion } from './mock/ops';
import { search, plain, eur, deliveryWindow, fmtDate } from './logic';

export type Lang = 'es' | 'en' | 'fr';
export type AssistantContext = { ref?: string; email?: string; awaitingHandoffEmail?: boolean; pendingQuestion?: string };
export type Reply = {
  text: string;
  products?: number[];
  context: AssistantContext;
  unanswered?: string;
  escalate?: { email: string; question: string };
  lang: Lang;
};

export function detectLang(t: string): Lang {
  const s = ` ${plain(t)} `;
  const en = [' the ', ' my ', ' order', ' size', ' shipping', ' ship ', ' where ', ' how ', ' can i', ' hi ', ' hello', ' is ', ' do you'].filter((w) => s.includes(w)).length;
  const fr = [' bonjour', ' commande', ' taille', ' livr', ' combien', ' je ', ' vous ', ' est-ce', ' maillot', ' merci'].filter((w) => s.includes(w)).length;
  if (fr > 0 && fr >= en) return 'fr';
  if (en > 0) return 'en';
  return 'es';
}

const T = {
  askBoth: {
    es: 'Para ver tu pedido necesito la referencia de nueve letras y el correo con el que compraste. Los dos juntos, por seguridad.',
    en: 'To look up your order I need the nine letter reference and the email you used to buy. Both together, for your security.',
    fr: 'Pour retrouver votre commande, il me faut la référence de neuf lettres et l’e-mail utilisé pour l’achat. Les deux ensemble, par sécurité.',
  },
  askEmail: {
    es: 'Tengo la referencia. Ahora el correo con el que hiciste la compra, y te digo dónde está.',
    en: 'Got the reference. Now the email you used to buy, and I will tell you where it is.',
    fr: 'J’ai la référence. Il me faut maintenant l’e-mail de l’achat.',
  },
  askRef: {
    es: 'Tengo el correo. Me falta la referencia del pedido, son nueve letras y está en el correo de confirmación.',
    en: 'Got the email. I still need the order reference, nine letters, it is in the confirmation email.',
    fr: 'J’ai l’e-mail. Il me manque la référence, neuf lettres, dans l’e-mail de confirmation.',
  },
  noMatch: {
    es: 'No encuentro ningún pedido con esa referencia y ese correo. Revisa que sea el correo de la compra, o te paso con una persona.',
    en: 'I cannot find an order with that reference and that email. Check it is the email you bought with, or I can pass you to a person.',
    fr: 'Je ne trouve aucune commande avec cette référence et cet e-mail. Vérifiez l’e-mail de l’achat, ou je vous passe à une personne.',
  },
  sizeAsk: {
    es: 'Dime tu altura y tu peso, por ejemplo 178 y 74, y te digo la talla. Si es para un niño o una niña, dime su altura y lo miro en la tabla infantil.',
    en: 'Tell me your height and weight, for example 178 and 74, and I will tell you the size.',
    fr: 'Donnez-moi votre taille et votre poids, par exemple 178 et 74, et je vous dis quelle taille choisir.',
  },
  print: {
    es: 'El nombre va en mayúsculas, hasta 12 caracteres, y se estampa tal cual lo escribes, tildes y Ñ incluidas. El dorsal va del 0 al 99. Nombre y dorsal suman 15 € y el parche de liga 4,95 €. Las camisetas personalizadas no admiten devolución, así que revisa bien el texto antes de pagar.',
    en: 'The name is printed in capitals, up to 12 characters, exactly as you type it, accents included. Numbers go from 0 to 99. Name and number add 15 € and the league patch 4,95 €. Personalised shirts cannot be returned, so check the text before paying.',
    fr: 'Le nom est imprimé en majuscules, 12 caractères maximum, tel que vous l’écrivez, accents compris. Le numéro va de 0 à 99. Nom et numéro coûtent 15 €, le patch de ligue 4,95 €. Un maillot personnalisé ne peut pas être retourné.',
  },
  returns: {
    es: 'Lo que no está personalizado tiene 14 días para devolverse sin explicaciones. Lo personalizado no, porque lleva tu nombre y tu dorsal. Si llegó con un fallo de estampado, eso sí lo reponemos siempre.',
    en: 'Items that are not personalised can be returned within 14 days. Personalised shirts cannot, since they carry your name and number. A printing fault is always replaced.',
    fr: 'Un article non personnalisé peut être retourné sous 14 jours. Un maillot personnalisé, non. Un défaut d’impression est toujours remplacé.',
  },
  handoffAsk: {
    es: 'Te paso con una persona del equipo. Déjame tu correo y te escriben hoy mismo.',
    en: 'I will pass you to a person on the team. Leave your email and they will write to you today.',
    fr: 'Je vous passe à une personne de l’équipe. Laissez votre e-mail et elle vous écrit aujourd’hui.',
  },
  handoffDone: {
    es: 'Hecho. Una persona del equipo tiene ya tu pregunta y te escribe a {email}.',
    en: 'Done. A person on the team has your question and will write to {email}.',
    fr: 'C’est fait. Une personne de l’équipe a votre question et écrira à {email}.',
  },
  unknown: {
    es: 'Esa todavía no la sé contestar bien. Puedo pasársela a una persona del equipo, que te responde por correo.',
    en: 'I cannot answer that one well yet. I can pass it to a person on the team, who will reply by email.',
    fr: 'Je ne sais pas encore bien répondre à cela. Je peux transmettre à une personne de l’équipe.',
  },
  found: {
    es: 'Esto es lo que tengo:',
    en: 'This is what I found:',
    fr: 'Voici ce que j’ai trouvé :',
  },
  hello: {
    es: 'Hola. Te ayudo con tallas, personalización, envíos o el estado de tu pedido. También puedo buscarte una camiseta.',
    en: 'Hi. I can help with sizes, personalisation, shipping or your order status. I can also find you a shirt.',
    fr: 'Bonjour. Je peux vous aider pour les tailles, la personnalisation, la livraison ou votre commande.',
  },
};

const has = (s: string, words: string[]) => words.some((w) => s.includes(w));

function parseBody(raw: string) {
  const s = plain(raw).replace(/(\d),(\d)/g, '$1.$2');
  let height: number | undefined;
  let weight: number | undefined;
  const metres = s.match(/\b1\.(\d{2})\b/);
  if (metres) height = 100 + Number(metres[1]);
  const nums = [...s.matchAll(/\b(\d{2,3})\b/g)].map((m) => Number(m[1])).filter((n) => !(metres && n === Number(metres[1])));
  if (!height) height = nums.find((n) => n >= 95 && n <= 210);
  const kg = s.match(/(\d{2,3})\s*(kg|kilos)/) || s.match(/peso\s*(\d{2,3})/);
  if (kg) weight = Number(kg[1]);
  else weight = nums.find((n) => n >= 25 && n <= 150 && n !== height);
  return { height, weight };
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const REF = /\b([A-Za-z]{9})\b/;

export function answer(
  input: string,
  ctx: AssistantContext,
  data: { orders: Order[]; customers: Customer[]; settings: Settings; knowledge: UnansweredQuestion[] },
): Reply {
  const lang = detectLang(input);
  const s = plain(input);
  const next: AssistantContext = { ...ctx };
  const emailMatch = input.match(EMAIL);

  if (ctx.awaitingHandoffEmail) {
    if (emailMatch) {
      return { lang, text: T.handoffDone[lang].replace('{email}', emailMatch[0]), context: {}, escalate: { email: emailMatch[0], question: ctx.pendingQuestion ?? input } };
    }
  }

  if (has(s, ['persona', 'humano', 'agente', 'hablar con', 'human', 'someone', 'quelqu', 'pasame', 'pasar con'])) {
    return { lang, text: T.handoffAsk[lang], context: { ...next, awaitingHandoffEmail: true, pendingQuestion: ctx.pendingQuestion ?? input } };
  }

  // Order status: reference AND email, or nothing is shown.
  const refWord = (input.match(/\b[A-Z]{9}\b/) ?? (has(s, ['pedido', 'order', 'commande', 'referencia']) ? input.match(REF) : null))?.[0];
  const orderIntent = has(s, ['pedido', 'order', 'commande', 'encomenda', 'seguimiento', 'tracking', 'donde esta', 'where is', 'llega mi', 'mi paquete']);
  if (refWord && !['REFERENCIA'].includes(refWord.toUpperCase())) next.ref = refWord.toUpperCase();
  if (emailMatch && (orderIntent || next.ref)) next.email = emailMatch[0].toLowerCase();
  if (orderIntent || (next.ref && next.ref !== ctx.ref) || (emailMatch && ctx.ref)) {
    if (next.ref && next.email) {
      const o = data.orders.find((x) => x.ref === next.ref);
      const c = o && data.customers.find((x) => x.id === o.customerId);
      if (!o || !c || c.email.toLowerCase() !== next.email) return { lang, text: T.noMatch[lang], context: {} };
      const st = STATUS[o.status].label;
      const last = o.history[o.history.length - 1];
      const items = o.lines.map((l) => productById(l.productId)?.name).filter(Boolean).join(', ');
      const win = deliveryWindow(o.lines, o.carrier === 'GLS' ? 'GLS' : o.carrier);
      const lines: Record<Lang, string> = {
        es: `Tu pedido ${o.ref} está en «${st}» desde el ${fmtDate(last.at, true)}. Lleva: ${items}.${o.tracking ? ` Va con ${o.carrier}, seguimiento ${o.tracking}.` : ` Saldrá con ${o.carrier}${o.status === 'entregado' ? '' : `, entrega prevista entre el ${win.start} y el ${win.end}`}.`}`,
        en: `Your order ${o.ref} has been "${st}" since ${fmtDate(last.at, true)}. It contains: ${items}.${o.tracking ? ` Carrier ${o.carrier}, tracking ${o.tracking}.` : ''}`,
        fr: `Votre commande ${o.ref} est « ${st} » depuis le ${fmtDate(last.at, true)}.${o.tracking ? ` Transporteur ${o.carrier}, suivi ${o.tracking}.` : ''}`,
      };
      return { lang, text: lines[lang], context: {} };
    }
    if (next.ref && !next.email) return { lang, text: T.askEmail[lang], context: next };
    if (next.email && !next.ref) return { lang, text: T.askRef[lang], context: next };
    return { lang, text: T.askBoth[lang], context: next };
  }

  // Answers the team wrote for questions the assistant could not answer before.
  const tokens = (t: string) => plain(t).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 3);
  const words = tokens(input);
  const known = data.knowledge.find((q) => {
    if (!q.answer) return false;
    const qw = tokens(q.question);
    const hit = qw.filter((w) => words.includes(w)).length;
    return hit >= Math.max(2, Math.ceil(qw.length * 0.4));
  });
  if (known) return { lang, text: known.answer!, context: next };

  if (has(s, ['talla', 'size', 'taille', 'tamanho', 'mido', 'peso', ' kg', 'kilos', 'me queda'])) {
    const { height, weight } = parseBody(input);
    const kids = has(s, ['nino', 'nina', 'anos', 'hijo', 'hija', 'sobrino', 'crio']) || (height !== undefined && height < 150);
    if (height && (weight || kids)) {
      const size = recommendSize(height, weight ?? 30, 'ajustada', kids);
      const msg: Record<Lang, string> = {
        es: `Con ${height} cm${weight ? ` y ${weight} kg` : ''} te recomiendo la ${size}. El corte es ajustado: si buscas que quede holgada, sube una talla.`,
        en: `With ${height} cm${weight ? ` and ${weight} kg` : ''} I would go for ${size}. The cut is slim, so go one size up for a looser fit.`,
        fr: `Avec ${height} cm${weight ? ` et ${weight} kg` : ''}, je vous conseille la ${size}. La coupe est ajustée, prenez une taille au-dessus pour plus d’aisance.`,
      };
      return { lang, text: msg[lang], context: next };
    }
    return { lang, text: T.sizeAsk[lang], context: next };
  }

  if (has(s, ['devol', 'devolver', 'cambiar la talla', 'cambio de talla', 'return', 'rembours', 'retour'])) return { lang, text: T.returns[lang], context: next };

  if (has(s, ['tasa', 'recargo', 'impuesto', 'tax', 'arancel', 'aduana'])) {
    const f = data.settings.fee;
    const msg: Record<Lang, string> = {
      es: f.enabled
        ? `La ${f.label.toLowerCase()} es de ${eur(f.amount)} ${f.mode === 'pedido' ? 'por pedido' : 'por cada tipo de artículo del pedido'}. Aparece desde el carrito y va dentro del total que pagas, sin sorpresas al final.`
        : 'Ahora mismo no se aplica ningún recargo aparte del envío.',
      en: f.enabled ? `The ${f.label} is ${eur(f.amount)} ${f.mode === 'pedido' ? 'per order' : 'per item type'}, shown from the cart and included in the total.` : 'No extra charge applies right now besides shipping.',
      fr: f.enabled ? `La ${f.label} est de ${eur(f.amount)} ${f.mode === 'pedido' ? 'par commande' : 'par type d’article'}, incluse dans le total.` : 'Aucun supplément à part la livraison.',
    };
    return { lang, text: msg[lang], context: next };
  }

  if (has(s, ['nombre', 'dorsal', 'personaliz', 'estamp', 'letras', 'numero', 'name', 'number', 'print', 'nom ', 'numéro', 'flocage', 'parche', 'patch'])) {
    if (!has(s, ['00', 'delante', 'vinilo', 'bordad', 'front', 'manga'])) return { lang, text: T.print[lang], context: next };
  }

  if (has(s, ['envio', 'enviais', 'llega', 'plazo', 'entrega', 'tarda', 'shipping', 'deliver', 'livr', 'correos', 'seur', 'gls'])) {
    if (!has(s, ['canarias', 'uk', 'reino unido', 'andorra', 'ceuta', 'melilla', 'suiza'])) {
      const msg: Record<Lang, string> = {
        es: `En España, Correos entrega en 3 a 5 días laborables (4,95 €, gratis desde 100 €) y SEUR en 24 a 48 horas (8,95 €). Al resto de Europa va con GLS en 4 a 7 días. Si la camiseta va personalizada, sale del taller dos días laborables después.`,
        en: 'In Spain, Correos delivers in 3 to 5 working days (4,95 €, free from 100 €) and SEUR in 24 to 48 hours. The rest of Europe ships with GLS in 4 to 7 days. Personalised shirts leave the workshop 2 working days later.',
        fr: 'En Europe, GLS livre en 4 à 7 jours ouvrés. Un maillot personnalisé part 2 jours ouvrés plus tard.',
      };
      return { lang, text: msg[lang], context: next };
    }
  }

  const found = search(input).slice(0, 4);
  if (found.length && !has(s, ['canarias', '00', 'vinilo', 'bordad', 'factura', 'cif', 'tienda fisica', 'recoger'])) {
    const kids = has(s, ['nino', 'nina', 'infantil', 'anos']);
    const list = kids ? found.filter((p) => p.category === 'infantil').concat(found.filter((p) => p.category !== 'infantil')).slice(0, 4) : found;
    return { lang, text: T.found[lang], products: list.map((p) => p.id), context: next };
  }

  if (s.length < 14 && has(s, ['hola', 'buenas', 'hello', 'hi', 'bonjour', 'ola'])) return { lang, text: T.hello[lang], context: next };

  return { lang, text: T.unknown[lang], context: { ...next, pendingQuestion: input }, unanswered: input };
}

export const SUGGESTIONS = ['Dónde está mi pedido', 'Qué talla me pido, mido 178 y peso 74', 'Cómo se personaliza', 'Camiseta azul para un niño de 8 años'];

export const productsForReply = (ids?: number[]) => (ids ?? []).map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PRODUCTS, productById, type CategorySlug } from './mock/catalog';
import {
  ORDERS, REVIEWS, CARTS, CUSTOMERS, NOW, STAGING_COPY, toMin, fromMin, makeRef,
  type Order, type Review, type AbandonedCart, type Customer, type Line, type OrderStatus,
} from './mock/sales';
import {
  EMAIL_TEMPLATES, UNANSWERED, CONVERSATIONS, ESCALATIONS, CHANGES, DEFAULT_SETTINGS,
  type EmailTemplate, type UnansweredQuestion, type Conversation, type Escalation, type Change, type Settings, type ChatMessage,
} from './mock/ops';
import { computeTotals, lineKey } from './logic';
import { answer, type AssistantContext } from './assistant';

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Rehearsal = { id: number; at: string; minutes: number; issues: string[]; ok: boolean; ordersKept: number };
export type CheckoutDraft = { email: string; name: string; address: string; city: string; zip: string; country: string; carrier: 'Correos' | 'SEUR' | 'GLS' };

type State = {
  orders: Order[];
  reviews: Review[];
  carts: AbandonedCart[];
  customers: Customer[];
  emails: EmailTemplate[];
  unanswered: UnansweredQuestion[];
  conversations: Conversation[];
  escalations: Escalation[];
  changes: Change[];
  settings: Settings;
  stock: Record<number, Record<string, number>>;
  cart: Line[];
  checkout: CheckoutDraft;
  sessionCartId: string | null;
  chat: { messages: ChatMessage[]; context: AssistantContext; id: string | null };
  rehearsals: Rehearsal[];
  checklist: Record<string, boolean>;
  sortLog: { at: string; window: number; moved: number }[];
  clock: number;
};

const initial = (): State => ({
  orders: ORDERS,
  reviews: REVIEWS,
  carts: CARTS,
  customers: CUSTOMERS,
  emails: EMAIL_TEMPLATES,
  unanswered: UNANSWERED,
  conversations: CONVERSATIONS,
  escalations: ESCALATIONS,
  changes: CHANGES,
  settings: DEFAULT_SETTINGS,
  stock: Object.fromEntries(PRODUCTS.map((p) => [p.id, { ...p.stock }])),
  cart: [],
  checkout: { email: '', name: '', address: '', city: '', zip: '', country: 'España', carrier: 'Correos' },
  sessionCartId: null,
  chat: { messages: [], context: {}, id: null },
  rehearsals: [],
  checklist: {},
  sortLog: [{ at: '2026-10-22 03:00', window: 90, moved: 3 }, { at: '2026-10-21 03:00', window: 90, moved: 1 }],
  clock: 0,
});

/** Session time moves forward from the fixed store clock, so new records sort on top. */
const stamp = (clock: number) => fromMin(toMin(NOW) + clock);

const KEY = 'vestuario:datos:v4';

type Toast = { id: number; text: string; tone: 'ok' | 'info' | 'bad' };

type Api = ReturnType<typeof useApi>;
const Ctx = createContext<Api | null>(null);

function useApi() {
  const [s, setS] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const pulse = useRef(0);
  const sRef = useRef(s);
  sRef.current = s;

  // Kept in this browser only, and shared between its tabs: an order placed in the store shows up in the panel tab.
  const written = useRef('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        written.current = raw;
        setS({ ...initial(), ...JSON.parse(raw) });
      }
    } catch {}
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        written.current = e.newValue ?? '';
        setS(e.newValue ? { ...initial(), ...JSON.parse(e.newValue) } : initial());
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        const { orders, reviews, carts, customers, emails, unanswered, conversations, escalations, changes, settings, stock, cart, checkout, sessionCartId, chat, rehearsals, checklist, sortLog, clock } = s;
        const json = JSON.stringify({ orders, reviews, carts, customers, emails, unanswered, conversations, escalations, changes, settings, stock, cart, checkout, sessionCartId, chat, rehearsals, checklist, sortLog, clock });
        if (json !== written.current) {
          written.current = json;
          localStorage.setItem(KEY, json);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [s, hydrated]);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++pulse.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const tick = (st: State, minutes = 1) => ({ ...st, clock: st.clock + minutes });

  const emit = (name: string, detail?: unknown) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  // ---------- cart
  const addToCart = useCallback(async (line: Line) => {
    await wait(450);
    setS((st) => {
      const key = lineKey(line);
      const exists = st.cart.find((l) => lineKey(l) === key);
      const cart = exists ? st.cart.map((l) => (lineKey(l) === key ? { ...l, qty: l.qty + line.qty } : l)) : [...st.cart, line];
      return syncSessionCart({ ...st, cart });
    });
    emit('vestuario:add', line);
    setCartOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setS((st) => syncSessionCart({ ...st, cart: qty <= 0 ? st.cart.filter((l) => lineKey(l) !== key) : st.cart.map((l) => (lineKey(l) === key ? { ...l, qty } : l)) }));
  }, []);

  const updateCheckout = useCallback((patch: Partial<CheckoutDraft>) => {
    setS((st) => syncSessionCart({ ...st, checkout: { ...st.checkout, ...patch } }));
  }, []);

  /** The cart the visitor is building shows up in the panel as soon as there is an email to remind. */
  function syncSessionCart(st: State): State {
    const email = st.checkout.email.trim();
    const valid = /[\w.+-]+@[\w-]+\.[\w.]+/.test(email);
    if (!st.cart.length) {
      return st.sessionCartId ? { ...st, carts: st.carts.filter((c) => c.id !== st.sessionCartId), sessionCartId: null } : st;
    }
    if (!valid && !st.sessionCartId) return st;
    const id = st.sessionCartId ?? `C${7400 + st.clock}`;
    const rec: AbandonedCart = {
      id,
      email: valid ? email : null,
      name: st.checkout.name || null,
      createdAt: st.carts.find((c) => c.id === id)?.createdAt ?? stamp(st.clock),
      step: st.checkout.address ? 'envio' : 'datos',
      lines: st.cart,
      reminders: [],
      status: valid ? 'pendiente' : 'sin_correo',
    };
    const carts = st.carts.some((c) => c.id === id) ? st.carts.map((c) => (c.id === id ? { ...c, ...rec, reminders: c.reminders, status: c.status === 'recuperado' ? c.status : rec.status } : c)) : [rec, ...st.carts];
    return { ...st, carts, sessionCartId: id };
  }

  const placeOrder = useCallback(async (payment: 'Tarjeta' | 'Bizum' | 'PayPal', card: string) => {
    await wait(1400);
    if (payment === 'Tarjeta' && card.replace(/\s/g, '').endsWith('0002')) {
      throw new Error('El banco ha rechazado la tarjeta. No se ha cobrado nada, prueba con otra o con Bizum.');
    }
    const st = tick(sRef.current, 3);
    const t = computeTotals(st.cart, st.settings, st.checkout.carrier, st.checkout.country);
    let customer = st.customers.find((c) => c.email.toLowerCase() === st.checkout.email.toLowerCase());
    let customers = st.customers;
    if (!customer) {
      customer = { id: 3300 + st.clock, name: st.checkout.name || 'Cliente nuevo', email: st.checkout.email, city: st.checkout.city || 'Madrid', country: st.checkout.country, lang: 'es', since: stamp(st.clock).split(' ')[0] };
      customers = [customer, ...st.customers];
    }
    let seed = st.clock * 7919 + st.cart.length * 104729 + 17;
    const r = () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
    const ref = makeRef(r);
    const at = stamp(st.clock);
    const order: Order = {
      ref, id: Math.max(...st.orders.map((o) => o.id)) + 1, customerId: customer.id, date: at, status: 'pago_aceptado',
      lines: st.cart, carrier: st.checkout.carrier, shipping: t.shipping,
      fee: t.fee ? { label: t.feeLabel, amount: t.fee } : null, total: t.total, payment,
      history: [{ status: 'pago_aceptado', at }], emails: [{ kind: 'confirmacion', at }],
    };
    const stock = { ...st.stock };
    for (const l of st.cart) stock[l.productId] = { ...stock[l.productId], [l.size]: Math.max(0, (stock[l.productId]?.[l.size] ?? 0) - l.qty) };
    const carts = st.sessionCartId
      ? st.carts.map((c) => (c.id === st.sessionCartId ? (c.reminders.length ? { ...c, status: 'recuperado' as const } : c) : c)).filter((c) => c.id !== st.sessionCartId || c.reminders.length)
      : st.carts;
    setS((cur) => ({ ...cur, clock: st.clock, orders: [order, ...cur.orders], customers, stock, cart: [], carts, sessionCartId: null }));
    emit('vestuario:order');
    return ref;
  }, []);

  // ---------- orders
  const setOrderStatus = useCallback(async (ref: string, status: OrderStatus) => {
    await wait(600);
    setS((st0) => {
      const st = tick(st0, 2);
      const at = stamp(st.clock);
      return {
        ...st,
        orders: st.orders.map((o) => {
          if (o.ref !== ref) return o;
          const tracking = status === 'enviado' && !o.tracking ? (o.carrier === 'Correos' ? `PQ4F${String(o.id).padStart(9, '7')}ES` : `0${o.id}${o.id}`) : o.tracking;
          const emails = status === 'enviado' && !o.emails.some((e) => e.kind === 'envio') ? [...o.emails, { kind: 'envio', at }] : o.emails;
          return { ...o, status, tracking, emails, history: [...o.history, { status, at }] };
        }),
      };
    });
    emit('vestuario:status', { ref, status });
  }, []);

  const setOrderNote = useCallback((ref: string, note: string) => {
    setS((st) => ({ ...st, orders: st.orders.map((o) => (o.ref === ref ? { ...o, note } : o)) }));
  }, []);

  const deleteOrder = useCallback(async (ref: string) => {
    await wait(500);
    setS((st) => ({ ...st, orders: st.orders.filter((o) => o.ref !== ref) }));
  }, []);

  // ---------- reviews
  const setReviewStatus = useCallback(async (id: number, status: Review['status']) => {
    await wait(350);
    setS((st) => ({ ...st, reviews: st.reviews.map((r) => (r.id === id ? { ...r, status } : r)) }));
  }, []);
  const replyReview = useCallback(async (id: number, reply: string) => {
    await wait(500);
    setS((st) => ({ ...st, reviews: st.reviews.map((r) => (r.id === id ? { ...r, reply: reply || undefined } : r)) }));
  }, []);
  const deleteReview = useCallback(async (id: number) => {
    await wait(350);
    setS((st) => ({ ...st, reviews: st.reviews.filter((r) => r.id !== id) }));
  }, []);
  const requestOldReviews = useCallback(async () => {
    await wait(1600);
    const st = tick(sRef.current, 5);
    const limit = toMin(NOW) - st.settings.reviews.monthsBack * 30 * 1440;
    const at = stamp(st.clock);
    let sent = 0;
    const orders = st.orders.map((o) => {
      if (o.status !== 'entregado' || o.emails.some((e) => e.kind === 'opinion') || toMin(o.date) < limit) return o;
      sent++;
      return { ...o, emails: [...o.emails, { kind: 'opinion', at }] };
    });
    setS((cur) => ({ ...cur, clock: st.clock, orders, settings: { ...cur.settings, reviews: { ...cur.settings.reviews, includeOld: true } } }));
    return sent;
  }, []);

  // ---------- categories
  const setPins = useCallback((slug: CategorySlug, ids: number[]) => {
    setS((st) => ({ ...st, settings: { ...st.settings, pins: { ...st.settings.pins, [slug]: ids } } }));
  }, []);
  const setSortWindow = useCallback((w: Settings['sortWindow']) => {
    setS((st) => ({ ...st, settings: { ...st.settings, sortWindow: w } }));
  }, []);
  const runSort = useCallback(async (moved: number) => {
    await wait(1500);
    setS((st0) => {
      const st = tick(st0, 1);
      const at = stamp(st.clock);
      return { ...st, settings: { ...st.settings, lastSortRun: at }, sortLog: [{ at, window: st.settings.sortWindow, moved }, ...st.sortLog].slice(0, 6) };
    });
  }, []);

  // ---------- abandoned carts
  const sendReminder = useCallback(async (id: string) => {
    await wait(800);
    setS((st0) => {
      const st = tick(st0, 1);
      return {
        ...st,
        carts: st.carts.map((c) => {
          if (c.id !== id || !c.email || c.reminders.length >= 2) return c;
          const reminders = [...c.reminders, stamp(st.clock)];
          return { ...c, reminders, status: reminders.length === 1 ? 'recordatorio_1' : 'recordatorio_2' };
        }),
      };
    });
  }, []);
  const markRecovered = useCallback(async (id: string) => {
    await wait(400);
    setS((st) => ({ ...st, carts: st.carts.map((c) => (c.id === id ? { ...c, status: 'recuperado' } : c)) }));
  }, []);
  const deleteCart = useCallback(async (id: string) => {
    await wait(350);
    setS((st) => ({ ...st, carts: st.carts.filter((c) => c.id !== id) }));
  }, []);
  const setCartSettings = useCallback((patch: Partial<Settings['carts']>) => {
    setS((st) => ({ ...st, settings: { ...st.settings, carts: { ...st.settings.carts, ...patch } } }));
  }, []);

  // ---------- emails
  const saveEmail = useCallback(async (id: EmailTemplate['id'], patch: Pick<EmailTemplate, 'subject' | 'body'>) => {
    await wait(700);
    setS((st0) => {
      const st = tick(st0, 1);
      return { ...st, emails: st.emails.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: stamp(st.clock) } : e)) };
    });
  }, []);
  const resetEmail = useCallback((id: EmailTemplate['id']) => {
    const orig = EMAIL_TEMPLATES.find((e) => e.id === id)!;
    setS((st) => ({ ...st, emails: st.emails.map((e) => (e.id === id ? orig : e)) }));
  }, []);

  // ---------- settings
  const saveFee = useCallback(async (fee: Settings['fee']) => {
    await wait(650);
    setS((st) => ({ ...st, settings: { ...st.settings, fee } }));
  }, []);
  const saveReviewSettings = useCallback((patch: Partial<Settings['reviews']>) => {
    setS((st) => ({ ...st, settings: { ...st.settings, reviews: { ...st.settings.reviews, ...patch } } }));
  }, []);
  const saveAssistantSettings = useCallback((patch: Partial<Settings['assistant']>) => {
    setS((st) => ({ ...st, settings: { ...st.settings, assistant: { ...st.settings.assistant, ...patch } } }));
  }, []);

  // ---------- assistant
  const ask = useCallback(async (text: string) => {
    setS((st0) => {
      const st = tick(st0, 1);
      const id = st.chat.id ?? `K-${9320 + st.clock}`;
      return { ...st, chat: { ...st.chat, id, messages: [...st.chat.messages, { from: 'cliente', text }] } };
    });
    await wait(700 + Math.min(900, text.length * 12));
    setS((st) => {
      const r = answer(text, st.chat.context, { orders: st.orders, customers: st.customers, settings: st.settings, knowledge: st.unanswered });
      const messages: ChatMessage[] = [...st.chat.messages, { from: 'asistente', text: r.text, products: r.products }];
      let unanswered = st.unanswered;
      if (r.unanswered) {
        const sim = unanswered.find((q) => q.question.toLowerCase().slice(0, 24) === r.unanswered!.toLowerCase().slice(0, 24));
        unanswered = sim
          ? unanswered.map((q) => (q === sim ? { ...q, count: q.count + 1, lastAt: stamp(st.clock) } : q))
          : [{ id: Math.max(0, ...unanswered.map((q) => q.id)) + 1, question: r.unanswered, count: 1, lastAt: stamp(st.clock), lang: r.lang }, ...unanswered];
      }
      let escalations = st.escalations;
      if (r.escalate) escalations = [{ id: Math.max(...escalations.map((e) => e.id)) + 1, email: r.escalate.email, question: r.escalate.question, at: stamp(st.clock), status: 'abierta' }, ...escalations];
      const chatId = st.chat.id!;
      const outcome: Conversation['outcome'] = r.escalate ? 'derivada' : r.unanswered ? 'sin_respuesta' : 'resuelta';
      const conv: Conversation = { id: chatId, startedAt: st.conversations.find((c) => c.id === chatId)?.startedAt ?? stamp(st.clock), lang: r.lang, topic: messages[0]?.text.slice(0, 28) ?? 'Consulta', outcome, messages };
      const conversations = st.conversations.some((c) => c.id === chatId) ? st.conversations.map((c) => (c.id === chatId ? conv : c)) : [conv, ...st.conversations];
      return {
        ...st,
        unanswered,
        escalations,
        conversations,
        settings: { ...st.settings, assistant: { ...st.settings.assistant, quotaUsed: st.settings.assistant.quotaUsed + 1 } },
        chat: { ...st.chat, messages, context: r.context },
      };
    });
  }, []);
  const answerQuestion = useCallback(async (id: number, text: string) => {
    await wait(600);
    setS((st) => ({ ...st, unanswered: st.unanswered.map((q) => (q.id === id ? { ...q, answer: text || undefined } : q)) }));
  }, []);
  const deleteQuestion = useCallback((id: number) => {
    setS((st) => ({ ...st, unanswered: st.unanswered.filter((q) => q.id !== id) }));
  }, []);
  const resolveEscalation = useCallback(async (id: number) => {
    await wait(400);
    setS((st) => ({ ...st, escalations: st.escalations.map((e) => (e.id === id ? { ...e, status: 'respondida' } : e)) }));
  }, []);
  const resetChat = useCallback(() => setS((st) => ({ ...st, chat: { messages: [], context: {}, id: null } })), []);

  // ---------- go-live
  const saveChange = useCallback(async (c: Omit<Change, 'id'> & { id?: number }) => {
    await wait(450);
    setS((st) => ({
      ...st,
      changes: c.id ? st.changes.map((x) => (x.id === c.id ? ({ ...x, ...c } as Change) : x)) : [...st.changes, { ...c, id: Math.max(0, ...st.changes.map((x) => x.id)) + 1 } as Change],
    }));
  }, []);
  const deleteChange = useCallback(async (id: number) => {
    await wait(300);
    setS((st) => ({ ...st, changes: st.changes.filter((x) => x.id !== id) }));
  }, []);
  const toggleCheck = useCallback((id: string) => setS((st) => ({ ...st, checklist: { ...st.checklist, [id]: !st.checklist[id] } })), []);
  const logRehearsal = useCallback((r: Omit<Rehearsal, 'id' | 'at'>) => {
    setS((st0) => {
      const st = tick(st0, r.minutes);
      return { ...st, rehearsals: [{ ...r, id: st.rehearsals.length + 1, at: stamp(st.clock) }, ...st.rehearsals] };
    });
  }, []);

  const resetAll = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
    written.current = '';
    setS(initial());
  }, []);

  const derived = useMemo(() => {
    const totals = computeTotals(s.cart, s.settings, s.checkout.carrier, s.checkout.country);
    const copyMin = toMin(STAGING_COPY);
    const sinceCopy = s.orders.filter((o) => toMin(o.date) >= copyMin);
    const firstOrder = new Map<number, number>();
    for (const o of s.orders) firstOrder.set(o.customerId, Math.min(firstOrder.get(o.customerId) ?? Infinity, toMin(o.date)));
    const newCustomers = [...firstOrder.values()].filter((m) => m >= copyMin).length;
    return { totals, cartCount: s.cart.reduce((a, l) => a + l.qty, 0), sinceCopy, newCustomers, now: stamp(s.clock) };
  }, [s]);

  return {
    ...s, ...derived, hydrated, toasts, toast, cartOpen, setCartOpen, chatOpen, setChatOpen,
    addToCart, setQty, updateCheckout, placeOrder,
    setOrderStatus, setOrderNote, deleteOrder,
    setReviewStatus, replyReview, deleteReview, requestOldReviews,
    setPins, setSortWindow, runSort,
    sendReminder, markRecovered, deleteCart, setCartSettings,
    saveEmail, resetEmail, saveFee, saveReviewSettings, saveAssistantSettings,
    ask, answerQuestion, deleteQuestion, resolveEscalation, resetChat,
    saveChange, deleteChange, toggleCheck, logRehearsal, resetAll,
    productById,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

/** First paint of a panel screen behaves like a request: skeleton, then data. */
export function useLoading(ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

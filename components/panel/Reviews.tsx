'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, EyeOff, Trash2, MessageSquareReply, Send, Code2, BadgeCheck, Search } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { PRODUCTS, productById } from '@/lib/mock/catalog';
import { avgRating, fmtDate } from '@/lib/logic';
import { NOW, toMin } from '@/lib/mock/sales';
import { Stars, SkRows, Empty, Spinner, Switch } from '@/components/ui';

export function Reviews() {
  const { reviews, orders, settings, setReviewStatus, replyReview, deleteReview, requestOldReviews, saveReviewSettings, toast } = useStore();
  const loading = useLoading();
  const [tab, setTab] = useState<'pendiente' | 'publicada' | 'oculta'>('pendiente');
  const [stars, setStars] = useState(0);
  const [replying, setReplying] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const list = useMemo(() => reviews.filter((r) => r.status === tab && (!stars || r.rating === stars)), [reviews, tab, stars]);
  const limit = toMin(NOW) - settings.reviews.monthsBack * 30 * 1440;
  const oldPending = orders.filter((o) => o.status === 'entregado' && !o.emails.some((e) => e.kind === 'opinion') && toMin(o.date) >= limit).length;
  const withStars = PRODUCTS.filter((p) => avgRating(p.id, reviews).count > 0);

  const sendOld = async () => {
    setSending(true);
    const n = await requestOldReviews();
    setSending(false);
    toast(n ? `${n} peticiones de opinión enviadas a pedidos ya entregados` : 'No quedan pedidos antiguos sin petición');
  };

  return (
    <>
      <div className="main-head">
        <div><h1>Opiniones</h1><div className="small muted">Moderar, contestar y pedirlas solas, también a pedidos antiguos</div></div>
      </div>
      <div className="cols" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 6 }}>
          <div className="tabs" style={{ padding: '0 8px' }}>
            {(['pendiente', 'publicada', 'oculta'] as const).map((t) => (
              <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
                {t === 'pendiente' ? 'Por moderar' : t === 'publicada' ? 'Publicadas' : 'Ocultas'} ({reviews.filter((r) => r.status === t).length})
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 6, padding: '0 10px 10px', flexWrap: 'wrap' }}>
            {[0, 5, 4, 3, 2, 1].map((n) => <button key={n} className={`chip ${stars === n ? 'on' : ''}`} style={{ minHeight: 30 }} onClick={() => setStars(n)}>{n ? `${n} ★` : 'Todas'}</button>)}
          </div>
          {loading ? <div style={{ padding: 12 }}><SkRows rows={5} h={90} /></div> : list.length === 0 ? (
            <Empty icon={<Search size={22} />} title={tab === 'pendiente' ? 'Nada por moderar' : 'Ninguna opinión aquí'} text="Las nuevas entran como pendientes salvo que actives la publicación automática." />
          ) : (
            <div style={{ padding: '0 12px' }}>
              {list.slice(0, 30).map((r) => {
                const p = productById(r.productId);
                return (
                  <div key={r.id} className="review enter">
                    <div className="row between"><Stars value={r.rating} /><span className="tiny muted">{fmtDate(r.date)}</span></div>
                    <div className="strong small" style={{ marginTop: 6 }}>{r.title}</div>
                    <p className="small" style={{ color: 'var(--ink-2)', marginTop: 3 }}>{r.body}</p>
                    <div className="row tiny muted" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span>{r.author}, {r.city}</span>
                      {r.verified && <span className="row" style={{ gap: 3, color: 'var(--ok)', fontWeight: 700 }}><BadgeCheck size={12} /> Verificada</span>}
                      {p && <Link href={`/producto/${p.slug}#opiniones`} style={{ color: 'var(--accent-ink)' }}>{p.name}</Link>}
                    </div>
                    {r.reply && replying !== r.id && <div className="notice info" style={{ marginTop: 8 }}><MessageSquareReply size={15} /><span>{r.reply}</span></div>}
                    {replying === r.id && (
                      <div className="stack enter" style={{ gap: 8, marginTop: 8 }}>
                        <textarea className="textarea" style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Gracias por contarlo..." />
                        <div className="row"><button className="btn btn-dark btn-xs" onClick={async () => { await replyReview(r.id, text); setReplying(null); toast('Respuesta publicada en la ficha'); }}>Publicar respuesta</button><button className="btn btn-ghost btn-xs" onClick={() => setReplying(null)}>Cancelar</button></div>
                      </div>
                    )}
                    <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {r.status !== 'publicada' && <button className="btn btn-xs btn-soft" onClick={async () => { await setReviewStatus(r.id, 'publicada'); toast('Publicada, ya suma en las estrellas de la ficha'); }}><Check size={13} /> Publicar</button>}
                      {r.status !== 'oculta' && <button className="btn btn-xs btn-ghost" onClick={async () => { await setReviewStatus(r.id, 'oculta'); toast('Ocultada', 'info'); }}><EyeOff size={13} /> Ocultar</button>}
                      <button className="btn btn-xs btn-ghost" onClick={() => { setReplying(r.id); setText(r.reply ?? ''); }}><MessageSquareReply size={13} /> Responder</button>
                      <button className="btn btn-xs btn-danger" onClick={async () => { await deleteReview(r.id); toast('Opinión borrada', 'info'); }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad">
            <b>Peticiones automáticas</b>
            <div className="row between" style={{ marginTop: 12 }}>
              <span className="small">Días después de la entrega</span>
              <input type="number" className="input" style={{ width: 80 }} min={2} max={30} value={settings.reviews.daysAfterDelivery} onChange={(e) => saveReviewSettings({ daysAfterDelivery: Number(e.target.value) })} />
            </div>
            <div className="row between" style={{ marginTop: 12 }}>
              <span className="small">Publicar solas desde</span>
              <select className="select" style={{ width: 120 }} value={settings.reviews.autoPublishFrom} onChange={(e) => saveReviewSettings({ autoPublishFrom: Number(e.target.value) })}>
                <option value={6}>Nunca</option><option value={5}>5 estrellas</option><option value={4}>4 estrellas</option>
              </select>
            </div>
            <div className="divider" />
            <div className="row between"><span className="small strong">Pedidos antiguos</span><Switch on={settings.reviews.includeOld} onChange={(v) => saveReviewSettings({ includeOld: v })} label="Incluir pedidos antiguos" /></div>
            <p className="tiny muted" style={{ marginTop: 6 }}>Pedidos entregados en los últimos {settings.reviews.monthsBack} meses que nunca recibieron la petición: <b>{oldPending}</b>.</p>
            <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: 10 }} disabled={sending || oldPending === 0} onClick={sendOld}>{sending ? <><Spinner /> Enviando</> : <><Send size={14} /> Pedir opinión a esos {oldPending}</>}</button>
          </div>
          <div className="card card-pad">
            <b className="row" style={{ gap: 8 }}><Code2 size={16} /> Estrellas en Google</b>
            <p className="small muted" style={{ marginTop: 6 }}>Cada ficha lleva un único bloque de datos estructurados con la media y el número de opiniones. Con un tema nuevo y otro módulo de reseñas es fácil acabar con dos bloques o con ninguno, y la ficha no parece rota, solo desaparecen las estrellas del resultado de Google.</p>
            <div className="stack" style={{ gap: 6, marginTop: 10 }}>
              {withStars.slice(0, 5).map((p) => {
                const r = avgRating(p.id, reviews);
                return (
                  <div key={p.id} className="row between tiny"><span style={{ flex: 1 }}>{p.name.replace('Camiseta ', '')}</span><span className="badge ok">1 bloque · {r.avg.toFixed(1).replace('.', ',')} ({r.count})</span></div>
                );
              })}
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>{withStars.length} fichas con estrellas, {PRODUCTS.length - withStars.length} sin opiniones todavía, sin bloque de valoración.</p>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Send, CheckCircle2, Trash2, MailX, Eye, Ban, Clock } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { computeTotals, eur, ago, fmtDate } from '@/lib/logic';
import type { AbandonedCart, CartStatus } from '@/lib/mock/sales';
import { SkRows, Empty, Modal, Spinner } from '@/components/ui';
import { EmailPreview } from '@/components/EmailPreview';
import { PrintTag } from '@/components/store/CartDrawer';
import { productById } from '@/lib/mock/catalog';

const LABEL: Record<CartStatus, { t: string; tone: string }> = {
  pendiente: { t: 'Sin recordar', tone: 'warn' },
  recordatorio_1: { t: '1.er aviso enviado', tone: 'info' },
  recordatorio_2: { t: '2.º aviso enviado', tone: 'info' },
  recuperado: { t: 'Recuperado', tone: 'ok' },
  sin_correo: { t: 'Sin correo', tone: 'muted' },
};

export function Carts() {
  const { carts, settings, emails, sendReminder, markRecovered, deleteCart, setCartSettings, sessionCartId, toast } = useStore();
  const loading = useLoading();
  const [tab, setTab] = useState<'todos' | 'con' | 'sin' | 'recuperados'>('con');
  const [preview, setPreview] = useState<AbandonedCart | null>(null);
  const [busy, setBusy] = useState('');
  const list = useMemo(
    () => carts.filter((c) => (tab === 'con' ? c.email && c.status !== 'recuperado' : tab === 'sin' ? !c.email : tab === 'recuperados' ? c.status === 'recuperado' : true)),
    [carts, tab],
  );
  const withEmail = carts.filter((c) => c.email).length;
  const value = (c: AbandonedCart) => computeTotals(c.lines, settings).total;
  const lost = carts.filter((c) => c.status !== 'recuperado').reduce((a, c) => a + value(c), 0);
  const recovered = carts.filter((c) => c.status === 'recuperado').reduce((a, c) => a + value(c), 0);

  const remind = async (c: AbandonedCart) => {
    setBusy(c.id);
    await sendReminder(c.id);
    setBusy('');
    toast(`Aviso ${c.reminders.length + 1} enviado a ${c.email}`);
  };

  return (
    <>
      <div className="main-head">
        <div><h1>Carritos abandonados</h1><div className="small muted">Dos avisos, sin cupón, con el carrito tal cual lo dejaron</div></div>
      </div>
      <div className="kpis">
        <div className="card kpi"><span className="small muted">Carritos en 9 días</span><b>{carts.length}</b><span className="tiny muted">{withEmail} con correo, se les puede recordar</span></div>
        <div className="card kpi"><span className="small muted">Sin recuperar</span><b>{eur(lost)}</b><span className="tiny muted">importe total con la tasa incluida</span></div>
        <div className="card kpi"><span className="small muted">Recuperado</span><b style={{ color: 'var(--ok)' }}>{eur(recovered)}</b><span className="tiny muted">{carts.filter((c) => c.status === 'recuperado').length} carritos pagados tras el aviso</span></div>
      </div>

      <div className="cols" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card" style={{ padding: 6, gridColumn: '1 / -1' }}>
          <div className="tabs" style={{ padding: '0 8px' }}>
            {([['con', 'Con correo'], ['sin', 'Sin correo'], ['recuperados', 'Recuperados'], ['todos', 'Todos']] as const).map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          {loading ? <div style={{ padding: 12 }}><SkRows rows={7} /></div> : list.length === 0 ? (
            <Empty icon={<MailX size={22} />} title="Nada en esta pestaña" text="Cuando alguien deja el correo en el primer paso del pedido y no termina, aparece aquí." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Cliente</th><th>Carrito</th><th>Paso</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {list.map((c) => {
                    const p = productById(c.lines[0].productId);
                    return (
                      <tr key={c.id} className="enter">
                        <td>
                          <div className="small strong">{c.name ?? 'Visitante anónimo'}{c.id === sessionCartId && <span className="badge volt" style={{ marginLeft: 6 }}>Tu sesión</span>}</div>
                          <div className="tiny muted">{c.email ?? 'No dejó el correo'} · {ago(c.createdAt)}</div>
                        </td>
                        <td><div className="small">{p?.name.replace('Camiseta ', '')}</div><div className="row" style={{ gap: 6, marginTop: 3, flexWrap: 'wrap' }}><PrintTag line={c.lines[0]} /><b className="tiny num" style={{ whiteSpace: 'nowrap' }}>{eur(value(c))}</b></div></td>
                        <td className="small muted">{c.step === 'carrito' ? 'Carrito' : c.step === 'datos' ? 'Datos' : c.step === 'envio' ? 'Envío' : 'Pago'}</td>
                        <td><span className={`badge ${LABEL[c.status].tone}`}>{LABEL[c.status].t}</span>{c.opened && <div className="tiny muted" style={{ marginTop: 3 }}>Abrió el correo</div>}</td>
                        <td>
                          <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                            {c.email && <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setPreview(c)} aria-label="Ver el correo" title="Ver el correo"><Eye size={16} /></button>}
                            {c.email && c.status !== 'recuperado' && c.reminders.length < 2 && (
                              <button className="btn btn-xs btn-soft" disabled={busy === c.id} onClick={() => remind(c)}>{busy === c.id ? <Spinner size={13} /> : <Send size={13} />} Aviso {c.reminders.length + 1}</button>
                            )}
                            {c.status !== 'recuperado' && c.email && <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={async () => { await markRecovered(c.id); toast('Marcado como recuperado'); }} aria-label="Marcar recuperado" title="Marcar recuperado"><CheckCircle2 size={16} /></button>}
                            <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={async () => { await deleteCart(c.id); toast('Carrito borrado', 'info'); }} aria-label="Borrar" title="Borrar"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad">
            <b className="row" style={{ gap: 8 }}><Clock size={16} /> Cuándo salen los avisos</b>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field"><label htmlFor="r1">Primer aviso, horas</label><input id="r1" type="number" min={1} max={12} className="input" value={settings.carts.first} onChange={(e) => setCartSettings({ first: Number(e.target.value) })} /></div>
              <div className="field"><label htmlFor="r2">Segundo aviso, horas</label><input id="r2" type="number" min={12} max={72} className="input" value={settings.carts.second} onChange={(e) => setCartSettings({ second: Number(e.target.value) })} /></div>
            </div>
            <div className="notice warn" style={{ marginTop: 12 }}>
              <Ban size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Sin cupón a propósito. Con descuento el correo pasa a ser publicidad, que en España pide permiso previo a quien todavía no es cliente, y además enseña a abandonar el carrito para conseguirlo.</span>
            </div>
            <p className="tiny muted" style={{ marginTop: 10 }}>Solo se puede avisar a quien dejó el correo: con sesión iniciada o al pasar el primer paso del pedido. Prueba a empezar un pedido en la tienda y verás tu carrito aquí.</p>
          </div>
        </div>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={(preview?.reminders.length ?? 0) >= 2 ? `Último aviso enviado a ${preview?.name ?? ''}` : `Próximo aviso para ${preview?.name ?? ''}`} wide>
        {preview && (
          <>
            <EmailPreview tpl={emails.find((e) => e.id === (preview.reminders.length === 0 ? 'carrito_1' : 'carrito_2'))!} customer={{ name: preview.name ?? '', email: preview.email ?? '' }} lines={preview.lines} />
            <p className="tiny muted" style={{ marginTop: 10 }}>{preview.reminders.length ? `Avisos enviados: ${preview.reminders.map((r) => fmtDate(r, true)).join(' y ')}.` : 'Todavía no ha salido ningún aviso.'} El enlace abre este mismo carrito con la talla y la personalización.</p>
          </>
        )}
      </Modal>
    </>
  );
}

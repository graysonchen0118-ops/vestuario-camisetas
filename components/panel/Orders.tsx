'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Printer, Trash2, Mail, CheckCircle2, Circle, ArrowRight, PackageX, StickyNote } from 'lucide-react';
import { useStore, useLoading } from '@/lib/store';
import { STATUS, STATUS_FLOW, type Order, type OrderStatus } from '@/lib/mock/sales';
import { productById, productImage } from '@/lib/mock/catalog';
import { eur, fmtDate, ago, orderSubtotal } from '@/lib/logic';
import { SkRows, Empty, Spinner, Modal } from '@/components/ui';
import { WorkshopShirt } from '@/components/three';
import { PrintTag } from '@/components/store/CartDrawer';

const PER = 15;
const EMAIL_LABEL: Record<string, string> = { confirmacion: 'Confirmación de pedido', envio: 'Pedido enviado', opinion: 'Petición de opinión' };

function Detail({ order, onClose }: { order: Order; onClose: () => void }) {
  const { customers, setOrderStatus, setOrderNote, deleteOrder, toast } = useStore();
  const c = customers.find((x) => x.id === order.customerId);
  const printed = order.lines.filter((l) => l.print && (l.print.name || l.print.number));
  const [sel, setSel] = useState(0);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState(order.note ?? '');
  const [flip, setFlip] = useState(0);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { setSel(0); setNote(order.note ?? ''); }, [order.ref, order.note]);
  const idx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  const line = printed[sel];
  const p = line && productById(line.productId);

  const move = async (s: OrderStatus) => {
    setBusy(s);
    await setOrderStatus(order.ref, s);
    setFlip((f) => f + 1);
    setBusy('');
    toast(s === 'enviado' ? `Marcado como enviado. Sale el correo con el seguimiento a ${c?.email}` : `Pedido ${order.ref}: ${STATUS[s].label}`);
  };

  return (
    <>
      <div className="drawer-head">
        <div>
          <div className="strong num">Pedido {order.ref}</div>
          <div className="tiny muted">{fmtDate(order.date, true)} · nº {order.id}</div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className={`badge ${STATUS[order.status].tone}`}>{STATUS[order.status].label}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
      </div>
      <div className="drawer-body stack" style={{ gap: 18 }}>
        {line && p ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="row between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
              <b className="row" style={{ gap: 8 }}><Printer size={16} /> Hoja de taller</b>
              {printed.length > 1 && (
                <div className="seg">{printed.map((_, i) => <button key={i} className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>Camiseta {i + 1}</button>)}</div>
              )}
            </div>
            <div className="cols" style={{ gap: 0 }}>
              <div className="workshop" style={{ borderRadius: 0, border: 0 }}>
                <WorkshopShirt kit={p.kit!} print={line.print!} flip={flip} />
              </div>
              <div style={{ padding: 16 }} className="stack">
                <span className="tiny muted">Estampar exactamente</span>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.1, margin: '4px 0 2px' }}>{line.print!.name || 'SIN NOMBRE'}</div>
                <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1 }}>{line.print!.number || '-'}</div>
                <div className="divider" />
                <div className="small"><b>{p.name}</b></div>
                <div className="small muted">Talla {line.size} · {line.qty} ud. · {line.print!.patch ? 'con parche de liga' : 'sin parche'}</div>
                <div className="tiny muted" style={{ marginTop: 8 }}>Es el mismo texto que el cliente vio en 3D, que está en su carrito y en su correo de confirmación.</div>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <div className="label" style={{ marginBottom: 8 }}>Estado</div>
          <div className="timeline">
            {STATUS_FLOW.map((s, i) => {
              const h = order.history.find((x) => x.status === s);
              return (
                <div key={s} className={`tl ${i < idx || (i === idx && s === 'entregado') ? 'done' : i === idx ? 'now' : ''}`}>
                  <i>{i <= idx ? <CheckCircle2 size={13} /> : <Circle size={11} />}</i>
                  <div className="row between"><span className="small strong">{STATUS[s].label}</span><span className="tiny muted">{h ? fmtDate(h.at, true) : ''}</span></div>
                </div>
              );
            })}
          </div>
          <div className="row wrapflex" style={{ marginTop: 4 }}>
            {nextStatus && order.status !== 'cancelado' && (
              <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => move(nextStatus)}>
                {busy === nextStatus ? <><Spinner /> Guardando</> : <>Pasar a {STATUS[nextStatus].label.toLowerCase()} <ArrowRight size={15} /></>}
              </button>
            )}
            {order.status !== 'cancelado' && order.status !== 'entregado' && (
              <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => move('cancelado')}><PackageX size={15} /> Cancelar</button>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}><Trash2 size={15} /> Borrar</button>
          </div>
          {order.tracking && <div className="small muted" style={{ marginTop: 10 }}>{order.carrier} · seguimiento <b className="num" style={{ color: 'var(--ink)' }}>{order.tracking}</b></div>}
        </div>

        <div className="card card-pad">
          <div className="label" style={{ marginBottom: 6 }}>Cliente</div>
          <div className="strong">{c?.name}</div>
          <div className="small muted">{c?.email} · {c?.city}, {c?.country}</div>
          <div className="tiny muted">Cliente desde {c ? fmtDate(`${c.since} 00:00`) : ''} · pagó con {order.payment}</div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>Productos</div>
          {order.lines.map((l, i) => {
            const pr = productById(l.productId);
            return (
              <div key={i} className="row" style={{ gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                {pr && <img src={productImage(pr, l.print ? 'b' : 'f')} alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: 'contain', background: 'var(--surface-2)', borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small strong">{pr?.name}</div>
                  <div className="row" style={{ gap: 6, marginTop: 3 }}><span className="badge muted">Talla {l.size}</span><PrintTag line={l} /></div>
                </div>
                <b className="small num">{eur(l.unit * l.qty)}</b>
              </div>
            );
          })}
          <div style={{ marginTop: 8 }}>
            <div className="sum-row"><span>Productos</span><span>{eur(orderSubtotal(order))}</span></div>
            <div className="sum-row"><span>Envío, {order.carrier}</span><span>{order.shipping ? eur(order.shipping) : 'Gratis'}</span></div>
            {order.fee && <div className="sum-row fee"><span>{order.fee.label}</span><span>{eur(order.fee.amount)}</span></div>}
            <div className="sum-row total"><span>Cobrado</span><span>{eur(order.total)}</span></div>
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 6 }}>Correos enviados</div>
          {order.emails.map((e, i) => (
            <div key={i} className="row small" style={{ gap: 8, padding: '4px 0' }}><Mail size={14} className="muted" /> {EMAIL_LABEL[e.kind] ?? e.kind}<span className="muted tiny" style={{ marginLeft: 'auto' }}>{fmtDate(e.at, true)}</span></div>
          ))}
        </div>

        <div className="field">
          <label htmlFor="note" className="row" style={{ gap: 6 }}><StickyNote size={14} /> Nota interna</label>
          <textarea id="note" className="textarea" style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Solo la ve el equipo" />
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setOrderNote(order.ref, note); toast('Nota guardada'); }}>Guardar nota</button>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Borrar este pedido">
        <p className="muted">El pedido {order.ref} desaparece del panel. Para un pedido real lo normal es cancelarlo, así queda el historial.</p>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Mejor no</button>
          <button className="btn btn-danger btn-sm" onClick={async () => { setConfirm(false); onClose(); await deleteOrder(order.ref); toast(`Pedido ${order.ref} borrado`, 'info'); }}>Borrar pedido</button>
        </div>
      </Modal>
    </>
  );
}

export function Orders() {
  const { orders, customers } = useStore();
  const loading = useLoading();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [onlyPrint, setOnlyPrint] = useState(false);
  const [sort, setSort] = useState<'nuevos' | 'antiguos' | 'importe'>('nuevos');
  const [page, setPage] = useState(1);
  const [openRef, setOpenRef] = useState<string | null>(null);
  useEffect(() => setPage(1), [q, status, onlyPrint, sort]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let l = orders.filter((o) => {
      const c = customers.find((x) => x.id === o.customerId);
      if (status && o.status !== status) return false;
      if (onlyPrint && !o.lines.some((x) => x.print)) return false;
      if (!term) return true;
      return [o.ref, c?.name, c?.email, ...o.lines.map((x) => x.print?.name ?? '')].some((v) => v?.toLowerCase().includes(term));
    });
    if (sort === 'antiguos') l = [...l].reverse();
    if (sort === 'importe') l = [...l].sort((a, b) => b.total - a.total);
    return l;
  }, [orders, customers, q, status, onlyPrint, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const shown = list.slice((page - 1) * PER, page * PER);
  const open = orders.find((o) => o.ref === openRef);

  return (
    <>
      <div className="main-head">
        <div><h1>Pedidos</h1><div className="small muted">{orders.length} pedidos · busca por referencia, cliente, correo o el nombre estampado</div></div>
      </div>
      <div className="toolbar">
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} className="muted" />
          <input className="input" style={{ paddingLeft: 36, width: '100%' }} placeholder="XKBKNABJK, Lucía, PAPÁ..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedidos" />
        </div>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Orden">
          <option value="nuevos">Más recientes</option><option value="antiguos">Más antiguos</option><option value="importe">Mayor importe</option>
        </select>
        <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={onlyPrint} onChange={(e) => setOnlyPrint(e.target.checked)} /> Solo personalizados</label>
      </div>
      <div className="card" style={{ padding: 6 }}>
        {loading ? <div style={{ padding: 12 }}><SkRows rows={8} /></div> : shown.length === 0 ? (
          <Empty icon={<Search size={22} />} title="Ningún pedido coincide" text="Prueba con otra referencia o quita el filtro de estado." action={<button className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setStatus(''); setOnlyPrint(false); }}>Quitar filtros</button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Referencia</th><th>Cliente</th><th>Personalización</th><th>Estado</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {shown.map((o, i) => {
                  const c = customers.find((x) => x.id === o.customerId);
                  const pl = o.lines.find((l) => l.print);
                  return (
                    <tr key={o.ref} className="click enter" style={{ animationDelay: `${i * 18}ms` }} onClick={() => setOpenRef(o.ref)}>
                      <td className="num strong">{o.ref}</td>
                      <td><div className="small strong">{c?.name}</div><div className="tiny muted">{c?.city}</div></td>
                      <td>{pl ? <PrintTag line={pl} /> : <span className="tiny muted">Sin personalizar</span>}</td>
                      <td><span className={`badge ${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span></td>
                      <td className="small muted" title={fmtDate(o.date, true)}>{ago(o.date)}</td>
                      <td className="num strong" style={{ textAlign: 'right' }}>{eur(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="pager" style={{ padding: '10px 12px' }}>
          <span className="small muted">{list.length} pedidos · página {page} de {pages}</span>
          <div className="row">
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Anterior"><ChevronLeft size={16} /></button>
            <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Siguiente"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpenRef(null)} />
      <aside className={`drawer drawer-wide ${open ? 'open' : ''}`} aria-hidden={!open}>
        {open && <Detail order={open} onClose={() => setOpenRef(null)} />}
      </aside>
    </>
  );
}

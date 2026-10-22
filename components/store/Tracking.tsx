'use client';

import { useState } from 'react';
import { PackageSearch, Lock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { useStore, wait } from '@/lib/store';
import { STATUS, STATUS_FLOW, type Order } from '@/lib/mock/sales';
import { fmtDate, eur, deliveryWindow } from '@/lib/logic';
import { productById } from '@/lib/mock/catalog';
import { Spinner } from '@/components/ui';
import { PrintTag } from './CartDrawer';

export function Tracking() {
  const { orders, customers } = useStore();
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState<Order | null>(null);

  const sample = orders.find((o) => o.status === 'enviado' && o.tracking);
  const sampleCustomer = sample && customers.find((c) => c.id === sample.customerId);

  const look = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setFound(null);
    if (!/^[A-Za-z]{9}$/.test(ref.trim())) return setError('La referencia son nueve letras, la tienes en el correo de confirmación.');
    if (!/[\w.+-]+@[\w-]+\.[\w.]+/.test(email)) return setError('Escribe el correo con el que hiciste la compra.');
    setBusy(true);
    await wait(900);
    const o = orders.find((x) => x.ref === ref.trim().toUpperCase());
    const c = o && customers.find((x) => x.id === o.customerId);
    setBusy(false);
    if (!o || !c || c.email.toLowerCase() !== email.trim().toLowerCase()) return setError('No encontramos ningún pedido con esa referencia y ese correo. Por seguridad hacen falta los dos.');
    setFound(o);
  };

  const idx = found ? STATUS_FLOW.indexOf(found.status) : -1;
  const win = found && deliveryWindow(found.lines, found.carrier);

  return (
    <div className="wrap section" style={{ paddingTop: 36, maxWidth: 860 }}>
      <div className="eyebrow">Seguimiento</div>
      <h1 className="h-lg" style={{ margin: '6px 0 8px' }}>Dónde está mi pedido</h1>
      <p className="muted">Con la referencia y el correo de la compra. Sin los dos no enseñamos nada, así nadie más puede ver tu dirección.</p>
      <form className="card card-pad form-grid" style={{ marginTop: 18, alignItems: 'end' }} onSubmit={look}>
        <div className="field"><label htmlFor="t-ref">Referencia</label><input id="t-ref" className="input num" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 9))} placeholder="9 letras" /></div>
        <div className="field"><label htmlFor="t-mail">Correo</label><input id="t-mail" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? <><Spinner /> Buscando</> : <><PackageSearch size={17} /> Buscar</>}</button>
      </form>
      {sample && sampleCustomer && !found && (
        <button className="btn btn-xs btn-soft" style={{ marginTop: 10 }} onClick={() => { setRef(sample.ref); setEmail(sampleCustomer.email); }}>
          Rellenar con un pedido de ejemplo
        </button>
      )}
      {error && <div className="notice bad enter" style={{ marginTop: 14 }}><AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span></div>}
      {found && (
        <div className="card card-pad enter" style={{ marginTop: 18 }}>
          <div className="row between wrapflex">
            <div><div className="strong">Pedido {found.ref}</div><div className="small muted">{fmtDate(found.date, true)} · {eur(found.total)}</div></div>
            <span className={`badge ${STATUS[found.status].tone}`}>{STATUS[found.status].label}</span>
          </div>
          <div className="divider" />
          <div className="timeline">
            {STATUS_FLOW.map((s, i) => {
              const h = found.history.find((x) => x.status === s);
              return (
                <div key={s} className={`tl ${i < idx || (i === idx && s === 'entregado') ? 'done' : i === idx ? 'now' : ''}`}>
                  <i>{i <= idx ? <CheckCircle2 size={13} /> : <Circle size={11} />}</i>
                  <div><div className="strong small">{STATUS[s].label}</div><div className="tiny muted">{h ? fmtDate(h.at, true) : s === 'entregado' && win ? `Prevista entre el ${win.start} y el ${win.end}` : 'Pendiente'}</div></div>
                </div>
              );
            })}
          </div>
          {found.tracking && <div className="notice info"><Lock size={15} /><span>{found.carrier}, número de seguimiento <b className="num">{found.tracking}</b></span></div>}
          <div className="divider" />
          {found.lines.map((l, i) => (
            <div key={i} className="row between small" style={{ padding: '6px 0', gap: 10 }}>
              <span style={{ flex: 1 }}>{productById(l.productId)?.name} · talla {l.size}</span>
              <PrintTag line={l} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

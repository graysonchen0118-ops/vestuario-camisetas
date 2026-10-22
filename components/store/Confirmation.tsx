'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, PackageSearch, Stamp, Truck, Home as HomeIcon, Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import { STATUS } from '@/lib/mock/sales';
import { deliveryWindow, eur, fmtDate } from '@/lib/logic';
import { EmailPreview } from '@/components/EmailPreview';
import { Empty } from '@/components/ui';

export function Confirmation() {
  const ref = useSearchParams().get('ref') ?? '';
  const { orders, customers, emails, hydrated } = useStore();
  const order = orders.find((o) => o.ref === ref);
  if (!hydrated) return <div className="wrap section"><div className="sk" style={{ height: 320 }} /></div>;
  if (!order) {
    return (
      <div className="wrap section">
        <Empty icon={<Search size={24} />} title="No encontramos ese pedido" text="Puede que la sesión se haya reiniciado. Puedes consultarlo desde el seguimiento con la referencia y tu correo." action={<Link href="/seguimiento" className="btn btn-dark btn-sm">Ir al seguimiento</Link>} />
      </div>
    );
  }
  const customer = customers.find((c) => c.id === order.customerId);
  const win = deliveryWindow(order.lines, order.carrier);
  const tpl = emails.find((e) => e.id === 'confirmacion')!;
  const steps = [
    { icon: CheckCircle2, t: 'Pago aceptado', d: fmtDate(order.date, true), on: true },
    { icon: Stamp, t: win.printed ? 'Estampado en el taller' : 'Preparación', d: win.printed ? 'Dos días laborables' : 'Hoy o mañana', on: false },
    { icon: Truck, t: `Enviado con ${order.carrier}`, d: 'Te llega el número de seguimiento por correo', on: false },
    { icon: HomeIcon, t: 'En tu casa', d: `Entre el ${win.start} y el ${win.end}`, on: false },
  ];
  return (
    <div className="wrap section" style={{ paddingTop: 36 }}>
      <div className="checkout" style={{ paddingTop: 0 }}>
        <div className="stack" style={{ gap: 18 }}>
          <div className="enter">
            <span className="badge ok"><CheckCircle2 size={14} /> {STATUS[order.status].label}</span>
            <h1 className="h-lg" style={{ marginTop: 10 }}>Gracias, {customer?.name.split(' ')[0]}. Tu pedido está dentro.</h1>
            <p className="muted" style={{ marginTop: 8 }}>Referencia <b className="num" style={{ color: 'var(--ink)' }}>{order.ref}</b> · {eur(order.total)} · te hemos enviado la confirmación a {customer?.email}.</p>
          </div>
          <div className="card card-pad timeline">
            {steps.map((s, i) => (
              <div key={i} className={`tl ${s.on ? 'done' : i === 1 ? 'now' : ''}`}>
                <i><s.icon size={13} /></i>
                <div><div className="strong small">{s.t}</div><div className="tiny muted">{s.d}</div></div>
              </div>
            ))}
          </div>
          <div className="row wrapflex">
            <Link href="/seguimiento" className="btn btn-dark"><PackageSearch size={17} /> Seguir mi pedido</Link>
            <Link href="/" className="btn btn-ghost">Volver a la tienda</Link>
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>El correo que acabas de recibir</div>
          <EmailPreview tpl={tpl} order={order} customer={customer} />
        </div>
      </div>
    </div>
  );
}

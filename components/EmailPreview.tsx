'use client';

import { Mail } from 'lucide-react';
import { productById, productImage } from '@/lib/mock/catalog';
import type { Order, Customer, Line } from '@/lib/mock/sales';
import type { EmailTemplate } from '@/lib/mock/ops';
import { eur, orderSubtotal } from '@/lib/logic';

function Items({ lines, order }: { lines: Line[]; order?: Order }) {
  return (
    <div className="email-items">
      {lines.map((l, i) => {
        const p = productById(l.productId);
        if (!p) return null;
        const printed = l.print && (l.print.name || l.print.number);
        return (
          <div key={i} className="row" style={{ gap: 10, padding: '6px 0', alignItems: 'flex-start' }}>
            <img src={productImage(p, printed ? 'b' : 'f')} alt="" width={48} height={48} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#fff' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="strong small">{p.name}</div>
              <div className="tiny muted">
                Talla {l.size} · {l.qty} ud.{printed ? ` · Nombre «${l.print!.name || '-'}», dorsal ${l.print!.number || '-'}` : ''}{l.print?.patch ? ' · parche de liga' : ''}
              </div>
            </div>
            <b className="small num">{eur(l.unit * l.qty)}</b>
          </div>
        );
      })}
      {order && (
        <div className="tiny" style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 8 }}>
          <div className="row between"><span>Productos</span><span>{eur(orderSubtotal(order))}</span></div>
          <div className="row between"><span>Envío</span><span>{order.shipping ? eur(order.shipping) : 'Gratis'}</span></div>
          {order.fee && <div className="row between"><span>{order.fee.label}</span><span>{eur(order.fee.amount)}</span></div>}
          <div className="row between strong" style={{ fontSize: 13 }}><span>Total pagado</span><span>{eur(order.total)}</span></div>
        </div>
      )}
    </div>
  );
}

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

export function EmailPreview({ tpl, order, customer, lines, cartLink }: { tpl: Pick<EmailTemplate, 'subject' | 'body'>; order?: Order; customer?: Customer | { name: string; email: string }; lines?: Line[]; cartLink?: string }) {
  const first = (customer?.name ?? 'Lucía').split(' ')[0];
  const vars: Record<string, string> = {
    nombre: first,
    referencia: order?.ref ?? 'XKBKNABJK',
    transportista: order?.carrier ?? 'Correos',
    seguimiento: order?.tracking ?? 'PQ4F000000000ES',
    enlace_carrito: cartLink ?? 'Volver a mi carrito ›',
    total: order ? eur(order.total) : '',
  };
  const parts = fillTemplate(tpl.body, vars).split('{productos}');
  const items = lines ?? order?.lines ?? [];
  return (
    <div className="email-preview">
      <div className="email-head">
        <div className="row" style={{ gap: 8 }}><Mail size={15} /><b>{fillTemplate(tpl.subject, vars)}</b></div>
        <div className="tiny muted" style={{ marginTop: 4 }}>De: Vestuario · Para: {customer?.email ?? 'lucia.garcia@gmail.com'}</div>
      </div>
      <div className="email-body">
        {parts.map((t, i) => (
          <span key={i}>
            {t}
            {i < parts.length - 1 && <Items lines={items} order={order} />}
          </span>
        ))}
      </div>
    </div>
  );
}

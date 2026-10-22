'use client';

import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, Info } from 'lucide-react';
import { productById, productImage } from '@/lib/mock/catalog';
import { useStore } from '@/lib/store';
import { eur, lineKey, type Totals } from '@/lib/logic';
import type { Line } from '@/lib/mock/sales';
import { Empty } from '@/components/ui';

export function PrintTag({ line }: { line: Line }) {
  if (!line.print || (!line.print.name && !line.print.number)) return null;
  return (
    <span className="print-tag">
      {line.print.name || 'SIN NOMBRE'} · {line.print.number || '-'}
      {line.print.patch && <span style={{ opacity: 0.7, fontWeight: 600 }}>+ parche</span>}
    </span>
  );
}

export function CartLine({ line, editable = true }: { line: Line; editable?: boolean }) {
  const { setQty } = useStore();
  const p = productById(line.productId);
  if (!p) return null;
  const printed = !!line.print && !!(line.print.name || line.print.number);
  return (
    <div className="cart-line">
      <img src={productImage(p, printed ? 'b' : 'f')} alt={p.name} width={76} height={76} />
      <div className="stack" style={{ gap: 5, minWidth: 0 }}>
        <Link href={`/producto/${p.slug}`} className="strong small" style={{ lineHeight: 1.3 }}>{p.name}</Link>
        <div className="row wrapflex" style={{ gap: 6 }}>
          <span className="badge muted">Talla {line.size}</span>
          <PrintTag line={line} />
        </div>
        <div className="row between">
          {editable ? (
            <div className="qty" style={{ transform: 'scale(.86)', transformOrigin: 'left' }}>
              <button aria-label="Quitar una" onClick={() => setQty(lineKey(line), line.qty - 1)}>{line.qty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}</button>
              <span>{line.qty}</span>
              <button aria-label="Añadir una" onClick={() => setQty(lineKey(line), line.qty + 1)}><Plus size={15} /></button>
            </div>
          ) : (
            <span className="small muted">{line.qty} ud.</span>
          )}
          <b className="num">{eur(line.unit * line.qty)}</b>
        </div>
      </div>
    </div>
  );
}

export function Summary({ t, note = true }: { t: Totals; note?: boolean }) {
  return (
    <div>
      <div className="sum-row"><span>Productos</span><span className="num">{eur(t.subtotal)}</span></div>
      <div className="sum-row"><span>Envío</span><span className="num">{t.shipping === 0 ? 'Gratis' : eur(t.shipping)}</span></div>
      {t.fee > 0 && (
        <div className="sum-row fee"><span>{t.feeLabel}</span><span className="num">{eur(t.fee)}</span></div>
      )}
      <div className="sum-row total"><span>Total</span><span className="num">{eur(t.total)}</span></div>
      <div className="tiny muted" style={{ textAlign: 'right' }}>IVA incluido, {eur(t.vat)}</div>
      {note && t.fee > 0 && (
        <div className="notice info" style={{ marginTop: 12 }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>La {t.feeLabel.toLowerCase()} ya está dentro del total. Es la misma cifra que verás al pagar, en la factura y en el correo.</span>
        </div>
      )}
    </div>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, totals } = useStore();
  const pct = Math.min(100, (totals.subtotal / 100) * 100);
  return (
    <>
      <div className={`scrim ${cartOpen ? 'show' : ''}`} onClick={() => setCartOpen(false)} />
      <aside className={`drawer ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen} aria-label="Carrito">
        <div className="drawer-head">
          <h3 className="h-md" style={{ fontSize: 18 }}>Tu carrito</h3>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X size={20} /></button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 ? (
            <Empty icon={<ShoppingBag size={24} />} title="Tu carrito está vacío" text="Elige una camiseta, ponle nombre y dorsal, y aparecerá aquí con la personalización tal cual." action={<Link href="/categoria/temporada-26-27" className="btn btn-dark btn-sm" onClick={() => setCartOpen(false)}>Ver la temporada 26/27</Link>} />
          ) : (
            <>
              <div className="stack" style={{ gap: 6, marginBottom: 6 }}>
                <div className="row small" style={{ gap: 8 }}>
                  <Truck size={16} color="var(--accent)" />
                  {totals.freeShippingLeft > 0 ? <span>Te faltan <b>{eur(totals.freeShippingLeft)}</b> para el envío gratis con Correos</span> : <span><b>Envío gratis</b> con Correos</span>}
                </div>
                <div className="progress"><span style={{ width: `${pct}%` }} /></div>
              </div>
              {cart.map((l) => <CartLine key={lineKey(l)} line={l} />)}
            </>
          )}
        </div>
        {cart.length > 0 && (
          <div className="drawer-foot">
            <Summary t={totals} />
            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <Link href="/carrito" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCartOpen(false)}>Ver carrito</Link>
              <Link href="/pedido" className="btn btn-primary" style={{ flex: 1.4 }} onClick={() => setCartOpen(false)}>Tramitar pedido</Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

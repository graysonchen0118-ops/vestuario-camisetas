'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, CheckCircle2, XCircle, ShoppingCart, FileText, Mail, CreditCard, Package, Info } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PRODUCTS, PRINT_PRICE } from '@/lib/mock/catalog';
import { SHIPPING } from '@/lib/mock/sales';
import type { Settings } from '@/lib/mock/ops';
import { computeTotals, eur } from '@/lib/logic';
import { Switch, Spinner } from '@/components/ui';

export function Fees() {
  const { settings, saveFee, toast } = useStore();
  const [fee, setFee] = useState<Settings['fee']>(settings.fee);
  const [saving, setSaving] = useState(false);
  const [mixed, setMixed] = useState(true);
  useEffect(() => setFee(settings.fee), [settings.fee]);
  const dirty = JSON.stringify(fee) !== JSON.stringify(settings.fee);

  const shirt = PRODUCTS.find((p) => p.clubId === 'valdemora' && p.category === 'temporada-26-27')!;
  const ball = PRODUCTS.find((p) => p.tags.includes('balon'))!;
  const lines = useMemo(
    () => [
      { productId: shirt.id, size: 'L', qty: 1, unit: shirt.price + PRINT_PRICE, print: { name: 'LUCÍA', number: '7', patch: false } },
      ...(mixed ? [{ productId: ball.id, size: '5', qty: 1, unit: ball.price }] : []),
    ],
    [mixed, shirt, ball],
  );
  const t = computeTotals(lines, { ...settings, fee }, 'Correos');
  const places = [
    { icon: ShoppingCart, label: 'Carrito' },
    { icon: Package, label: 'Pedido' },
    { icon: FileText, label: 'Factura' },
    { icon: Mail, label: 'Correo de confirmación' },
    { icon: CreditCard, label: 'Importe enviado a la pasarela' },
  ];

  return (
    <>
      <div className="main-head">
        <div><h1>Envíos y tasas</h1><div className="small muted">Un gasto fijo que se suma al total, no un texto pintado en el carrito</div></div>
        <button className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={async () => { setSaving(true); await saveFee(fee); setSaving(false); toast('Guardado. El carrito de la tienda ya lo aplica'); }}>
          {saving ? <><Spinner /> Guardando</> : <><Save size={15} /> Guardar</>}
        </button>
      </div>
      <div className="cols" style={{ alignItems: 'start' }}>
        <div className="card card-pad stack" style={{ gap: 14 }}>
          <div className="row between"><b>Gasto fijo</b><Switch on={fee.enabled} onChange={(v) => setFee({ ...fee, enabled: v })} label="Activar gasto fijo" /></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="f-l">Nombre que ve el cliente</label><input id="f-l" className="input" value={fee.label} onChange={(e) => setFee({ ...fee, label: e.target.value.slice(0, 30) })} /></div>
            <div className="field"><label htmlFor="f-a">Importe, IVA incluido</label><input id="f-a" className="input" type="number" step="0.5" min={0} value={fee.amount} onChange={(e) => setFee({ ...fee, amount: Math.max(0, Number(e.target.value)) })} /></div>
          </div>
          <div className="field">
            <span className="label">Cómo se cobra</span>
            <div className="seg" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
              <button className={fee.mode === 'pedido' ? 'on' : ''} onClick={() => setFee({ ...fee, mode: 'pedido' })}>Una vez por pedido</button>
              <button className={fee.mode === 'articulo' ? 'on' : ''} onClick={() => setFee({ ...fee, mode: 'articulo' })}>Por tipo de artículo</button>
            </div>
            <span className="hint">Por tipo de artículo: todas las camisetas cuentan como un tipo, los balones como otro. Es como se calcula el arancel europeo de 3 € a los paquetes que entran de fuera de la UE.</span>
          </div>
          <div className="field">
            <label htmlFor="f-s">A qué pedidos</label>
            <select id="f-s" className="select" value={fee.scope} onChange={(e) => setFee({ ...fee, scope: e.target.value as Settings['fee']['scope'] })}>
              <option value="todos">Todos los pedidos</option>
              <option value="ue">Solo envíos dentro de la UE</option>
              <option value="fuera_ue">Solo envíos fuera de la UE</option>
            </select>
          </div>
          <div className="notice info"><Info size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Se guarda como regla del carrito, así entra en el total que calcula la tienda. Si solo se mostrara en el carrito, la pasarela cobraría otra cifra y el pedido quedaría en error de pago.</span></div>
          <div className="divider" />
          <b>Transportistas</b>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {(Object.keys(SHIPPING) as (keyof typeof SHIPPING)[]).map((k) => (
                  <tr key={k}><td className="strong">{k}</td><td className="small muted">{SHIPPING[k].label.split(', ')[1]}</td><td className="num">{eur(SHIPPING[k].price)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad">
          <div className="row between"><b>Comprobación con un pedido de prueba</b>
            <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={mixed} onChange={(e) => setMixed(e.target.checked)} /> Añadir un balón</label>
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>Camiseta del Valdemora con LUCÍA 7{mixed ? ' y un balón' : ''}, envío con Correos.</div>
          <div style={{ marginTop: 12 }}>
            <div className="sum-row"><span>Productos</span><span>{eur(t.subtotal)}</span></div>
            <div className="sum-row"><span>Envío</span><span>{t.shipping ? eur(t.shipping) : 'Gratis'}</span></div>
            {t.fee > 0 && <div className="sum-row fee"><span>{fee.label}{fee.mode === 'articulo' ? ` × ${Math.round(t.fee / Math.max(0.01, fee.amount))}` : ''}</span><span>{eur(t.fee)}</span></div>}
            <div className="sum-row total"><span>Total</span><span>{eur(t.total)}</span></div>
          </div>
          <div className="divider" />
          <div className="stack" style={{ gap: 8 }}>
            {places.map((pl) => (
              <div key={pl.label} className="row enter" style={{ gap: 10 }}>
                <pl.icon size={16} className="muted" />
                <span className="small" style={{ flex: 1 }}>{pl.label}</span>
                <b className="num small">{eur(t.total)}</b>
                <CheckCircle2 size={16} color="var(--ok)" />
              </div>
            ))}
          </div>
          <div className="notice ok" style={{ marginTop: 12 }}><CheckCircle2 size={16} /><span>Las cinco cifras coinciden porque todas salen del mismo cálculo.</span></div>
          <div className="db-card" style={{ marginTop: 12, background: 'var(--bad-soft)', borderColor: '#f3c2ca' }}>
            <div className="row small strong" style={{ gap: 8, color: '#7d1f2e' }}><XCircle size={16} /> Si solo se pintara en el carrito</div>
            <div className="tiny" style={{ marginTop: 6, color: '#7d1f2e' }}>El carrito diría {eur(t.total)}, la pasarela cobraría {eur(t.total - t.fee)} y PrestaShop dejaría el pedido en «Error en el pago» por la diferencia de {eur(t.fee)}.</div>
          </div>
        </div>
      </div>
    </>
  );
}

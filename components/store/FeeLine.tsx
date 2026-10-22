'use client';

import { useStore } from '@/lib/store';
import { eur } from '@/lib/logic';

export function FeeLine() {
  const { settings } = useStore();
  const f = settings.fee;
  if (!f.enabled) return <p className="muted" style={{ marginTop: 8 }}>Ahora mismo no se aplica ningún recargo aparte del envío.</p>;
  return (
    <p className="muted" style={{ marginTop: 8 }}>
      La {f.label.toLowerCase()} es de <b style={{ color: 'var(--ink)' }}>{eur(f.amount)}</b> {f.mode === 'pedido' ? 'por pedido' : 'por cada tipo de artículo del pedido'}. Aparece en el carrito desde el primer producto y va dentro del total, así que lo que ves antes de pagar es lo que se cobra, lo que dice la factura y lo que llega en el correo.
    </p>
  );
}

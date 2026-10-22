'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight, Lock } from 'lucide-react';
import { useStore } from '@/lib/store';
import { lineKey } from '@/lib/logic';
import { CartLine, Summary } from './CartDrawer';
import { Empty } from '@/components/ui';

export function CartPage() {
  const { cart, totals, hydrated } = useStore();
  return (
    <div className="wrap section" style={{ paddingTop: 32 }}>
      <h1 className="h-lg">Tu carrito</h1>
      {!hydrated ? (
        <div className="sk" style={{ height: 240, marginTop: 20 }} />
      ) : cart.length === 0 ? (
        <Empty icon={<ShoppingBag size={24} />} title="Todavía no hay nada aquí" text="Las camisetas que añadas aparecen con la talla y la personalización exactas que elegiste." action={<Link href="/categoria/temporada-26-27" className="btn btn-dark btn-sm">Ver camisetas</Link>} />
      ) : (
        <div className="checkout">
          <div className="card card-pad">{cart.map((l) => <CartLine key={lineKey(l)} line={l} />)}</div>
          <div className="card card-pad" style={{ position: 'sticky', top: 90 }}>
            <Summary t={totals} />
            <Link href="/pedido" className="btn btn-primary btn-block" style={{ marginTop: 16 }}><Lock size={16} /> Tramitar pedido <ArrowRight size={16} /></Link>
            <Link href="/" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>Seguir comprando</Link>
          </div>
        </div>
      )}
    </div>
  );
}

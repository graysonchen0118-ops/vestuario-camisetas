'use client';

import Link from 'next/link';
import { Shirt, ShieldCheck, Undo2, Truck } from 'lucide-react';
import { CATEGORIES, CLUBS, PRODUCTS } from '@/lib/mock/catalog';
import { Header } from './Header';
import { CartDrawer } from './CartDrawer';
import { Assistant } from './Assistant';
import { Toasts } from '@/components/ui';
import { Backdrop } from '@/components/three';

const backdropKits = CLUBS.slice(0, 8).map((c, i) => (i % 2 ? c.away : c.home));
const guide = PRODUCTS.find((p) => p.clubId === 'valdemora' && p.category === 'temporada-26-27')!;

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Backdrop kits={backdropKits} />
      <Header />
      <main className="main-store">{children}</main>
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="logo" style={{ color: '#fff' }}><span className="logo-mark"><Shirt size={20} /></span>Vestuario</div>
              <p className="small" style={{ marginTop: 12, maxWidth: 260 }}>Camisetas de fútbol personalizadas con nombre y dorsal. Estampadas en nuestro taller y enviadas a toda Europa.</p>
            </div>
            <div>
              <h4>Tienda</h4>
              {CATEGORIES.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`}>{c.name}</Link>)}
            </div>
            <div>
              <h4>Ayuda</h4>
              <Link href="/seguimiento">Seguir mi pedido</Link>
              <Link href={`/producto/${guide.slug}#tallas`}>Guía de tallas</Link>
              <Link href="/envios">Envíos y devoluciones</Link>
              <Link href="/panel">Panel de gestión</Link>
            </div>
            <div>
              <h4>Comprar tranquilo</h4>
              <div className="row small" style={{ gap: 8, padding: '4px 0' }}><ShieldCheck size={16} /> Pago seguro con tarjeta, Bizum o PayPal</div>
              <div className="row small" style={{ gap: 8, padding: '4px 0' }}><Truck size={16} /> Seguimiento en cada envío</div>
              <div className="row small" style={{ gap: 8, padding: '4px 0' }}><Undo2 size={16} /> 14 días para devolver lo no personalizado</div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Vestuario. Todos los derechos reservados.</span>
            <span>Fotografías de Unsplash</span>
          </div>
        </div>
      </footer>
      <CartDrawer />
      <Assistant />
      <Toasts />
    </>
  );
}

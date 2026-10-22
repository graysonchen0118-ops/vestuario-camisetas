'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ListOrdered, ShoppingCart, Star, Mail, ReceiptText, Bot, Rocket, BookOpen, Store, Menu, X, Shirt, RotateCcw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CLUBS } from '@/lib/mock/catalog';
import { Toasts } from '@/components/ui';
import { Backdrop } from '@/components/three';

const kits = CLUBS.slice(2, 8).map((c) => c.home);

export function PanelShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { orders, reviews, unanswered, carts, changes, resetAll, toast } = useStore();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const pendingOrders = orders.filter((o) => ['pago_aceptado', 'en_preparacion', 'estampado'].includes(o.status)).length;
  const items = [
    { group: 'Tienda' },
    { href: '/panel', label: 'Resumen', icon: LayoutDashboard },
    { href: '/panel/pedidos', label: 'Pedidos', icon: Package, count: pendingOrders },
    { href: '/panel/categorias', label: 'Orden de categorías', icon: ListOrdered },
    { href: '/panel/carritos', label: 'Carritos abandonados', icon: ShoppingCart, count: carts.filter((c) => c.status === 'pendiente').length },
    { href: '/panel/opiniones', label: 'Opiniones', icon: Star, count: reviews.filter((r) => r.status === 'pendiente').length },
    { href: '/panel/correos', label: 'Correos', icon: Mail },
    { href: '/panel/tasas', label: 'Envíos y tasas', icon: ReceiptText },
    { href: '/panel/asistente', label: 'Asistente', icon: Bot, count: unanswered.filter((q) => !q.answer).length },
    { group: 'Proyecto' },
    { href: '/panel/produccion', label: 'Paso a producción', icon: Rocket, count: changes.filter((c) => c.status !== 'probado').length },
    { href: '/panel/guia', label: 'Qué puedes cambiar tú', icon: BookOpen },
  ] as const;

  return (
    <>
      <Backdrop kits={kits} tone="panel" density={0.55} />
      <div className="app">
        <div className="admin-top">
          <button className="icon-btn" style={{ color: '#fff' }} onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button>
          <span className="row strong" style={{ gap: 8 }}><Shirt size={18} /> Panel</span>
          <Link href="/" className="icon-btn" style={{ color: '#fff' }} aria-label="Ver la tienda"><Store size={20} /></Link>
        </div>
        <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
        <aside className={`side ${open ? 'open' : ''}`}>
          <div className="row between">
            <Link href="/panel" className="logo"><span className="logo-mark"><Shirt size={19} /></span><span>Vestuario<small>Panel de gestión</small></span></Link>
            <button className="icon-btn admin-close" style={{ color: '#fff' }} onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
          </div>
          {items.map((it, i) =>
            'group' in it ? (
              <div key={i} className="side-group">{it.group}</div>
            ) : (
              <Link key={it.href} href={it.href} className={path === it.href ? 'on' : ''}>
                <it.icon size={18} /> {it.label}
                {'count' in it && it.count ? <span className="count">{it.count}</span> : null}
              </Link>
            ),
          )}
          <div style={{ marginTop: 'auto', paddingTop: 16 }} className="stack">
            <Link href="/"><Store size={18} /> Ver la tienda</Link>
            <button className="btn btn-xs" style={{ background: 'rgba(255,255,255,.08)', color: '#c3cbe0', marginTop: 8 }} onClick={() => { resetAll(); toast('Datos de la sesión reiniciados', 'info'); }}>
              <RotateCcw size={13} /> Reiniciar datos de la sesión
            </button>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
      <Toasts />
    </>
  );
}

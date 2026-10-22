'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShoppingBag, Menu, X, Shirt, PackageSearch, ChevronDown, ChevronRight, LayoutDashboard } from 'lucide-react';
import { CATEGORIES, CLUBS, PRODUCTS, productImage } from '@/lib/mock/catalog';
import { useStore } from '@/lib/store';
import { search, eur } from '@/lib/logic';

export function SearchBox({ mobile = false, onDone }: { mobile?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const results = useMemo(() => (q.trim().length > 1 ? search(q).slice(0, 6) : []), [q]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const go = (href: string) => {
    setOpen(false);
    setQ('');
    onDone?.();
    router.push(href);
  };
  return (
    <div className={`search-box ${mobile ? 'mobile' : ''}`} ref={box}>
      <Search size={18} className="lead" />
      <input
        className="input"
        placeholder="Busca club, equipación o talla"
        value={q}
        aria-label="Buscar"
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHl(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHl((h) => Math.min(results.length, h + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(0, h - 1)); }
          if (e.key === 'Enter' && q.trim()) go(hl > 0 && results[hl - 1] ? `/producto/${results[hl - 1].slug}` : `/buscar?q=${encodeURIComponent(q.trim())}`);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && q.trim().length > 1 && (
        <div className="suggest">
          {results.length === 0 ? (
            <div className="small muted" style={{ padding: 12 }}>Nada con «{q}». Prueba con el club o con local, visitante o niño.</div>
          ) : (
            results.map((p, i) => (
              <a key={p.id} href={`/producto/${p.slug}`} className={hl === i + 1 ? 'hl' : ''} onClick={(e) => { e.preventDefault(); go(`/producto/${p.slug}`); }}>
                <img src={productImage(p)} alt="" width={42} height={42} />
                <span style={{ flex: 1 }}>{p.name}</span>
                <b className="small">{eur(p.price)}</b>
              </a>
            ))
          )}
          {results.length > 0 && (
            <a href={`/buscar?q=${encodeURIComponent(q)}`} onClick={(e) => { e.preventDefault(); go(`/buscar?q=${encodeURIComponent(q.trim())}`); }} style={{ justifyContent: 'center', fontWeight: 700, color: 'var(--accent-ink)' }}>
              Ver todos los resultados
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { cartCount, setCartOpen } = useStore();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  const homeKits = PRODUCTS.filter((p) => p.category === 'temporada-26-27' && p.name.includes('1.ª'));
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>Envío gratis con Correos desde <b>100 €</b></span>
          <span className="hide-sm">Las personalizadas salen del taller en <b>2 días laborables</b></span>
          <span className="hide-sm">Vendiendo camisetas <b>desde 2012</b></span>
        </div>
      </div>
      <header className="header">
        <div className="wrap header-in">
          <button className="icon-btn menu-btn" aria-label="Abrir menú" onClick={() => setMenu(true)}><Menu size={22} /></button>
          <Link href="/" className="logo" aria-label="Vestuario, inicio">
            <span className="logo-mark"><Shirt size={20} /></span>
            <span>Vestuario<small>Camisetas de fútbol</small></span>
          </Link>
          <nav className="nav" aria-label="Principal">
            <div>
              <Link href="/categoria/temporada-26-27" className={`top ${path.includes('temporada-26-27') ? 'on' : ''}`}>Temporada 26/27 <ChevronDown size={15} /></Link>
              <div className="mega">
                {CLUBS.map((c) => {
                  const p = homeKits.find((x) => x.clubId === c.id);
                  return (
                    <Link key={c.id} href={p ? `/producto/${p.slug}` : '/categoria/temporada-26-27'}>
                      <span className="swatch" style={{ background: `linear-gradient(135deg, ${c.home.base} 50%, ${c.home.second} 50%)` }} />
                      {c.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            {CATEGORIES.slice(1).map((c) => (
              <div key={c.slug}>
                <Link href={`/categoria/${c.slug}`} className={`top ${path.includes(c.slug) ? 'on' : ''}`}>{c.menu}</Link>
              </div>
            ))}
          </nav>
          <SearchBox />
          <Link href="/seguimiento" className="icon-btn" aria-label="Seguir mi pedido" title="Seguir mi pedido"><PackageSearch size={21} /></Link>
          <button className="icon-btn cart-btn" aria-label="Abrir carrito" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={21} />
            {cartCount > 0 && <span className="cart-count" key={cartCount}>{cartCount}</span>}
          </button>
        </div>
      </header>
      <div className={`scrim ${menu ? 'show' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`mobile-nav ${menu ? 'open' : ''}`} aria-hidden={!menu}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <span className="logo"><span className="logo-mark"><Shirt size={20} /></span>Vestuario</span>
          <button className="icon-btn" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X size={22} /></button>
        </div>
        <SearchBox mobile onDone={() => setMenu(false)} />
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/categoria/${c.slug}`}>{c.menu}<ChevronRight size={18} /></Link>
        ))}
        <Link href="/seguimiento">Seguir mi pedido<ChevronRight size={18} /></Link>
        <Link href="/panel" style={{ color: 'var(--accent-ink)' }}>Panel de gestión<LayoutDashboard size={18} /></Link>
      </aside>
    </>
  );
}

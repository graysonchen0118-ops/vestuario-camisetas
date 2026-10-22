'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, SearchX, ChevronLeft, ChevronRight } from 'lucide-react';
import { CLUBS, type Product } from '@/lib/mock/catalog';
import { useStore } from '@/lib/store';
import { avgRating, sortCategory } from '@/lib/logic';
import { ProductCard, ProductGridSkeleton } from './ProductCard';
import { Empty } from '@/components/ui';
import { toMin } from '@/lib/mock/sales';

type Sort = 'destacados' | 'ventas' | 'precio_asc' | 'precio_desc' | 'nuevos' | 'valoracion';
const PER_PAGE = 12;

export function Listing({ items, categorySlug, defaultSort = 'destacados' }: { items: Product[]; categorySlug?: Product['category']; defaultSort?: Sort }) {
  const { settings, stock, reviews } = useStore();
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [size, setSize] = useState('');
  const [clubId, setClub] = useState('');
  const [onlyPrint, setOnlyPrint] = useState(false);
  const [maxPrice, setMaxPrice] = useState(150);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const key = `${sort}|${size}|${clubId}|${onlyPrint}|${maxPrice}|${page}`;

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, [key]);
  useEffect(() => setPage(1), [sort, size, clubId, onlyPrint, maxPrice]);

  const sizes = useMemo(() => [...new Set(items.flatMap((p) => p.sizes))], [items]);
  const clubs = useMemo(() => CLUBS.filter((c) => items.some((p) => p.clubId === c.id)), [items]);

  const result = useMemo(() => {
    let list = items.filter(
      (p) =>
        (!size || (p.sizes.includes(size) && (stock[p.id]?.[size] ?? 0) > 0)) &&
        (!clubId || p.clubId === clubId) &&
        (!onlyPrint || p.personalizable) &&
        p.price <= maxPrice,
    );
    if (sort === 'destacados' && categorySlug) {
      const order = sortCategory(categorySlug, settings).map((p) => p.id);
      list = [...list].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    } else if (sort === 'ventas') list = [...list].sort((a, b) => b.sold90 - a.sold90);
    else if (sort === 'precio_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'precio_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'nuevos') list = [...list].sort((a, b) => toMin(`${b.createdAt} 00:00`) - toMin(`${a.createdAt} 00:00`));
    else if (sort === 'valoracion') list = [...list].sort((a, b) => avgRating(b.id, reviews).avg - avgRating(a.id, reviews).avg);
    return list;
  }, [items, size, clubId, onlyPrint, maxPrice, sort, categorySlug, settings, stock, reviews]);

  const pages = Math.max(1, Math.ceil(result.length / PER_PAGE));
  const shown = result.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const clear = () => { setSize(''); setClub(''); setOnlyPrint(false); setMaxPrice(150); };

  return (
    <div>
      <div className="toolbar card card-pad" style={{ padding: 12, marginBottom: 18 }}>
        <SlidersHorizontal size={18} className="muted" />
        <select className="select" value={size} onChange={(e) => setSize(e.target.value)} aria-label="Talla">
          <option value="">Todas las tallas</option>
          {sizes.map((s) => <option key={s} value={s}>Talla {s}</option>)}
        </select>
        {clubs.length > 1 && (
          <select className="select" value={clubId} onChange={(e) => setClub(e.target.value)} aria-label="Club">
            <option value="">Todos los clubes</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <label className="row small" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyPrint} onChange={(e) => setOnlyPrint(e.target.checked)} /> Personalizables
        </label>
        <label className="row small" style={{ gap: 8 }}>
          Hasta {maxPrice} €
          <input type="range" min={20} max={150} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} aria-label="Precio máximo" />
        </label>
        <select className="select" style={{ marginLeft: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar">
          {categorySlug && <option value="destacados">Destacados</option>}
          <option value="ventas">Más vendidos</option>
          <option value="valoracion">Mejor valorados</option>
          <option value="nuevos">Novedades</option>
          <option value="precio_asc">Precio, de menor a mayor</option>
          <option value="precio_desc">Precio, de mayor a menor</option>
        </select>
      </div>
      <div className="row between small muted" style={{ marginBottom: 12 }}>
        <span>{result.length} {result.length === 1 ? 'producto' : 'productos'}</span>
        {(size || clubId || onlyPrint || maxPrice < 150) && <button className="btn btn-xs btn-ghost" onClick={clear}>Quitar filtros</button>}
      </div>
      {loading ? (
        <ProductGridSkeleton n={Math.min(8, Math.max(4, shown.length))} />
      ) : shown.length === 0 ? (
        <Empty icon={<SearchX size={24} />} title="No hay camisetas con esos filtros" text="Prueba con otra talla o quita el filtro de precio. Las tallas agotadas no aparecen al filtrar." action={<button className="btn btn-dark btn-sm" onClick={clear}>Quitar filtros</button>} />
      ) : (
        <div className="products">
          {shown.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      )}
      {pages > 1 && (
        <div className="pager">
          <span className="small muted">Página {page} de {pages}</span>
          <div className="row">
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Anterior</button>
            <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Siguiente <ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

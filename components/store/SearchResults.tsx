'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { search } from '@/lib/logic';
import { Listing } from './Listing';
import { SearchBox } from './Header';

export function SearchResults() {
  const q = useSearchParams().get('q') ?? '';
  const items = useMemo(() => search(q), [q]);
  return (
    <div className="wrap section" style={{ paddingTop: 32 }}>
      <div className="eyebrow">Búsqueda</div>
      <h1 className="h-lg" style={{ margin: '6px 0 6px' }}>Resultados para «{q}»</h1>
      <p className="small muted" style={{ marginBottom: 18 }}>Busca sin tildes, con sinónimos como local, visitante o niño, y aunque se escape una letra.</p>
      <div className="search-inline" style={{ maxWidth: 420, marginBottom: 18 }}><SearchBox mobile /></div>
      <Listing key={q} items={items} defaultSort="ventas" />
    </div>
  );
}

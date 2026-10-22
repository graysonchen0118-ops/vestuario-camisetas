import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchResults } from '@/components/store/SearchResults';

export const metadata: Metadata = { title: 'Buscar' };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="wrap section"><div className="sk" style={{ height: 40, width: 320 }} /></div>}>
      <SearchResults />
    </Suspense>
  );
}

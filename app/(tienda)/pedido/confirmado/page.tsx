import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Confirmation } from '@/components/store/Confirmation';

export const metadata: Metadata = { title: 'Pedido recibido' };

export default function Page() {
  return (
    <Suspense fallback={<div className="wrap section"><div className="sk" style={{ height: 300 }} /></div>}>
      <Confirmation />
    </Suspense>
  );
}

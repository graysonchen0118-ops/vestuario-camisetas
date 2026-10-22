import type { Metadata } from 'next';
import { Checkout } from '@/components/store/Checkout';

export const metadata: Metadata = { title: 'Tramitar pedido' };

export default function Page() {
  return <Checkout />;
}

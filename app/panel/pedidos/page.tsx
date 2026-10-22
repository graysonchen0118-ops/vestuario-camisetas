import type { Metadata } from 'next';
import { Orders } from '@/components/panel/Orders';

export const metadata: Metadata = { title: 'Pedidos' };

export default function Page() {
  return <Orders />;
}

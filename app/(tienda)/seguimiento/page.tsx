import type { Metadata } from 'next';
import { Tracking } from '@/components/store/Tracking';

export const metadata: Metadata = { title: 'Seguir mi pedido' };

export default function Page() {
  return <Tracking />;
}

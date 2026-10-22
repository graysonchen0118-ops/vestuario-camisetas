import type { Metadata } from 'next';
import { Fees } from '@/components/panel/Fees';

export const metadata: Metadata = { title: 'Envíos y tasas' };

export default function Page() {
  return <Fees />;
}

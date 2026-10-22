import type { Metadata } from 'next';
import { Carts } from '@/components/panel/Carts';

export const metadata: Metadata = { title: 'Carritos abandonados' };

export default function Page() {
  return <Carts />;
}

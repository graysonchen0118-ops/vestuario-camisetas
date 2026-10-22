import type { Metadata } from 'next';
import { CategoryOrder } from '@/components/panel/CategoryOrder';

export const metadata: Metadata = { title: 'Orden de categorías' };

export default function Page() {
  return <CategoryOrder />;
}

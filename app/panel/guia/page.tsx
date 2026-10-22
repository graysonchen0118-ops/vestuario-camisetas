import type { Metadata } from 'next';
import { Guide } from '@/components/panel/Guide';

export const metadata: Metadata = { title: 'Qué puedes cambiar tú' };

export default function Page() {
  return <Guide />;
}

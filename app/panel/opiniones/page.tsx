import type { Metadata } from 'next';
import { Reviews } from '@/components/panel/Reviews';

export const metadata: Metadata = { title: 'Opiniones' };

export default function Page() {
  return <Reviews />;
}

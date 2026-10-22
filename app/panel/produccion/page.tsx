import type { Metadata } from 'next';
import { GoLive } from '@/components/panel/GoLive';

export const metadata: Metadata = { title: 'Paso a producción' };

export default function Page() {
  return <GoLive />;
}

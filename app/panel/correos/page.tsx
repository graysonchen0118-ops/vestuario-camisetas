import type { Metadata } from 'next';
import { Emails } from '@/components/panel/Emails';

export const metadata: Metadata = { title: 'Correos' };

export default function Page() {
  return <Emails />;
}

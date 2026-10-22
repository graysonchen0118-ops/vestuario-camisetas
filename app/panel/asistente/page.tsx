import type { Metadata } from 'next';
import { AssistantAdmin } from '@/components/panel/AssistantAdmin';

export const metadata: Metadata = { title: 'Asistente' };

export default function Page() {
  return <AssistantAdmin />;
}

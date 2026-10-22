import type { Metadata, Viewport } from 'next';
import { Lexend } from 'next/font/google';
import { StoreProvider } from '@/lib/store';
import './globals.css';

const lexend = Lexend({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-lexend' });

export const metadata: Metadata = {
  title: { default: 'Vestuario · Camisetas de fútbol personalizadas', template: '%s · Vestuario' },
  description: 'Camisetas de fútbol con tu nombre y tu dorsal. Temporada 26/27, retro, infantil y accesorios, con envío a toda Europa.',
};

export const viewport: Viewport = { themeColor: '#0b1222', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${lexend.className} ${lexend.variable}`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

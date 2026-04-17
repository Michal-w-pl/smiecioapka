import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Harmonogram odpadów – Polska',
  description: 'Web app z backendem do geokodowania adresów i wyszukiwania publicznych harmonogramów wywozu odpadów w Polsce.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}

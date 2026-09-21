import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'FableMart. — Joki CDID, Minecraft, Desain UI/UX',
  description: 'Marketplace terpercaya untuk kebutuhan Joki CDID, Setup Modded Server, dan aset desain UI/UX. Transaksi aman, proses instan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

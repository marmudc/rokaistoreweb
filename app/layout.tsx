import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Rokai Store',
  description: 'Marketplace terpercaya untuk kebutuhan Roblox. Transaksi aman, legal & proses instan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body className="geometric-red">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

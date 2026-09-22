import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'FableMart. — Spesialis Roblox: Joki CDID, Blox Fruits, Robux & Gamepass',
  description: 'Marketplace terpercaya untuk kebutuhan Roblox: Joki CDID, Blox Fruits, Robux & Gamepass, serta Joki Akun Roblox. Transaksi aman, legal & proses instan.',
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

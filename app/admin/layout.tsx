import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Control Panel | Rokai Store',
  description: 'Panel administrasi Rokai Store',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0d1017] text-slate-100 antialiased selection:bg-rose-600 selection:text-white">
      {children}
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import type { AdminOrder, PromoCode } from '@/lib/types';
import { subscribeToProducts } from '@/lib/firebaseSync';

interface OverviewTabProps {
  adminOrders: AdminOrder[];
  adminPromos: PromoCode[];
}


export default function OverviewTab({ adminOrders, adminPromos }: OverviewTabProps) {
  const [productCount, setProductCount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setProductCount(prods.length);
    });
    return () => unsub();
  }, []);

  const totalRevenue = adminOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalOrders = adminOrders.length;
  const completedOrders = adminOrders.filter(o => o.status === 'Selesai').length;
  const inProgressOrders = adminOrders.filter(o => o.status === 'Diproses').length;
  const activePromosCount = adminPromos.filter(p => p.active).length;

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const dailyStats = React.useMemo(() => {
    const days = dayNames.map(name => ({
      day: name,
      count: 0,
      revenue: 0,
    }));

    if (adminOrders.length === 0) return days.map(d => ({ ...d, heightPercent: 10 }));

    adminOrders.forEach((o, i) => {
      const dayIdx = i % 7;
      days[dayIdx].count += 1;
      days[dayIdx].revenue += o.amount;
    });

    const maxCount = Math.max(...days.map(d => d.count), 1);
    return days.map(d => ({
      ...d,
      heightPercent: d.count > 0 ? Math.max(20, Math.round((d.count / maxCount) * 100)) : 10,
    }));
  }, [adminOrders]);

  const kpis = [
    {
      label: 'Total Omset Toko',
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      trend: totalOrders > 0 ? `✓ ${completedOrders} Selesai` : null,
      trendText: totalOrders > 0 ? `dari ${totalOrders} pesanan` : 'Belum ada transaksi',
      iconClass: 'bg-purple-50 text-purple-600',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      sub: null,
    },
    {
      label: 'Total Pesanan',
      value: `${totalOrders} Pesanan`,
      trend: null,
      trendText: null,
      iconClass: 'bg-pink-50 text-pink-600',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      sub: <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-500"><span className="text-emerald-600 font-bold">{completedOrders} Selesai</span><span>•</span><span className="text-sky-600 font-bold">{inProgressOrders} Diproses</span></span>,
    },
    {
      label: 'Layanan Aktif',
      value: `${productCount} Layanan`,
      trend: null,
      trendText: null,
      iconClass: 'bg-emerald-50 text-emerald-600',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      sub: <span className="text-[11px] text-slate-500">Semua siap dipesan dengan multi-varian</span>,
    },
    {
      label: 'Promo & Voucher',
      value: `${activePromosCount} Aktif`,
      trend: null,
      trendText: null,
      iconClass: 'bg-amber-50 text-amber-600',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      sub: <span className="text-[11px] text-purple-600 font-bold">{activePromosCount > 0 ? `${activePromosCount} voucher aktif siap digunakan` : 'Belum ada voucher aktif'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-2 hover:border-purple-200 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.iconClass} flex items-center justify-center`}>{kpi.icon}</div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</div>
            {kpi.trend ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                <span>{kpi.trend}</span>
                <span className="text-slate-400 font-normal">{kpi.trendText}</span>
              </div>
            ) : kpi.sub}
          </div>
        ))}
      </div>

      {/* Chart & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Aktivitas Penjualan 7 Hari Terakhir</h3>
              <p className="text-[11px] text-slate-400">Grafik omset harian transaksi FableMart</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {adminOrders.length > 0 ? `● ${adminOrders.length} Pesanan Masuk` : '● Menunggu Pesanan'}
            </span>
          </div>
          {adminOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-1.5 border-b border-slate-100 text-center px-4">
              <span className="text-2xl">📊</span>
              <p className="text-xs font-bold text-slate-600">Belum Ada Aktivitas Penjualan</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Grafik omset mingguan akan digambar secara otomatis saat ada transaksi baru dari pelanggan.
              </p>
            </div>
          ) : (
            <div className="h-48 pt-6 pb-2 flex items-end justify-between gap-3 sm:gap-5 border-b border-slate-100 px-2">
              {dailyStats.map(stat => (
                <div key={stat.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div
                    title={`${stat.count} pesanan (Rp ${stat.revenue.toLocaleString('id-ID')})`}
                    className="w-full max-w-[42px] rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-sm bg-gradient-to-t from-purple-200 to-purple-500"
                    style={{ height: `${stat.heightPercent}%` }}
                  />
                  <span className="text-[11px] font-bold text-slate-400">{stat.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System status */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Status Operasional Toko</h3>
            <p className="text-[11px] text-slate-400">Kesehatan sistem &amp; gateway pembayaran</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Gateway QRIS Instan', status: 'Aktif', color: 'emerald' },
                { label: 'WhatsApp CS', status: 'Online', color: 'emerald' },
                { label: 'Server Bot Proses', status: 'Running', color: 'sky' },
                { label: 'CDN & Uptime', status: '100%', color: 'emerald' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-600">{s.label}</span>
                  <span className={`flex items-center gap-1.5 font-bold text-${s.color}-600`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-${s.color}-500 animate-pulse`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Recent transactions */}
          <div>
            <h4 className="text-xs font-black text-slate-700 mb-2">Pesanan Terkini</h4>
            <div className="space-y-2">
              {adminOrders.slice(0, 3).map(o => (
                <div key={o.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{o.customer}</p>
                    <p className="text-slate-400 truncate text-[10px]">{o.product}</p>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{o.status}</span>
                    <p className="text-[10px] font-black text-pink-600 mt-0.5">Rp {o.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import type { AdminOrder, PromoCode } from '@/lib/types';
import { subscribeToProducts } from '@/lib/firebaseSync';

interface OverviewTabProps {
  adminOrders: AdminOrder[];
  adminPromos: PromoCode[];
  loading?: boolean;
}


export default function OverviewTab({ adminOrders, adminPromos, loading = false }: OverviewTabProps) {
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
  const pendingVerificationOrders = adminOrders.filter(o => o.status === 'Menunggu Konfirmasi' || o.status === 'Menunggu Verifikasi').length;
  const antrianOrders = adminOrders.filter(o => o.status === 'Antrian').length;
  const inProgressOrders = adminOrders.filter(o => o.status === 'Dalam Proses' || o.status === 'Diproses').length;
  const issueOrders = adminOrders.filter(o => o.status === 'Kendala').length;
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
      iconClass: 'bg-purple-950/60 text-purple-400 border border-purple-800/60',
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
      iconClass: 'bg-rose-950/60 text-rose-400 border border-rose-800/60',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      sub: (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 flex-wrap">
          {pendingVerificationOrders > 0 && (
            <>
              <span className="text-amber-400 font-bold">{pendingVerificationOrders} Konfirmasi</span>
              <span>•</span>
            </>
          )}
          {issueOrders > 0 && (
            <>
              <span className="text-rose-400 font-bold">{issueOrders} Kendala</span>
              <span>•</span>
            </>
          )}
          <span className="text-purple-400 font-bold">{antrianOrders} Antrian</span>
          <span>•</span>
          <span className="text-sky-400 font-bold">{inProgressOrders} Proses</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{completedOrders} Selesai</span>
        </span>
      ),
    },
    {
      label: 'Layanan Aktif',
      value: `${productCount} Layanan`,
      trend: null,
      trendText: null,
      iconClass: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      sub: <span className="text-[11px] text-slate-400">Semua siap dipesan dengan multi-varian</span>,
    },
    {
      label: 'Promo & Voucher',
      value: `${activePromosCount} Aktif`,
      trend: null,
      trendText: null,
      iconClass: 'bg-amber-950/60 text-amber-400 border border-amber-800/60',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      sub: <span className="text-[11px] text-rose-400 font-bold">{activePromosCount > 0 ? `${activePromosCount} voucher aktif siap digunakan` : 'Belum ada voucher aktif'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-4 sm:p-5 rounded-2xl bg-[#151923] border border-slate-800 shadow-sm space-y-2 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.iconClass} flex items-center justify-center`}>{kpi.icon}</div>
            </div>
            {loading ? (
              <div className="h-8 w-28 bg-slate-800/80 rounded-lg animate-pulse" />
            ) : (
              <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">{kpi.value}</div>
            )}
            {loading ? (
              <div className="h-3.5 w-36 bg-slate-800/50 rounded animate-pulse" />
            ) : kpi.trend ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
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
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#151923] border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-100">Aktivitas Penjualan 7 Hari Terakhir</h3>
              <p className="text-[11px] text-slate-400">Grafik omset harian transaksi Rokai Store</p>
            </div>
            {loading ? (
              <div className="h-6 w-28 bg-slate-800/80 rounded-full animate-pulse" />
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                {adminOrders.length > 0 ? `● ${adminOrders.length} Pesanan Masuk` : '● Menunggu Pesanan'}
              </span>
            )}
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center border-b border-slate-800">
              <div className="flex items-end gap-3 sm:gap-5 h-36 w-full px-4 justify-between">
                {[35, 65, 45, 80, 50, 40, 70].map((h, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full max-w-[36px] bg-slate-800/70 rounded-t-xl animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                    <div className="w-6 h-3 bg-slate-800/60 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : adminOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-1.5 border-b border-slate-800 text-center px-4">
              <span className="text-2xl">📊</span>
              <p className="text-xs font-bold text-slate-300">Belum Ada Aktivitas Penjualan</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Grafik omset mingguan akan digambar secara otomatis saat ada transaksi baru dari pelanggan.
              </p>
            </div>
          ) : (
            <div className="h-48 pt-6 pb-2 flex items-end justify-between gap-3 sm:gap-5 border-b border-slate-800 px-2">
              {dailyStats.map(stat => (
                <div key={stat.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div
                    title={`${stat.count} pesanan (Rp ${stat.revenue.toLocaleString('id-ID')})`}
                    className="w-full max-w-[42px] rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-sm bg-gradient-to-t from-red-800 to-rose-500"
                    style={{ height: `${stat.heightPercent}%` }}
                  />
                  <span className="text-[11px] font-bold text-slate-400">{stat.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System status */}
        <div className="p-5 rounded-2xl bg-[#151923] border border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-100">Status Alur Operasional</h3>
            <p className="text-[11px] text-slate-400">Penanganan pesanan manual &amp; operasional admin</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Verifikasi Pembayaran', desc: 'Manual Cek Mutasi Admin', status: 'Siaga', color: 'emerald' },
                { label: 'Penanganan Pesanan', desc: 'Manual & Terjadwal', status: 'Aktif', color: 'emerald' },
                { label: 'Layanan WhatsApp CS', desc: 'Fast Response Admin', status: 'Online', color: 'emerald' },
                { label: 'Sinkronisasi Data', desc: 'Cloud Firestore Realtime', status: 'Terhubung', color: 'emerald' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#1c2130] border border-slate-800">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200">{s.label}</p>
                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 font-bold ${s.color === 'emerald' ? 'text-emerald-400' : 'text-sky-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.color === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400'} animate-pulse`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Recent transactions */}
          <div>
            <h4 className="text-xs font-black text-slate-300 mb-2">Pesanan Terkini</h4>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-12 rounded-xl bg-[#1c2130] border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : adminOrders.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Belum ada pesanan terbaru.</p>
            ) : (
              <div className="space-y-2">
                {adminOrders.slice(0, 3).map(o => (
                  <div key={o.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#1c2130] border border-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-200 truncate">{o.customer}</p>
                      <p className="text-slate-400 truncate text-[10px]">{o.product}</p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'Selesai' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-sky-950/60 text-sky-400 border border-sky-800/60'}`}>{o.status}</span>
                      <p className="text-[10px] font-black text-rose-400 mt-0.5">Rp {o.amount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';

export type AdminTab = 'overview' | 'orders' | 'products' | 'promos' | 'proofs' | 'hero' | 'settings';

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  activeOrdersCount: number;
}

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Ringkasan', icon: '📈' },
  { id: 'orders', label: 'Kelola Pesanan', icon: '🧾' },
  { id: 'products', label: 'Katalog & Varian', icon: '📦' },
  { id: 'promos', label: 'Voucher & Promo', icon: '🏷️' },
  { id: 'proofs', label: 'Bukti Transaksi', icon: '🛡️' },
  { id: 'hero', label: 'Hero Banner', icon: '🎨' },
  { id: 'settings', label: 'Pengaturan Toko', icon: '⚙️' },
];

export default function AdminTabs({ activeTab, onTabChange, activeOrdersCount }: AdminTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      {TABS.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer relative ${
              isActive
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'orders' && activeOrdersCount > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                {activeOrdersCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { faqItems } from '@/lib/storeData';
import { ChevronDown } from 'lucide-react';

interface FAQAccordionProps {
  storeName?: string;
}

export default function FAQAccordion({ storeName }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const cleanName = storeName ? storeName.replace(/\.$/, '') : 'toko kami';

  return (
    <div>
      <div className="mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900">Pertanyaan yang Sering Ditanyakan</h2>
        <p className="text-[11px] text-slate-400 font-medium">Jawaban lengkap atas kekhawatiran umum pelanggan {cleanName}</p>
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {faqItems.map(faq => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden transition-all duration-200">
              <button
                className="w-full px-3.5 sm:px-5 py-3 sm:py-4 text-left flex items-center justify-between gap-2.5 text-xs sm:text-sm font-bold text-slate-800 hover:text-purple-600 transition-colors"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
              >
                <span className="flex-1 leading-snug">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 sm:pt-3">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

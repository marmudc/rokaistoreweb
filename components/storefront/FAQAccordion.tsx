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
        <h2 className="text-base sm:text-lg font-black text-white">Pertanyaan yang Sering Ditanyakan</h2>
        <p className="text-[11px] text-rose-200/60 font-medium">Jawaban lengkap atas kekhawatiran umum pelanggan {cleanName}</p>
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {faqItems.map(faq => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="bg-[#16060a]/90 rounded-xl sm:rounded-2xl border border-rose-950/80 shadow-soft overflow-hidden transition-all duration-200 hover:border-rose-500/50">
              <button
                className="w-full px-3.5 sm:px-5 py-3 sm:py-4 text-left flex items-center justify-between gap-2.5 text-xs sm:text-sm font-bold text-slate-100 hover:text-rose-400 transition-colors cursor-pointer"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
              >
                <span className="flex-1 leading-snug">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`text-rose-400/70 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-4 text-xs sm:text-sm text-rose-100/80 leading-relaxed border-t border-rose-950/60 pt-2.5 sm:pt-3">
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

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { heroThemes } from '@/lib/storeData';
import type { HeroSlide } from '@/lib/types';
import { subscribeToHeroSettings } from '@/lib/firebaseSync';

const tagIconMap: Record<string, string> = {
  sparkles: '✨',
  'gamepad-2': '🎮',
  cpu: '⚡',
  flame: '🔥',
  star: '⭐',
  tag: '🏷️',
  crown: '👑',
  gift: '🎁',
};

interface HeroSectionProps {
  onCategoryFilter: (cat: string) => void;
  whatsappNumber: string;
  initialSlides?: HeroSlide[];
  initialTheme?: string;
}

export default function HeroSection({
  onCategoryFilter,
  whatsappNumber,
  initialSlides,
  initialTheme,
}: HeroSectionProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides || []);
  const [theme, setTheme] = useState(initialTheme || 'cyber');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync with initial props if provided
  useEffect(() => {
    if (initialSlides !== undefined) {
      setSlides(initialSlides);
    }
  }, [initialSlides]);

  useEffect(() => {
    if (initialTheme !== undefined) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  // Real-time listener for Firestore settings/hero
  useEffect(() => {
    const unsub = subscribeToHeroSettings((data) => {
      setSlides(data.slides || []);
      if (data.theme) {
        setTheme(data.theme);
      }
    });

    return () => unsub();
  }, []);

  const goTo = useCallback((idx: number) => {
    if (slides.length === 0) return;
    setCurrentIndex(idx % slides.length);
  }, [slides.length]);

  // Auto-slide every 8 seconds if more than 1 slide
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const themeObj = heroThemes.find(t => t.id === theme) ?? heroThemes[0];

  // If no slides exist, render a clean, elegant default storefront hero
  if (slides.length === 0) {
    return (
      <section
        className={`bg-gradient-to-r ${themeObj.bgClass} rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-hero relative overflow-hidden transition-all duration-300`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 glass-badge px-3 py-1.5 rounded-full mb-4 sm:mb-5">
            <span className="text-base">✨</span>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">OFFICIAL STORE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3 sm:mb-4 drop-shadow-sm">
            Selamat Datang di Toko Kami.
          </h1>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-xl">
            Pusat layanan game, setup teknis, dan aset digital terpercaya. Transaksi aman &amp; terpercaya dengan garansi 100%.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onCategoryFilter('all')}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-slate-900 font-bold text-sm hover:bg-white/90 transition shadow-lg cursor-pointer"
            >
              Lihat Katalog Layanan
            </button>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Halo%20Admin,%20saya%20ingin%20konsultasi%20layanan`}
              target="_blank"
              rel="noreferrer"
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full glass-badge text-white font-bold text-sm hover:bg-white/20 transition"
            >
              Konsultasi WhatsApp
            </a>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 hidden lg:flex flex-col gap-2">
          {[
            { icon: '🛡️', text: '100% Terpercaya' },
            { icon: '⚡', text: 'Proses Cepat' },
            { icon: '💬', text: 'CS 24/7' },
          ].map(vp => (
            <div key={vp.text} className="glass-badge px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-white">
              <span>{vp.icon}</span>
              <span>{vp.text}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const slide = slides[currentIndex] ?? slides[0];

  return (
    <section
      className={`bg-gradient-to-r ${themeObj.bgClass} rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-hero relative overflow-hidden transition-all duration-300`}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        {/* Tag pill */}
        <div className="inline-flex items-center gap-2 glass-badge px-3 py-1.5 rounded-full mb-4 sm:mb-5">
          <span className="text-base">{tagIconMap[slide.tagIcon] ?? '✨'}</span>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">{slide.tag}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3 sm:mb-4 drop-shadow-sm">
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-xl">
          {slide.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onCategoryFilter(slide.categoryFilter)}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-slate-900 font-bold text-sm hover:bg-white/90 transition shadow-lg cursor-pointer"
          >
            {slide.primaryCta}
          </button>
          <a
            href={`https://wa.me/${whatsappNumber}?text=Halo%20Admin,%20saya%20ingin%20konsultasi%20layanan`}
            target="_blank"
            rel="noreferrer"
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full glass-badge text-white font-bold text-sm hover:bg-white/20 transition"
          >
            {slide.secondaryCta}
          </a>
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2 mt-6 sm:mt-8">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating value props */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 hidden lg:flex flex-col gap-2">
        {[
          { icon: '🛡️', text: '99.87% Sukses' },
          { icon: '⚡', text: 'Proses < 5 Menit' },
          { icon: '💬', text: 'CS 24/7' },
        ].map(vp => (
          <div key={vp.text} className="glass-badge px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-white">
            <span>{vp.icon}</span>
            <span>{vp.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

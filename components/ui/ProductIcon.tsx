'use client';
import React from 'react';

interface ProductIconProps {
  type: string;
  className?: string;
}

const iconClasses: Record<string, string> = {
  car: 'text-slate-300 group-hover:text-indigo-500',
  code: 'text-slate-300 group-hover:text-sky-500',
  terminal: 'text-slate-300 group-hover:text-sky-500',
  layout: 'text-slate-300 group-hover:text-purple-500',
  video: 'text-slate-300 group-hover:text-pink-500',
  globe: 'text-slate-300 group-hover:text-purple-500',
  tv: 'text-slate-300 group-hover:text-rose-500',
};

export default function ProductIcon({ type, className = 'w-8 h-8 sm:w-12 sm:h-12' }: ProductIconProps) {
  const colorClass = iconClasses[type] ?? 'text-slate-300';
  const fullClass = `${className} ${colorClass} transition duration-300`;

  switch (type) {
    case 'car':
      return (
        <svg className={fullClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'code':
    case 'terminal':
      return (
        <svg className={fullClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case 'layout':
      return (
        <svg className={fullClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    case 'video':
      return (
        <svg className={fullClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="15" x="2" y="5" rx="3" />
          <polygon points="10 9 15 12.5 10 16" fill="currentColor" opacity="0.3" stroke="currentColor" />
        </svg>
      );
    case 'globe':
      return (
        <svg className={fullClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'tv':
      return (
        <svg className={fullClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="15" x="2" y="7" rx="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
      );
    default:
      return (
        <svg className={`${className} text-slate-300`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect width="18" height="18" x="3" y="3" rx="2" />
        </svg>
      );
  }
}

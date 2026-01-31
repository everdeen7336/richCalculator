'use client';

import { ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'dark';
}

const variantStyles: Record<string, string> = {
  default: 'bento-card',
  accent: 'rounded-2xl p-5 transition-all duration-300 bg-[var(--bg-card)] border border-[var(--accent)]/20 hover:border-[var(--accent)]/40',
  dark: 'rounded-2xl p-5 bg-[#2C2C2C] text-white transition-all duration-300 hover:bg-[#343434]',
};

export default function BentoCard({
  children,
  className = '',
  variant = 'default',
}: BentoCardProps) {
  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

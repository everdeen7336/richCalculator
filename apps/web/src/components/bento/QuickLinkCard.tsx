'use client';

import Link from 'next/link';

interface QuickLinkCardProps {
  href: string;
  title: string;
  subtitle: string;
  icon: string;
}

export default function QuickLinkCard({ href, title, subtitle, icon }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="
        group bento-card flex flex-col justify-between
        hover:border-[var(--accent)]/30
      "
    >
      <span className="text-2xl mb-3">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>
      </div>
    </Link>
  );
}

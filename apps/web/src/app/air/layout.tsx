'use client';

import { Providers } from '../providers';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/air', label: '홈', icon: '🏠', exact: true },
  { href: '/air/departure', label: '출국', icon: '✈️', exact: false },
  { href: '/air/arrival', label: '입국', icon: '🛬', exact: false },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-4xl mx-auto flex">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 pt-3 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AirLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="pb-16">
        {children}
      </div>
      <BottomNav />
    </Providers>
  );
}

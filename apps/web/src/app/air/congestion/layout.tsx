'use client';

import { Providers } from '../../providers';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/air/congestion/inout', label: '출입국별' },
  { href: '/air/congestion/route', label: '노선별' },
];

function CongestionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 justify-center mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CongestionLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-6">
          <Link href="/air" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            &larr; 대시보드
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">공항 혼잡도 예측</h1>
          <p className="text-sm text-gray-500">인천국제공항 시간대별 예상 승객 수</p>
        </header>
        <CongestionNav />
        {children}
      </main>
    </Providers>
  );
}

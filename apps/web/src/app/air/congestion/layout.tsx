'use client';

import { Providers } from '../../providers';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/air/congestion/departure', label: '✈️ 출국', desc: '떠나는 분' },
  { href: '/air/congestion/arrival', label: '🛬 입국', desc: '돌아오는 분' },
];

function CongestionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-3 justify-center mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              flex flex-col items-center px-7 py-3 rounded-2xl text-sm transition-all duration-200
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
              }
            `}
          >
            <span className="text-base font-bold">{tab.label}</span>
            <span className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
              {tab.desc}
            </span>
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

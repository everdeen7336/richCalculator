import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: '여행 대시보드',
  description: '들여다보는 것만으로 마음이 정리되는 여행 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
      </head>
      <body className="bg-[var(--bg-primary)] min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

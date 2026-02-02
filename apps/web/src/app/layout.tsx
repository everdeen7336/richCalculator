import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from './providers';
import './globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: '토키보 — 여행 대시보드',
  description: '들여다보는 것만으로 마음이 정리되는 여행 대시보드. 항공편, 일정, 예산을 한 곳에서.',
  manifest: '/manifest.json',
  themeColor: '#5B8A7A',
  openGraph: {
    title: '토키보 — 여행 대시보드',
    description: '항공편 등록부터 일정 관리, 경비 추적까지. 여행의 모든 것을 한 곳에서.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </head>
      <body className="bg-[var(--bg-primary)] min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

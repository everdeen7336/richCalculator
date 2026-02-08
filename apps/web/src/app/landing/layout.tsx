import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '아이랑 첫 해외여행, 두렵지 않게 | 토키보',
  description: '혼자서도 할 수 있어요. 연령별 준비물, 비행기 꿀팁, 검증된 목적지까지. 무료 체크리스트로 첫 여행을 준비하세요.',
  openGraph: {
    title: '아이랑 첫 해외여행, 두렵지 않게',
    description: '혼자서도 할 수 있어요. 연령별 준비물, 비행기 꿀팁, 검증된 목적지까지.',
    type: 'website',
    images: [
      {
        url: '/og-landing.png', // TODO: OG 이미지 제작
        width: 1200,
        height: 630,
        alt: '아이랑 해외여행 체크리스트',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '아이랑 첫 해외여행, 두렵지 않게',
    description: '혼자서도 할 수 있어요. 연령별 준비물, 비행기 꿀팁, 검증된 목적지까지.',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mediaanswer-aeo.fullmoon9289.chatgpt.site'),
  title: 'MediAnswer | 병원 AEO 플랫폼',
  description:
    '위드유 의원·한의원의 공식 정보를 기반으로 AI 검색 질문, 의료 콘텐츠 근거, 검수 상태를 관리하는 병원 AEO 운영 플랫폼',
  openGraph: {
    title: 'MediAnswer | 병원 AEO 플랫폼',
    description: '위드유 의원·한의원 AEO 온보딩과 안전한 의료 지식베이스',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'MediAnswer 병원 AEO 대시보드',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MediAnswer | 병원 AEO 플랫폼',
    description: '위드유 의원·한의원 AEO 온보딩과 안전한 의료 지식베이스',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

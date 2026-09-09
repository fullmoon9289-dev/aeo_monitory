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
    'AI 검색에서 병원의 노출을 측정하고, 키워드를 발굴해 콘텐츠 발행까지 연결하는 AEO 운영 플랫폼',
  openGraph: {
    title: 'MediAnswer | 병원 AEO 플랫폼',
    description: 'AI 검색에서 발견되는 병원',
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
    description: 'AI 검색에서 발견되는 병원',
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

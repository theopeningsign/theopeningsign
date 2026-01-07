import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollRestoration from "@/components/ScrollRestoration";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "더오프닝사인 THE OPENING SIGN | 병원 간판 전문 업체",
  description:
    "더오프닝사인 THE OPENING SIGN은 병원 간판 전문 제작 업체입니다. 다양한 병원 간판 시공 포트폴리오를 확인하세요.",
  keywords: [
    "더오프닝사인",
    "THE OPENING SIGN",
    "병원 간판",
    "병원 간판 제작",
    "병원 간판 시공",
    "병원 간판 포트폴리오",
  ],
  icons: {
    icon: [
      { url: "/onlylogo.png?v=2" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: [{ url: "/onlylogo.png?v=2" }],
  },
  openGraph: {
    title: "더오프닝사인 THE OPENING SIGN | 병원 간판 전문 업체",
    description:
      "더오프닝사인 THE OPENING SIGN은 병원 간판 전문 제작 업체입니다. 다양한 병원 간판 시공 포트폴리오를 확인하세요.",
    url: "https://theopeningsign.vercel.app",
    siteName: "더오프닝사인 THE OPENING SIGN",
    type: "website",
    images: [
      {
        url: "https://theopeningsign.vercel.app/logo_nail.png",
        width: 1200,
        height: 1200,
        alt: "더오프닝사인 로고",
      },
    ],
  },
  metadataBase: new URL("https://theopeningsign.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 이미지 preconnect로 로딩 속도 개선 */}
        <link rel="preconnect" href="https://secure.notion-static.com" />
        <link rel="preconnect" href="https://s3.us-west-2.amazonaws.com" />
        <link rel="preconnect" href="https://prod-files-secure.s3.us-west-2.amazonaws.com" />
        {/* 네이버 검색 최적화 */}
        <meta name="naver-site-verification" content="" />
      </head>
      <body className={`${notoSans.variable} antialiased bg-white text-slate-800`}>
        <ScrollRestoration />
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

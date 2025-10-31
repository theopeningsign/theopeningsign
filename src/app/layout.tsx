import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "THE OPENING SIGN | 병원 간판의 새로운 기준",
  description: "병원 간판 포트폴리오",
  icons: {
    icon: [
      { url: "/onlylogo.png?v=2" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: [{ url: "/onlylogo.png?v=2" }],
  },
  openGraph: {
    title: "THE OPENING SIGN | 병원 간판의 새로운 기준",
    description: "병원 간판 포트폴리오",
    url: process.env.SITE_URL || "https://example.com",
    siteName: "THE OPENING SIGN",
    type: "website",
  },
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSans.variable} antialiased bg-white text-slate-800`}>
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

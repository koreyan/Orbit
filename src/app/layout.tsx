import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Orbit | 자미두수로 자신을 이해하다",
    template: "%s | Orbit",
  },
  description: "자미두수 명리학 기반의 초개인화 AI 분석을 통해 유저의 고유한 성향과 매력을 진단합니다.",
  openGraph: {
    title: "Orbit | 자미두수로 자신을 이해하다",
    description: "자미두수 명리학 기반의 초개인화 AI 분석",
    url: "https://orbit-six-gamma.vercel.app",
    siteName: "Orbit",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

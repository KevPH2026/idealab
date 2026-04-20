import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IdeaLab - AI 灵感创作平台",
  description: "丢素材，5分钟出营销文案和设计稿。覆盖朋友圈、小红书、抖音、电商等全场景。",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><defs><linearGradient id='g' x1='24' y1='4' x2='24' y2='44' gradientUnits='userSpaceOnUse'><stop offset='0%25' stop-color='%23a855f7'/><stop offset='100%25' stop-color='%236366f1'/></linearGradient></defs><path d='M24 4C17.37 4 12 9.37 12 16C12 19.87 14.06 23.27 17.2 25.4C17.75 25.78 18 26.4 18 27.1V30H30V27.1C30 26.4 30.25 25.78 30.8 25.4C33.95 23.27 36 19.87 36 16C36 9.37 30.63 4 24 4Z' fill='url(%23g)'/><rect x='19' y='30' width='10' height='3' rx='1' fill='%236366f1'/><rect x='20' y='33' width='8' height='2.5' rx='1' fill='%234f46e5'/><rect x='21' y='35.5' width='6' height='2.5' rx='1' fill='%233730a3'/><path d='M25 14L22 19H24.5L23 24L26 18H23.5L25 14Z' fill='%23fbbf24'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased bg-[#070711]`}>
        {children}
      </body>
    </html>
  );
}

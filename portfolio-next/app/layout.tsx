import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sahil A. Pai — Software Engineer",
  description:
    "Portfolio of Sahil A. Pai — Software Engineer, Founder of TerraMind, 3× Hackathon Champion, and CS student at ASU Barrett Honors College.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F5F5F7] font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}

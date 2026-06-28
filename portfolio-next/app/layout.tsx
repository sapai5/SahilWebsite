import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteBackground from "@/components/SiteBackground";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sahil A. Pai · Software Engineer",
  description:
    "Portfolio of Sahil A. Pai. Software engineer, founder of TerraMind, 4× hackathon champion, and CS student at ASU Barrett Honors College.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F5F5F7] font-[family-name:var(--font-inter)] selection:bg-black/10 relative">
        <SiteBackground />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}

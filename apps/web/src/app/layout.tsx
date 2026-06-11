import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Safar — Travel Smarter. Travel Safer.",
  description:
    "India's community-powered mobility platform. Smart route planning, safety heatmaps, and emergency shield for Indian commuters.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScentDex",
  description: "Browse and study the most popular fragrances",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
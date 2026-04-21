import { Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Footer } from "@/components/footer1";
import { cn } from "@/lib/utils";
import Header from "@/components/ui/header";
import type { NavigationSection } from "@/components/ui/header";

const navigationData: NavigationSection[] = [
  {
    title: "Home",
    href: "/",
    isActive: true,
  },
  {
    title: "Library",
    href: "/library",
  },
  {
    title: "Compare",
    href: "/compare",
  },
  {
    title: "AI",
    href: "/ai",
  }
];

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "ScentDex",
    template: "%s - ScentDex",
  },
  description: "",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Header navigationData={navigationData} />
            {children}
            <Footer />
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}

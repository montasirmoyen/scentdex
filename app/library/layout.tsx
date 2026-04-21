import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Library",
}

export default function AiLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}

import type { Metadata } from "next"
import fragranceData from "@/data/fragrances.json"

type FragranceRecord = {
  Name?: string
}

type FragranceLayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: Omit<FragranceLayoutProps, "children">): Promise<Metadata> {
  const { id } = await params
  const fragranceId = Number(id)

  if (!Number.isInteger(fragranceId) || fragranceId < 0) {
    return {
      title: "Fragrance",
    }
  }

  const fragrance = (fragranceData as FragranceRecord[])[fragranceId]

  return {
    title: fragrance?.Name || "Fragrance",
  }
}

export default async function FragranceLayout({
  children,
}: FragranceLayoutProps) {
  return children
}

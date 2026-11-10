import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = { title: "Compare products", description: "Compare prices, ratings and specifications side by side.", robots: { index: false, follow: true } }

export default function Layout({ children }: { children: ReactNode }) {
  return children
}

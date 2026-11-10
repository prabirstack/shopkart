import type { ReactNode } from "react"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader } from "@/components/store/site-header"

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  )
}

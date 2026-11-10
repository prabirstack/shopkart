import type { ReactNode } from "react"
import { Analytics } from "@/features/analytics/analytics"
import { ConsentBanner } from "@/features/analytics/consent-banner"
import { CartHydrator } from "@/features/cart/cart-hydrator"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader } from "@/components/store/site-header"

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CartHydrator />
      <SiteHeader />
      {children}
      <SiteFooter />
      <Analytics />
      <ConsentBanner />
    </>
  )
}

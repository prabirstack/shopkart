import type { Metadata } from "next"
import { NotFoundContent } from "@/components/store/not-found-content"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader } from "@/components/store/site-header"

export const metadata: Metadata = { title: "Page not found", robots: { index: false } }

/** Used for URLs that match no route at all, so it brings its own header and footer. */
export default function RootNotFound() {
  return (
    <>
      <SiteHeader />
      <NotFoundContent />
      <SiteFooter />
    </>
  )
}

import type { Metadata } from "next"
import { Suspense, type ReactNode } from "react"
import { AdminGate } from "@/components/admin/admin-gate"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: ReactNode }) {
  // The gate reads the request (cookies and headers), so it streams inside Suspense.
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center p-6"><Skeleton className="h-40 w-full max-w-md rounded-2xl" /></div>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  )
}

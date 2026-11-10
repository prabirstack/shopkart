import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminHydrator } from "@/features/admin/hooks"

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AdminHydrator />
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <AdminTopbar />
          <p role="note" className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">Demo admin on sample data. There is no login or permission check yet, so never put real business data here. Changes are saved in this browser only.</p>
          <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

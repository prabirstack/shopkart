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
          <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

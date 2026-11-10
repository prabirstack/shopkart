import {
  BarChart3, Boxes, FileText, Image as ImageIcon, LayoutDashboard, Package,
  Percent, RotateCcw, ShoppingBag, Ticket, Users, type LucideIcon,
} from "lucide-react"

export type AdminNavItem = { title: string; href: string; icon: LucideIcon }
export type AdminNavGroup = { label: string; items: AdminNavItem[] }

export const adminNav: AdminNavGroup[] = [
  { label: "Overview", items: [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  ] },
  { label: "Catalog", items: [
    { title: "Products", href: "/admin/products", icon: Package },
    { title: "Inventory", href: "/admin/inventory", icon: Boxes },
  ] },
  { label: "Sales", items: [
    { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { title: "Returns", href: "/admin/returns", icon: RotateCcw },
    { title: "Customers", href: "/admin/customers", icon: Users },
  ] },
  { label: "Marketing", items: [
    { title: "Coupons", href: "/admin/coupons", icon: Ticket },
    { title: "Banners", href: "/admin/banners", icon: ImageIcon },
    { title: "Articles", href: "/admin/articles", icon: FileText },
  ] },
  { label: "Settings", items: [
    { title: "Tax (GST)", href: "/admin/tax", icon: Percent },
    { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  ] },
]

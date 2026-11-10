import {
  BarChart3, Boxes, FileText, Image as ImageIcon, LayoutDashboard, Package, Percent,
  Inbox, MessageSquare, RotateCcw, Settings, ShoppingBag, Ticket, Users, type LucideIcon,
} from "lucide-react"

export type AdminNavItem = { title: string; href: string; icon: LucideIcon; badge?: "orders" | "stock" | "returns" | "reviews" | "inbox" }
export type AdminNavGroup = { label: string; items: AdminNavItem[] }

export const adminNav: AdminNavGroup[] = [
  { label: "Overview", items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  { label: "Catalog", items: [
    { title: "Products", href: "/admin/products", icon: Package },
    { title: "Inventory", href: "/admin/inventory", icon: Boxes, badge: "stock" },
    { title: "Reviews", href: "/admin/reviews", icon: MessageSquare, badge: "reviews" },
  ] },
  { label: "Sales", items: [
    { title: "Orders", href: "/admin/orders", icon: ShoppingBag, badge: "orders" },
    { title: "Returns", href: "/admin/returns", icon: RotateCcw, badge: "returns" },
    { title: "Customers", href: "/admin/customers", icon: Users },
    { title: "Inbox", href: "/admin/inbox", icon: Inbox, badge: "inbox" },
  ] },
  { label: "Marketing", items: [
    { title: "Coupons", href: "/admin/coupons", icon: Ticket },
    { title: "Banners", href: "/admin/banners", icon: ImageIcon },
    { title: "Articles", href: "/admin/articles", icon: FileText },
  ] },
  { label: "Insights", items: [{ title: "Reports", href: "/admin/reports", icon: BarChart3 }] },
  { label: "Settings", items: [
    { title: "Tax (GST)", href: "/admin/tax", icon: Percent },
    { title: "Store settings", href: "/admin/settings", icon: Settings },
  ] },
]

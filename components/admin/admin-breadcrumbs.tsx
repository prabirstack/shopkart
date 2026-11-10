"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { adminNav } from "@/features/admin/nav"

const titles = new Map(adminNav.flatMap((g) => g.items).map((i) => [i.href, i.title]))

export function AdminBreadcrumbs() {
  const parts = usePathname().split("/").filter(Boolean).slice(1) // drop "admin"
  const crumbs = parts.map((part, i) => {
    const href = "/admin/" + parts.slice(0, i + 1).join("/")
    return { href, title: titles.get(href) ?? part }
  })
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {crumbs.length === 0 ? <BreadcrumbPage>Dashboard</BreadcrumbPage>
            : <BreadcrumbLink asChild><Link href="/admin">Dashboard</Link></BreadcrumbLink>}
        </BreadcrumbItem>
        {crumbs.map((c, i) => (
          <Fragment key={c.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? <BreadcrumbPage>{c.title}</BreadcrumbPage>
                : <BreadcrumbLink asChild><Link href={c.href}>{c.title}</Link></BreadcrumbLink>}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

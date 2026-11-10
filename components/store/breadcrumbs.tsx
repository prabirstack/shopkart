import Link from "next/link"
import { Fragment } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export function StoreBreadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
        {trail.map((t) => (
          <Fragment key={t.label}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {t.href ? <BreadcrumbLink asChild><Link href={t.href}>{t.label}</Link></BreadcrumbLink>
                : <BreadcrumbPage>{t.label}</BreadcrumbPage>}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

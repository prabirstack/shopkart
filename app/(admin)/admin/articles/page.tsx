import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { SimpleTable } from "@/components/admin/simple-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { articles } from "@/features/admin/demo"

export default function AdminArticlesPage() {
  return (
    <>
      <PageHeader title="Articles" description="Buying guides and news that appear on the storefront.">
        <Button disabled title="The article editor arrives in the articles chapter">New article</Button>
      </PageHeader>
      <DemoNotice />
      <SimpleTable rows={articles} rowKey={(a) => a.id} caption="Articles by last update." empty="No articles yet. Write your first buying guide."
        columns={[
          { header: "Title", cell: (a) => a.title, className: "min-w-52 font-medium" },
          { header: "URL", cell: (a) => <span className="font-mono text-xs">/news/{a.slug}</span> },
          { header: "Author", cell: (a) => a.author, className: "whitespace-nowrap text-muted-foreground" },
          { header: "Updated", cell: (a) => a.updated, className: "whitespace-nowrap" },
          { header: "Status", cell: (a) => <StatusBadge tone={a.published ? "good" : "muted"}>{a.published ? "Published" : "Draft"}</StatusBadge> },
        ]} />
    </>
  )
}

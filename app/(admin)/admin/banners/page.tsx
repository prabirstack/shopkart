import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { SimpleTable } from "@/components/admin/simple-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { banners } from "@/features/admin/demo"

const tone = { live: "good", scheduled: "info", ended: "muted" } as const

export default function AdminBannersPage() {
  return (
    <>
      <PageHeader title="Banners" description="Scheduled homepage campaigns. Text and links stay in HTML, images only support them.">
        <Button disabled title="Banner editing arrives in the banners chapter">New banner</Button>
      </PageHeader>
      <DemoNotice />
      <SimpleTable rows={banners} rowKey={(b) => b.id} caption="Banners with their schedule. Times are in IST." empty="No banners scheduled."
        columns={[
          { header: "Title", cell: (b) => b.title, className: "min-w-40 font-medium" },
          { header: "Placement", cell: (b) => b.slot, className: "whitespace-nowrap text-muted-foreground" },
          { header: "Starts", cell: (b) => b.starts, className: "whitespace-nowrap" },
          { header: "Ends", cell: (b) => b.ends, className: "whitespace-nowrap" },
          { header: "Status", cell: (b) => <StatusBadge tone={tone[b.status]}>{b.status[0].toUpperCase() + b.status.slice(1)}</StatusBadge> },
        ]} />
    </>
  )
}

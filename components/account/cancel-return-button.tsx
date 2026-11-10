"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { callApi } from "@/features/account/api"

/** A customer can take back a return request until we've approved it. The server enforces that too. */
export function CancelReturnButton({ number }: { number: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const cancel = async () => {
    setBusy(true); setError("")
    const res = await callApi(`/api/v1/returns/${encodeURIComponent(number)}/cancel`, "POST")
    setBusy(false)
    if (!res.ok) { setError(res.message); return }
    setOpen(false); router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError("") }}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Cancel return</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel return {number}?</DialogTitle><DialogDescription>We haven&apos;t acted on this request yet. Cancelling it frees those items, so you can request a new return while the window is open.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Keep return</Button>
          <Button variant="destructive" onClick={cancel} disabled={busy}>{busy && <Loader2 className="animate-spin" aria-hidden="true" />}Cancel return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

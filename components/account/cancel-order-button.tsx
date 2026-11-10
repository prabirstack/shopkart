"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

/** Customers can cancel an order only until it is paid. The server enforces that too. */
export function CancelOrderButton({ number }: { number: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const cancel = async () => {
    setBusy(true); setError("")
    try {
      const res = await fetch(`/api/v1/orders/${encodeURIComponent(number)}/cancel`, { method: "POST" })
      if (!res.ok) { setError((await res.json().catch(() => null))?.error?.message ?? "We couldn't cancel this order."); return }
      setOpen(false); router.refresh()
    } catch { setError("Couldn't reach the server. Check your connection and try again.") } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError("") }}>
      <DialogTrigger asChild><Button variant="outline">Cancel order</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel order {number}?</DialogTitle><DialogDescription>This order has not been paid yet. Cancelling releases the items and cannot be undone.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Keep order</Button>
          <Button variant="destructive" onClick={cancel} disabled={busy}>{busy && <Loader2 className="animate-spin" aria-hidden="true" />}Cancel order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

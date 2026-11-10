import type { Metadata } from "next"
import { RotateCcw } from "lucide-react"
import Link from "next/link"
import { DraftNotice, InfoPage, Prose, HelpAside } from "@/components/info/info-page"
import { policy } from "@/features/help/content"

export const metadata: Metadata = { title: "Returns & refunds", description: `Return most products within ${policy.returnDays} days of delivery. Learn how returns, replacements and refunds work at ShopKart.`, alternates: { canonical: "/help/returns" } }

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Returns" icon={RotateCcw} aside={<HelpAside />} title="Returns & refunds" intro={`Changed your mind or received the wrong item? You have ${policy.returnDays} days from delivery.`} trail={[{ label: "Help", href: "/help" }]}>
      <DraftNotice>Starter policy text for the demo store. Have it reviewed against your real business rules before launch.</DraftNotice>
      <Prose title="What can be returned"><p>Most products can be returned within <strong>{policy.returnDays} days of delivery</strong> if they are unused, undamaged and in original packaging with all accessories.</p>
        <ul><li>Opened personal care and hygiene items cannot be returned.</li><li>Gift cards are not refundable.</li><li>Faulty items are covered by the brand warranty; contact us and we will help.</li></ul></Prose>
      <Prose title="How to return an item">
        <ol className="grid gap-2 [&>li]:ml-5 [&>li]:list-decimal"><li>Open <Link href="/account/orders" className="text-primary underline">Account, Orders</Link> and choose the order.</li><li>Pick the item and a reason, then request the return.</li><li>Pack the item securely. We arrange the pickup.</li><li>We inspect it and start your refund.</li></ol></Prose>
      <Prose title="Refunds"><p>Refunds go to your <strong>original payment method</strong>. After inspection, banks usually take 5 to 7 working days to show the money. GST on a refunded item is credited through a credit note.</p></Prose>
      <Prose title="Need help?"><p>Questions about a return? <Link href="/contact" className="text-primary underline">Contact us</Link> with your order number.</p></Prose>
    </InfoPage>
  )
}

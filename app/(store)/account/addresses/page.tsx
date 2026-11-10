import { AccountTitle } from "@/components/account/account-title"
import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addresses } from "@/features/account/demo"

export default function AccountAddressesPage() {
  return (
    <>
      <AccountTitle title="Saved addresses" description="Where we deliver your orders."><Button disabled title="Address management arrives with the account chapter"><Plus aria-hidden="true" /> Add address</Button></AccountTitle>
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className={`rounded-xl border bg-card p-5 ${a.isDefault ? "ring-2 ring-primary/40" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" aria-hidden="true" /> {a.label}</p>
              {a.isDefault && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Default</span>}
            </div>
            <address className="text-sm not-italic text-muted-foreground">{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />Phone {a.phone}</address>
            <div className="mt-4 flex gap-2"><Button variant="outline" size="sm" disabled>Edit</Button><Button variant="outline" size="sm" disabled>Remove</Button></div>
          </li>
        ))}
      </ul>
    </>
  )
}

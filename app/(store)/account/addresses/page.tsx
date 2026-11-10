import { Suspense } from "react"
import { AddressBook } from "@/components/account/address-book"
import { AccountTitle } from "@/components/account/account-title"
import { Skeleton } from "@/components/ui/skeleton"
import { requireUser } from "@/features/account/session"
import { listAddresses } from "@/lib/db/queries"

export const instant = false

async function Addresses() {
  const user = await requireUser("/account/addresses")
  const rows = await listAddresses(user.id)
  return <AddressBook userName={user.name} addresses={rows.map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault }))} />
}

export default function AccountAddressesPage() {
  return (
    <Suspense fallback={<><AccountTitle title="Saved addresses" description="Where we deliver your orders." /><Skeleton className="h-48 w-full rounded-xl" /></>}>
      <Addresses />
    </Suspense>
  )
}

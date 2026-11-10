"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, ChevronDown, Loader2, MapPin, Plus } from "lucide-react"
import { AccountTitle } from "@/components/account/account-title"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { callApi } from "@/features/account/api"
import { addressSchema, type AddressValues, type SavedAddress } from "@/features/account/schema"
import { INDIAN_STATES } from "@/features/checkout/schema"

const MAX = 10
const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm shadow-xs outline-none transition hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-destructive"
const blank: AddressValues = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false }

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function AddressDialog({ address, open, onClose, firstAddress, userName }: { address: SavedAddress | null; open: boolean; onClose: () => void; firstAddress: boolean; userName: string }) {
  const router = useRouter()
  const [formError, setFormError] = useState("")
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? { label: address.label, name: address.name, phone: address.phone, line1: address.line1, line2: address.line2 ?? "", city: address.city, state: address.state, pincode: address.pincode, isDefault: address.isDefault } : { ...blank, name: userName, isDefault: firstAddress },
  })
  const a = (n: keyof AddressValues) => ({ "aria-invalid": errors[n] ? (true as const) : undefined, "aria-describedby": errors[n] ? `addr-${n}-error` : undefined })
  const states: string[] = [...INDIAN_STATES]
  if (address && !states.includes(address.state)) states.push(address.state)

  const save = handleSubmit(async (values) => {
    setFormError("")
    const body = { ...values, line2: values.line2 || null }
    const res = await (address ? callApi(`/api/v1/account/addresses/${address.id}`, "PUT", body) : callApi("/api/v1/account/addresses", "POST", body))
    if (!res.ok) {
      let placed = false
      for (const [path, message] of Object.entries(res.fields)) if (path in addressSchema.shape) { setError(path as keyof AddressValues, { message }); placed = true }
      if (!placed) setFormError(res.message)
      return
    }
    onClose(); router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{address ? "Edit address" : "Add a new address"}</DialogTitle><DialogDescription>We deliver your orders to the address you pick at checkout.</DialogDescription></DialogHeader>
        <form onSubmit={save} noValidate className="grid gap-3 sm:grid-cols-2" aria-label={address ? "Edit address" : "Add address"}>
          <Field id="addr-label" label="Label" error={errors.label?.message}><input id="addr-label" {...register("label")} {...a("label")} placeholder="Home, Office…" className={input} /></Field>
          <Field id="addr-name" label="Full name" error={errors.name?.message}><input id="addr-name" {...register("name")} {...a("name")} autoComplete="name" className={input} /></Field>
          <Field id="addr-phone" label="Mobile number" error={errors.phone?.message}><input id="addr-phone" {...register("phone")} {...a("phone")} inputMode="numeric" autoComplete="tel-national" maxLength={10} className={input} /></Field>
          <Field id="addr-pincode" label="PIN code" error={errors.pincode?.message}><input id="addr-pincode" {...register("pincode")} {...a("pincode")} inputMode="numeric" autoComplete="postal-code" maxLength={6} className={input} /></Field>
          <div className="sm:col-span-2"><Field id="addr-line1" label="Street address" error={errors.line1?.message}><input id="addr-line1" {...register("line1")} {...a("line1")} autoComplete="address-line1" className={input} /></Field></div>
          <div className="sm:col-span-2"><Field id="addr-line2" label="Apartment, landmark (optional)" error={errors.line2?.message}><input id="addr-line2" {...register("line2")} {...a("line2")} autoComplete="address-line2" className={input} /></Field></div>
          <Field id="addr-city" label="City" error={errors.city?.message}><input id="addr-city" {...register("city")} {...a("city")} autoComplete="address-level2" className={input} /></Field>
          <Field id="addr-state" label="State" error={errors.state?.message}>
            <div className="relative"><select id="addr-state" {...register("state")} {...a("state")} autoComplete="address-level1" className={`${input} cursor-pointer appearance-none pr-9`}>
              <option value="" disabled>Select state</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" {...register("isDefault")} className="size-4 accent-primary" /> Make this my default address</label>
          {formError && <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{formError}</p>}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}{address ? "Save changes" : "Add address"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AddressBook({ addresses, userName }: { addresses: SavedAddress[]; userName: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null)
  const [removing, setRemoving] = useState<SavedAddress | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const full = addresses.length >= MAX

  const makeDefault = async (a: SavedAddress) => {
    setBusy(a.id); setError("")
    const res = await callApi(`/api/v1/account/addresses/${a.id}`, "PUT", { label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, isDefault: true })
    setBusy(null)
    if (!res.ok) setError(res.message); else router.refresh()
  }
  const remove = async () => {
    if (!removing) return
    setBusy(removing.id); setError("")
    const res = await callApi(`/api/v1/account/addresses/${removing.id}`, "DELETE")
    setBusy(null)
    if (!res.ok) { setError(res.message); return }
    setRemoving(null); router.refresh()
  }

  return (
    <>
      <AccountTitle title="Saved addresses" description="Where we deliver your orders.">
        <Button onClick={() => setEditing("new")} disabled={full} title={full ? `You can save up to ${MAX} addresses` : undefined}><Plus aria-hidden="true" /> Add address</Button>
      </AccountTitle>
      {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
      {addresses.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader><EmptyMedia variant="icon"><MapPin aria-hidden="true" /></EmptyMedia><EmptyTitle>No saved addresses</EmptyTitle><EmptyDescription>Add one now and checkout gets faster.</EmptyDescription></EmptyHeader>
          <EmptyContent><Button onClick={() => setEditing("new")}><Plus aria-hidden="true" /> Add address</Button></EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className={`rounded-xl border bg-card p-5 ${a.isDefault ? "ring-2 ring-primary/40" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" aria-hidden="true" /> {a.label}</p>
                {a.isDefault && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Default</span>}
              </div>
              <address className="text-sm not-italic text-muted-foreground">{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />Phone {a.phone}</address>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                {!a.isDefault && <Button variant="outline" size="sm" onClick={() => makeDefault(a)} disabled={busy === a.id}>{busy === a.id && <Loader2 className="animate-spin" aria-hidden="true" />}Set as default</Button>}
                <Button variant="outline" size="sm" onClick={() => { setError(""); setRemoving(a) }}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <AddressDialog key={editing === "new" ? "new" : editing.id} address={editing === "new" ? null : editing} open onClose={() => setEditing(null)} firstAddress={addresses.length === 0} userName={userName} />}
      <Dialog open={!!removing} onOpenChange={(o) => { if (!o) setRemoving(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove this address?</DialogTitle><DialogDescription>{removing ? `${removing.label} · ${removing.line1}, ${removing.city}. ` : ""}Past orders keep the address they were delivered to.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)} disabled={!!busy}>Keep it</Button>
            <Button variant="destructive" onClick={remove} disabled={!!busy}>{busy && <Loader2 className="animate-spin" aria-hidden="true" />}Remove address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

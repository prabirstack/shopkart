"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { callApi } from "@/features/account/api"
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from "@/features/account/schema"
import { authClient } from "@/lib/auth-client"

const input = "h-10 w-full rounded-lg border bg-muted/40 px-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-destructive read-only:text-muted-foreground"

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const Problem = ({ children }: { children: string }) => <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{children}</p>
const Success = ({ children }: { children: string }) => <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{children}</p>

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const router = useRouter()
  const [formError, setFormError] = useState("")
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name, phone } })
  const a = (n: keyof ProfileValues) => ({ "aria-invalid": errors[n] ? (true as const) : undefined, "aria-describedby": errors[n] ? `profile-${n}-error` : undefined })

  const save = handleSubmit(async (values) => {
    setFormError(""); setSaved(false)
    const res = await callApi<{ name: string; phone: string | null }>("/api/v1/account/profile", "PATCH", { name: values.name, phone: values.phone === "" ? null : values.phone })
    if (!res.ok) {
      let placed = false
      for (const [path, message] of Object.entries(res.fields)) if (path === "name" || path === "phone") { setError(path, { message }); placed = true }
      // A phone number already used by someone else comes back as a plain conflict message.
      if (!placed) { if (/phone/i.test(res.message)) setError("phone", { message: res.message }); else setFormError(res.message) }
      return
    }
    reset({ name: res.data.name, phone: res.data.phone ?? "" })
    setSaved(true); router.refresh()
  })

  return (
    <form onSubmit={save} noValidate className="grid max-w-xl gap-4 rounded-xl border bg-card p-5" aria-label="Profile details">
      <Field id="profile-name" label="Full name" error={errors.name?.message}><input id="profile-name" {...register("name")} {...a("name")} autoComplete="name" className={input} /></Field>
      <Field id="profile-email" label="Email" hint="Your email is your sign-in and can't be changed here."><input id="profile-email" value={email} readOnly className={input} /></Field>
      <Field id="profile-phone" label="Mobile number" error={errors.phone?.message}><input id="profile-phone" {...register("phone")} {...a("phone")} inputMode="numeric" autoComplete="tel-national" maxLength={10} className={input} /></Field>
      {formError && <Problem>{formError}</Problem>}
      {saved && <Success>Your profile has been saved.</Success>}
      <div><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}Save changes</Button></div>
    </form>
  )
}

export function PasswordForm() {
  const [formError, setFormError] = useState("")
  const [done, setDone] = useState(false)
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } })
  const a = (n: keyof PasswordValues) => ({ "aria-invalid": errors[n] ? (true as const) : undefined, "aria-describedby": errors[n] ? `pw-${n}-error` : undefined })

  const save = handleSubmit(async (values) => {
    setFormError(""); setDone(false)
    try {
      const { error } = await authClient.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword, revokeOtherSessions: true })
      if (error) {
        if (error.code === "INVALID_PASSWORD" || /incorrect|invalid password/i.test(error.message ?? "")) setError("currentPassword", { message: "That isn't your current password." })
        else if (/too short/i.test(error.message ?? "")) setError("newPassword", { message: "Use at least 10 characters." })
        else if (error.status === 429) setFormError("Too many attempts. Wait a minute and try again.")
        else setFormError(error.message || "We couldn't change your password. Please try again.")
        return
      }
      reset(); setDone(true)
    } catch { setFormError("Couldn't reach the server. Check your connection and try again.") }
  })

  return (
    <form onSubmit={save} noValidate className="grid max-w-xl gap-4 rounded-xl border bg-card p-5" aria-label="Change password">
      <Field id="pw-currentPassword" label="Current password" error={errors.currentPassword?.message}><input id="pw-currentPassword" type="password" {...register("currentPassword")} {...a("currentPassword")} autoComplete="current-password" className={input} /></Field>
      <Field id="pw-newPassword" label="New password" hint="At least 10 characters." error={errors.newPassword?.message}><input id="pw-newPassword" type="password" {...register("newPassword")} {...a("newPassword")} autoComplete="new-password" className={input} /></Field>
      <Field id="pw-confirm" label="Confirm new password" error={errors.confirm?.message}><input id="pw-confirm" type="password" {...register("confirm")} {...a("confirm")} autoComplete="new-password" className={input} /></Field>
      <p className="text-xs text-muted-foreground">Changing your password signs you out of your other devices.</p>
      {formError && <Problem>{formError}</Problem>}
      {done && <Success>Password changed. Your other devices have been signed out.</Success>}
      <div><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}Change password</Button></div>
    </form>
  )
}

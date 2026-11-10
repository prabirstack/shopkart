"use client"
import Link from "next/link"
import { useState } from "react"
import { MailCheck } from "lucide-react"
import { AuthCard } from "@/components/info/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null)
  return (
    <AuthCard title="Reset your password" intro="Enter your email and we'll send you a reset link.">
      {sent ? (
        <div role="status" className="grid justify-items-center gap-3 rounded-2xl border bg-muted/40 p-5 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><MailCheck className="size-6" aria-hidden="true" /></span>
          {/* Same message whether or not the account exists, so this form can't be used to discover who has an account. */}
          <p className="text-sm text-muted-foreground">If an account exists for <strong className="text-foreground">{sent}</strong>, a reset link is on its way. It works for one hour.</p>
        </div>
      ) : (
        <AuthForm submitLabel="Send reset link" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
          onSubmit={async ({ email }) => {
            const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })
            if (error?.status === 429) return "Too many requests. Please wait a few minutes."
            setSent(email)
          }} />
      )}
      <p className="text-sm text-muted-foreground"><Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </AuthCard>
  )
}

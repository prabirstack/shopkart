"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthCard } from "@/components/info/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { authClient } from "@/lib/auth-client"

export default function ResetPasswordPage() {
  const router = useRouter()
  return (
    <AuthCard title="Choose a new password" intro="Pick something at least 10 characters long.">
      <AuthForm submitLabel="Update password" fields={[{ name: "password", label: "New password", type: "password", autoComplete: "new-password", minLength: 10, maxLength: 128 }]}
        onSubmit={async ({ password }) => {
          const token = new URLSearchParams(window.location.search).get("token")
          if (!token) return "This reset link is incomplete. Request a new one."
          const { error } = await authClient.resetPassword({ newPassword: password, token })
          if (error) return "This reset link is invalid or has expired. Request a new one."
          router.push("/login?reset=1")
        }} />
      <p className="text-sm text-muted-foreground"><Link href="/forgot-password" className="font-medium text-primary hover:underline">Request a new link</Link></p>
    </AuthCard>
  )
}

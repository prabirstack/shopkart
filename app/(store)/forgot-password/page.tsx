import Link from "next/link"
import { AuthCard } from "@/components/info/auth-card"
import { DemoForm } from "@/components/info/demo-form"

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" intro="Enter your email and we'll send you a reset link.">
      <DemoForm submitLabel="Send reset link" notice="If an account exists for that email, a reset link would be sent. Password reset isn't connected yet."
        fields={[{ name: "email", label: "Email", type: "email", required: true, autoComplete: "email" }]} />
      <p className="text-center text-sm text-muted-foreground"><Link href="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
    </AuthCard>
  )
}

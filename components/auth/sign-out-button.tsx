"use client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button type="button" className={className} onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh() }}>
      <span className="grid size-8 place-items-center rounded-lg bg-muted"><LogOut className="size-4" aria-hidden="true" /></span>Sign out
    </button>
  )
}

import { Badge } from "@/components/ui/badge"

const tones = {
  good: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
  muted: "bg-neutral-200 text-neutral-700",
  bad: "bg-red-100 text-red-800",
} as const

export function StatusBadge({ tone, children }: { tone: keyof typeof tones; children: string }) {
  return <Badge variant="secondary" className={tones[tone]}>{children}</Badge>
}

import { Star } from "lucide-react"

export function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={`${className} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />
      ))}
    </span>
  )
}

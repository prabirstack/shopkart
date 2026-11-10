"use client"
import { useEffect, useState } from "react"

const pad = (n: number) => String(n).padStart(2, "0")

/** Counts down to a real end timestamp; it never restarts on refresh. */
export function Countdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    const end = new Date(endsAt).getTime()
    const tick = () => setLeft(Math.max(0, end - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endsAt])

  const secs = left === null ? null : Math.floor(left / 1000)
  const text = secs === null ? "-- : -- : --"
    : secs === 0 ? "Ended"
    : `${pad(Math.floor(secs / 3600))} : ${pad(Math.floor((secs % 3600) / 60))} : ${pad(secs % 60)}`
  return (
    <span className="price rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
      Ends in <span className="font-bold">{text}</span>
    </span>
  )
}

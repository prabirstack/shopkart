"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, Flame, LayoutGrid } from "lucide-react"
import type { MenuData } from "@/features/catalog/menu"
import { MegaPanel, type MenuId } from "./mega-panels"

const OPEN_DELAY = 90 // ms the pointer must rest before a panel opens, so sweeping across the bar doesn't flash panels
const CLOSE_DELAY = 200 // ms grace so the pointer can cross the gap into the panel

const menus: { id: MenuId; label: string; href: string }[] = [
  { id: "new", label: "New Arrivals", href: "/new-arrivals" },
  { id: "best", label: "Bestsellers", href: "/bestsellers" },
  { id: "brands", label: "Brands", href: "/brands" },
]
type Entry = { kind: "link"; label: string; href: string; flame?: boolean } | { kind: "menu"; id: MenuId }
const entries: Entry[] = [
  { kind: "link", label: "Deals", href: "/deals", flame: true },
  { kind: "menu", id: "new" }, { kind: "menu", id: "best" },
  { kind: "link", label: "Top Selling", href: "/top-selling" },
  { kind: "menu", id: "brands" },
  { kind: "link", label: "Guides", href: "/news" },
  { kind: "link", label: "Gift Cards", href: "/gift-cards" },
  { kind: "link", label: "Sell on ShopKart", href: "/sell" },
]

/**
 * Desktop store navigation with mega menus. Behaviour:
 * - Hover (with intent delays) or focus opens a panel; moving between triggers swaps panels instantly.
 * - Each trigger is a real link to its page plus a chevron button that toggles the panel (disclosure pattern).
 * - Esc closes and returns focus; ArrowDown on a chevron opens and moves into the panel; Left/Right move along the bar.
 * - Tabbing out, clicking the backdrop or following a link closes it.
 */
export function MegaNav({ menu }: { menu: MenuData }) {
  const [open, setOpen] = useState<MenuId | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  // True while the menu was opened with the keyboard. A mouse parked over the page must not close it.
  const viaKeyboard = useRef(false)
  const openTimer = useRef<number | undefined>(undefined)
  const closeTimer = useRef<number | undefined>(undefined)
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({})

  useEffect(() => () => { window.clearTimeout(openTimer.current); window.clearTimeout(closeTimer.current) }, [])
  // Scrolling the page closes an open menu, so a panel never floats over content that moved.
  useEffect(() => {
    if (!open) return
    const start = window.scrollY
    const onScroll = () => { if (Math.abs(window.scrollY - start) > 24) setOpen(null) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [open])
  const clear = () => { window.clearTimeout(openTimer.current); window.clearTimeout(closeTimer.current) }
  const close = () => { clear(); setOpen(null) }
  const hoverOpen = (id: MenuId) => {
    clear()
    viaKeyboard.current = false
    if (open) setOpen(id) // a panel is already showing: swap straight away
    else openTimer.current = window.setTimeout(() => setOpen(id), OPEN_DELAY)
  }
  const scheduleClose = () => { window.clearTimeout(openTimer.current); if (viaKeyboard.current) return; closeTimer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY) }
  const focusPanel = () => window.requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("a[href]")?.focus())

  return (
    <div ref={root} className="relative" onMouseEnter={() => window.clearTimeout(closeTimer.current)} onMouseLeave={scheduleClose}
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) close() }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) { const id = open; close(); triggers.current[id]?.focus() }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const items = [...root.current!.querySelectorAll<HTMLElement>("[data-top]")]
          const i = items.indexOf(document.activeElement as HTMLElement)
          if (i >= 0) { e.preventDefault(); items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length].focus() }
        }
      }}>
      <div className="store-container grid grid-cols-[14rem_minmax(0,1fr)] items-center gap-4">
        <Link href="/categories" onMouseEnter={scheduleClose} className="my-1 flex h-9 items-center justify-between rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <span className="flex items-center gap-3"><LayoutGrid className="size-5" aria-hidden="true" /> All Categories</span>
          <ChevronDown className="size-4" aria-hidden="true" />
        </Link>
        <ul className="flex items-center justify-between text-sm font-medium">
          {entries.map((e) => {
            if (e.kind === "link") return (
              <li key={e.label} onMouseEnter={scheduleClose}>
                <Link href={e.href} data-top className="flex items-center gap-1.5 py-3.5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  {e.flame && <Flame className="size-4 text-primary" aria-hidden="true" />}{e.label}
                </Link>
              </li>
            )
            const m = menus.find((x) => x.id === e.id)!
            const active = open === m.id
            return (
              <li key={m.id} onMouseEnter={() => hoverOpen(m.id)} className="relative">
                <span className="flex items-center">
                  <Link href={m.href} data-top onFocus={() => setOpen((o) => (o ? m.id : o))} onClick={close}
                    className={`py-3.5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 ${active ? "text-primary" : ""}`}>{m.label}</Link>
                  <button type="button" data-top ref={(el) => { triggers.current[m.id] = el }} aria-expanded={active} aria-controls={`mega-${m.id}`} aria-label={`${m.label} menu`}
                    onClick={(ev) => { if (active) { close(); return } clear(); viaKeyboard.current = ev.detail === 0; setOpen(m.id) }}
                    onKeyDown={(ev) => { if (ev.key === "ArrowDown") { ev.preventDefault(); clear(); viaKeyboard.current = true; setOpen(m.id); focusPanel() } }}
                    className="grid size-6 place-items-center rounded-md hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <ChevronDown className={`size-3.5 transition-transform duration-200 ${active ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                </span>
                <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0"}`} />
              </li>
            )
          })}
        </ul>
      </div>
      {open && (
        <>
          <div aria-hidden="true" onMouseEnter={scheduleClose} onClick={close} className="absolute inset-x-0 top-full z-40 h-screen bg-black/30 animate-in fade-in-0 duration-200 motion-reduce:animate-none" />
          <div className="absolute inset-x-0 top-full z-50">
            <div className="store-container">
              <div ref={panel} id={`mega-${open}`} role="region" aria-label={`${menus.find((m) => m.id === open)!.label} menu`}
                onClick={(e) => { if ((e.target as HTMLElement).closest("a")) close() }}
                className="rounded-b-2xl border border-t-0 bg-card p-6 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-200 motion-reduce:animate-none">
                <MegaPanel id={open} menu={menu} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

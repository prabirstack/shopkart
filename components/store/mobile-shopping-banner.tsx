import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Check } from "lucide-react"

export function MobileShoppingBanner() {
  return (
    <section aria-label="Shopping on the go" className="relative isolate overflow-hidden rounded-2xl bg-[#060a17] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-full opacity-30 sm:w-[65%] sm:opacity-100"><Image src="/images/campaigns/mobile-shopping.webp" alt="" fill sizes="(max-width: 640px) 100vw, 65vw" className="object-cover object-right sm:object-contain" /></div>
      <div className="relative max-w-md sm:max-w-[50%]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300">SHOPKART, ON THE GO</p>
        <h2 className="mt-3 text-3xl font-semibold leading-[1.12] tracking-tight lg:text-4xl">Great finds.<br />Always within reach.</h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-300">Browse your favorites and track every order, wherever your day takes you.</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/products" className="inline-flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-rose-50">Explore ShopKart <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Check className="size-3.5" aria-hidden="true" /> No download needed</span>
        </div>
      </div>
    </section>
  )
}

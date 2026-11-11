import Link from "next/link"
import Image from "next/image"
import { campaignImage } from "@/features/catalog/images"
import { ChevronRight, Gamepad2, Armchair, Percent, Shirt } from "lucide-react"
import { promoCards } from "@/features/promotions/demo"

const styles: Record<string, { box: string; icon: typeof Shirt; text: string }> = {
  fashion: { box: "bg-gradient-to-br from-amber-100 to-orange-200", icon: Shirt, text: "text-foreground" },
  home: { box: "bg-gradient-to-br from-stone-100 to-stone-300", icon: Armchair, text: "text-foreground" },
  electronics: { box: "bg-gradient-to-br from-slate-800 to-slate-950", icon: Gamepad2, text: "text-white" },
  weekend: { box: "bg-gradient-to-br from-amber-300 to-orange-500", icon: Percent, text: "text-foreground" },
}

function Promo({ id, className = "" }: { id: string; className?: string }) {
  const card = promoCards.find((c) => c.id === id)!
  const { box, icon: Icon, text } = styles[id]
  const image = campaignImage(`promo-${id}`)
  return (
    <Link href={card.href} className={`group/promo relative flex overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 ${box} ${text} ${className}`}>
      <div className="relative z-10 flex max-w-[55%] flex-col items-start justify-center gap-1">
        <h3 className="text-lg font-bold leading-tight xl:text-xl">{card.title}</h3>
        <p className="text-sm">{card.lead} <span className="text-lg font-extrabold text-primary sm:text-xl">{card.highlight}</span></p>
        {id === "fashion" && (
          <span className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Shop Now <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {image ? <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 35vw" className="object-contain" /> : <Icon className="absolute -bottom-2 right-2 size-28 opacity-25" strokeWidth={1} aria-hidden="true" />}

    </Link>
  )
}

export function PromotionGrid() {
  return (
    <section aria-label="Campaigns" className="grid items-center gap-4 md:grid-cols-2 lg:grid-cols-[1.18fr_1fr_1.18fr]">
      <Promo id="fashion" className="aspect-[16/9]" />
      <div className="grid gap-4">
        <Promo id="home" className="aspect-[3/1]" />
        <Promo id="electronics" className="aspect-[3/1]" />
      </div>
      <Promo id="weekend" className="aspect-[16/9] md:col-span-2 md:mx-auto md:w-1/2 lg:col-span-1 lg:w-full" />
    </section>
  )
}

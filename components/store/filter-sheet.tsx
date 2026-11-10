"use client"
import type { ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

/** Mobile wrapper: the server-rendered filter form is passed in as children. */
export function FilterSheet({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  return (
    <Sheet>
      <SheetTrigger className={buttonVariants({ variant: "outline" }) + " lg:hidden"}>
        <SlidersHorizontal aria-hidden="true" /> Filters{activeCount > 0 && ` (${activeCount})`}
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader><SheetTitle>Filters</SheetTitle><SheetDescription>Narrow down the products.</SheetDescription></SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

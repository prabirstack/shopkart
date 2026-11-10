import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

/** One question open at a time. Built on the shadcn Accordion (Radix): keyboard and screen-reader friendly. */
export function FaqAccordion({ items, idPrefix }: { items: { q: string; a: string }[]; idPrefix: string }) {
  return (
    <Accordion type="single" collapsible className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      {items.map((f, i) => (
        <AccordionItem key={f.q} value={`${idPrefix}-${i}`} className="border-b px-5 last:border-b-0">
          <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

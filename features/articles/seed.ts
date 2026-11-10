import { doc, h2, h3, ol, p, quote, ul } from "./doc"
import type { Article } from "./types"

// Sample articles for the demo store. Product claims are general buying advice, not lab tests.
const base = { author: "Team ShopKart", status: "published" as const, compareIds: [] as string[] }

export const seedArticles: Article[] = [
  {
    ...base, id: "a1", slug: "choose-wireless-earbuds", title: "How to choose wireless earbuds", category: "Buying guide", publishedAt: "2026-10-28", updatedAt: "2026-11-08",
    excerpt: "Battery life, noise cancelling, fit and codecs: what actually matters when you pick a pair, and what is marketing.", productIds: ["d1", "t2"],
    seoTitle: "How to choose wireless earbuds: a buyer's guide", seoDescription: "A plain-English guide to battery life, noise cancelling, fit and price when buying wireless earbuds in India.",
    doc: doc(
      p("Wireless earbuds are one of the easiest products to overspend on. Here is how to decide what you really need before you look at prices."),
      h2("Start with how you will use them"),
      p(["Commuters and open-office workers benefit most from ", ["active noise cancelling", "bold"], ". If you mostly listen at home or at the gym, fit and sweat resistance matter more than ANC."]),
      h2("The four things worth comparing"),
      ul([[["Battery life.", "bold"], " Look at the total with the case, then the single-charge figure. 5 to 7 hours per charge is a good baseline."], [["Noise cancelling.", "bold"], " Real ANC reduces constant noise such as engines and fans. It will not remove voices."], [["Fit.", "bold"], " Try different ear tips. A good seal improves bass and ANC more than any spec."], [["Controls and app.", "bold"], " Touch controls are convenient; an app lets you tune sound and update firmware."]]),
      h3("Charging and case"),
      p("USB-C charging and a compact case are now standard. Wireless charging is a nice extra, not a requirement."),
      quote("If you can only improve one thing, improve the fit. The best earbuds on paper sound ordinary if they leak."),
      h2("Our suggestions"),
      p("These two cover most needs. Compare them side by side before you buy."),
    ),
  },
  {
    ...base, id: "a2", slug: "air-fryer-buying-guide", title: "Air fryer buying guide: size, power and what to skip", category: "Buying guide", publishedAt: "2026-10-30", updatedAt: "2026-11-05",
    excerpt: "Capacity for your family, controls you will actually use, and the cleaning details that decide whether you keep using it.", productIds: ["d4", "t3", "t5"],
    seoTitle: "Air fryer buying guide for Indian kitchens", seoDescription: "How to pick an air fryer: capacity, power, controls and cleaning, with a simple size chart.",
    doc: doc(
      p("An air fryer cooks with hot circulating air, so you use far less oil. The right size and an easy-clean basket decide whether it becomes a daily tool or a cupboard ornament."),
      h2("Pick the right capacity"),
      ul(["2 to 3 litres: one or two people.", "4 to 5.5 litres: a family of three or four.", "6 litres and above: batch cooking or a larger family."]),
      h2("Features that matter"),
      ol([[["Dishwasher-safe basket.", "bold"], " Cleaning is the main reason people stop using them."], [["Temperature range and presets.", "bold"], " Presets help beginners; manual control helps everyone else."], [["A viewing window or auto shake reminder", "bold"], " saves overcooking."]]),
      h2("What to skip"),
      p("Extra attachments you will not use and very high wattage claims. Check the actual capacity and basket quality instead."),
    ),
  },
  {
    ...base, id: "a3", slug: "wireless-earbuds-anc-review", title: "Wireless Earbuds with ANC: what to know before you buy", category: "Product review", publishedAt: "2026-11-02", updatedAt: "2026-11-09",
    excerpt: "A buyer-focused look at the Samsung Wireless Earbuds with ANC: who they suit, where they fall short and what to compare them with.", productIds: ["d1"],
    seoTitle: "Wireless Earbuds with ANC review and buying notes", seoDescription: "Who the Wireless Earbuds with ANC suit, their strengths and limits, and what to compare before buying.",
    doc: doc(
      p([["Sample review for the demo store.", "italic"], " It summarises the listed specifications and general expectations for this category, not independent lab testing."]),
      h2("The short version"),
      p("Active noise cancelling, a long total battery life with the case and USB-C charging make these a sensible all-rounder at their price."),
      h2("What stands out"),
      ul(["28 hours of battery life including the case.", "Noise cancelling that suits commuting and office use.", "A pocket-sized charging case.", "Backed by a 1-year brand warranty and a GST invoice."]),
      h2("Where to be careful"),
      ul(["Fit is personal. Use the 7-day return window if the seal is not right.", "ANC reduces steady noise, not voices.", "Check the app and firmware support for your phone."]),
      h2("Who should buy"),
      p("Daily commuters and remote workers who want ANC without paying flagship prices. If you mainly listen at home, a pair of over-ear headphones may suit you better."),
    ),
  },
  {
    ...base, id: "a4", slug: "earbuds-vs-headphones", title: "Earbuds vs headphones: which should you buy?", category: "Comparison", publishedAt: "2026-11-04", updatedAt: "2026-11-09", compareIds: ["d1", "t2"],
    excerpt: "Portability against comfort and battery: a clear comparison of in-ear and over-ear audio to help you choose.", productIds: ["d1", "t2"],
    seoTitle: "Earbuds vs headphones: a clear comparison", seoDescription: "Compare wireless earbuds and over-ear headphones on battery, comfort, portability and price.",
    doc: doc(
      p("Both give you wireless audio. The right choice depends on where you listen and for how long."),
      h2("Earbuds"),
      ul(["Easy to carry and good for the gym and travel.", "Shorter battery life per charge, topped up by the case.", "Fit depends on your ears."]),
      h2("Over-ear headphones"),
      ul(["More comfortable for long sessions.", "Longer battery life, often 30 to 40 hours.", "Bulkier to carry."]),
      h2("The quick rule"),
      p("Choose earbuds if you move around a lot. Choose headphones if you sit and listen for hours. Use the comparison tool to see these two side by side."),
    ),
  },
  {
    ...base, id: "a5", slug: "smartwatch-vs-fitness-band", title: "Smartwatch vs fitness band: which suits you?", category: "Comparison", publishedAt: "2026-11-06", updatedAt: "2026-11-09", compareIds: ["d2", "t4"],
    excerpt: "Screens, battery and extras: how a full smartwatch differs from a simple fitness band, and who should pick which.", productIds: ["d2", "t4"],
    seoTitle: "Smartwatch vs fitness band comparison", seoDescription: "Compare a smartwatch and a fitness band on display, battery life, features and price.",
    doc: doc(
      p("A fitness band tracks steps, heart rate and sleep with a long battery. A smartwatch adds a brighter screen and more features, with a shorter battery."),
      h2("Choose a fitness band if"),
      ul(["You want simple tracking and a battery that lasts about two weeks.", "You prefer a light, low-cost device."]),
      h2("Choose a smartwatch if"),
      ul(["You want a bright AMOLED display and richer notifications.", "You are happy to charge every few days."]),
      p("Open the comparison to see price, rating and specifications for both."),
    ),
  },
  {
    ...base, id: "a6", slug: "gift-ideas-under-2000", title: "Gift ideas under ₹2,000", category: "News", publishedAt: "2026-11-10", updatedAt: "2026-11-10", status: "draft",
    excerpt: "Thoughtful picks that do not stretch the budget.", productIds: ["t2", "x2"], seoTitle: "Gift ideas under ₹2,000", seoDescription: "Practical gift ideas under two thousand rupees.",
    doc: doc(p("Draft in progress."), ul(["Wireless headphones", "A yoga mat"])),
  },
]

export const publishedSeed = seedArticles.filter((a) => a.status === "published")
export const seedBySlug = (slug: string) => seedArticles.find((a) => a.slug === slug)

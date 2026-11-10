// Sample review data for the layout lessons. Real reviews need verified purchases,
// moderation and one review per buyer; a later chapter adds that. Do not present
// these as real customer feedback in production.
export type Review = {
  id: string; name: string; rating: number; title: string; body: string; date: string; verified: boolean
}

const people = ["Aarav M.", "Diya N.", "Kabir S.", "Isha R.", "Rohan I.", "Meera J.", "Ananya P.", "Vikram T."]
const titles = ["Worth every rupee", "Exactly as described", "Good, with a small catch", "Great value", "Would buy again", "Solid quality"]
const bodies = [
  "Arrived two days early and the packaging was excellent. Does exactly what it promises.",
  "Build quality is better than I expected at this price. Setup took only a few minutes.",
  "Very happy overall. Support answered my question quickly. One small thing: the manual could be clearer.",
  "Compared three options before choosing this one and I'm glad I did. Feels premium.",
  "Using it daily for a month now and no complaints. Delivery and returns policy gave me confidence.",
  "Good product, fair price. The discount during the sale made it an easy decision.",
]
const dates = ["02 Nov 2026", "28 Oct 2026", "19 Oct 2026", "07 Oct 2026", "30 Sep 2026", "21 Sep 2026"]

/** Deterministic sample reviews so server and client always render the same text. */
export function reviewsFor(productId: string, ratingAvg = 4.5): Review[] {
  const seed = [...productId].reduce((s, c) => s + c.charCodeAt(0), 0)
  return Array.from({ length: 4 }, (_, i) => {
    const k = (seed + i * 3) % 6
    const rating = i === 2 ? 4 : ratingAvg >= 4.5 || i < 2 ? 5 : 4
    return { id: `${productId}-r${i}`, name: people[(seed + i) % people.length], rating, title: titles[k], body: bodies[(k + i) % bodies.length], date: dates[(k + i) % dates.length], verified: i !== 3 }
  })
}

/** Rough 5-to-1 star split used for the distribution bars (sums to 100). */
export function distributionFor(ratingAvg = 4.5): number[] {
  if (ratingAvg >= 4.7) return [78, 15, 4, 2, 1]
  if (ratingAvg >= 4.5) return [68, 22, 6, 2, 2]
  if (ratingAvg >= 4.3) return [58, 26, 9, 4, 3]
  return [48, 28, 13, 6, 5]
}

export type Testimonial = { id: string; name: string; city: string; quote: string; rating: number }
export const testimonials: Testimonial[] = [
  { id: "tm1", name: "Priya Sharma", city: "Mumbai", rating: 5, quote: "Ordered on Monday evening and had it by Wednesday. The packaging was neat and the invoice made my GST claim easy." },
  { id: "tm2", name: "Rahul Verma", city: "Bengaluru", rating: 5, quote: "Prices were better than the other sites I compared, and the return process was exactly as described. No arguments." },
  { id: "tm3", name: "Sneha Kulkarni", city: "Pune", rating: 4, quote: "Clean site, clear delivery dates and quick support replies. I now buy all my kitchen appliances here." },
]

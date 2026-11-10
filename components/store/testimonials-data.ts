/** Static sample testimonials for the home page. Editorial copy, not customer reviews from the database. */
export type Testimonial = { id: string; name: string; city: string; quote: string; rating: number }

export const testimonials: Testimonial[] = [
  { id: "tm1", name: "Priya Sharma", city: "Mumbai", rating: 5, quote: "Ordered on Monday evening and had it by Wednesday. The packaging was neat and the invoice made my GST claim easy." },
  { id: "tm2", name: "Rahul Verma", city: "Bengaluru", rating: 5, quote: "Prices were better than the other sites I compared, and the return process was exactly as described. No arguments." },
  { id: "tm3", name: "Sneha Kulkarni", city: "Pune", rating: 4, quote: "Clean site, clear delivery dates and quick support replies. I now buy all my kitchen appliances here." },
  { id: "tm4", name: "Arjun Nair", city: "Kochi", rating: 5, quote: "The earbuds arrived well packed, and the coupon applied exactly as promised. Checkout took under two minutes." },
  { id: "tm5", name: "Kavya Reddy", city: "Hyderabad", rating: 5, quote: "I liked seeing the GST split on the invoice. Returns were simple when I needed a different size." },
  { id: "tm6", name: "Imran Sheikh", city: "Delhi", rating: 4, quote: "Good prices and honest delivery dates. Support answered my question on the same day." },
]

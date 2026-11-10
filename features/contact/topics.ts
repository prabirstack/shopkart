/** What a message can be about. Shared by the form (browser) and the API validation (server). */
export const CONTACT_TOPICS = ["Order status", "Returns & refunds", "Payments & invoices", "Product question", "Something else"] as const
export type ContactTopic = (typeof CONTACT_TOPICS)[number]

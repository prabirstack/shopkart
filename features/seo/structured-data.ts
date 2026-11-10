import type { Product } from "@/features/catalog/demo"
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/icon"),
}

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: absoluteUrl(t.path) })),
  }
}

/**
 * Product markup uses only facts we hold: price, stock, brand and SKU. It leaves out
 * aggregateRating and review on purpose: the demo reviews are sample data, and marking
 * up reviews that aren't real customer feedback breaks search engine guidelines.
 */
export function productLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    sku: p.id.toUpperCase(),
    brand: { "@type": "Brand", name: p.brand },
    image: [absoluteUrl(`/og/product/${p.slug}`)],
    url: absoluteUrl(`/products/${p.slug}`),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${p.slug}`),
      priceCurrency: "INR",
      price: (p.pricePaise / 100).toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  }
}

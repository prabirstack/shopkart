"use client"
import Script from "next/script"
import { useEffect } from "react"
import { useReportWebVitals } from "next/web-vitals"
import { GA_ID, ANALYTICS_ENABLED } from "./config"
import { useConsent } from "./consent"
import { flushPending, track } from "./track"

/** Reports Core Web Vitals as GA events (only when consent is granted and GA is configured). */
function WebVitals() {
  useReportWebVitals((m) => track("web_vitals", { metric_id: m.id, metric_name: m.name, metric_value: Math.round(m.name === "CLS" ? m.value * 1000 : m.value), metric_rating: m.rating, navigation_type: m.navigationType }))
  return null
}

/**
 * Loads gtag.js only after the visitor accepts ("basic" consent mode): before that, no
 * request leaves the browser and no cookie is set. SPA page_view events come from GA4's
 * built-in history-change detection, so no manual route tracking is needed.
 */
export function Analytics() {
  const consent = useConsent()
  useEffect(() => { if (consent === "denied") window.gtag?.("consent", "update", { analytics_storage: "denied" }) }, [consent])
  if (!ANALYTICS_ENABLED || consent !== "granted") return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" onReady={flushPending} />
      <Script id="ga-init" strategy="afterInteractive" onReady={flushPending}>{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
      <WebVitals />
    </>
  )
}

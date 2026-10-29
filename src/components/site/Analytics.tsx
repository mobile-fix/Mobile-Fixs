"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

import { isPrivatePath, reportablePath, track } from "@/lib/analytics";
import { trackingConfig } from "@/lib/config";

/**
 * Loads GA4, Google Ads and the Meta Pixel — each only when its ID is set —
 * and records contact clicks site-wide.
 *
 * WhatsApp, call and email links appear in dozens of places, many of them in
 * server components that cannot attach handlers. A single delegated listener
 * on the document catches every one of them, including links added later,
 * without touching each link.
 *
 * Pages whose URL holds a repair reference load no tags at all.
 */
export function Analytics() {
  const { ga4Id, googleAdsId, metaPixelId } = trackingConfig;
  const gtagId = ga4Id || googleAdsId;
  const pathname = usePathname();
  const tagsLoaded = useRef(false);
  const privatePage = isPrivatePath(pathname);

  useEffect(() => {
    if (!gtagId && !metaPixelId) return;

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href") ?? "";
      const region = link.closest("header, footer, nav, aside, [data-track-location]");
      const location = `${reportablePath(window.location.pathname)}#${
        region?.getAttribute("data-track-location") ?? region?.tagName.toLowerCase() ?? "main"
      }`;

      if (href.startsWith("https://wa.me/") || href.startsWith("https://api.whatsapp.com/")) {
        track({ name: "whatsapp_click", location });
      } else if (href.startsWith("tel:")) {
        track({ name: "call_click", location });
      } else if (href.startsWith("mailto:")) {
        track({ name: "email_click", location });
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [gtagId, metaPixelId]);

  // GA4 records client-side navigations itself (enhanced measurement). The
  // Pixel's own history tracking is switched off below so that private pages
  // can be skipped; each other App Router navigation is reported here instead.
  // The page that first loads the tags is counted by the Pixel snippet itself.
  useEffect(() => {
    if (privatePage) return;
    if (tagsLoaded.current) window.fbq?.("track", "PageView");
    tagsLoaded.current = true;
  }, [pathname, privatePage]);

  if ((!gtagId && !metaPixelId) || privatePage) return null;

  return (
    <>
      {gtagId ? (
        <>
          <Script
            id="gtag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${
              ga4Id ? `gtag('config',${JSON.stringify(ga4Id)});` : ""
            }${googleAdsId ? `gtag('config',${JSON.stringify(googleAdsId)});` : ""}`}
          </Script>
        </>
      ) : null}

      {metaPixelId ? (
        <>
          {/*
            autoConfig off: otherwise the Pixel scans form fields (name, phone,
            email) and button text and sends them to Meta, which the privacy
            policy promises we do not do. disablePushState: page views after
            client-side navigation are sent by the effect above, which knows
            to skip private pages.
          */}
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq.disablePushState=true;fbq('set','autoConfig',false,${JSON.stringify(
              metaPixelId,
            )});fbq('init',${JSON.stringify(metaPixelId)});fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- the Pixel's no-JS fallback is a 1×1 beacon */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GTM_ID, GA_ID, pageview } from "@/lib/gtm";
import Script from "next/script";

export default function GoogleTagManager() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname) {
            pageview(pathname);
        }
    }, [pathname]);

    // No tracking IDs configured
    if (!GTM_ID && !GA_ID) return null;

    return (
        <>
            {/* Google Tag Manager */}
            {GTM_ID && (
                <>
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                            height="0"
                            width="0"
                            style={{ display: "none", visibility: "hidden" }}
                        />
                    </noscript>
                    <Script
                        id="gtm-script"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                                })(window,document,'script','dataLayer','${GTM_ID}');
                            `,
                        }}
                    />
                </>
            )}

            {/* Google Analytics 4 (direct) */}
            {GA_ID && !GTM_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script
                        id="ga4-script"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${GA_ID}', {
                                    page_path: window.location.pathname,
                                });
                                window.gtag = gtag;
                            `,
                        }}
                    />
                </>
            )}
        </>
    );
}

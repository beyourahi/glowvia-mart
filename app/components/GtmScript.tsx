/**
 * @fileoverview Google Tag Manager Script Loader Component
 *
 * @description
 * Renders the GTM script tags required to initialize Google Tag Manager. Handles CSP
 * nonce for security, client-side only rendering to prevent hydration mismatches, and
 * provides noscript fallback for users with JavaScript disabled.
 *
 * @related
 * - ~/components/GoogleTagManager - Pushes events to dataLayer
 * - ~/root - Renders GtmScript with container ID from environment
 */

import {useEffect, useState} from "react";
import {Script, useNonce} from "@shopify/hydrogen";

// ================================================================================
// Type Definitions
// ================================================================================

interface GtmScriptProps {
    gtmContainerId: string;
}

// ================================================================================
// Script Loader Component
// ================================================================================

/**
 * GtmScript - Loads GTM script tags with CSP nonce
 *
 * Renders GTM initialization script and noscript fallback.
 * Only renders client-side after hydration to prevent hydration mismatches
 * (analytics scripts don't need SSR and nonce changes between renders).
 *
 * Script functionality:
 * - Initializes window.dataLayer array
 * - Pushes gtm.start timestamp
 * - Dynamically loads gtm.js script
 * - Provides noscript iframe fallback
 *
 * @param gtmContainerId - The GTM container ID (e.g., "GTM-XXXXXXX")
 * @returns null during SSR or if no container ID, otherwise script tags
 */
export function GtmScript({gtmContainerId}: GtmScriptProps) {
    const nonce = useNonce();
    const [isClient, setIsClient] = useState(false);

    // Only render on client after hydration to prevent hydration mismatch
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Don't render anything if no container ID is provided or during SSR
    if (!gtmContainerId || !isClient) return null;

    // Validate GTM container ID format to prevent script injection
    if (!/^GTM-[A-Z0-9]+$/.test(gtmContainerId)) return null;

    return (
        <>
            {/* GTM Head Script - Initializes dataLayer and loads GTM */}
            <Script
                nonce={nonce}
                dangerouslySetInnerHTML={{
                    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmContainerId}');`
                }}
            />
            {/* GTM Noscript Fallback - For users with JavaScript disabled */}
            <noscript>
                <iframe
                    title="Google Tag Manager"
                    src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
                    height="0"
                    width="0"
                    style={{display: "none", visibility: "hidden"}}
                />
            </noscript>
        </>
    );
}

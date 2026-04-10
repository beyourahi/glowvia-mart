/**
 * @fileoverview React Router Configuration for Hydrogen
 *
 * @description
 * Configures React Router 7 for the Shopify Hydrogen storefront.
 * Uses the official Hydrogen preset which provides optimized settings
 * for Shopify Oxygen (Cloudflare Workers) deployment.
 *
 * @architecture
 * The Hydrogen preset configures:
 * - Server-side rendering (SSR) mode
 * - Optimized route chunking
 * - Hydrogen-specific route handling
 * - Oxygen Workers compatibility
 *
 * @presets
 * hydrogenPreset() includes:
 * - ssr: true (server-side rendering)
 * - Optimized build settings for Workers
 * - Cart and customer account route handling
 * - Proper cache headers for Oxygen CDN
 *
 * @customization
 * Additional configuration can be added alongside the preset:
 * - future: Enable future flags
 * - appDirectory: Custom app directory (default: "app")
 * - buildDirectory: Custom build output (default: "build")
 *
 * @dependencies
 * - @react-router/dev/config - Configuration types
 * - @shopify/hydrogen/react-router-preset - Hydrogen optimization preset
 *
 * @related
 * - routes.ts - Route definitions
 * - vite.config.ts - Build configuration
 * - server.ts - Server entry point
 *
 * @see https://reactrouter.com/api/framework-conventions/react-router.config
 */

import type {Config} from "@react-router/dev/config";
import {hydrogenPreset} from "@shopify/hydrogen/react-router-preset";

// =============================================================================
// REACT ROUTER CONFIGURATION
// =============================================================================

/**
 * Export React Router configuration with Hydrogen preset.
 *
 * The preset handles all Hydrogen-specific configuration automatically.
 * Additional options can be spread into this object if needed.
 */
export default {
    presets: [hydrogenPreset()]
    // Additional configuration options can be added here:
    // future: { v3_fetcherPersist: true },
    // appDirectory: "app",
    // buildDirectory: "build",
} satisfies Config;

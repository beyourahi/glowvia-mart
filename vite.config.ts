import {defineConfig} from "vite";
import {hydrogen} from "@shopify/hydrogen/vite";
import {oxygen} from "@shopify/mini-oxygen/vite";
import {reactRouter} from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [tailwindcss(), hydrogen(), oxygen(), reactRouter(), tsconfigPaths()],

    // -------------------------------------------------------------------------
    // RESOLVE OPTIONS — Prevent duplicate module instances
    // -------------------------------------------------------------------------
    resolve: {
        dedupe: [
            "react",
            "react-dom",
            "react-router",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom/client",
            "@shopify/hydrogen"
        ]
    },

    // -------------------------------------------------------------------------
    // BUILD OPTIONS
    // -------------------------------------------------------------------------
    build: {
        // Don't inline assets as base64 - this allows strict CSP headers
        // All assets are served as separate files with proper caching
        assetsInlineLimit: 0
    },

    // -------------------------------------------------------------------------
    // SSR OPTIONS
    // -------------------------------------------------------------------------
    ssr: {
        optimizeDeps: {
            /**
             * Include dependencies here if they throw CJS<>ESM errors.
             * For example, for the following error:
             *
             * > ReferenceError: module is not defined
             * >   at /Users/.../node_modules/example-dep/index.js:1:1
             *
             * Include 'example-dep' in the array below.
             * @see https://vitejs.dev/config/dep-optimization-options
             */
            include: [
                "set-cookie-parser",
                "cookie",
                "react",
                "react-dom",
                "react/jsx-runtime",
                "react/jsx-dev-runtime",
                "react-router",
                "use-sync-external-store/shim",
                "@radix-ui/react-use-is-hydrated",
                "embla-carousel-autoplay"
            ],
            exclude: ["@shopify/hydrogen"]
        }
    },
    // -------------------------------------------------------------------------
    // DEV SERVER OPTIONS
    // -------------------------------------------------------------------------
    server: {
        // Allowed hosts for development server
        // - tryhydrogen.dev: Shopify's development environment
        // - ngrok: Required for Customer Account API OAuth flow
        allowedHosts: [".tryhydrogen.dev", "hermelinda-nonsegmentary-hettie.ngrok-free.dev"],

        // HMR WebSocket configuration (L-10)
        // When multiple Vite-based projects run simultaneously in this workspace,
        // the browser may attempt to connect the HMR WebSocket to the wrong port
        // (e.g. ws://localhost:3000 from another project's stale connection).
        // Setting `hmr.server` to undefined (the default) tells Vite to attach the
        // HMR WebSocket directly to the dev server — using whatever port Hydrogen
        // assigns — which prevents cross-project port mismatches.
        // If the issue persists, it is likely caused by the Service Worker caching
        // a stale HMR endpoint; disable the SW in dev or use an Incognito window.
        hmr: {
            // Use the dev server's own port for the HMR WebSocket connection.
            // This prevents "WebSocket connection to ws://localhost:3000/ failed"
            // errors when this storefront runs on a different port.
            protocol: "ws",
            host: "localhost"
        }
    }
});

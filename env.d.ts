/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import "@total-typescript/ts-reset";

// Extend the Env interface with custom environment variables
declare global {
    interface Env {
        PUBLIC_GTM_CONTAINER_ID?: string;
        AGENT_ANALYTICS?: AnalyticsEngineDataset;
    }

    interface Window {
        dataLayer?: Array<Record<string, unknown>>;
    }
}

export {};

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
        // Changelog pipeline — server-side only, never returned to client
        GITHUB_TOKEN: string;
        GITHUB_REPO_OWNER: string;
        GITHUB_REPO_NAME: string;
        ANTHROPIC_API_KEY: string;
    }

    interface Window {
        dataLayer?: Array<Record<string, unknown>>;
    }
}

export {};
